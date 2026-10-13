import type { NextApiRequest, NextApiResponse } from "next";
import mongoose from "mongoose";

import { connectDB } from "~/lib/mongodb";
import { requireAuth } from "~/lib/permissions";

import { Order } from "~/models/Order";
import { Product } from "~/models/Product";
import { Customer } from "~/models/Customer";
import { OrderStatus } from "~/models/OrderStatus";

const POS_ROLES = ["SUPER_ADMIN", "STORE_ADMIN", "MARKETING", "SALES", "FULFILLMENT"] as const;

type DashboardResponse = {
 success: boolean;
 message?: string;
 filters?: {
  storeId: string | null;
  fromDate: string;
  toDate: string;
 };
 stats?: {
  totalOrders: number;
  pendingOrders: number;
  deliveredOrders: number;
  totalCustomers: number;
  totalProducts: number;
  lowStockProducts: number;
  revenue: Array<{
   currency: string;
   total: number;
  }>;
 };
 salesOverview?: Array<{
  date: string;
  currency: string;
  total: number;
  orders: number;
 }>;
 recentOrders?: unknown[];
 lowStockProducts?: unknown[];
};

export default async function handler(req: NextApiRequest, res: NextApiResponse<DashboardResponse>) {
 try {
  if (req.method !== "GET") {
   res.setHeader("Allow", "GET");

   return res.status(405).json({
    success: false,
    message: "Method not allowed.",
   });
  }

  await connectDB();

  const user = await requireAuth(req);

  // Only these five roles may access POS APIs.
  if (!(POS_ROLES as readonly string[]).includes(user.role)) {
   return res.status(403).json({
    success: false,
    message: "You do not have access to POS.",
   });
  }

  // Non-super-admin users are restricted to their assigned store.
  let storeId: string | null = null;

  if (user.role === "SUPER_ADMIN") {
   const requestedStoreId = typeof req.query.storeId === "string" ? req.query.storeId.trim() : "";

   if (requestedStoreId) {
    if (!mongoose.Types.ObjectId.isValid(requestedStoreId)) {
     return res.status(400).json({
      success: false,
      message: "Invalid storeId.",
     });
    }

    storeId = requestedStoreId;
   }
  } else {
   if (!user.storeId) {
    return res.status(403).json({
     success: false,
     message: "User is not assigned to a store.",
    });
   }

   storeId = user.storeId;
  }

  const parseDate = (value: string, endOfDay = false): Date | null => {
   const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

   if (!match) return null;

   const year = Number(match[1]);
   const month = Number(match[2]);
   const day = Number(match[3]);

   // Kiểm tra ngày lịch bằng UTC, không so sánh chuỗi ISO.
   const calendarDate = new Date(Date.UTC(year, month - 1, day));

   if (calendarDate.getUTCFullYear() !== year || calendarDate.getUTCMonth() + 1 !== month || calendarDate.getUTCDate() !== day) {
    return null;
   }

   // Chuyển đầu/cuối ngày Việt Nam (UTC+7) thành thời điểm UTC.
   const timestamp = Date.UTC(year, month - 1, day, endOfDay ? 16 : -7, endOfDay ? 59 : 0, endOfDay ? 59 : 0, endOfDay ? 999 : 0);

   return new Date(timestamp);
  };

  const now = new Date();
  const vietnamNow = new Date(now.getTime() + 7 * 60 * 60 * 1000);

  const year = vietnamNow.getUTCFullYear();
  const month = String(vietnamNow.getUTCMonth() + 1).padStart(2, "0");
  const day = String(vietnamNow.getUTCDate()).padStart(2, "0");

  const defaultFrom = `${year}-${month}-01`;
  const defaultTo = `${year}-${month}-${day}`;

  const queryFromDate = typeof req.query.fromDate === "string" && req.query.fromDate.trim() ? req.query.fromDate.trim() : defaultFrom;

  const queryToDate = typeof req.query.toDate === "string" && req.query.toDate.trim() ? req.query.toDate.trim() : defaultTo;

  const fromDate = parseDate(queryFromDate);
  const toDate = parseDate(queryToDate, true);
  console.log("POS dashboard date debug:", {
   fromDateQuery: req.query.fromDate,
   toDateQuery: req.query.toDate,
   queryFromDate,
   queryToDate,
   parsedFromDate: fromDate,
   parsedToDate: toDate,
  });
  if (!fromDate || !toDate || fromDate.getTime() > toDate.getTime()) {
   return res.status(400).json({
    success: false,
    message: "Invalid date range.",
   });
  }

  const storeFilter = storeId ? { storeId: new mongoose.Types.ObjectId(storeId) } : {};

  const orderFilter = {
   ...storeFilter,
   isDeleted: { $ne: true },
  };

  const orderDateFilter = {
   ...orderFilter,
   createdAt: {
    $gte: fromDate,
    $lte: toDate,
   },
  };

  const productFilter = {
   ...storeFilter,
   isActive: true,
  };

  const customerFilter = {
   ...storeFilter,
   isActive: true,
  };

  const [totalOrders, statusCounts, revenueAggregation, salesAggregation, totalCustomers, totalProducts, lowStockCount, lowStockProducts, recentOrders] =
   await Promise.all([
    Order.countDocuments(orderDateFilter),

    Order.aggregate([
     { $match: orderDateFilter },
     {
      $group: {
       _id: "$statusId",
       count: { $sum: 1 },
      },
     },
    ]),

    Order.aggregate([
     {
      $match: {
       ...orderDateFilter,
       paymentStatus: "PAID",
      },
     },
     {
      $group: {
       _id: "$currency",
       total: { $sum: "$total" },
      },
     },
    ]),

    Order.aggregate([
     {
      $match: {
       ...orderDateFilter,
       paymentStatus: "PAID",
      },
     },
     {
      $group: {
       _id: {
        date: {
         $dateToString: {
          format: "%Y-%m-%d",
          date: "$createdAt",
          timezone: "Asia/Ho_Chi_Minh",
         },
        },
        currency: "$currency",
       },
       total: { $sum: "$total" },
       orders: { $sum: 1 },
      },
     },
     { $sort: { "_id.date": 1 } },
    ]),

    Customer.countDocuments(customerFilter),

    Product.countDocuments(productFilter),
    Product.countDocuments({
     ...productFilter,
     quantity: {
      $lte: 5,
     },
    }),
    Product.find({
     ...productFilter,
     quantity: {
      $lte: 5,
     },
    })
     .select("_id name sku quantity lowStockThreshold price currency images status")
     .sort({ quantity: 1, createdAt: -1 })
     .limit(10)
     .lean(),

    Order.find(orderDateFilter)
     .populate("customerId", "name phone")
     .populate("statusId", "name code")
     .select("_id orderNumber customerId customerSnapshot subtotal shippingFee discount total currency paymentMethod paymentStatus statusId createdAt")
     .sort({ createdAt: -1 })
     .limit(10)
     .lean(),
   ]);

  // Resolve status codes through the OrderStatus collection.
  const statusIds = statusCounts.map((item) => item._id).filter(Boolean);

  const statuses = statusIds.length
   ? await OrderStatus.find({ _id: { $in: statusIds } })
      .select("_id code name")
      .lean()
   : [];

  const statusCodeById = new Map(statuses.map((status) => [String(status._id), String(status.code ?? "").toUpperCase()]));

  const statusCountByCode = new Map<string, number>();

  for (const item of statusCounts) {
   const code = statusCodeById.get(String(item._id));

   if (code) {
    statusCountByCode.set(code, (statusCountByCode.get(code) ?? 0) + item.count);
   }
  }

  return res.status(200).json({
   success: true,

   filters: {
    storeId,
    fromDate: fromDate.toISOString(),
    toDate: toDate.toISOString(),
   },

   stats: {
    totalOrders,
    pendingOrders: statusCountByCode.get("PENDING") ?? 0,
    deliveredOrders: statusCountByCode.get("DELIVERED") ?? 0,
    totalCustomers,
    totalProducts,
    lowStockProducts: lowStockCount,
    revenue: revenueAggregation.map((item) => ({
     currency: item._id,
     total: item.total,
    })),
   },

   salesOverview: salesAggregation.map((item) => ({
    date: item._id.date,
    currency: item._id.currency,
    total: item.total,
    orders: item.orders,
   })),

   recentOrders,
   lowStockProducts,
  });
 } catch (error) {
  console.error("POS dashboard API error:", error);

  if (error instanceof Error && error.message === "UNAUTHORIZED") {
   return res.status(401).json({
    success: false,
    message: "Unauthorized.",
   });
  }

  if (error instanceof Error && error.message === "FORBIDDEN") {
   return res.status(403).json({
    success: false,
    message: "Forbidden.",
   });
  }

  return res.status(500).json({
   success: false,
   message: "Internal server error.",
  });
 }
}
