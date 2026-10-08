import type { NextApiRequest, NextApiResponse } from "next";
import mongoose from "mongoose";

import { connectDB } from "~/lib/mongodb";
import { requirePermission } from "~/lib/permissions";

import { Customer } from "~/models/Customer";
import { Inventory } from "~/models/Inventory";
import { Order } from "~/models/Order";
import { OrderItem } from "~/models/OrderItem";
import { Product } from "~/models/Product";
import { Store } from "~/models/Store";

function generateOrderNumber() {
 return `ORD-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
 try {
  await connectDB();

  // =========================================================
  // GET ORDERS
  // =========================================================

  if (req.method === "GET") {
   const user = await requirePermission(req, "orders.read");

   const { storeId, status, paymentStatus, customerId } = req.query;

   const filter: Record<string, any> = {};

   // Store access
   if (user.role === "SUPER_ADMIN") {
    if (storeId && typeof storeId === "string") {
     filter.storeId = storeId;
    }
   } else {
    if (!user.storeId) {
     return res.status(403).json({
      success: false,
      message: "User is not assigned to a store.",
     });
    }

    filter.storeId = user.storeId;
   }

   // Status filter
   if (status && typeof status === "string") {
    filter.status = status;
   }

   // Payment status filter
   if (paymentStatus && typeof paymentStatus === "string") {
    filter.paymentStatus = paymentStatus;
   }

   // Customer filter
   if (customerId && typeof customerId === "string") {
    filter.customerId = customerId;
   }

   const orders = await Order.find(filter)
    .populate("customerId", "name phone")
    .populate("storeId", "name slug")
    .populate("createdBy", "name email")
    .sort({ createdAt: -1 })
    .lean();

   return res.status(200).json({
    success: true,
    orders,
   });
  }

  // =========================================================
  // CREATE ORDER
  // =========================================================

  if (req.method === "POST") {
   const user = await requirePermission(req, "orders.create");

   const {
    storeId,
    customerId,

    customer,
    shippingAddress,

    items,

    shippingMethod,
    shippingFee = 0,
    discount = 0,

    currency,

    paymentMethod = "COD",
    paymentStatus = "PENDING",

    status = "PENDING",

    note = "",
   } = req.body;

   // -------------------------------------------------------
   // STORE
   // -------------------------------------------------------

   let targetStoreId: string | null = null;

   if (user.role === "SUPER_ADMIN") {
    if (!storeId || typeof storeId !== "string") {
     return res.status(400).json({
      success: false,
      message: "storeId is required.",
     });
    }

    targetStoreId = storeId;
   } else {
    targetStoreId = user.storeId;
   }

   if (!targetStoreId) {
    return res.status(400).json({
     success: false,
     message: "Store is required.",
    });
   }

   const store = await Store.findById(targetStoreId).lean();

   if (!store) {
    return res.status(404).json({
     success: false,
     message: "Store not found.",
    });
   }

   if (!store.isActive) {
    return res.status(400).json({
     success: false,
     message: "Store is inactive.",
    });
   }

   // -------------------------------------------------------
   // VALIDATE ITEMS
   // -------------------------------------------------------

   if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({
     success: false,
     message: "At least one order item is required.",
    });
   }

   const normalizedItems = items.map((item: any) => ({
    productId: item.productId,
    quantity: Number(item.quantity),
   }));

   for (const item of normalizedItems) {
    if (!item.productId) {
     return res.status(400).json({
      success: false,
      message: "Each item must have a productId.",
     });
    }

    if (!Number.isInteger(item.quantity) || item.quantity < 1) {
     return res.status(400).json({
      success: false,
      message: "Each item quantity must be an integer greater than 0.",
     });
    }
   }

   // Prevent duplicate products in the same order
   const productIds = normalizedItems.map((item: any) => item.productId);

   const uniqueProductIds = new Set(productIds);

   if (uniqueProductIds.size !== productIds.length) {
    return res.status(400).json({
     success: false,
     message: "The same product cannot appear more than once in an order.",
    });
   }

   // -------------------------------------------------------
   // SHIPPING ADDRESS
   // -------------------------------------------------------

   if (!shippingAddress || typeof shippingAddress !== "object") {
    return res.status(400).json({
     success: false,
     message: "Shipping address is required.",
    });
   }

   if (!shippingAddress.address || typeof shippingAddress.address !== "string" || !shippingAddress.address.trim()) {
    return res.status(400).json({
     success: false,
     message: "Shipping address is required.",
    });
   }

   // -------------------------------------------------------
   // CUSTOMER VALIDATION
   // -------------------------------------------------------

   if (!customerId && (!customer || typeof customer !== "object")) {
    return res.status(400).json({
     success: false,
     message: "customerId or customer information is required.",
    });
   }

   // -------------------------------------------------------
   // NUMERIC VALIDATION
   // -------------------------------------------------------

   const normalizedShippingFee = Number(shippingFee);
   const normalizedDiscount = Number(discount);

   if (!Number.isFinite(normalizedShippingFee) || normalizedShippingFee < 0) {
    return res.status(400).json({
     success: false,
     message: "Invalid shippingFee.",
    });
   }

   if (!Number.isFinite(normalizedDiscount) || normalizedDiscount < 0) {
    return res.status(400).json({
     success: false,
     message: "Invalid discount.",
    });
   }

   // -------------------------------------------------------
   // TRANSACTION
   // -------------------------------------------------------

   const session = await mongoose.startSession();

   try {
    session.startTransaction();

    // =====================================================
    // CUSTOMER
    // =====================================================

    let targetCustomer;

    if (customerId) {
     targetCustomer = await Customer.findById(customerId).session(session);

     if (!targetCustomer) {
      throw new Error("CUSTOMER_NOT_FOUND");
     }

     if (targetCustomer.storeId.toString() !== targetStoreId) {
      throw new Error("CUSTOMER_STORE_MISMATCH");
     }

     if (!targetCustomer.isActive) {
      throw new Error("CUSTOMER_INACTIVE");
     }
    } else {
     if (!customer.name || typeof customer.name !== "string" || !customer.name.trim()) {
      throw new Error("CUSTOMER_NAME_REQUIRED");
     }

     if (!customer.phone || typeof customer.phone !== "string" || !customer.phone.trim()) {
      throw new Error("CUSTOMER_PHONE_REQUIRED");
     }

     targetCustomer = await Customer.create(
      [
       {
        storeId: targetStoreId,
        name: customer.name.trim(),
        phone: customer.phone.trim(),
        isActive: true,
       },
      ],
      { session },
     ).then((result) => result[0]);
    }

    // =====================================================
    // PRODUCTS
    // =====================================================

    const orderItemsData: any[] = [];

    let subtotal = 0;
    let orderCurrency = currency ? String(currency).toUpperCase() : "";

    for (const item of normalizedItems) {
     const product = await Product.findOne({
      _id: item.productId,
      storeId: targetStoreId,
     }).session(session);

     if (!product) {
      throw new Error("PRODUCT_NOT_FOUND");
     }

     if (!product.isActive) {
      throw new Error("PRODUCT_INACTIVE");
     }

     if (product.status !== "ACTIVE") {
      throw new Error("PRODUCT_NOT_ACTIVE");
     }

     if (product.quantity < item.quantity) {
      throw new Error(`INSUFFICIENT_STOCK:${product.name}`);
     }

     if (!orderCurrency) {
      orderCurrency = product.currency;
     }

     if (product.currency !== orderCurrency) {
      throw new Error("CURRENCY_MISMATCH");
     }

     const itemSubtotal = product.price * item.quantity;

     subtotal += itemSubtotal;

     orderItemsData.push({
      product,
      quantity: item.quantity,
      price: product.price,
      subtotal: itemSubtotal,
      currency: product.currency,
     });
    }

    // =====================================================
    // TOTAL
    // =====================================================

    const total = subtotal + normalizedShippingFee - normalizedDiscount;

    if (total < 0) {
     throw new Error("INVALID_TOTAL");
    }

    // =====================================================
    // ORDER NUMBER
    // =====================================================

    const orderNumber = generateOrderNumber();

    // =====================================================
    // CREATE ORDER
    // =====================================================

    const createdOrders = await Order.create(
     [
      {
       storeId: targetStoreId,

       customerId: targetCustomer._id,

       customerSnapshot: {
        name: targetCustomer.name,
        phone: targetCustomer.phone,
        email: customer?.email && typeof customer.email === "string" ? customer.email.trim() : "",
       },

       shippingAddress: {
        province: typeof shippingAddress.province === "string" ? shippingAddress.province.trim() : "",

        district: typeof shippingAddress.district === "string" ? shippingAddress.district.trim() : "",

        ward: typeof shippingAddress.ward === "string" ? shippingAddress.ward.trim() : "",

        address: shippingAddress.address.trim(),

        postalCode: typeof shippingAddress.postalCode === "string" ? shippingAddress.postalCode.trim() : "",
       },

       subtotal,
       shippingFee: normalizedShippingFee,
       discount: normalizedDiscount,
       total,

       currency: orderCurrency,

       paymentMethod,
       paymentStatus,

       status,

       note: typeof note === "string" ? note.trim() : "",

       shippingMethod: typeof shippingMethod === "string" ? shippingMethod.trim() : "",

       createdBy: user.id,
      },
     ],
     { session },
    );

    const order = createdOrders[0];

    // =====================================================
    // CREATE ORDER ITEMS + UPDATE STOCK
    // =====================================================

    for (const item of orderItemsData) {
     const product = item.product;

     await OrderItem.create(
      [
       {
        orderId: order._id,

        productId: product._id,

        productSnapshot: {
         name: product.name,
         sku: product.sku,
         slug: product.slug,
         image: product.images?.length > 0 ? product.images[0] : "",
        },

        quantity: item.quantity,

        price: item.price,

        subtotal: item.subtotal,

        currency: item.currency,
       },
      ],
      { session },
     );

     const quantityBefore = product.quantity;
     const quantityAfter = quantityBefore - item.quantity;

     product.quantity = quantityAfter;

     if (quantityAfter === 0) {
      product.status = "OUT_OF_STOCK";
     }

     await product.save({ session });

     // Inventory history
     await Inventory.create(
      [
       {
        storeId: targetStoreId,

        productId: product._id,

        type: "OUT",

        quantity: item.quantity,

        quantityBefore,

        quantityAfter,

        note: `Order ${order.orderNumber}`,

        reference: order.orderNumber,

        createdBy: user.id,
       },
      ],
      { session },
     );
    }

    await session.commitTransaction();

    // =====================================================
    // RESPONSE
    // =====================================================

    return res.status(201).json({
     success: true,
     message: "Order created successfully.",
     order,
    });
   } catch (error) {
    await session.abortTransaction();
    throw error;
   } finally {
    await session.endSession();
   }
  }

  res.setHeader("Allow", ["GET", "POST"]);

  return res.status(405).json({
   success: false,
   message: `Method ${req.method} not allowed.`,
  });
 } catch (error: any) {
  console.error("Orders API error:", error);

  if (error.message === "UNAUTHORIZED") {
   return res.status(401).json({
    success: false,
    message: "Unauthorized.",
   });
  }

  if (error.message === "FORBIDDEN") {
   return res.status(403).json({
    success: false,
    message: "Forbidden.",
   });
  }

  const errorMessages: Record<string, string> = {
   CUSTOMER_NOT_FOUND: "Customer not found.",
   CUSTOMER_STORE_MISMATCH: "Customer does not belong to this store.",
   CUSTOMER_INACTIVE: "Customer is inactive.",
   CUSTOMER_NAME_REQUIRED: "Customer name is required.",
   CUSTOMER_PHONE_REQUIRED: "Customer phone is required.",
   PRODUCT_NOT_FOUND: "Product not found.",
   PRODUCT_INACTIVE: "Product is inactive.",
   PRODUCT_NOT_ACTIVE: "Product is not available for sale.",
   CURRENCY_MISMATCH: "All products in an order must use the same currency.",
   INVALID_TOTAL: "Order total cannot be negative.",
  };

  if (error.message?.startsWith("INSUFFICIENT_STOCK:")) {
   const productName = error.message.split(":")[1] || "product";

   return res.status(400).json({
    success: false,
    message: `Insufficient stock for ${productName}.`,
   });
  }

  if (errorMessages[error.message]) {
   return res.status(400).json({
    success: false,
    message: errorMessages[error.message],
   });
  }

  if (error.code === 11000) {
   return res.status(409).json({
    success: false,
    message: "Duplicate order number.",
   });
  }

  return res.status(500).json({
   success: false,
   message: "Internal server error.",
  });
 }
}
