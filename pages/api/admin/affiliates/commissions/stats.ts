import type { NextApiRequest, NextApiResponse } from "next";
import mongoose from "mongoose";

import { connectDB } from "~/lib/mongodb";
import { requireAuth } from "~/lib/permissions";

import { Affiliate } from "~/models/Affiliate";
import { AffiliateStore } from "~/models/AffiliateStore";
import { Order } from "~/models/Order";
import { OrderItem } from "~/models/OrderItem";
import { OrderStatus } from "~/models/OrderStatus";
import { AffiliateCommission } from "~/models/AffiliateCommission";
import { AffiliatePayment } from "~/models/AffiliatePayment";

type ApiResponse = {
 success: boolean;
 message?: string;
 data?: {
  conversions: number;
  deliveredOrders: number;
  estimatedCommission: number;
  actualCommission: number;
  paidAmount: number;
  remainingCommission: number;
  ordersMissingRate: number;
  currency: "VND";
 };
};

function getErrorStatus(error: unknown) {
 const message = error instanceof Error ? error.message : "";

 if (message === "UNAUTHORIZED") return 401;
 if (message === "FORBIDDEN") return 403;

 return 500;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<ApiResponse>) {
 if (req.method !== "GET") {
  res.setHeader("Allow", ["GET"]);

  return res.status(405).json({
   success: false,
   message: "Phương thức không được hỗ trợ.",
  });
 }

 try {
  await connectDB();

  const user = await requireAuth(req);

  if (user.role !== "AFFILIATE") {
   return res.status(403).json({
    success: false,
    message: "Bạn không có quyền truy cập dữ liệu affiliate.",
   });
  }

  const affiliate = await Affiliate.findOne({
   userId: user.id,
   status: "ACTIVE",
  })
   .select("_id")
   .lean();

  if (!affiliate) {
   return res.status(404).json({
    success: false,
    message: "Không tìm thấy tài khoản affiliate đang hoạt động.",
   });
  }

  const storeId = typeof req.query.storeId === "string" ? req.query.storeId : "";

  if (storeId && !mongoose.isValidObjectId(storeId)) {
   return res.status(400).json({
    success: false,
    message: "Store ID không hợp lệ.",
   });
  }

  const affiliateStoreFilter: Record<string, unknown> = {
   affiliateId: affiliate._id,
   status: "ACTIVE",
  };

  if (storeId) {
   affiliateStoreFilter.storeId = new mongoose.Types.ObjectId(storeId);
  }

  const affiliateStores = await AffiliateStore.find(affiliateStoreFilter).select("storeId").lean();

  const allowedStoreIds = affiliateStores.map((item) => item.storeId);

  if (storeId && allowedStoreIds.length === 0) {
   return res.status(403).json({
    success: false,
    message: "Bạn không được liên kết với cửa hàng này.",
   });
  }

  if (allowedStoreIds.length === 0) {
   return res.status(200).json({
    success: true,
    data: {
     conversions: 0,
     deliveredOrders: 0,
     estimatedCommission: 0,
     actualCommission: 0,
     paidAmount: 0,
     remainingCommission: 0,
     ordersMissingRate: 0,
     currency: "VND",
    },
   });
  }

  const orders = await Order.find({
   affiliateId: affiliate._id,
   storeId: { $in: allowedStoreIds },
   isDeleted: { $ne: true },
   currency: "VND",
  })
   .select("_id statusId")
   .lean();

  const orderIds = orders.map((order) => order._id);

  const statusIds: string[] = [];

  orders.forEach((order) => {
   const statusId = order.statusId.toString();

   if (statusIds.indexOf(statusId) === -1) {
    statusIds.push(statusId);
   }
  });

  const statuses = await OrderStatus.find({
   _id: { $in: statusIds },
  })
   .select("_id code")
   .lean();

  const statusById = new Map(statuses.map((status) => [status._id.toString(), status.code.toUpperCase()]));

  const deliveredOrderIds = new Set(orders.filter((order) => statusById.get(order.statusId.toString()) === "DELIVERED").map((order) => order._id.toString()));

  const excludedStatuses = new Set(["CANCELLED", "CANCELED", "REJECTED", "RETURNED", "REFUNDED"]);

  const eligibleOrderIds = new Set(
   orders.filter((order) => !excludedStatuses.has(statusById.get(order.statusId.toString()) || "")).map((order) => order._id.toString()),
  );

  const commissions = orderIds.length
   ? await AffiliateCommission.find({
      affiliateId: affiliate._id,
      storeId: { $in: allowedStoreIds },
      orderId: { $in: orderIds },
      currency: "VND",
     })
      .select("orderId orderItemId amount status")
      .lean()
   : [];

  const commissionByItemId = new Map(commissions.map((commission) => [commission.orderItemId.toString(), commission]));

  const items = orderIds.length
   ? await OrderItem.find({
      orderId: { $in: orderIds },
     })
      .select("_id orderId subtotal affiliateCommissionRate")
      .lean()
   : [];

  let estimatedCommission = 0;
  let actualCommission = 0;
  let ordersMissingRate = 0;

  for (const item of items) {
   const orderId = item.orderId.toString();

   if (!eligibleOrderIds.has(orderId)) {
    continue;
   }

   const commission = commissionByItemId.get(item._id.toString());

   if (commission) {
    if (commission.status === "REVERSED") {
     continue;
    }

    estimatedCommission += commission.amount;

    if (deliveredOrderIds.has(orderId)) {
     actualCommission += commission.amount;
    }

    continue;
   }

   const rate = item.affiliateCommissionRate;

   if (rate === null || rate === undefined) {
    ordersMissingRate += 1;
    continue;
   }

   const itemCommission = Math.round((item.subtotal * rate) / 100);

   estimatedCommission += itemCommission;

   if (deliveredOrderIds.has(orderId)) {
    actualCommission += itemCommission;
   }
  }

  const paymentTotals = await AffiliatePayment.aggregate([
   {
    $match: {
     affiliateId: affiliate._id,
     storeId: { $in: allowedStoreIds },
     isDeleted: { $ne: true },
     currency: "VND",
    },
   },
   {
    $group: {
     _id: null,
     total: { $sum: "$amount" },
    },
   },
  ]);

  const paidAmount = paymentTotals[0]?.total || 0;

  return res.status(200).json({
   success: true,
   data: {
    conversions: orders.length,
    deliveredOrders: deliveredOrderIds.size,
    estimatedCommission,
    actualCommission,
    paidAmount,
    remainingCommission: actualCommission - paidAmount,
    ordersMissingRate,
    currency: "VND",
   },
  });
 } catch (error) {
  console.error("Affiliate commission stats error:", error);

  const status = getErrorStatus(error);

  return res.status(status).json({
   success: false,
   message: status === 401 ? "Bạn chưa đăng nhập." : status === 403 ? "Bạn không có quyền truy cập dữ liệu này." : "Đã xảy ra lỗi máy chủ.",
  });
 }
}
