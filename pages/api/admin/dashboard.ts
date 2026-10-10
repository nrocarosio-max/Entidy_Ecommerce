import type { NextApiRequest, NextApiResponse } from "next";

import { connectDB } from "~/lib/mongodb";
import { requireAuth } from "~/lib/permissions";

import { Order } from "~/models/Order";
import { Product } from "~/models/Product";
import { Customer } from "~/models/Customer";
import { Payment } from "~/models/Payment";
import { Types } from "mongoose";

import { Affiliate } from "~/models/Affiliate";
import { AffiliateCommission } from "~/models/AffiliateCommission";
import { AffiliatePayment } from "~/models/AffiliatePayment";
import { AffiliateStore } from "~/models/AffiliateStore";
const ORDER_STATUSES = ["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED", "RETURNED"] as const;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
 try {
  if (req.method !== "GET") {
   return res.status(405).json({
    message: "Method not allowed.",
   });
  }

  await connectDB();

  const user = await requireAuth(req);

  /*
   * SUPER_ADMIN:
   * - Can view all stores.
   * - Can optionally filter by storeId.
   *
   * Other users:
   * - Can only view their own store.
   */
  const requestedStoreId = typeof req.query.storeId === "string" ? req.query.storeId : "";

  const storeId = user.role === "SUPER_ADMIN" ? requestedStoreId || null : user.storeId;

  if (user.role !== "SUPER_ADMIN" && !user.storeId) {
   return res.status(403).json({
    message: "User is not assigned to a store.",
   });
  }

  /*
   * Build common store filters.
   */
  const orderFilter = storeId ? { storeId } : {};

  const productFilter = storeId ? { storeId } : {};

  const customerFilter = storeId ? { storeId } : {};

  const paymentFilter = storeId ? { storeId } : {};

  /*
   * Date range.
   *
   * Default:
   * Current month.
   *
   * Optional:
   * ?fromDate=2026-10-01&toDate=2026-10-31
   */
  const now = new Date();

  const defaultFromDate = new Date(now.getFullYear(), now.getMonth(), 1);

  const defaultToDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

  const fromDateParam = typeof req.query.fromDate === "string" ? req.query.fromDate : "";

  const toDateParam = typeof req.query.toDate === "string" ? req.query.toDate : "";

  const fromDate = fromDateParam ? new Date(`${fromDateParam}T00:00:00.000+07:00`) : defaultFromDate;

  const toDate = toDateParam ? new Date(`${toDateParam}T23:59:59.999+07:00`) : defaultToDate;

  /*
   * Basic date validation.
   */
  if (Number.isNaN(fromDate.getTime()) || Number.isNaN(toDate.getTime())) {
   return res.status(400).json({
    message: "Invalid date range.",
   });
  }

  /*
   * Order date filter.
   */
  const orderDateFilter = {
   ...orderFilter,
   createdAt: {
    $gte: fromDate,
    $lte: toDate,
   },
  };

  /*
   * ---------------------------------------------------------
   * 1. ORDER STATISTICS
   * ---------------------------------------------------------
   */

  const totalOrdersPromise = Order.countDocuments(orderDateFilter);

  const orderStatusAggregationPromise = Order.aggregate([
   {
    $match: orderDateFilter,
   },
   {
    $group: {
     _id: "$status",
     count: {
      $sum: 1,
     },
    },
   },
  ]);

  /*
   * ---------------------------------------------------------
   * 2. REVENUE
   * ---------------------------------------------------------
   *
   * Revenue is currently calculated from delivered orders.
   *
   * This keeps cancelled / returned orders out of revenue.
   */
  const revenueAggregationPromise = Order.aggregate([
   {
    $match: {
     ...orderDateFilter,
     status: "DELIVERED",
    },
   },
   {
    $group: {
     _id: "$currency",
     total: {
      $sum: "$total",
     },
    },
   },
  ]);

  /*
   * ---------------------------------------------------------
   * 3. SALES OVERVIEW
   * ---------------------------------------------------------
   *
   * Daily revenue from delivered orders.
   *
   * The date is converted to Asia/Ho_Chi_Minh (+07:00)
   * before grouping so the dashboard matches Vietnam time.
   */
  const salesOverviewAggregationPromise = Order.aggregate([
   {
    $match: {
     ...orderDateFilter,
     status: "DELIVERED",
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
     total: {
      $sum: "$total",
     },
     orders: {
      $sum: 1,
     },
    },
   },
   {
    $sort: {
     "_id.date": 1,
    },
   },
  ]);

  /*
   * ---------------------------------------------------------
   * 4. CUSTOMERS
   * ---------------------------------------------------------
   */

  const totalCustomersPromise = Customer.countDocuments({
   ...customerFilter,
   isActive: true,
  });

  /*
   * ---------------------------------------------------------
   * 5. PRODUCTS
   * ---------------------------------------------------------
   */

  const totalProductsPromise = Product.countDocuments({
   ...productFilter,
   isActive: true,
  });

  /*
   * ---------------------------------------------------------
   * 6. LOW STOCK PRODUCTS
   * ---------------------------------------------------------
   */

  const lowStockProductsPromise = Product.find({
   ...productFilter,
   isActive: true,
   quantity: {
    $lte: 5,
   },
  })
   .select("_id name sku quantity lowStockThreshold price currency images status")
   .sort({
    quantity: 1,
    createdAt: -1,
   })
   .limit(10)
   .lean();

  /*
   * ---------------------------------------------------------
   * 7. RECENT ORDERS
   * ---------------------------------------------------------
   */

  const recentOrdersPromise = Order.find(orderFilter)
   .populate("customerId", "name phone nameNormalized")
   .select("_id orderNumber customerId customerSnapshot subtotal shippingFee discount total currency paymentMethod paymentStatus status createdAt")
   .sort({
    createdAt: -1,
   })
   .limit(10)
   .lean();

  /*
   * ---------------------------------------------------------
   * 8. PAYMENT STATISTICS
   * ---------------------------------------------------------
   *
   * Payment is optional during this transition stage.
   *
   * If Payment collection has no records yet,
   * return zero values instead of failing.
   */
  const paymentStatusAggregationPromise = Payment.aggregate([
   {
    $match: {
     ...paymentFilter,
     createdAt: {
      $gte: fromDate,
      $lte: toDate,
     },
    },
   },
   {
    $group: {
     _id: "$status",
     count: {
      $sum: 1,
     },
     amount: {
      $sum: "$amount",
     },
    },
   },
  ]);

  const reconciliationAggregationPromise = Payment.aggregate([
   {
    $match: {
     ...paymentFilter,
     createdAt: {
      $gte: fromDate,
      $lte: toDate,
     },
    },
   },
   {
    $group: {
     _id: "$reconciliationStatus",
     count: {
      $sum: 1,
     },
     amount: {
      $sum: "$amount",
     },
    },
   },
  ]);

  /*
   * ---------------------------------------------------------
   * 9. AFFILIATE OVERVIEW
   * ---------------------------------------------------------
   */

  const affiliateStoreFilter = storeId ? { storeId: new Types.ObjectId(storeId) } : {};

  // Accumulated figures are calculated through the selected end date.
  const affiliateCommissionFilter = {
   ...affiliateStoreFilter,
   currency: "VND",
   status: { $ne: "REVERSED" },
   createdAt: { $lte: toDate },
  };

  const affiliatePaymentFilter = {
   ...affiliateStoreFilter,
   currency: "VND",
   isDeleted: { $ne: true },
   paymentDate: { $lte: toDate },
  };

  const referredOrderFilter = {
   ...orderFilter,
   affiliateId: { $ne: null },
   isDeleted: { $ne: true },
   createdAt: {
    $gte: fromDate,
    $lte: toDate,
   },
  };

  const [activeAffiliates, referredOrders, commissionAggregation, affiliatePaymentAggregation] = await Promise.all([
   // Count active affiliates linked to the selected store.
   // When no store is selected, count unique active affiliates
   // across all active affiliate-store relationships.
   AffiliateStore.aggregate([
    {
     $match: {
      ...affiliateStoreFilter,
      status: "ACTIVE",
     },
    },
    {
     $lookup: {
      from: "affiliates",
      localField: "affiliateId",
      foreignField: "_id",
      as: "affiliate",
     },
    },
    {
     $unwind: "$affiliate",
    },
    {
     $match: {
      "affiliate.status": "ACTIVE",
     },
    },
    {
     $group: {
      _id: "$affiliateId",
     },
    },
    {
     $count: "total",
    },
   ]).then((result) => result[0]?.total ?? 0),

   // Count referred orders created within the selected date range.
   Order.countDocuments(referredOrderFilter),

   // Total commission accumulated up to the selected end date.
   AffiliateCommission.aggregate([
    {
     $match: affiliateCommissionFilter,
    },
    {
     $group: {
      _id: null,
      total: { $sum: "$amount" },
     },
    },
   ]),

   // Total payments recorded up to the selected end date.
   AffiliatePayment.aggregate([
    {
     $match: affiliatePaymentFilter,
    },
    {
     $group: {
      _id: null,
      total: { $sum: "$amount" },
     },
    },
   ]),
  ]);

  const totalCommission = commissionAggregation[0]?.total ?? 0;
  const totalPaid = affiliatePaymentAggregation[0]?.total ?? 0;

  const affiliateOverview = {
   activeAffiliates,
   referredOrders,
   totalCommission,
   totalPaid,
   remainingCommission: Math.max(0, totalCommission - totalPaid),
   currency: "VND" as const,
  };
  /*
   
   * ---------------------------------------------------------
   * Execute queries in parallel.
   * ---------------------------------------------------------
   */

  const [
   totalOrders,
   orderStatusAggregation,
   revenueAggregation,
   salesOverviewAggregation,
   totalCustomers,
   totalProducts,
   lowStockProducts,
   recentOrders,
   paymentStatusAggregation,
   reconciliationAggregation,
  ] = await Promise.all([
   totalOrdersPromise,
   orderStatusAggregationPromise,
   revenueAggregationPromise,
   salesOverviewAggregationPromise,
   totalCustomersPromise,
   totalProductsPromise,
   lowStockProductsPromise,
   recentOrdersPromise,
   paymentStatusAggregationPromise,
   reconciliationAggregationPromise,
  ]);

  /*
   * ---------------------------------------------------------
   * Format order status.
   * ---------------------------------------------------------
   */

  const orderStatus: Record<(typeof ORDER_STATUSES)[number], number> = {
   PENDING: 0,
   CONFIRMED: 0,
   PROCESSING: 0,
   SHIPPED: 0,
   DELIVERED: 0,
   CANCELLED: 0,
   RETURNED: 0,
  };

  for (const item of orderStatusAggregation) {
   if (ORDER_STATUSES.includes(item._id as (typeof ORDER_STATUSES)[number])) {
    orderStatus[item._id as (typeof ORDER_STATUSES)[number]] = item.count;
   }
  }

  /*
   * ---------------------------------------------------------
   * Format revenue.
   * ---------------------------------------------------------
   */

  const revenue = revenueAggregation.map((item) => ({
   currency: item._id,
   total: item.total,
  }));

  /*
   * ---------------------------------------------------------
   * Format sales overview.
   * ---------------------------------------------------------
   */

  const salesOverview = salesOverviewAggregation.map((item) => ({
   date: item._id.date,
   currency: item._id.currency,
   total: item.total,
   orders: item.orders,
  }));

  /*
   * ---------------------------------------------------------
   * Format payment statistics.
   * ---------------------------------------------------------
   */

  const paymentStatus = paymentStatusAggregation.map((item) => ({
   status: item._id,
   count: item.count,
   amount: item.amount,
  }));

  const reconciliationStatus = reconciliationAggregation.map((item) => ({
   status: item._id,
   count: item.count,
   amount: item.amount,
  }));

  /*
   * ---------------------------------------------------------
   * Response
   * ---------------------------------------------------------
   */

  return res.status(200).json({
   filters: {
    storeId,
    fromDate: fromDate.toISOString(),
    toDate: toDate.toISOString(),
   },

   stats: {
    totalOrders,
    totalCustomers,
    totalProducts,
    revenue,
    pendingOrders: orderStatus.PENDING,
    lowStockProducts: lowStockProducts.length,
   },

   affiliateOverview,

   orderStatus,
   salesOverview,
   paymentStatus,
   reconciliationStatus,
   recentOrders,
   lowStockProducts,
  });
 } catch (error) {
  console.error("Dashboard API error:", error);

  if (error instanceof Error && error.message === "UNAUTHORIZED") {
   return res.status(401).json({
    message: "Unauthorized.",
   });
  }

  if (error instanceof Error && error.message === "FORBIDDEN") {
   return res.status(403).json({
    message: "Forbidden.",
   });
  }

  return res.status(500).json({
   message: "Internal server error.",
  });
 }
}
