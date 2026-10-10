import type { NextApiRequest, NextApiResponse } from "next";
import mongoose from "mongoose";

import { connectDB } from "~/lib/mongodb";
import { requireSuperAdmin } from "~/lib/permissions";
import { AffiliateCommission } from "~/models/AffiliateCommission";

type CommissionStatus = "PENDING" | "APPROVED" | "PAID" | "REVERSED";

const ALLOWED_TRANSITIONS: Record<CommissionStatus, CommissionStatus[]> = {
 PENDING: ["APPROVED", "REVERSED"],
 APPROVED: ["PAID", "REVERSED"],
 PAID: [],
 REVERSED: [],
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
 await connectDB();

 try {
  await requireSuperAdmin(req);
 } catch {
  return res.status(403).json({
   success: false,
   message: "Bạn không có quyền thực hiện thao tác này.",
  });
 }

 if (req.method !== "PATCH") {
  res.setHeader("Allow", ["PATCH"]);
  return res.status(405).json({
   success: false,
   message: "Method not allowed.",
  });
 }

 try {
  const { id } = req.query;

  if (typeof id !== "string" || !mongoose.isValidObjectId(id)) {
   return res.status(400).json({
    success: false,
    message: "ID hoa hồng không hợp lệ.",
   });
  }

  const { status, note } = req.body as {
   status?: CommissionStatus;
   note?: string;
  };

  const validStatuses: CommissionStatus[] = ["PENDING", "APPROVED", "PAID", "REVERSED"];

  if (!status || !validStatuses.includes(status)) {
   return res.status(400).json({
    success: false,
    message: "Trạng thái hoa hồng không hợp lệ.",
   });
  }

  if (note !== undefined && typeof note !== "string") {
   return res.status(400).json({
    success: false,
    message: "Ghi chú không hợp lệ.",
   });
  }

  const normalizedNote = typeof note === "string" ? note.trim() : undefined;

  if (normalizedNote && normalizedNote.length > 1000) {
   return res.status(400).json({
    success: false,
    message: "Ghi chú không được vượt quá 1000 ký tự.",
   });
  }

  const commission = await AffiliateCommission.findById(id);

  if (!commission) {
   return res.status(404).json({
    success: false,
    message: "Không tìm thấy hoa hồng.",
   });
  }

  const currentStatus = commission.status as CommissionStatus;

  if (!ALLOWED_TRANSITIONS[currentStatus]?.includes(status)) {
   return res.status(409).json({
    success: false,
    message: `Không thể chuyển trạng thái từ ${currentStatus} sang ${status}.`,
   });
  }

  // A paid commission must never be reversed through this endpoint.
  // Handle payment disputes or clawbacks through a separate audited workflow.
  const sessionUser = (
   req as NextApiRequest & {
    user?: { _id?: string; id?: string };
   }
  ).user;

  const actorId = sessionUser?._id || sessionUser?.id;

  if (status === "APPROVED") {
   if (!actorId || !mongoose.isValidObjectId(actorId)) {
    return res.status(401).json({
     success: false,
     message: "Không xác định được người duyệt.",
    });
   }

   commission.approvedBy = new mongoose.Types.ObjectId(actorId);
   commission.approvedAt = new Date();
  }

  if (status === "PAID") {
   commission.paidAt = new Date();
  }

  commission.status = status;

  if (normalizedNote !== undefined) {
   commission.note = normalizedNote;
  }

  await commission.save();

  return res.status(200).json({
   success: true,
   message: "Cập nhật trạng thái hoa hồng thành công.",
   commission,
  });
 } catch (error) {
  console.error("PATCH affiliate commission error:", error);

  return res.status(500).json({
   success: false,
   message: "Không thể cập nhật trạng thái hoa hồng.",
  });
 }
}
