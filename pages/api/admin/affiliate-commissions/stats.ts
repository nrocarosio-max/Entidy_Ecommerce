import type { NextApiRequest, NextApiResponse } from "next";
import mongoose from "mongoose";

import { connectDB } from "~/lib/mongodb";
import { requireSuperAdmin } from "~/lib/permissions";

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
  await requireSuperAdmin(req);

  const affiliateId = typeof req.query.affiliateId === "string" ? req.query.affiliateId : "";

  const storeId = typeof req.query.storeId === "string" ? req.query.storeId : "";

  if (!mongoose.isValidObjectId(affiliateId) || (storeId && !mongoose.isValidObjectId(storeId))) {
   return res.status(400).json({
    success: false,
    message: "Affiliate ID hoặc Store ID không hợp lệ.",
   });
  }

  const orderFilter: Record<string, unknown> = {
   affiliateId: new mongoose.Types.ObjectId(affiliateId),
   isDeleted: { $ne: true },
   currency: "VND",
  };

  if (storeId) {
   orderFilter.storeId = new mongoose.Types.ObjectId(storeId);
  }

  const orders = await Order.find(orderFilter).select("_id statusId orderNumber").lean();

  const orderIds = orders.map((order) => order._id);
  const orderIdStrings = new Set(orderIds.map((id) => id.toString()));

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

  const excludedStatusCodes = new Set(["CANCELLED", "CANCELED", "REJECTED", "RETURNED", "REFUNDED"]);

  const eligibleOrderIds = new Set(
   orders.filter((order) => !excludedStatusCodes.has(statusById.get(order.statusId.toString()) || "")).map((order) => order._id.toString()),
  );

  const commissionFilter: Record<string, unknown> = {
   affiliateId: new mongoose.Types.ObjectId(affiliateId),
   currency: "VND",
   orderId: { $in: orderIds },
  };

  if (storeId) {
   commissionFilter.storeId = new mongoose.Types.ObjectId(storeId);
  }

  const commissions = await AffiliateCommission.find(commissionFilter).select("orderId orderItemId amount status").lean();

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
   const itemOrderId = item.orderId.toString();

   if (!eligibleOrderIds.has(itemOrderId)) {
    continue;
   }

   const commission = commissionByItemId.get(item._id.toString());

   if (commission) {
    if (commission.status === "REVERSED") {
     continue;
    }

    estimatedCommission += commission.amount;

    if (deliveredOrderIds.has(itemOrderId)) {
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

   if (deliveredOrderIds.has(itemOrderId)) {
    actualCommission += itemCommission;
   }
  }

  const paymentFilter: Record<string, unknown> = {
   affiliateId: new mongoose.Types.ObjectId(affiliateId),
   isDeleted: { $ne: true },
   currency: "VND",
  };

  if (storeId) {
   paymentFilter.storeId = new mongoose.Types.ObjectId(storeId);
  }

  const paymentTotals = await AffiliatePayment.aggregate([
   { $match: paymentFilter },
   {
    $group: {
     _id: null,
     total: { $sum: "$amount" },
    },
   },
  ]);

  const paidAmount = paymentTotals[0]?.total || 0;
  const remainingCommission = actualCommission - paidAmount;

  return res.status(200).json({
   success: true,
   data: {
    conversions: orders.length,
    deliveredOrders: deliveredOrderIds.size,
    estimatedCommission,
    actualCommission,
    paidAmount,
    remainingCommission,
    ordersMissingRate,
    currency: "VND",
   },
  });
 } catch (error) {
  console.error("Affiliate commission stats error:", error);

  const status = getErrorStatus(error);

  return res.status(status).json({
   success: false,
   message: status === 401 ? "Bạn chưa đăng nhập." : status === 403 ? "Bạn không có quyền thực hiện thao tác này." : "Đã xảy ra lỗi máy chủ.",
  });
 }
}
