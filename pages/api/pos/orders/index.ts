import type { NextApiRequest, NextApiResponse } from "next";
import mongoose from "mongoose";

import { connectDB } from "~/lib/mongodb";
import { requireAuth } from "~/lib/permissions";

import { Order } from "~/models/Order";
import { OrderItem } from "~/models/OrderItem";
import { OrderStatus } from "~/models/OrderStatus";

const ALLOWED_ROLES = ["SUPER_ADMIN", "STORE_ADMIN"];

const PAYMENT_METHODS = ["COD", "BANK_TRANSFER", "CREDIT_CARD", "DEBIT_CARD", "OTHER"];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
 if (req.method !== "GET") {
  res.setHeader("Allow", ["GET"]);
  return res.status(405).json({
   message: "Phương thức không được hỗ trợ.",
  });
 }

 try {
  await connectDB();

  const user = await requireAuth(req);

  if (!ALLOWED_ROLES.includes(user.role)) {
   return res.status(403).json({
    message: "Bạn không có quyền xem danh sách đơn hàng.",
   });
  }

  const parseString = (value: unknown) => (typeof value === "string" ? value.trim() : "");

  const keyword = parseString(req.query.keyword);
  const statusId = parseString(req.query.statusId);
  const requestedStoreId = parseString(req.query.storeId);
  const startDate = parseString(req.query.startDate);
  const endDate = parseString(req.query.endDate);
  const paymentMethod = parseString(req.query.paymentMethod);
  const paymentStatus = parseString(req.query.paymentStatus);

  const PAYMENT_STATUSES = ["PENDING", "PAID", "FAILED", "REFUNDED"];

  if (paymentStatus && !PAYMENT_STATUSES.includes(paymentStatus)) {
   return res.status(400).json({
    message: "Trạng thái thanh toán không hợp lệ.",
   });
  }
  const sortBy = parseString(req.query.sortBy) || "newest";

  const rawPage = Number(req.query.page || 1);
  const rawLimit = Number(req.query.limit || 20);

  const page = Number.isInteger(rawPage) && rawPage > 0 ? rawPage : 1;

  const limit = Number.isInteger(rawLimit) && rawLimit > 0 ? Math.min(rawLimit, 100) : 20;

  if (statusId && !mongoose.Types.ObjectId.isValid(statusId)) {
   return res.status(400).json({
    message: "ID trạng thái không hợp lệ.",
   });
  }

  if (requestedStoreId && !mongoose.Types.ObjectId.isValid(requestedStoreId)) {
   return res.status(400).json({
    message: "ID cửa hàng không hợp lệ.",
   });
  }

  if (paymentMethod && !PAYMENT_METHODS.includes(paymentMethod)) {
   return res.status(400).json({
    message: "Phương thức thanh toán không hợp lệ.",
   });
  }

  const allowedSorts: Record<string, Record<string, 1 | -1>> = {
   newest: { createdAt: -1 },
   oldest: { createdAt: 1 },
   amount_desc: { total: -1, createdAt: -1 },
   amount_asc: { total: 1, createdAt: -1 },
  };

  if (!allowedSorts[sortBy]) {
   return res.status(400).json({
    message: "Kiểu sắp xếp không hợp lệ.",
   });
  }

  const filter: Record<string, any> = {
   isDeleted: false,
  };

  // STORE_ADMIN chỉ được truy cập cửa hàng của mình.
  if (user.role !== "SUPER_ADMIN") {
   if (!user.storeId) {
    return res.status(403).json({
     message: "Tài khoản chưa được gán cửa hàng.",
    });
   }

   filter.storeId = new mongoose.Types.ObjectId(user.storeId);
  } else if (requestedStoreId) {
   // SUPER_ADMIN có thể lọc theo một cửa hàng cụ thể.
   filter.storeId = new mongoose.Types.ObjectId(requestedStoreId);
  }

  if (statusId) {
   filter.statusId = new mongoose.Types.ObjectId(statusId);
  }

  if (paymentMethod) {
   filter.paymentMethod = paymentMethod;
  }
  if (paymentStatus) {
   filter.paymentStatus = paymentStatus;
  }
  if (startDate || endDate) {
   const createdAt: Record<string, Date> = {};

   if (startDate) {
    const date = new Date(`${startDate}T00:00:00.000Z`);

    if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== startDate) {
     return res.status(400).json({
      message: "Ngày bắt đầu không hợp lệ.",
     });
    }

    createdAt.$gte = date;
   }

   if (endDate) {
    const date = new Date(`${endDate}T00:00:00.000Z`);

    if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== endDate) {
     return res.status(400).json({
      message: "Ngày kết thúc không hợp lệ.",
     });
    }

    // Bao gồm toàn bộ ngày kết thúc.
    date.setUTCDate(date.getUTCDate() + 1);
    createdAt.$lt = date;
   }

   if (createdAt.$gte && createdAt.$lt && createdAt.$gte >= createdAt.$lt) {
    return res.status(400).json({
     message: "Khoảng ngày không hợp lệ.",
    });
   }

   filter.createdAt = createdAt;
  }

  if (keyword) {
   const escapedKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
   const regex = new RegExp(escapedKeyword, "i");

   filter.$or = [{ orderNumber: regex }, { "customerSnapshot.name": regex }, { "customerSnapshot.phone": regex }];
  }

  const skip = (page - 1) * limit;

  const [orderDocuments, total] = await Promise.all([
   Order.find(filter).sort(allowedSorts[sortBy]).skip(skip).limit(limit).lean(),

   Order.countDocuments(filter),
  ]);

  const orderIds = orderDocuments.map((order: any) => order._id);

  const [itemDocuments, statusDocuments] = await Promise.all([
   orderIds.length
    ? OrderItem.find({
       orderId: { $in: orderIds },
      })
       .sort({ createdAt: 1, _id: 1 })
       .lean()
    : Promise.resolve([]),

   OrderStatus.find({}).select("_id name code color icon sortOrder isActive isFinal nextStatusIds").sort({ sortOrder: 1 }).lean(),
  ]);

  const itemsByOrder = new Map<string, any[]>();

  for (const item of itemDocuments as any[]) {
   const key = String(item.orderId);

   const currentItems = itemsByOrder.get(key) || [];

   currentItems.push({
    _id: String(item._id),
    productId: String(item.productId),
    productSnapshot: item.productSnapshot,
    quantity: item.quantity,
    price: item.price,
    subtotal: item.subtotal,
    currency: item.currency,
   });

   itemsByOrder.set(key, currentItems);
  }

  const orders = orderDocuments.map((order: any) => ({
   ...order,
   _id: String(order._id),
   storeId: String(order.storeId),
   customerId: String(order.customerId),
   statusId: String(order.statusId),
   items: itemsByOrder.get(String(order._id)) || [],
  }));

  const statuses = (statusDocuments as any[]).map((status) => ({
   ...status,
   _id: String(status._id),
   nextStatusIds: (status.nextStatusIds || []).map((id: mongoose.Types.ObjectId) => String(id)),
  }));

  return res.status(200).json({
   orders,
   statuses,
   total,
   page,
   limit,
   totalPages: Math.ceil(total / limit),
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

  console.error("POS ORDERS API ERROR:", error);

  return res.status(500).json({
   message: "Không thể tải danh sách đơn hàng.",
  });
 }
}
