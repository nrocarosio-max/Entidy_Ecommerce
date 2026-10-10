import type { NextApiRequest, NextApiResponse } from "next";
import mongoose from "mongoose";

import { connectDB } from "~/lib/mongodb";
import { requireAuth } from "~/lib/permissions";

import { Affiliate } from "~/models/Affiliate";
import { AffiliateStore } from "~/models/AffiliateStore";
import { AffiliateCommission } from "~/models/AffiliateCommission";

type ApiResponse = {
 success: boolean;
 message?: string;
 data?: unknown[];
 pagination?: {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
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
    message: "Bạn không có quyền xem dữ liệu affiliate.",
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

  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));

  const storeId = typeof req.query.storeId === "string" ? req.query.storeId : "";

  const status = typeof req.query.status === "string" ? req.query.status.toUpperCase() : "";

  const allowedStatuses = ["PENDING", "APPROVED", "PAID", "REVERSED"];

  if (storeId && !mongoose.isValidObjectId(storeId)) {
   return res.status(400).json({
    success: false,
    message: "Store ID không hợp lệ.",
   });
  }

  if (status && !allowedStatuses.includes(status)) {
   return res.status(400).json({
    success: false,
    message: "Trạng thái hoa hồng không hợp lệ.",
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
    data: [],
    pagination: {
     page,
     limit,
     total: 0,
     totalPages: 0,
    },
   });
  }

  const filter: Record<string, unknown> = {
   affiliateId: affiliate._id,
   storeId: { $in: allowedStoreIds },
   currency: "VND",
  };

  if (status) {
   filter.status = status;
  }

  const [commissions, total] = await Promise.all([
   AffiliateCommission.find(filter)
    .populate("storeId", "name code")
    .populate("orderId", "orderNumber statusId createdAt")
    .populate("orderItemId", "productSnapshot quantity subtotal")
    .populate("productId", "name sku slug")
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .lean(),

   AffiliateCommission.countDocuments(filter),
  ]);

  return res.status(200).json({
   success: true,
   data: commissions,
   pagination: {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
   },
  });
 } catch (error) {
  console.error("Affiliate commissions API error:", error);

  const statusCode = getErrorStatus(error);

  return res.status(statusCode).json({
   success: false,
   message: statusCode === 401 ? "Bạn chưa đăng nhập." : statusCode === 403 ? "Bạn không có quyền truy cập dữ liệu này." : "Đã xảy ra lỗi máy chủ.",
  });
 }
}
