import type { NextApiRequest, NextApiResponse } from "next";
import mongoose from "mongoose";

import { connectDB } from "~/lib/mongodb";
import { requireSuperAdmin } from "~/lib/permissions";

import { AffiliatePayment } from "~/models/AffiliatePayment";
import { AffiliateStore } from "~/models/AffiliateStore";

type ApiResponse = {
 success: boolean;
 message?: string;
 data?: unknown;
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

  const { id } = req.query;

  if (typeof id !== "string" || !mongoose.isValidObjectId(id)) {
   return res.status(400).json({
    success: false,
    message: "Payment ID không hợp lệ.",
   });
  }

  const payment = await AffiliatePayment.findOne({
   _id: id,
   isDeleted: { $ne: true },
  });

  if (!payment) {
   return res.status(404).json({
    success: false,
    message: "Không tìm thấy khoản thanh toán.",
   });
  }

  if (req.method === "PUT") {
   const { storeId, amount, paymentDate, paymentMethod, transactionReference, note } = req.body ?? {};

   // Update amount
   if (amount !== undefined) {
    const parsedAmount = Number(amount);

    if (!Number.isSafeInteger(parsedAmount) || parsedAmount < 1) {
     return res.status(400).json({
      success: false,
      message: "Số tiền phải là số nguyên VND lớn hơn 0.",
     });
    }

    payment.amount = parsedAmount;
   }

   // Update store
   if (storeId !== undefined) {
    if (!mongoose.isValidObjectId(storeId)) {
     return res.status(400).json({
      success: false,
      message: "Store ID không hợp lệ.",
     });
    }

    const affiliateStore = await AffiliateStore.findOne({
     affiliateId: payment.affiliateId,
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

    payment.storeId = new mongoose.Types.ObjectId(storeId);
    payment.affiliateStoreId = affiliateStore._id;
   }

   // Update payment date
   if (paymentDate !== undefined) {
    const parsedDate = new Date(paymentDate);

    if (!paymentDate || Number.isNaN(parsedDate.getTime())) {
     return res.status(400).json({
      success: false,
      message: "Ngày thanh toán không hợp lệ.",
     });
    }

    payment.paymentDate = parsedDate;
   }

   // Update payment method
   if (paymentMethod !== undefined) {
    const allowedMethods = ["BANK_TRANSFER", "CASH", "E_WALLET", "OTHER"];

    if (!allowedMethods.includes(paymentMethod)) {
     return res.status(400).json({
      success: false,
      message: "Phương thức thanh toán không hợp lệ.",
     });
    }

    payment.paymentMethod = paymentMethod;
   }

   if (transactionReference !== undefined) {
    if (typeof transactionReference !== "string") {
     return res.status(400).json({
      success: false,
      message: "Mã giao dịch không hợp lệ.",
     });
    }

    payment.transactionReference = transactionReference.trim();
   }

   if (note !== undefined) {
    if (typeof note !== "string") {
     return res.status(400).json({
      success: false,
      message: "Ghi chú không hợp lệ.",
     });
    }

    payment.note = note.trim();
   }

   payment.updatedBy = new mongoose.Types.ObjectId(admin.id);

   await payment.save();

   const updatedPayment = await AffiliatePayment.findById(payment._id)
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
    .lean();

   return res.status(200).json({
    success: true,
    message: "Đã cập nhật khoản thanh toán.",
    data: updatedPayment,
   });
  }

  if (req.method === "DELETE") {
   payment.isDeleted = true;
   payment.deletedAt = new Date();
   payment.updatedBy = new mongoose.Types.ObjectId(admin.id);

   await payment.save();

   return res.status(200).json({
    success: true,
    message: "Đã xóa mềm khoản thanh toán.",
   });
  }

  res.setHeader("Allow", ["PUT", "DELETE"]);

  return res.status(405).json({
   success: false,
   message: "Phương thức không được hỗ trợ.",
  });
 } catch (error) {
  console.error("Affiliate payment detail API error:", error);

  const status = getErrorStatus(error);

  return res.status(status).json({
   success: false,
   message: status === 401 ? "Bạn chưa đăng nhập." : status === 403 ? "Bạn không có quyền thực hiện thao tác này." : "Đã xảy ra lỗi máy chủ.",
  });
 }
}
