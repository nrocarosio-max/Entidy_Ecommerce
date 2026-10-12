import type { NextApiRequest, NextApiResponse } from "next";
import mongoose from "mongoose";

import { connectDB } from "~/lib/mongodb";
import { requireAuth } from "~/lib/permissions";
import { Affiliate } from "~/models/Affiliate";
import { AffiliateCommission } from "~/models/AffiliateCommission";

type ApiResponse = {
 success: boolean;
 message?: string;
 data?: Record<string, unknown>[];
 pagination?: {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
 };
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

  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 10));

  const storeId = typeof req.query.storeId === "string" ? req.query.storeId : "";

  const status = typeof req.query.status === "string" ? req.query.status : "";

  const validStatuses = ["PENDING", "APPROVED", "PAID", "REVERSED"];

  if (status && !validStatuses.includes(status)) {
   return res.status(400).json({
    success: false,
    message: "Trạng thái hoa hồng không hợp lệ.",
   });
  }

  const filter: Record<string, unknown> = {
   affiliateId: affiliate._id,
  };

  if (storeId) {
   if (!mongoose.isValidObjectId(storeId)) {
    return res.status(400).json({
     success: false,
     message: "Mã cửa hàng không hợp lệ.",
    });
   }

   filter.storeId = new mongoose.Types.ObjectId(storeId);
  }

  if (status) {
   filter.status = status;
  }

  const [total, commissions] = await Promise.all([
   AffiliateCommission.countDocuments(filter),

   AffiliateCommission.find(filter)
    .populate({
     path: "storeId",
     select: "name code",
    })
    .populate({
     path: "orderId",
     select: "orderNumber statusId createdAt",
     populate: {
      path: "statusId",
      select: "code name",
     },
    })
    .populate({
     path: "orderItemId",
     select: "productSnapshot quantity",
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

  const data = commissions.map((commission: any) => ({
   _id: String(commission._id),
   orderNumber: commission.orderId?.orderNumber || commission.orderNumber || "",
   productName: commission.orderItemId?.productSnapshot?.name || commission.productName || commission.productId?.name || "Sản phẩm",
   quantity: commission.quantity || commission.orderItemId?.quantity || 1,
   commissionRate: commission.commissionRate,
   commissionBase: commission.commissionBase,
   amount: commission.amount,
   currency: commission.currency,
   status: commission.status,
   entryType: commission.entryType,
   adjustmentReason: commission.adjustmentReason || undefined,
   createdAt: commission.createdAt,
   storeId: commission.storeId
    ? {
       _id: String(commission.storeId._id),
       name: commission.storeId.name || "",
       code: commission.storeId.code || "",
      }
    : undefined,
   orderId: commission.orderId
    ? {
       _id: String(commission.orderId._id),
       orderNumber: commission.orderId.orderNumber || "",
       statusId: commission.orderId.statusId
        ? {
           code: commission.orderId.statusId.code,
           name: commission.orderId.statusId.name,
          }
        : undefined,
       createdAt: commission.orderId.createdAt,
      }
    : undefined,
   orderItemId: commission.orderItemId
    ? {
       productSnapshot: {
        name: commission.orderItemId.productSnapshot?.name,
       },
       quantity: commission.orderItemId.quantity,
      }
    : undefined,
   productId: commission.productId
    ? {
       name: commission.productId.name || "",
      }
    : undefined,
  }));

  return res.status(200).json({
   success: true,
   data,
   pagination: {
    page,
    limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / limit)),
   },
  });
 } catch (error) {
  console.error("Affiliate commissions API error:", error);

  return res.status(500).json({
   success: false,
   message: "Không thể tải danh sách hoa hồng.",
  });
 }
}
