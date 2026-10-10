import type { NextApiRequest, NextApiResponse } from "next";
import mongoose from "mongoose";

import { connectDB } from "~/lib/mongodb";
import { requireSuperAdmin } from "~/lib/permissions";

import { AffiliatePayment } from "~/models/AffiliatePayment";
import { Affiliate } from "~/models/Affiliate";
import { AffiliateStore } from "~/models/AffiliateStore";

type ApiResponse = {
 success: boolean;
 message?: string;
 data?: unknown;
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
 try {
  await connectDB();
  const admin = await requireSuperAdmin(req);

  if (req.method === "GET") {
   const page = Math.max(1, Number(req.query.page) || 1);
   const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));

   const affiliateId = typeof req.query.affiliateId === "string" ? req.query.affiliateId : "";

   const storeId = typeof req.query.storeId === "string" ? req.query.storeId : "";

   const search = typeof req.query.search === "string" ? req.query.search.trim() : "";

   if ((affiliateId && !mongoose.isValidObjectId(affiliateId)) || (storeId && !mongoose.isValidObjectId(storeId))) {
    return res.status(400).json({
     success: false,
     message: "Affiliate ID hoặc Store ID không hợp lệ.",
    });
   }

   const filter: Record<string, unknown> = {
    isDeleted: { $ne: true },
    currency: "VND",
   };

   if (affiliateId) filter.affiliateId = affiliateId;
   if (storeId) filter.storeId = storeId;

   if (search) {
    const matchingAffiliates = await Affiliate.find({
     $or: [{ code: { $regex: search, $options: "i" } }],
    })
     .select("_id")
     .lean();

    const matchingIds = matchingAffiliates.map((item) => item._id.toString());

    if (mongoose.isValidObjectId(search)) {
     matchingIds.push(search);
    }

    filter.$or = [
     { transactionReference: { $regex: search, $options: "i" } },
     { note: { $regex: search, $options: "i" } },
     { affiliateId: { $in: matchingIds } },
    ];
   }

   const [payments, total] = await Promise.all([
    AffiliatePayment.find(filter)
     .populate({
      path: "affiliateId",
      select: "code userId",
      populate: {
       path: "userId",
       select: "name email",
      },
     })
     .populate("storeId", "name code")
     .populate("affiliateStoreId", "commissionRate status")
     .populate("recordedBy", "name email")
     .populate("updatedBy", "name email")
     .sort({ paymentDate: -1, createdAt: -1 })
     .skip((page - 1) * limit)
     .limit(limit)
     .lean(),

    AffiliatePayment.countDocuments(filter),
   ]);

   return res.status(200).json({
    success: true,
    data: payments,
    pagination: {
     page,
     limit,
     total,
     totalPages: Math.ceil(total / limit),
    },
   });
  }

  if (req.method === "POST") {
   const { affiliateId, storeId, amount, paymentDate, paymentMethod, transactionReference, note } = req.body ?? {};

   if (!mongoose.isValidObjectId(affiliateId) || !mongoose.isValidObjectId(storeId)) {
    return res.status(400).json({
     success: false,
     message: "Affiliate ID hoặc Store ID không hợp lệ.",
    });
   }

   const parsedAmount = Number(amount);

   if (!Number.isSafeInteger(parsedAmount) || parsedAmount < 1) {
    return res.status(400).json({
     success: false,
     message: "Số tiền thanh toán phải là số nguyên VND lớn hơn 0.",
    });
   }

   const allowedMethods = ["BANK_TRANSFER", "CASH", "E_WALLET", "OTHER"];

   const method = paymentMethod || "BANK_TRANSFER";

   if (!allowedMethods.includes(method)) {
    return res.status(400).json({
     success: false,
     message: "Phương thức thanh toán không hợp lệ.",
    });
   }

   const parsedDate = paymentDate ? new Date(paymentDate) : new Date();

   if (Number.isNaN(parsedDate.getTime())) {
    return res.status(400).json({
     success: false,
     message: "Ngày thanh toán không hợp lệ.",
    });
   }

   const affiliate = await Affiliate.findById(affiliateId).select("_id status").lean();

   if (!affiliate) {
    return res.status(404).json({
     success: false,
     message: "Không tìm thấy affiliate.",
    });
   }

   const affiliateStore = await AffiliateStore.findOne({
    affiliateId,
    storeId,
   })
    .select("_id")
    .lean();

   if (!affiliateStore) {
    return res.status(400).json({
     success: false,
     message: "Affiliate chưa được liên kết với cửa hàng này.",
    });
   }

   const payment = await AffiliatePayment.create({
    affiliateId,
    affiliateStoreId: affiliateStore._id,
    storeId,
    amount: parsedAmount,
    currency: "VND",
    paymentDate: parsedDate,
    paymentMethod: method,
    transactionReference: typeof transactionReference === "string" ? transactionReference.trim() : "",
    note: typeof note === "string" ? note.trim() : "",
    recordedBy: admin.id,
   });

   const savedPayment = await AffiliatePayment.findById(payment._id)
    .populate({
     path: "affiliateId",
     select: "code userId",
     populate: {
      path: "userId",
      select: "name email",
     },
    })
    .populate("storeId", "name code")
    .populate("recordedBy", "name email")
    .lean();

   return res.status(201).json({
    success: true,
    message: "Đã ghi nhận khoản thanh toán affiliate.",
    data: savedPayment,
   });
  }

  res.setHeader("Allow", ["GET", "POST"]);

  return res.status(405).json({
   success: false,
   message: "Phương thức không được hỗ trợ.",
  });
 } catch (error) {
  console.error("Affiliate payment API error:", error);

  const status = getErrorStatus(error);

  return res.status(status).json({
   success: false,
   message: status === 401 ? "Bạn chưa đăng nhập." : status === 403 ? "Bạn không có quyền thực hiện thao tác này." : "Đã xảy ra lỗi máy chủ.",
  });
 }
}
