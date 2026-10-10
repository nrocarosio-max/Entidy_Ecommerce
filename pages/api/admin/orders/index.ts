import type { NextApiRequest, NextApiResponse } from "next";
import mongoose from "mongoose";
import { resolveAffiliate } from "~/lib/resolveAffiliate";
import { connectDB } from "~/lib/mongodb";
import { requirePermission, getAuthorizedStoreId } from "~/lib/permissions";
import { normalizeText } from "~/lib/normalizeText";

import { Order } from "~/models/Order";
import { OrderItem } from "~/models/OrderItem";
import { OrderStatus } from "~/models/OrderStatus";
import { Product } from "~/models/Product";
import { Customer } from "~/models/Customer";
import { Store } from "~/models/Store";

interface ApiResponse {
 success: boolean;
 message?: string;
 orders?: unknown[];
 order?: unknown;
 pagination?: {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
 };
 summary?: {
  totalOrders: number;
  totalAmount: number;
 };
 statusSummary?: unknown[];
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<ApiResponse>) {
 try {
  await connectDB();

  /*
   * ==================================================
   * GET ORDERS
   * ==================================================
   */

  if (req.method === "GET") {
   const user = await requirePermission(req, "orders.read");

   const requestedStoreId = typeof req.query.storeId === "string" ? req.query.storeId : "";

   let storeId = requestedStoreId;

   if (user.role !== "SUPER_ADMIN") {
    if (!user.storeId) {
     return res.status(403).json({
      success: false,
      message: "You are not assigned to a store.",
     });
    }

    storeId = user.storeId;
   }

   if (!storeId || !mongoose.Types.ObjectId.isValid(storeId)) {
    return res.status(400).json({
     success: false,
     message: "Valid storeId is required.",
    });
   }

   const page = Math.max(Number(req.query.page) || 1, 1);

   const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);

   const search = typeof req.query.search === "string" ? req.query.search.trim() : "";

   const statusId = typeof req.query.statusId === "string" ? req.query.statusId : "";

   const paymentStatus = typeof req.query.paymentStatus === "string" ? req.query.paymentStatus : "";

   const customerId = typeof req.query.customerId === "string" ? req.query.customerId : "";

   const dateFrom = typeof req.query.dateFrom === "string" ? req.query.dateFrom : "";

   const dateTo = typeof req.query.dateTo === "string" ? req.query.dateTo : "";

   const filter: Record<string, unknown> = {
    storeId: new mongoose.Types.ObjectId(storeId),
   };

   if (statusId && mongoose.Types.ObjectId.isValid(statusId)) {
    filter.statusId = new mongoose.Types.ObjectId(statusId);
   }

   if (customerId && mongoose.Types.ObjectId.isValid(customerId)) {
    filter.customerId = new mongoose.Types.ObjectId(customerId);
   }

   if (paymentStatus) {
    filter.paymentStatus = paymentStatus;
   }

   if (dateFrom || dateTo) {
    const createdAt: Record<string, Date> = {};

    if (dateFrom) {
     createdAt.$gte = new Date(`${dateFrom}T00:00:00+07:00`);
    }

    if (dateTo) {
     createdAt.$lte = new Date(`${dateTo}T23:59:59.999+07:00`);
    }

    filter.createdAt = createdAt;
   }

   /*
    * Search order number / customer name / phone.
    */

   if (search) {
    const normalizedSearch = normalizeText(search);

    const matchingCustomers = await Customer.find({
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

    const customerIds = matchingCustomers.map((customer) => customer._id);

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

   const [orders, total, summaryResult, activeStatuses] = await Promise.all([
    Order.find(filter)
     .populate("customerId")
     .populate("createdBy", "name email")
     .populate("storeId", "name slug")
     .populate({
      path: "statusId",
      populate: {
       path: "nextStatusIds",
       select: "name code description color icon sortOrder isActive isInitial isFinal",
      },
     })
     .sort({ createdAt: -1 })
     .skip(skip)
     .limit(limit)
     .lean(),

    Order.countDocuments(filter),

    Order.aggregate([
     {
      $match: filter,
     },
     {
      $group: {
       _id: null,
       totalOrders: {
        $sum: 1,
       },
       totalAmount: {
        $sum: "$total",
       },
      },
     },
    ]),

    OrderStatus.find({
     isActive: true,
    })
     .sort({
      sortOrder: 1,
     })
     .lean(),
   ]);

   /*
    * Build status counts.
    */

   const statusCounts = await Order.aggregate([
    {
     $match: {
      storeId: new mongoose.Types.ObjectId(storeId),
     },
    },
    {
     $group: {
      _id: "$statusId",
      count: {
       $sum: 1,
      },
     },
    },
   ]);

   const statusCountMap = new Map(statusCounts.map((item) => [item._id?.toString(), item.count]));

   const statusSummary = activeStatuses.map((status) => ({
    id: status._id.toString(),
    code: status.code,
    name: status.name,
    color: status.color,
    icon: status.icon,
    sortOrder: status.sortOrder,
    count: statusCountMap.get(status._id.toString()) || 0,
   }));

   const summary = summaryResult[0] || {
    totalOrders: 0,
    totalAmount: 0,
   };

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
     totalOrders: summary.totalOrders || 0,
     totalAmount: summary.totalAmount || 0,
    },
    statusSummary,
   });
  }

  /*
   * ==================================================
   * POST CREATE ORDER
   * ==================================================
   */

  if (req.method === "POST") {
   const user = await requirePermission(req, "orders.create");

   const body = req.body || {};

   const requestedStoreId = typeof body.storeId === "string" ? body.storeId : "";

   let storeId = requestedStoreId;

   if (user.role !== "SUPER_ADMIN") {
    if (!user.storeId) {
     return res.status(403).json({
      success: false,
      message: "You are not assigned to a store.",
     });
    }

    storeId = user.storeId;
   }

   if (!storeId || !mongoose.Types.ObjectId.isValid(storeId)) {
    return res.status(400).json({
     success: false,
     message: "Valid storeId is required.",
    });
   }

   /*
    * --------------------------------------------------
    * Validate store
    * --------------------------------------------------
    */

   const store = await Store.findOne({
    _id: storeId,
    isActive: true,
   }).lean();

   if (!store) {
    return res.status(404).json({
     success: false,
     message: "Store not found or inactive.",
    });
   }

   /*
    * --------------------------------------------------
    * Validate customer input
    * --------------------------------------------------
    */

   const customerId = typeof body.customerId === "string" ? body.customerId : "";

   const customerInput = body.customer && typeof body.customer === "object" ? body.customer : null;

   if (!customerId && !customerInput) {
    return res.status(400).json({
     success: false,
     message: "Either customerId or customer information is required.",
    });
   }

   /*
    * --------------------------------------------------
    * Validate items
    * --------------------------------------------------
    */

   if (!Array.isArray(body.items) || body.items.length === 0) {
    return res.status(400).json({
     success: false,
     message: "At least one order item is required.",
    });
   }

   /*
    * --------------------------------------------------
    * Find initial status
    * --------------------------------------------------
    */

   const initialStatus = await OrderStatus.findOne({
    isInitial: true,
    isActive: true,
   });

   if (!initialStatus) {
    return res.status(500).json({
     success: false,
     message: "No active initial order status was found.",
    });
   }

   /*
    * --------------------------------------------------
    * Start transaction
    * --------------------------------------------------
    */

   const session = await mongoose.startSession();

   try {
    session.startTransaction();
    const affiliateAttribution = await resolveAffiliate({
     affiliateCode: body.affiliateCode,
     storeId,
     session,
    });
    /*
     * ==================================================
     * CUSTOMER
     * ==================================================
     */

    let customer;

    if (customerId) {
     /*
      * Existing customer.
      */

     if (!mongoose.Types.ObjectId.isValid(customerId)) {
      throw new Error("Invalid customerId.");
     }

     customer = await Customer.findOne({
      _id: customerId,
      storeId,
      isActive: true,
     }).session(session);

     if (!customer) {
      throw new Error("Customer not found or does not belong to this store.");
     }
    } else {
     /*
      * New customer.
      */

     const name = typeof customerInput.name === "string" ? customerInput.name.trim() : "";

     const phone = typeof customerInput.phone === "string" ? customerInput.phone.trim() : "";

     const email = typeof customerInput.email === "string" ? customerInput.email.trim() : "";

     if (!name) {
      throw new Error("Customer name is required.");
     }

     if (!phone) {
      throw new Error("Customer phone is required.");
     }

     /*
      * Search existing customer by
      * store + phone.
      */

     customer = await Customer.findOne({
      storeId,
      phone,
     }).session(session);

     /*
      * Existing phone:
      * reuse customer.
      */

     if (customer) {
      /*
       * Update missing email/name if necessary.
       * We do not overwrite existing customer
       * information unnecessarily.
       */

      let changed = false;

      if (!customer.name && name) {
       customer.name = name;
       customer.nameNormalized = normalizeText(name);
       changed = true;
      }

      if (!customer.email && email) {
       customer.email = email;
       changed = true;
      }

      if (changed) {
       await customer.save({
        session,
       });
      }
     } else {
      /*
       * Create brand-new customer.
       */

      const createdCustomers = await Customer.create(
       [
        {
         storeId,
         name,
         nameNormalized: normalizeText(name),
         phone,
         email,
         isActive: true,
        },
       ],
       {
        session,
       },
      );

      customer = createdCustomers[0];
     }
    }

    /*
     * ==================================================
     * PRODUCTS
     * ==================================================
     */

    const productIds = body.items.map((item: any) => item.productId);

    const uniqueProductIds = Array.from(new Set(productIds));

    const products = await Product.find({
     _id: {
      $in: uniqueProductIds,
     },
     storeId,
     isActive: true,
    }).session(session);

    const productMap = new Map(products.map((product) => [product._id.toString(), product]));

    const orderItems: Array<{
     productId: mongoose.Types.ObjectId;
     productSnapshot: {
      name: string;
      sku: string;
      slug: string;
      image: string;
     };
     quantity: number;
     price: number;
     subtotal: number;
     currency: string;
    }> = [];

    let calculatedSubtotal = 0;

    for (let index = 0; index < body.items.length; index++) {
     const item = body.items[index];
     const productId = typeof item.productId === "string" ? item.productId : "";

     if (!mongoose.Types.ObjectId.isValid(productId)) {
      throw new Error("Invalid productId.");
     }

     const product = productMap.get(productId);

     if (!product) {
      throw new Error("One or more products were not found.");
     }

     const quantity = Number(item.quantity);

     if (!Number.isInteger(quantity) || quantity < 1) {
      throw new Error(`Invalid quantity for product ${product.name}.`);
     }

     /*
      * We only validate stock here.
      * Stock is NOT deducted until
      * order reaches CONFIRMED.
      */

     if (product.quantity < quantity) {
      throw new Error(`Insufficient stock for ${product.name}. Available: ${product.quantity}.`);
     }

     const price = Number(product.price);

     const itemSubtotal = price * quantity;

     calculatedSubtotal += itemSubtotal;

     orderItems.push({
      productId: product._id as mongoose.Types.ObjectId,

      productSnapshot: {
       name: product.name,
       sku: product.sku,
       slug: product.slug || "",
       image: product.images?.[0] || "",
      },

      quantity,

      price,

      subtotal: itemSubtotal,

      currency: product.currency,
     });
    }

    /*
     * ==================================================
     * TOTALS
     * ==================================================
     */

    const shippingFee = Math.max(0, Number(body.shippingFee || 0));

    const discount = Math.max(0, Number(body.discount || 0));

    const subtotal = calculatedSubtotal;

    const total = Math.max(0, subtotal + shippingFee - discount);

    const currency = body.currency || orderItems[0]?.currency || "VND";

    /*
     * ==================================================
     * ORDER NUMBER
     * ==================================================
     */

    const orderNumber = `ORD-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    /*
     * ==================================================
     * CREATE ORDER
     * ==================================================
     */

    const createdOrders = await Order.create(
     [
      {
       storeId,

       customerId: customer._id,

       orderNumber,

       statusId: initialStatus._id,

       customerSnapshot: {
        name: customer.name,
        phone: customer.phone,
        email: customer.email || "",
       },

       shippingAddress: {
        province: body.shippingAddress?.province || "",

        district: body.shippingAddress?.district || "",

        ward: body.shippingAddress?.ward || "",

        address: body.shippingAddress?.address || "",

        postalCode: body.shippingAddress?.postalCode || "",
       },

       subtotal,

       shippingFee,

       discount,

       total,

       currency,

       paymentMethod: body.paymentMethod || "COD",

       paymentStatus: body.paymentStatus || "PENDING",

       note: typeof body.note === "string" ? body.note.trim() : "",

       shippingMethod: typeof body.shippingMethod === "string" ? body.shippingMethod.trim() : "",

       trackingNumber: typeof body.trackingNumber === "string" ? body.trackingNumber.trim() : "",

       createdBy: user.id,
       affiliateId: affiliateAttribution?.affiliateId ?? null,
       affiliateStoreId: affiliateAttribution?.affiliateStoreId ?? null,
       affiliateCode: affiliateAttribution?.affiliateCode ?? "",
      },
     ],
     {
      session,
     },
    );

    const order = createdOrders[0];

    /*
     * ==================================================
     * CREATE ORDER ITEMS
     * ==================================================
     */

    const orderItemDocuments = orderItems.map((item) => ({
     orderId: order._id,

     productId: item.productId,

     productSnapshot: item.productSnapshot,

     quantity: item.quantity,

     price: item.price,

     subtotal: item.subtotal,

     currency: item.currency,
    }));

    await OrderItem.insertMany(orderItemDocuments, {
     session,
    });

    await session.commitTransaction();

    /*
     * ==================================================
     * LOAD CREATED ORDER
     * ==================================================
     */

    const populatedOrder = await Order.findById(order._id)
     .populate("customerId")
     .populate("createdBy", "name email")
     .populate("storeId", "name slug")
     .populate({
      path: "statusId",
      populate: {
       path: "nextStatusIds",
       select: "name code description color icon sortOrder isActive isInitial isFinal",
      },
     })
     .lean();

    return res.status(201).json({
     success: true,
     order: populatedOrder,
    });
   } catch (error: any) {
    await session.abortTransaction();

    console.error("Create order error:", error);

    return res.status(400).json({
     success: false,
     message: error?.message || "Failed to create order.",
    });
   } finally {
    await session.endSession();
   }
  }

  /*
   * ==================================================
   * METHOD NOT ALLOWED
   * ==================================================
   */

  res.setHeader("Allow", ["GET", "POST"]);

  return res.status(405).json({
   success: false,
   message: "Method not allowed.",
  });
 } catch (error: any) {
  console.error("Orders API error:", error);

  if (error?.message === "UNAUTHORIZED") {
   return res.status(401).json({
    success: false,
    message: "Unauthorized.",
   });
  }

  if (error?.message === "FORBIDDEN") {
   return res.status(403).json({
    success: false,
    message: "Forbidden.",
   });
  }

  return res.status(500).json({
   success: false,
   message: error?.message || "Internal server error.",
  });
 }
}
