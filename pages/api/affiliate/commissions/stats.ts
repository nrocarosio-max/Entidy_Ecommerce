import type { NextApiRequest, NextApiResponse } from "next";
import mongoose from "mongoose";

import { connectDB } from "~/lib/mongodb";
import { requireAuth } from "~/lib/permissions";
import { Affiliate } from "~/models/Affiliate";
import { AffiliateCommission } from "~/models/AffiliateCommission";
import { Order } from "~/models/Order";
import { OrderStatus } from "~/models/OrderStatus";

type CommissionStats = {
 conversions: number;
 totalClicks: number;
 deliveredOrders: number;
 estimatedCommission: number;
 actualCommission: number;
 paidAmount: number;
 remainingCommission: number;
 ordersMissingRate: number;
 currency: "VND";
};

type ApiResponse = {
 success: boolean;
 message?: string;
 data?: CommissionStats;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse<ApiResponse>) {
 if (req.method !== "GET") {
  res.setHeader("Allow", "GET");
  return res.status(405).json({
   success: false,
   message: "Method not allowed.",
  });
 }

 try {
  await connectDB();

  const user = await requireAuth(req);

  if (!user) return;

  if (user.role !== "AFFILIATE") {
   return res.status(403).json({
    success: false,
    message: "Bạn không có quyền xem thống kê affiliate.",
   });
  }

  const affiliate = await Affiliate.findOne({
   userId: user.id,
  })
   .select("_id totalClicks")
   .lean();

  if (!affiliate) {
   return res.status(404).json({
    success: false,
    message: "Không tìm thấy tài khoản affiliate.",
   });
  }

  const storeId = typeof req.query.storeId === "string" ? req.query.storeId : "";

  if (storeId && !mongoose.isValidObjectId(storeId)) {
   return res.status(400).json({
    success: false,
    message: "Mã cửa hàng không hợp lệ.",
   });
  }

  const orderFilter: Record<string, unknown> = {
   affiliateId: affiliate._id,
   isDeleted: { $ne: true },
  };

  const commissionFilter: Record<string, unknown> = {
   affiliateId: affiliate._id,
  };

  if (storeId) {
   const storeObjectId = new mongoose.Types.ObjectId(storeId);

   orderFilter.storeId = storeObjectId;
   commissionFilter.storeId = storeObjectId;
  }

  const [orders, commissions] = await Promise.all([
   Order.find(orderFilter).select("_id statusId").lean(),

   AffiliateCommission.find(commissionFilter)
    .select("orderId orderItemId amount commissionRate commissionBase currency status entryType relatedCommissionId")
    .lean(),
  ]);

  const statusIds = Array.from(new Set(orders.map((order: any) => (order.statusId ? String(order.statusId) : "")).filter(Boolean)));

  const statuses = statusIds.length
   ? await OrderStatus.find({
      _id: {
       $in: statusIds.map((id) => new mongoose.Types.ObjectId(id)),
      },
     })
      .select("_id code")
      .lean()
   : [];

  const statusCodeById = new Map(statuses.map((status: any) => [String(status._id), status.code]));

  const deliveredOrderIds = new Set(
   orders.filter((order: any) => statusCodeById.get(String(order.statusId)) === "DELIVERED").map((order: any) => String(order._id)),
  );

  const deliveredOrders = deliveredOrderIds.size;
  console.log("Affiliate stats debug:", {
   conversions: orders.length,
   deliveredOrders,
   totalCommissions: commissions.length,
   entryTypes: commissions.map((item: any) => ({
    entryType: item.entryType,
    status: item.status,
    amount: item.amount,
    orderId: String(item.orderId),
   })),
  });
  const conversions = orders.length;

  const baseCommissions = commissions.filter((commission: any) => (commission.entryType ?? "COMMISSION") === "COMMISSION");

  const adjustments = commissions.filter((commission: any) => commission.entryType === "ADJUSTMENT");

  const adjustmentsByCommissionId = new Map<string, any[]>();

  for (const adjustment of adjustments as any[]) {
   if (!adjustment.relatedCommissionId) continue;

   const relatedId = String(adjustment.relatedCommissionId);
   const existing = adjustmentsByCommissionId.get(relatedId) || [];

   existing.push(adjustment);
   adjustmentsByCommissionId.set(relatedId, existing);
  }

  let estimatedCommission = 0;
  let actualCommission = 0;
  let paidAmount = 0;
  let ordersMissingRate = 0;

  for (const commission of baseCommissions as any[]) {
   const orderId = String(commission.orderId);

   const isDelivered = deliveredOrderIds.has(orderId);
   const amount = Number(commission.amount) || 0;
   const rate = Number(commission.commissionRate) || 0;

   if (isDelivered && commission.status !== "REVERSED") {
    estimatedCommission += amount;
   }

   if (isDelivered && ["PENDING", "APPROVED", "PAID"].includes(commission.status)) {
    actualCommission += amount;
   }

   if (isDelivered && commission.status === "PAID") {
    paidAmount += amount;
   }

   if (isDelivered && rate <= 0) {
    ordersMissingRate += 1;
   }

   const relatedAdjustments = adjustmentsByCommissionId.get(String(commission._id)) || [];

   const hasPendingAdjustment = relatedAdjustments.some((adjustment: any) => adjustment.status === "PENDING");

   if (isDelivered && hasPendingAdjustment) {
    const pendingAdjustmentAmount = relatedAdjustments
     .filter((adjustment: any) => adjustment.status === "PENDING")
     .reduce((total: number, adjustment: any) => total + (Number(adjustment.amount) || 0), 0);

    estimatedCommission -= pendingAdjustmentAmount;
    actualCommission -= pendingAdjustmentAmount;
   }
  }

  const remainingCommission = Math.max(0, actualCommission - paidAmount);

  return res.status(200).json({
   success: true,
   data: {
    conversions,
    totalClicks: affiliate.totalClicks ?? 0,
    deliveredOrders,
    estimatedCommission: Math.max(0, estimatedCommission),
    actualCommission: Math.max(0, actualCommission),
    paidAmount,
    remainingCommission,
    ordersMissingRate,
    currency: "VND",
   },
  });
 } catch (error) {
  console.error("Affiliate commission stats API error:", error);

  return res.status(500).json({
   success: false,
   message: "Không thể tải thống kê hoa hồng.",
  });
 }
}
