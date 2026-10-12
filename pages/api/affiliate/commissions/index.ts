import type { NextApiRequest, NextApiResponse } from "next";
import mongoose from "mongoose";
import "~/models/Product";
import { connectDB } from "~/lib/mongodb";
import { requireAuth } from "~/lib/permissions";

import { Affiliate } from "~/models/Affiliate";
import { AffiliateCommission } from "~/models/AffiliateCommission";

type ApiResponse = {
 success: boolean;
 message?: string;
 data?: {
  _id: string;
  orderNumber: string;
  productName: string;
  quantity: number;
  commissionRate: number;
  commissionBase: number;
  amount: number;
  currency: string;
  status: string;
  entryType: "COMMISSION" | "ADJUSTMENT";
  adjustmentReason: "CANCELLED" | "RETURNED" | null;
  relatedCommissionId: string | null;
  note: string;
  createdAt: Date;
  storeId: {
   _id: string;
   name: string;
  } | null;
  orderId: {
   _id: string;
   statusId: unknown;
  } | null;
  orderItemId: unknown;
  productId:
   | {
      _id: string;
      name: string;
     }
   | string
   | null;
 }[];
 pagination?: {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
 };
};

const ALLOWED_STATUSES = ["PENDING", "APPROVED", "PAID", "REVERSED"] as const;

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
  })
   .select("_id")
   .lean();

  if (!affiliate) {
   return res.status(404).json({
    success: false,
    message: "Không tìm thấy tài khoản affiliate.",
   });
  }

  const pageValue = Number(req.query.page);
  const limitValue = Number(req.query.limit);

  const page = Number.isInteger(pageValue) && pageValue > 0 ? pageValue : 1;

  const limit = Number.isInteger(limitValue) && limitValue > 0 ? Math.min(limitValue, 100) : 10;

  const filter: {
   affiliateId: mongoose.Types.ObjectId;
   storeId?: mongoose.Types.ObjectId;
   status?: string;
  } = {
   affiliateId: affiliate._id,
  };

  const storeId = typeof req.query.storeId === "string" ? req.query.storeId : "";

  if (storeId) {
   if (!mongoose.isValidObjectId(storeId)) {
    return res.status(400).json({
     success: false,
     message: "Mã cửa hàng không hợp lệ.",
    });
   }

   filter.storeId = new mongoose.Types.ObjectId(storeId);
  }

  const status = typeof req.query.status === "string" ? req.query.status : "";

  if (status) {
   if (!ALLOWED_STATUSES.some((allowedStatus) => allowedStatus === status)) {
    return res.status(400).json({
     success: false,
     message: "Trạng thái hoa hồng không hợp lệ.",
    });
   }

   filter.status = status;
  }

  const [total, commissions] = await Promise.all([
   AffiliateCommission.countDocuments(filter),
   AffiliateCommission.find(filter)
    .select(
     "_id orderNumber productName quantity commissionRate commissionBase amount currency status entryType adjustmentReason relatedCommissionId note createdAt storeId orderId orderItemId productId",
    )
    .populate({
     path: "storeId",
     select: "name",
    })
    .populate({
     path: "orderId",
     select: "orderNumber statusId createdAt",
     populate: {
      path: "statusId",
      select: "name code color",
     },
    })
    .populate({
     path: "orderItemId",
     select: "quantity productSnapshot",
    })
    .populate({
     path: "productId",
     select: "name",
    })
    .sort({ createdAt: -1, _id: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .lean(),
  ]);

  const data: ApiResponse["data"] = commissions.map((commission) => {
   const store =
    commission.storeId && typeof commission.storeId === "object" && "name" in commission.storeId
     ? {
        _id: String(commission.storeId._id),
        name: String(commission.storeId.name ?? ""),
       }
     : null;

   const order =
    commission.orderId && typeof commission.orderId === "object" && "statusId" in commission.orderId
     ? {
        _id: String(commission.orderId._id),
        statusId: commission.orderId.statusId ?? null,
       }
     : null;

   const product =
    commission.productId && typeof commission.productId === "object" && "name" in commission.productId
     ? {
        _id: String(commission.productId._id),
        name: String(commission.productId.name ?? ""),
       }
     : commission.productId
       ? String(commission.productId)
       : null;

   return {
    _id: String(commission._id),
    orderNumber: commission.orderNumber || "",
    productName: commission.productName || "",
    quantity: commission.quantity,
    commissionRate: commission.commissionRate,
    commissionBase: commission.commissionBase,
    amount: commission.amount,
    currency: commission.currency,
    status: commission.status,
    entryType: commission.entryType,
    adjustmentReason: commission.adjustmentReason ?? null,
    relatedCommissionId: commission.relatedCommissionId ? String(commission.relatedCommissionId) : null,
    note: commission.note || "",
    createdAt: commission.createdAt,
    storeId: store,
    orderId: order,
    orderItemId: commission.orderItemId ?? null,
    productId: product,
   };
  });

  return res.status(200).json({
   success: true,
   data,
   pagination: {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
   },
  });
 } catch (error: unknown) {
  console.error("Affiliate commissions API error:", error);

  const message = error instanceof Error ? error.message : "";

  if (message === "UNAUTHORIZED") {
   return res.status(401).json({
    success: false,
    message: "Bạn chưa đăng nhập.",
   });
  }

  if (message === "FORBIDDEN") {
   return res.status(403).json({
    success: false,
    message: "Bạn không có quyền truy cập dữ liệu này.",
   });
  }

  return res.status(500).json({
   success: false,
   message: "Đã xảy ra lỗi máy chủ.",
  });
 }
}
