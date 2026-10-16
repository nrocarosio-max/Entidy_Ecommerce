import type { NextApiRequest, NextApiResponse } from "next";
import mongoose from "mongoose";

import { connectDB } from "~/lib/mongodb";
import { requireAuth } from "~/lib/permissions";

import { Order } from "~/models/Order";
import { OrderStatus } from "~/models/OrderStatus";
import { OrderStatusHistory } from "~/models/OrderStatusHistory";

const ALLOWED_ROLES = ["SUPER_ADMIN", "STORE_ADMIN"];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
 if (req.method !== "PATCH") {
  res.setHeader("Allow", ["PATCH"]);

  return res.status(405).json({
   message: "Phương thức không được hỗ trợ.",
  });
 }

 try {
  await connectDB();

  const user = await requireAuth(req);

  if (!ALLOWED_ROLES.includes(user.role)) {
   return res.status(403).json({
    message: "Bạn không có quyền cập nhật trạng thái đơn hàng.",
   });
  }

  const orderId = Array.isArray(req.query.id) ? req.query.id[0] : req.query.id;

  const { statusId, note = "" } = req.body || {};

  if (!orderId || !mongoose.Types.ObjectId.isValid(orderId)) {
   return res.status(400).json({
    message: "ID đơn hàng không hợp lệ.",
   });
  }

  if (typeof statusId !== "string" || !mongoose.Types.ObjectId.isValid(statusId)) {
   return res.status(400).json({
    message: "ID trạng thái không hợp lệ.",
   });
  }

  if (typeof note !== "string") {
   return res.status(400).json({
    message: "Ghi chú không hợp lệ.",
   });
  }

  const orderFilter: Record<string, any> = {
   _id: new mongoose.Types.ObjectId(orderId),
   isDeleted: false,
  };

  // STORE_ADMIN chỉ được cập nhật đơn của cửa hàng mình.
  if (user.role !== "SUPER_ADMIN") {
   if (!user.storeId) {
    return res.status(403).json({
     message: "Tài khoản chưa được gán cửa hàng.",
    });
   }

   orderFilter.storeId = new mongoose.Types.ObjectId(user.storeId);
  }

  const order = await Order.findOne(orderFilter);

  if (!order) {
   return res.status(404).json({
    message: "Không tìm thấy đơn hàng hoặc bạn không có quyền truy cập.",
   });
  }

  const currentStatusId = String(order.statusId);
  const nextStatusId = statusId;

  if (currentStatusId === nextStatusId) {
   return res.status(400).json({
    message: "Đơn hàng đang ở trạng thái này.",
   });
  }

  const [currentStatus, nextStatus] = await Promise.all([OrderStatus.findById(currentStatusId).lean(), OrderStatus.findById(nextStatusId).lean()]);

  if (!currentStatus) {
   return res.status(400).json({
    message: "Không tìm thấy trạng thái hiện tại của đơn hàng.",
   });
  }

  if (!nextStatus || nextStatus.isActive === false) {
   return res.status(400).json({
    message: "Trạng thái mới không tồn tại hoặc đã bị vô hiệu hóa.",
   });
  }
  if ((nextStatus.sortOrder ?? 0) <= (currentStatus.sortOrder ?? 0)) {
   return res.status(400).json({
    message: "Không thể chuyển về trạng thái trước đó.",
   });
  }

  const changedBy = (user as any)._id || (user as any).id;

  if (!changedBy || !mongoose.Types.ObjectId.isValid(String(changedBy))) {
   return res.status(401).json({
    message: "Không xác định được tài khoản thực hiện thao tác.",
   });
  }

  // Chỉ cập nhật nếu trạng thái đơn vẫn là trạng thái vừa kiểm tra.
  const updatedOrder = await Order.findOneAndUpdate(
   {
    ...orderFilter,
    statusId: new mongoose.Types.ObjectId(currentStatusId),
   },
   {
    $set: {
     statusId: new mongoose.Types.ObjectId(nextStatusId),
    },
   },
   {
    new: true,
    runValidators: true,
   },
  );

  if (!updatedOrder) {
   return res.status(409).json({
    message: "Đơn hàng vừa được cập nhật. Vui lòng tải lại dữ liệu.",
   });
  }

  try {
   await OrderStatusHistory.create({
    orderId: updatedOrder._id,
    fromStatusId: currentStatus._id,
    toStatusId: nextStatus._id,
    fromStatusName: currentStatus.name,
    toStatusName: nextStatus.name,
    changedBy: new mongoose.Types.ObjectId(String(changedBy)),
    note: note.trim(),
   });
  } catch (historyError) {
   // Khôi phục trạng thái cũ nếu không ghi được lịch sử.
   await Order.updateOne(
    {
     _id: updatedOrder._id,
     statusId: nextStatus._id,
    },
    {
     $set: {
      statusId: currentStatus._id,
     },
    },
   );

   throw historyError;
  }

  return res.status(200).json({
   message: "Cập nhật trạng thái đơn hàng thành công.",
   order: {
    _id: String(updatedOrder._id),
    statusId: String(updatedOrder.statusId),
   },
   history: {
    fromStatusName: currentStatus.name,
    toStatusName: nextStatus.name,
   },
  });
 } catch (error) {
  const message = error instanceof Error ? error.message : "";

  if (message === "UNAUTHORIZED") {
   return res.status(401).json({
    message: "Vui lòng đăng nhập để tiếp tục.",
   });
  }

  if (message === "FORBIDDEN") {
   return res.status(403).json({
    message: "Bạn không có quyền thực hiện thao tác này.",
   });
  }

  console.error("UPDATE POS ORDER STATUS ERROR:", error);

  return res.status(500).json({
   message: "Không thể cập nhật trạng thái đơn hàng.",
  });
 }
}
