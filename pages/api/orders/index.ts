import type { NextApiRequest, NextApiResponse } from "next";
import mongoose from "mongoose";

import { connectDB } from "~/lib/mongodb";
import { resolveAffiliate } from "~/lib/resolveAffiliate";

import { Order } from "~/models/Order";
import { OrderItem } from "~/models/OrderItem";
import { OrderStatus } from "~/models/OrderStatus";
import { Product } from "~/models/Product";
import { Customer } from "~/models/Customer";
import { Store } from "~/models/Store";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
 if (req.method !== "POST") {
  res.setHeader("Allow", ["POST"]);

  return res.status(405).json({
   success: false,
   message: "Method not allowed.",
  });
 }

 try {
  await connectDB();

  const body = req.body || {};

  const {
   storeId,
   customer,
   customerId,
   shippingAddress,
   items,
   shippingFee = 0,
   discount = 0,
   currency,
   paymentMethod = "COD",
   note = "",
   shippingMethod = "",
   affiliateCode = "",
  } = body;

  /*
   * --------------------------------------------------
   * Validate store
   * --------------------------------------------------
   */

  if (typeof storeId !== "string" || !mongoose.Types.ObjectId.isValid(storeId)) {
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
   * Validate items
   * --------------------------------------------------
   */

  if (!Array.isArray(items) || items.length === 0) {
   return res.status(400).json({
    success: false,
    message: "Order must contain at least one item.",
   });
  }

  const productIds = items.map((item: any) => (typeof item?.productId === "string" ? item.productId : ""));

  const validProductIds = productIds.every((id: string) => mongoose.Types.ObjectId.isValid(id));

  if (!validProductIds) {
   return res.status(400).json({
    success: false,
    message: "Invalid productId.",
   });
  }

  const uniqueProductIds = Array.from(new Set(productIds));

  const products = await Product.find({
   _id: {
    $in: uniqueProductIds,
   },
   storeId,
   isActive: true,
  }).lean();

  if (products.length !== uniqueProductIds.length) {
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
   * Stock is deducted only when staff confirms
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

   if (product.quantity < quantity) {
    return res.status(400).json({
     success: false,
     message: `Not enough stock for product "${product.name}". Available: ${product.quantity}, requested: ${quantity}.`,
    });
   }
  }

  /*
   * --------------------------------------------------
   * Find initial order status
   * --------------------------------------------------
   */

  const initialStatus = await OrderStatus.findOne({
   code: "NEW",
   isActive: true,
  }).lean();

  if (!initialStatus) {
   return res.status(500).json({
    success: false,
    message: "Initial order status NEW was not found.",
   });
  }

  /*
   * --------------------------------------------------
   * Start transaction
   * --------------------------------------------------
   */

  const session = await mongoose.startSession();

  let orderId: mongoose.Types.ObjectId | null = null;

  try {
   session.startTransaction();

   /*
    * --------------------------------------------------
    * Resolve affiliate
    *
    * Affiliate identity and store permission are
    * verified by the server.
    * --------------------------------------------------
    */

   const affiliateAttribution = await resolveAffiliate({
    affiliateCode: typeof affiliateCode === "string" ? affiliateCode : "",
    storeId,
    session,
   });

   /*
    * --------------------------------------------------
    * Find or create customer
    * --------------------------------------------------
    */

   let customerDoc = null;

   if (typeof customerId === "string" && mongoose.Types.ObjectId.isValid(customerId)) {
    customerDoc = await Customer.findOne({
     _id: customerId,
     storeId,
     isActive: true,
    }).session(session);
   }

   if (!customerDoc) {
    const customerName = typeof customer?.name === "string" ? customer.name.trim() : typeof customer?.fullName === "string" ? customer.fullName.trim() : "";

    const customerPhone = typeof customer?.phone === "string" ? customer.phone.trim() : "";

    if (!customerName || !customerPhone) {
     throw new Error("Customer name and phone are required.");
    }

    const normalizedName = customerName
     .normalize("NFD")
     .replace(/[\u0300-\u036f]/g, "")
     .toLowerCase()
     .trim();

    customerDoc = await Customer.findOneAndUpdate(
     {
      storeId,
      phone: customerPhone,
     },
     {
      $set: {
       name: customerName,
       nameNormalized: normalizedName,
       isActive: true,
      },
     },
     {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
      session,
     },
    );
   }

   if (!customerDoc) {
    throw new Error("Unable to create customer.");
   }

   /*
    * --------------------------------------------------
    * Prepare order items using database prices
    * --------------------------------------------------
    */

   const orderItems = items.map((item: any) => {
    const product = productMap.get(item.productId)!;

    const quantity = Number(item.quantity);

    // Do not trust price or currency supplied by the client.
    const price = Number(product.price);

    if (!Number.isFinite(price) || price < 0) {
     throw new Error(`Invalid price for product "${product.name}".`);
    }

    return {
     productId: product._id,

     productSnapshot: {
      name: product.name,
      sku: product.sku,
      slug: product.slug || "",
      image: product.images?.[0] || "",
     },

     quantity,

     price,

     subtotal: price * quantity,

     currency: String(product.currency || currency || "VND").toUpperCase(),
    };
   });

   /*
    * --------------------------------------------------
    * Calculate totals on the server
    * --------------------------------------------------
    */

   const calculatedSubtotal = orderItems.reduce((sum, item) => sum + item.subtotal, 0);

   const parsedShippingFee = Number(shippingFee);
   const parsedDiscount = Number(discount);

   if (!Number.isFinite(parsedShippingFee) || parsedShippingFee < 0 || !Number.isFinite(parsedDiscount) || parsedDiscount < 0) {
    throw new Error("Invalid shipping fee or discount.");
   }

   if (parsedDiscount > calculatedSubtotal + parsedShippingFee) {
    throw new Error("Discount cannot exceed the order amount.");
   }

   const calculatedTotal = Math.max(0, calculatedSubtotal + parsedShippingFee - parsedDiscount);

   const orderCurrency = String(currency || orderItems[0]?.currency || "VND").toUpperCase();

   /*
    * --------------------------------------------------
    * Validate payment method
    * --------------------------------------------------
    */

   const allowedPaymentMethods = ["COD", "BANK_TRANSFER", "CREDIT_CARD", "DEBIT_CARD", "OTHER"];

   if (!allowedPaymentMethods.includes(paymentMethod)) {
    throw new Error("Invalid payment method.");
   }

   // Payment status must be controlled by the server.
   const initialPaymentStatus = "PENDING";

   /*
    * --------------------------------------------------
    * Create order
    * --------------------------------------------------
    */

   const orderNumber = `ORD-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

   const customerSnapshot = {
    name: customerDoc.name,
    phone: customerDoc.phone,
    email: typeof customer?.email === "string" ? customer.email.trim() : "",
   };

   const [order] = await Order.create(
    [
     {
      storeId,

      customerId: customerDoc._id,

      orderNumber,

      statusId: initialStatus._id,

      customerSnapshot,

      shippingAddress: {
       province: shippingAddress?.province || "",
       district: shippingAddress?.district || "",
       ward: shippingAddress?.ward || "",
       address: shippingAddress?.address || "",
       postalCode: shippingAddress?.postalCode || "",
      },

      subtotal: calculatedSubtotal,

      shippingFee: parsedShippingFee,

      discount: parsedDiscount,

      total: calculatedTotal,

      currency: orderCurrency,

      paymentMethod,

      paymentStatus: initialPaymentStatus,

      note: typeof note === "string" ? note.trim() : "",

      shippingMethod: typeof shippingMethod === "string" ? shippingMethod.trim() : "",

      // Affiliate attribution
      affiliateId: affiliateAttribution?.affiliateId ?? null,

      affiliateStoreId: affiliateAttribution?.affiliateStoreId ?? null,

      affiliateCode: affiliateAttribution?.affiliateCode ?? "",

      // Guest order
      createdBy: null,
     },
    ],
    {
     session,
    },
   );

   orderId = order._id;

   /*
    * --------------------------------------------------
    * Create order items
    * --------------------------------------------------
    */

   const orderItemDocuments = orderItems.map((item) => ({
    orderId: order._id,
    ...item,
   }));

   await OrderItem.insertMany(orderItemDocuments, {
    session,
   });

   /*
    * IMPORTANT:
    *
    * No Product.quantity update here.
    * No Inventory record here.
    *
    * Stock is deducted only when the order reaches
    * CONFIRMED through the admin order API.
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
   if (session.inTransaction()) {
    await session.abortTransaction();
   }

   throw error;
  } finally {
   await session.endSession();
  }
 } catch (error: any) {
  console.error("Guest order API error:", error);

  const message = typeof error?.message === "string" ? error.message : "Internal server error.";

  const isAffiliateError = message === "Affiliate code is invalid or inactive." || message === "This affiliate is not active for this store.";

  const isValidationError =
   isAffiliateError ||
   message.startsWith("Invalid ") ||
   message.startsWith("Customer ") ||
   message.startsWith("Unable to create customer") ||
   message.startsWith("Not enough stock") ||
   message.startsWith("Discount cannot");

  return res.status(isValidationError ? 400 : 500).json({
   success: false,
   message,
  });
 }
}
