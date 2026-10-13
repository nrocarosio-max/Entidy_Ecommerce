import type { NextApiRequest, NextApiResponse } from "next";
import mongoose from "mongoose";

import { connectDB } from "~/lib/mongodb";
import { requireAuth } from "~/lib/permissions";

import { Order } from "~/models/Order";
import { Customer } from "~/models/Customer";
import { OrderStatus } from "~/models/OrderStatus";

const ALLOWED_ROLES = ["SUPER_ADMIN", "STORE_ADMIN", "MARKETING", "SALES", "FULFILLMENT"];

const PAYMENT_STATUSES = ["PENDING", "PAID", "FAILED", "REFUNDED"];

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

export default async function handler(req: NextApiRequest, res: NextApiResponse<ApiResponse>) {
 if (req.method !== "GET") {
  res.setHeader("Allow", ["GET"]);

  return res.status(405).json({
   success: false,
   message: "Method not allowed.",
  });
 }

 try {
  await connectDB();

  // Register referenced models before populate.
  void Customer;
  void OrderStatus;

  const user = await requireAuth(req);
  const role = String(user.role).toUpperCase();

  if (!ALLOWED_ROLES.includes(role)) {
   return res.status(403).json({
    success: false,
    message: "You do not have permission to view orders.",
   });
  }

  const page = Math.max(1, Number.parseInt(String(req.query.page || "1"), 10) || 1);

  const limit = Math.min(100, Math.max(1, Number.parseInt(String(req.query.limit || "20"), 10) || 20));

  const search = String(req.query.search || "").trim();
  const statusId = req.query.statusId ? String(req.query.statusId) : "";
  const paymentStatus = req.query.paymentStatus ? String(req.query.paymentStatus).toUpperCase() : "";
  const requestedStoreId = req.query.storeId ? String(req.query.storeId) : "";

  const filter: Record<string, any> = {
   isDeleted: { $ne: true },
  };

  // Store-level access control.
  if (role === "SUPER_ADMIN") {
   if (requestedStoreId) {
    if (!mongoose.Types.ObjectId.isValid(requestedStoreId)) {
     return res.status(400).json({
      success: false,
      message: "Invalid storeId.",
     });
    }

    filter.storeId = new mongoose.Types.ObjectId(requestedStoreId);
   }
  } else {
   if (!user.storeId) {
    return res.status(403).json({
     success: false,
     message: "Your account is not assigned to a store.",
    });
   }

   filter.storeId = new mongoose.Types.ObjectId(user.storeId);
  }

  // Search order number, customer name, or phone.
  if (search) {
   const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

   const matchingCustomers = await Customer.find({
    storeId: filter.storeId,
    isActive: true,
    $or: [{ name: { $regex: escapedSearch, $options: "i" } }, { phone: { $regex: escapedSearch, $options: "i" } }],
   })
    .select("_id")
    .limit(500)
    .lean();

   const customerIds = matchingCustomers.map((customer) => customer._id);

   filter.$or = [
    { orderNumber: { $regex: escapedSearch, $options: "i" } },
    { "customerSnapshot.name": { $regex: escapedSearch, $options: "i" } },
    { "customerSnapshot.phone": { $regex: escapedSearch, $options: "i" } },
    ...(customerIds.length > 0 ? [{ customerId: { $in: customerIds } }] : []),
   ];
  }

  // Filter by workflow status.
  if (statusId) {
   if (!mongoose.Types.ObjectId.isValid(statusId)) {
    return res.status(400).json({
     success: false,
     message: "Invalid statusId.",
    });
   }

   filter.statusId = new mongoose.Types.ObjectId(statusId);
  }

  // Filter by payment status.
  if (paymentStatus) {
   if (!PAYMENT_STATUSES.includes(paymentStatus)) {
    return res.status(400).json({
     success: false,
     message: "Invalid paymentStatus.",
    });
   }

   filter.paymentStatus = paymentStatus;
  }

  const skip = (page - 1) * limit;

  const [orders, total] = await Promise.all([
   Order.find(filter)
    .populate("customerId", "name phone nameNormalized")
    .populate("statusId", "name code color sortOrder")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean(),

   Order.countDocuments(filter),
  ]);

  return res.status(200).json({
   success: true,
   data: orders,
   pagination: {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
   },
  });
 } catch (error: unknown) {
  console.error("POS orders API error:", error);

  const message = error instanceof Error ? error.message : "";

  if (message === "UNAUTHORIZED") {
   return res.status(401).json({
    success: false,
    message: "Please sign in to continue.",
   });
  }

  if (message === "FORBIDDEN") {
   return res.status(403).json({
    success: false,
    message: "You do not have permission to view these orders.",
   });
  }

  return res.status(500).json({
   success: false,
   message: process.env.NODE_ENV === "development" ? message || "Internal server error." : "Internal server error.",
  });
 }
}
