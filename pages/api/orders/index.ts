import type { NextApiRequest, NextApiResponse } from "next";
import mongoose from "mongoose";

import { connectDB } from "~/lib/mongodb";
import { Order } from "~/models/Order";
import { OrderItem } from "~/models/OrderItem";
import { OrderStatus } from "~/models/OrderStatus";
import { Product } from "~/models/Product";
import { Customer } from "~/models/Customer";
import { Store } from "~/models/Store";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
 await connectDB();

 if (req.method !== "POST") {
  return res.status(405).json({
   success: false,
   message: "Method not allowed.",
  });
 }

 try {
  const {
   storeId,
   customer,
   customerId,
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
  } = req.body;

  /*
   * --------------------------------------------------
   * Validate store
   * --------------------------------------------------
   */

  if (!storeId || !mongoose.Types.ObjectId.isValid(storeId)) {
   return res.status(400).json({
    success: false,
    message: "Valid storeId is required.",
   });
  }

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
   * Find or create customer
   * --------------------------------------------------
   */

  let customerDoc;

  if (customerId && mongoose.Types.ObjectId.isValid(customerId)) {
   customerDoc = await Customer.findOne({
    _id: customerId,
    storeId,
    isActive: true,
   });
  }

  if (!customerDoc) {
   const customerName = customer?.name || customer?.fullName || "";

   const customerPhone = customer?.phone || "";

   if (!customerName.trim() || !customerPhone.trim()) {
    return res.status(400).json({
     success: false,
     message: "Customer name and phone are required.",
    });
   }

   customerDoc = await Customer.findOneAndUpdate(
    {
     storeId,
     phone: customerPhone.trim(),
    },
    {
     $set: {
      name: customerName.trim(),
      nameNormalized: customerName
       .normalize("NFD")
       .replace(/[\u0300-\u036f]/g, "")
       .toLowerCase()
       .trim(),
      isActive: true,
     },
    },
    {
     new: true,
     upsert: true,
     setDefaultsOnInsert: true,
    },
   );
  }

  if (!customerDoc) {
   return res.status(400).json({
    success: false,
    message: "Unable to create customer.",
   });
  }

  /*
   * --------------------------------------------------
   * Validate items
   * --------------------------------------------------
   */

  if (!Array.isArray(items) || items.length === 0) {
   return res.status(400).json({
    success: false,
    message: "Order must contain at least one item.",
   });
  }

  const productIds = items.map((item: any) => item.productId);

  const validProductIds = productIds.every((id: string) => mongoose.Types.ObjectId.isValid(id));

  if (!validProductIds) {
   return res.status(400).json({
    success: false,
    message: "Invalid productId.",
   });
  }

  const products = await Product.find({
   _id: {
    $in: productIds,
   },
   storeId,
   isActive: true,
  });

  if (products.length !== productIds.length) {
   return res.status(400).json({
    success: false,
    message: "One or more products are invalid.",
   });
  }

  const productMap = new Map(products.map((product) => [product._id.toString(), product]));

  /*
   * --------------------------------------------------
   * Validate quantities and stock
   *
   * Stock is NOT deducted here.
   * The order starts at WAITING_STOCK.
   * Stock will be deducted when staff confirms
   * the order through the admin API.
   * --------------------------------------------------
   */

  for (const item of items) {
   const product = productMap.get(item.productId);

   if (!product) {
    return res.status(400).json({
     success: false,
     message: "Product not found.",
    });
   }

   const quantity = Number(item.quantity);

   if (!Number.isInteger(quantity) || quantity <= 0) {
    return res.status(400).json({
     success: false,
     message: `Invalid quantity for product "${product.name}".`,
    });
   }

   /*
    * We still check stock at checkout
    * so customers cannot place obviously
    * impossible orders.
    *
    * However, stock is not reserved/deducted
    * until the order is confirmed.
    */
   if (product.quantity < quantity) {
    return res.status(400).json({
     success: false,
     message: `Not enough stock for product "${product.name}". Available: ${product.quantity}, requested: ${quantity}.`,
    });
   }
  }

  /*
   * --------------------------------------------------
   * Get initial order status
   * --------------------------------------------------
   */

  const initialStatus = await OrderStatus.findOne({
   storeId,
   code: "WAITING_STOCK",
   isActive: true,
  }).lean();

  if (!initialStatus) {
   return res.status(500).json({
    success: false,
    message: "Initial order status WAITING_STOCK was not found.",
   });
  }

  /*
   * --------------------------------------------------
   * Create order
   * --------------------------------------------------
   */

  const session = await mongoose.startSession();

  try {
   session.startTransaction();

   const orderNumber = `ORD-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

   const customerSnapshot = {
    name: customerDoc.name,
    phone: customerDoc.phone,
    email: customer?.email || "",
   };

   const [order] = await Order.create(
    [
     {
      storeId,

      customerId: customerDoc._id,

      orderNumber,

      /*
       * NEW STATUS SYSTEM
       */
      statusId: initialStatus._id,

      customerSnapshot,

      shippingAddress: {
       province: shippingAddress?.province || "",
       district: shippingAddress?.district || "",
       ward: shippingAddress?.ward || "",
       address: shippingAddress?.address || "",
       postalCode: shippingAddress?.postalCode || "",
      },

      subtotal: Number(subtotal) || 0,

      shippingFee: Number(shippingFee) || 0,

      discount: Number(discount) || 0,

      total: Number(total) || 0,

      currency: String(currency || "").toUpperCase(),

      paymentMethod,
      paymentStatus,

      note: typeof note === "string" ? note.trim() : "",

      shippingMethod: typeof shippingMethod === "string" ? shippingMethod.trim() : "",

      /*
       * Guest order
       */
      createdBy: null,
     },
    ],
    {
     session,
    },
   );

   /*
    * --------------------------------------------------
    * Create order items
    * --------------------------------------------------
    */

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

     currency: String(item.currency || product.currency).toUpperCase(),
    };
   });

   await OrderItem.insertMany(orderItems, {
    session,
   });

   /*
    * IMPORTANT:
    *
    * No Product.quantity update here.
    * No Inventory record here.
    *
    * Stock is deducted only when:
    *
    * WAITING_STOCK
    *      ↓
    * PRIORITY
    *      ↓
    * WAITING_PRINT
    *      ↓
    * CONFIRMED
    *
    * The CONFIRMED transition is handled
    * by /api/admin/orders/[id].ts.
    */

   await session.commitTransaction();

   /*
    * --------------------------------------------------
    * Return created order
    * --------------------------------------------------
    */

   const createdOrder = await Order.findById(order._id)
    .populate({
     path: "customerId",
     select: "name phone isActive",
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
 } catch (error: any) {
  console.error("Guest order API error:", error);

  return res.status(500).json({
   success: false,
   message: error?.message || "Internal server error.",
  });
 }
}
