import type { NextApiRequest, NextApiResponse } from "next";
import mongoose from "mongoose";

import { connectDB } from "~/lib/mongodb";
import { requirePermission } from "~/lib/permissions";

import { Order } from "~/models/Order";
import { OrderItem } from "~/models/OrderItem";
import { OrderStatus } from "~/models/OrderStatus";
import { OrderStatusHistory } from "~/models/OrderStatusHistory";
import { Product } from "~/models/Product";
import { Customer } from "~/models/Customer";
import { Inventory } from "~/models/Inventory";
import { Store } from "~/models/Store";

import { normalizeText } from "~/lib/normalizeText";

function sendError(res: NextApiResponse, status: number, message: string) {
 return res.status(status).json({
  success: false,
  message,
 });
}

function getStoreId(
 req: NextApiRequest,
 user: {
  role: string;
  storeId: string | null;
 },
) {
 const requestedStoreId = typeof req.query.storeId === "string" ? req.query.storeId : undefined;

 if (user.role === "SUPER_ADMIN") {
  return requestedStoreId || null;
 }

 return user.storeId;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
 await connectDB();

 try {
  if (req.method === "GET") {
   const user = await requirePermission(req, "orders.read");

   const storeId = getStoreId(req, user);

   if (!storeId) {
    return sendError(res, 400, "storeId is required.");
   }

   const page = Math.max(Number(req.query.page) || 1, 1);

   const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);

   const search = typeof req.query.search === "string" ? req.query.search.trim() : "";

   const statusId = typeof req.query.statusId === "string" ? req.query.statusId : "";

   const paymentStatus = typeof req.query.paymentStatus === "string" ? req.query.paymentStatus : "";

   const customerId = typeof req.query.customerId === "string" ? req.query.customerId : "";

   const fromDate = typeof req.query.fromDate === "string" ? req.query.fromDate : "";

   const toDate = typeof req.query.toDate === "string" ? req.query.toDate : "";

   const filter: Record<string, any> = {
    storeId,
   };

   if (statusId) {
    filter.statusId = statusId;
   }

   if (paymentStatus) {
    filter.paymentStatus = paymentStatus;
   }

   if (customerId) {
    filter.customerId = customerId;
   }

   if (fromDate || toDate) {
    filter.createdAt = {};

    if (fromDate) {
     filter.createdAt.$gte = new Date(`${fromDate}T00:00:00+07:00`);
    }

    if (toDate) {
     filter.createdAt.$lte = new Date(`${toDate}T23:59:59.999+07:00`);
    }
   }

   /*
    * Search order number directly.
    * Customer name/phone search is handled below.
    */
   if (search) {
    const normalizedSearch = normalizeText(search);

    const customers = await Customer.find({
     storeId,
     $or: [
      {
       nameNormalized: {
        $regex: normalizedSearch,
        $options: "i",
       },
      },
      {
       phone: {
        $regex: search,
        $options: "i",
       },
      },
     ],
    })
     .select("_id")
     .lean();

    const customerIds = customers.map((customer) => customer._id);

    filter.$or = [
     {
      orderNumber: {
       $regex: search,
       $options: "i",
      },
     },
     {
      customerId: {
       $in: customerIds,
      },
     },
    ];
   }

   const skip = (page - 1) * limit;

   const [orders, total, summary] = await Promise.all([
    Order.find(filter)
     .populate({
      path: "customerId",
      select: "name phone isActive",
     })
     .populate({
      path: "createdBy",
      select: "name email",
     })
     .populate({
      path: "storeId",
      select: "name slug",
     })
     .populate({
      path: "statusId",
      select: "name code description color icon sortOrder isInitial isFinal nextStatusIds",
      populate: {
       path: "nextStatusIds",
       select: "name code description color icon sortOrder isInitial isFinal",
      },
     })
     .sort({ createdAt: -1 })
     .skip(skip)
     .limit(limit)
     .lean(),

    Order.countDocuments(filter),

    Order.aggregate([
     {
      $match: {
       storeId: new mongoose.Types.ObjectId(storeId),
      },
     },
     {
      $group: {
       _id: null,
       totalOrders: { $sum: 1 },
       totalAmount: { $sum: "$total" },
      },
     },
    ]),
   ]);

   const statusCounts = await Order.aggregate([
    {
     $match: filter,
    },
    {
     $lookup: {
      from: "orderstatuses",
      localField: "statusId",
      foreignField: "_id",
      as: "status",
     },
    },
    {
     $unwind: {
      path: "$status",
      preserveNullAndEmptyArrays: true,
     },
    },
    {
     $group: {
      _id: {
       code: "$status.code",
       name: "$status.name",
      },
      count: { $sum: 1 },
     },
    },
    {
     $sort: {
      "_id.name": 1,
     },
    },
   ]);

   const summaryData = summary[0] || {
    totalOrders: 0,
    totalAmount: 0,
   };

   const statusSummary = statusCounts.map((item) => ({
    code: item._id?.code || "",
    name: item._id?.name || "",
    count: item.count,
   }));

   return res.status(200).json({
    success: true,
    orders,
    pagination: {
     page,
     limit,
     total,
     totalPages: Math.ceil(total / limit),
    },
    summary: {
     totalOrders: summaryData.totalOrders,
     totalAmount: summaryData.totalAmount,
    },
    statusSummary,
   });
  }

  if (req.method === "POST") {
   const user = await requirePermission(req, "orders.create");

   const {
    storeId: bodyStoreId,
    customerId,
    customerSnapshot,
    shippingAddress,
    items,
    subtotal,
    shippingFee = 0,
    discount = 0,
    total,
    currency,
    paymentMethod = "COD",
    paymentStatus = "PENDING",
    note = "",
    shippingMethod = "",
    trackingNumber = "",
   } = req.body;

   const storeId = user.role === "SUPER_ADMIN" ? bodyStoreId : user.storeId;

   if (!storeId) {
    return sendError(res, 400, "storeId is required.");
   }

   if (!mongoose.Types.ObjectId.isValid(storeId)) {
    return sendError(res, 400, "Invalid storeId.");
   }

   if (!mongoose.Types.ObjectId.isValid(customerId)) {
    return sendError(res, 400, "Invalid customerId.");
   }

   if (!Array.isArray(items) || items.length === 0) {
    return sendError(res, 400, "Order must contain at least one item.");
   }

   const store = await Store.findOne({
    _id: storeId,
    isActive: true,
   }).lean();

   if (!store) {
    return sendError(res, 404, "Store not found or inactive.");
   }

   const customer = await Customer.findOne({
    _id: customerId,
    storeId,
    isActive: true,
   }).lean();

   if (!customer) {
    return sendError(res, 404, "Customer not found.");
   }

   const initialStatus = await OrderStatus.findOne({
    storeId,
    code: "WAITING_STOCK",
    isActive: true,
   }).lean();

   if (!initialStatus) {
    return sendError(res, 500, "Initial order status WAITING_STOCK was not found.");
   }

   const productIds = items.map((item: any) => item.productId);

   const validProductIds = productIds.every((id: string) => mongoose.Types.ObjectId.isValid(id));

   if (!validProductIds) {
    return sendError(res, 400, "Invalid productId.");
   }

   const products = await Product.find({
    _id: {
     $in: productIds,
    },
    storeId,
    isActive: true,
   });

   if (products.length !== productIds.length) {
    return sendError(res, 400, "One or more products are invalid.");
   }

   const productMap = new Map(products.map((product) => [product._id.toString(), product]));

   for (const item of items) {
    const product = productMap.get(item.productId);

    if (!product) {
     return sendError(res, 400, `Product ${item.productId} not found.`);
    }

    const quantity = Number(item.quantity);

    if (!Number.isInteger(quantity) || quantity <= 0) {
     return sendError(res, 400, `Invalid quantity for product ${product.name}.`);
    }

    /*
     * Guest/admin-created orders are initially
     * WAITING_STOCK.
     *
     * Stock is NOT deducted here.
     * Stock will be deducted when the order
     * reaches the appropriate confirmation step.
     */
   }

   const session = await mongoose.startSession();

   try {
    session.startTransaction();

    const orderNumber = `ORD-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const [order] = await Order.create(
     [
      {
       storeId,
       customerId,
       orderNumber,

       statusId: initialStatus._id,

       customerSnapshot: {
        name: customerSnapshot?.name || customer.name,
        phone: customerSnapshot?.phone || customer.phone,
        email: customerSnapshot?.email || "",
       },

       shippingAddress: {
        province: shippingAddress?.province || "",
        district: shippingAddress?.district || "",
        ward: shippingAddress?.ward || "",
        address: shippingAddress?.address || "",
        postalCode: shippingAddress?.postalCode || "",
       },

       subtotal,
       shippingFee,
       discount,
       total,
       currency,

       paymentMethod,
       paymentStatus,

       note,
       shippingMethod,
       trackingNumber,

       createdBy: user.id,
      },
     ],
     {
      session,
     },
    );

    const orderItems = items.map((item: any) => {
     const product = productMap.get(item.productId)!;

     const quantity = Number(item.quantity);

     const price = Number(item.price ?? product.price);

     return {
      orderId: order._id,
      productId: product._id,

      productSnapshot: {
       name: product.name,
       sku: product.sku,
       slug: product.slug,
       image: product.images?.[0] || "",
      },

      quantity,
      price,
      subtotal: price * quantity,
      currency: item.currency || product.currency,
     };
    });

    await OrderItem.insertMany(orderItems, {
     session,
    });

    /*
     * The initial WAITING_STOCK status does not
     * reserve stock.
     *
     * Inventory will be created when the order
     * is confirmed through the status transition.
     */

    await session.commitTransaction();

    const createdOrder = await Order.findById(order._id)
     .populate({
      path: "customerId",
      select: "name phone isActive",
     })
     .populate({
      path: "statusId",
      select: "name code description color icon sortOrder isInitial isFinal nextStatusIds",
      populate: {
       path: "nextStatusIds",
       select: "name code description color icon sortOrder isInitial isFinal",
      },
     })
     .populate({
      path: "createdBy",
      select: "name email",
     })
     .lean();

    return res.status(201).json({
     success: true,
     order: createdOrder,
    });
   } catch (error) {
    await session.abortTransaction();
    throw error;
   } finally {
    await session.endSession();
   }
  }

  return res.status(405).json({
   success: false,
   message: "Method not allowed.",
  });
 } catch (error: any) {
  console.error("Orders API error:", error);

  if (error?.message === "UNAUTHORIZED") {
   return sendError(res, 401, "Unauthorized.");
  }

  if (error?.message === "FORBIDDEN") {
   return sendError(res, 403, "Forbidden.");
  }

  return sendError(res, 500, error?.message || "Internal server error.");
 }
}
