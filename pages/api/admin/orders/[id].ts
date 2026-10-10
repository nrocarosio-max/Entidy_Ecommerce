import type { NextApiRequest, NextApiResponse } from "next";
import mongoose from "mongoose";

import { connectDB } from "~/lib/mongodb";
import { requirePermission } from "~/lib/permissions";

import { Order } from "~/models/Order";
import { OrderItem } from "~/models/OrderItem";
import { OrderStatus } from "~/models/OrderStatus";
import { OrderStatusHistory } from "~/models/OrderStatusHistory";
import { PaymentStatusHistory } from "~/models/PaymentStatusHistory";
import { Product } from "~/models/Product";
import { Inventory } from "~/models/Inventory";
import { AffiliateCommission } from "~/models/AffiliateCommission";
import { AffiliateStore } from "~/models/AffiliateStore";
import { AffiliateProductRate } from "~/models/AffiliateProductRate";
type PaymentStatus = "PENDING" | "PAID" | "FAILED" | "REFUNDED";

interface ApiResponse {
 success: boolean;
 message?: string;
 order?: unknown;
 items?: unknown[];
 history?: unknown[];
 paymentHistory?: unknown[];
}

const PAYMENT_STATUSES: PaymentStatus[] = ["PENDING", "PAID", "FAILED", "REFUNDED"];

function isPaymentStatus(value: unknown): value is PaymentStatus {
 return typeof value === "string" && PAYMENT_STATUSES.includes(value as PaymentStatus);
}

function getId(value: unknown): string {
 if (!value) return "";

 if (typeof value === "string") return value;

 if (typeof value === "object" && value !== null && "_id" in value) {
  return String((value as { _id: unknown })._id);
 }

 return String(value);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<ApiResponse>) {
 try {
  await connectDB();

  const id = typeof req.query.id === "string" ? req.query.id : "";

  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
   return res.status(400).json({
    success: false,
    message: "Invalid order ID.",
   });
  }

  if (req.method === "GET") {
   const user = await requirePermission(req, "orders.read");

   const order = await Order.findOne({
    _id: id,
    isDeleted: { $ne: true },
   })
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

   if (!order) {
    return res.status(404).json({
     success: false,
     message: "Order not found.",
    });
   }

   if (user.role !== "SUPER_ADMIN" && getId(order.storeId) !== getId(user.storeId)) {
    return res.status(403).json({
     success: false,
     message: "You do not have access to this order.",
    });
   }

   const [items, history, paymentHistory] = await Promise.all([
    OrderItem.find({ orderId: id }).populate("productId").sort({ createdAt: 1 }).lean(),

    OrderStatusHistory.find({ orderId: id })
     .populate("changedBy", "name email")
     .populate("fromStatusId", "name code color")
     .populate("toStatusId", "name code color")
     .sort({ createdAt: -1 })
     .lean(),
    PaymentStatusHistory.find({ orderId: id }).populate("changedBy", "name email").sort({ createdAt: -1 }).lean(),
   ]);

   return res.status(200).json({
    success: true,
    order,
    items,
    history,
    paymentHistory,
   });
  }

  if (req.method === "PATCH") {
   const user = await requirePermission(req, "orders.update");

   const body = req.body || {};
   const allowedOrderFields = ["customerSnapshot", "shippingAddress", "shippingFee", "discount", "note", "shippingMethod", "trackingNumber"] as const;
   const note = typeof body.note === "string" ? body.note.trim() : "";

   const session = await mongoose.startSession();

   let updatedOrderId = "";

   let isPaymentUpdate = false;

   try {
    await session.withTransaction(async () => {
     const currentOrder = await Order.findById(id).session(session);

     if (!currentOrder || currentOrder.isDeleted) {
      throw new Error("ORDER_NOT_FOUND");
     }
     // Prevent editing items when a delivered order already has commissions.
     if (Object.prototype.hasOwnProperty.call(req.body, "items")) {
      const [currentStatus, commissions] = await Promise.all([
       OrderStatus.findById(currentOrder.statusId).session(session).lean(),

       AffiliateCommission.find({
        orderId: currentOrder._id,
       })
        .select("_id")
        .session(session)
        .lean(),
      ]);

      if (currentStatus?.code === "DELIVERED" && commissions.length > 0) {
       throw new Error("DELIVERED_ORDER_ITEMS_LOCKED");
      }
     }
     if (user.role !== "SUPER_ADMIN" && getId(currentOrder.storeId) !== getId(user.storeId)) {
      throw new Error("FORBIDDEN");
     }

     /*
      * PAYMENT STATUS UPDATE
      */
     if (body.paymentStatus !== undefined) {
      isPaymentUpdate = true;

      if (!isPaymentStatus(body.paymentStatus)) {
       throw new Error("INVALID_PAYMENT_STATUS");
      }

      const previousPaymentStatus = currentOrder.paymentStatus as PaymentStatus;
      const newPaymentStatus = body.paymentStatus;

      if (previousPaymentStatus !== newPaymentStatus) {
       currentOrder.paymentStatus = newPaymentStatus;
       await currentOrder.save({ session });

       await PaymentStatusHistory.create(
        [
         {
          orderId: currentOrder._id,
          storeId: currentOrder.storeId,
          previousStatus: previousPaymentStatus,
          newStatus: newPaymentStatus,
          changedBy: user.id,
          note,
         },
        ],
        { session },
       );
      }

      updatedOrderId = currentOrder._id.toString();
      return;
     }

     /*
      * UPDATE ORDER ITEMS
      */
     if (Object.prototype.hasOwnProperty.call(body, "items")) {
      if (!Array.isArray(body.items)) {
       throw new Error("INVALID_ORDER_ITEMS");
      }

      if (body.items.length === 0) {
       throw new Error("ORDER_ITEMS_REQUIRED");
      }

      const currentStatus = await OrderStatus.findById(currentOrder.statusId).session(session).lean();

      if (!currentStatus) {
       throw new Error("CURRENT_STATUS_NOT_FOUND");
      }

      const statusCode = String(currentStatus.code || "").toUpperCase();

      const oldItems = await OrderItem.find({
       orderId: currentOrder._id,
      })
       .session(session)
       .lean();

      /*
       * Validate submitted items.
       * Duplicate product IDs are rejected to prevent
       * inconsistent quantities and commission records.
       */
      const seenProductIds = new Set<string>();

      const normalizedItems = body.items.map((item: unknown) => {
       if (!item || typeof item !== "object" || Array.isArray(item)) {
        throw new Error("INVALID_ORDER_ITEM");
       }

       const value = item as Record<string, unknown>;

       const productId = typeof value.productId === "string" ? value.productId : "";

       if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
        throw new Error("INVALID_ORDER_ITEM_PRODUCT");
       }

       if (seenProductIds.has(productId)) {
        throw new Error("DUPLICATE_ORDER_ITEM_PRODUCT");
       }

       seenProductIds.add(productId);

       const quantity = value.quantity;
       const price = value.price;

       if (typeof quantity !== "number" || !Number.isSafeInteger(quantity) || quantity < 1) {
        throw new Error("INVALID_ORDER_ITEM_QUANTITY");
       }

       if (typeof price !== "number" || !Number.isFinite(price) || price < 0) {
        throw new Error("INVALID_ORDER_ITEM_PRICE");
       }

       const subtotal = Math.round(price * quantity * 100) / 100;

       if (!Number.isFinite(subtotal)) {
        throw new Error("INVALID_ORDER_ITEM_PRICE");
       }

       return {
        productId: new mongoose.Types.ObjectId(productId),
        quantity,
        price,
        subtotal,
       };
      });

      /*
       * Load products from the same store.
       * The client cannot submit product snapshots or currency
       * to override the values maintained by the server.
       */
      const products = await Product.find({
       _id: { $in: normalizedItems.map((item: any) => item.productId) },
       storeId: currentOrder.storeId,
      }).session(session);

      const productMap = new Map(products.map((product) => [String(product._id), product]));

      for (const item of normalizedItems) {
       if (!productMap.has(String(item.productId))) {
        throw new Error("PRODUCT_NOT_FOUND");
       }
      }

      /*
       * Reconcile inventory only when the order is CONFIRMED.
       * Existing order quantities have already been deducted.
       */
      if (statusCode === "CONFIRMED") {
       const oldQuantities = new Map<string, number>();
       const newQuantities = new Map<string, number>();

       for (const item of oldItems) {
        const productId = String(item.productId);

        oldQuantities.set(productId, (oldQuantities.get(productId) || 0) + Number(item.quantity));
       }

       for (const item of normalizedItems) {
        const productId = String(item.productId);

        newQuantities.set(productId, (newQuantities.get(productId) || 0) + item.quantity);
       }

       const affectedProductIds = new Set(Array.from(oldQuantities.keys()).concat(Array.from(newQuantities.keys())));

       const affectedProductIdsArray = Array.from(affectedProductIds);

       for (let i = 0; i < affectedProductIdsArray.length; i++) {
        const productId = affectedProductIdsArray[i];

        const quantityBefore = oldQuantities.get(productId) || 0;
        const quantityAfter = newQuantities.get(productId) || 0;
        const difference = quantityAfter - quantityBefore;

        if (difference === 0) {
         continue;
        }

        const product = await Product.findOne({
         _id: productId,
         storeId: currentOrder.storeId,
        }).session(session);

        if (!product) {
         throw new Error("PRODUCT_NOT_FOUND");
        }

        product.quantity = product.quantity - difference;

        if (product.quantity < 0) {
         throw new Error("INSUFFICIENT_STOCK");
        }

        await product.save({ session });

        await Inventory.create(
         [
          {
           storeId: currentOrder.storeId,
           productId: product._id,
           type: difference > 0 ? "OUT" : "IN",
           quantity: Math.abs(difference),
          },
         ],
         { session },
        );
       }
      }

      /*
       * Replace old order items with validated items.
       * Product details and currency are generated on the server.
       */
      const itemDocuments = normalizedItems.map((item: any) => {
       const product = productMap.get(String(item.productId))!;

       return {
        orderId: currentOrder._id,
        productId: product._id,
        productSnapshot: {
         name: product.name,
         sku: product.sku,
         slug: product.slug,
         image: product.images?.[0] || "",
        },
        quantity: item.quantity,
        price: item.price,
        subtotal: item.subtotal,
        affiliateCommissionRate: null,
        currency: currentOrder.currency,
       };
      });

      await OrderItem.deleteMany({ orderId: currentOrder._id }, { session });

      await OrderItem.insertMany(itemDocuments, { session });

      /*
       * Recalculate all totals on the server.
       */
      currentOrder.subtotal = Math.round(normalizedItems.reduce((sum: any, item: any) => sum + item.subtotal, 0) * 100) / 100;

      const shippingFee = Number(currentOrder.shippingFee);
      const discount = Number(currentOrder.discount);

      if (!Number.isFinite(shippingFee) || shippingFee < 0 || !Number.isFinite(discount) || discount < 0) {
       throw new Error("INVALID_ORDER_TOTAL");
      }

      currentOrder.total = Math.round(Math.max(0, currentOrder.subtotal + shippingFee - discount) * 100) / 100;

      await currentOrder.save({ session });
     }

     /*
      * UPDATE GENERAL ORDER INFORMATION
      */
     const hasOrderFieldUpdate = allowedOrderFields.some((field) => Object.prototype.hasOwnProperty.call(body, field));

     if (hasOrderFieldUpdate) {
      if (Object.prototype.hasOwnProperty.call(body, "customerSnapshot")) {
       const value = body.customerSnapshot;

       if (!value || typeof value !== "object" || Array.isArray(value)) {
        throw new Error("INVALID_CUSTOMER_SNAPSHOT");
       }

       currentOrder.customerSnapshot = {
        ...currentOrder.customerSnapshot,
        ...value,
       };
      }

      if (Object.prototype.hasOwnProperty.call(body, "shippingAddress")) {
       const value = body.shippingAddress;

       if (!value || typeof value !== "object" || Array.isArray(value)) {
        throw new Error("INVALID_SHIPPING_ADDRESS");
       }

       currentOrder.shippingAddress = {
        ...currentOrder.shippingAddress,
        ...value,
       };
      }

      if (Object.prototype.hasOwnProperty.call(body, "shippingFee")) {
       const value = Number(body.shippingFee);

       if (!Number.isFinite(value) || value < 0) {
        throw new Error("INVALID_SHIPPING_FEE");
       }

       currentOrder.shippingFee = value;
      }

      if (Object.prototype.hasOwnProperty.call(body, "discount")) {
       const value = Number(body.discount);

       if (!Number.isFinite(value) || value < 0) {
        throw new Error("INVALID_DISCOUNT");
       }

       currentOrder.discount = value;
      }

      if (Object.prototype.hasOwnProperty.call(body, "note")) {
       if (typeof body.note !== "string") {
        throw new Error("INVALID_ORDER_NOTE");
       }

       currentOrder.note = body.note.trim();
      }

      if (Object.prototype.hasOwnProperty.call(body, "shippingMethod")) {
       if (typeof body.shippingMethod !== "string") {
        throw new Error("INVALID_SHIPPING_METHOD");
       }

       currentOrder.shippingMethod = body.shippingMethod.trim();
      }

      if (Object.prototype.hasOwnProperty.call(body, "trackingNumber")) {
       if (typeof body.trackingNumber !== "string") {
        throw new Error("INVALID_TRACKING_NUMBER");
       }

       currentOrder.trackingNumber = body.trackingNumber.trim();
      }

      const subtotal = Number(currentOrder.subtotal);
      const shippingFee = Number(currentOrder.shippingFee);
      const discount = Number(currentOrder.discount);

      if (!Number.isFinite(subtotal) || subtotal < 0 || !Number.isFinite(shippingFee) || shippingFee < 0 || !Number.isFinite(discount) || discount < 0) {
       throw new Error("INVALID_ORDER_TOTAL");
      }

      currentOrder.total = Math.max(0, subtotal + shippingFee - discount);

      await currentOrder.save({ session });
     }

     /*
      * ORDER STATUS UPDATE
      * statusId is optional for general order updates.
      */
     if (body.statusId !== undefined) {
      const requestedStatusId = typeof body.statusId === "string" ? body.statusId : "";

      if (!requestedStatusId || !mongoose.Types.ObjectId.isValid(requestedStatusId)) {
       throw new Error("INVALID_STATUS_ID");
      }

      const previousStatusId = getId(currentOrder.statusId);

      if (previousStatusId !== requestedStatusId) {
       const [previousStatus, newStatus] = await Promise.all([
        OrderStatus.findById(previousStatusId).session(session),
        OrderStatus.findOne({
         _id: requestedStatusId,
         isActive: true,
        }).session(session),
       ]);

       if (!previousStatus) {
        throw new Error("CURRENT_STATUS_NOT_FOUND");
       }

       if (!newStatus) {
        throw new Error("STATUS_NOT_FOUND");
       }

       const previousCode = String(previousStatus.code || "").toUpperCase();
       const newCode = String(newStatus.code || "").toUpperCase();

       /*
        * Deduct stock when the order first reaches CONFIRMED.
        */
       if (previousCode !== "CONFIRMED" && newCode === "CONFIRMED") {
        const orderItems = await OrderItem.find({
         orderId: currentOrder._id,
        })
         .session(session)
         .lean();

        for (const item of orderItems) {
         const product = await Product.findOne({
          _id: item.productId,
          storeId: currentOrder.storeId,
         }).session(session);

         if (!product) {
          throw new Error("PRODUCT_NOT_FOUND");
         }

         const quantity = Number(item.quantity);

         if (!Number.isInteger(quantity) || quantity < 1) {
          throw new Error("INVALID_PRODUCT_QUANTITY");
         }

         if (product.quantity < quantity) {
          throw new Error(`INSUFFICIENT_STOCK:${product.name}:${product.quantity}`);
         }

         const quantityBefore = product.quantity;
         const quantityAfter = quantityBefore - quantity;

         product.quantity = quantityAfter;

         if (quantityAfter === 0) {
          product.status = "OUT_OF_STOCK";
         }

         await product.save({ session });

         await Inventory.create(
          [
           {
            storeId: currentOrder.storeId,
            productId: product._id,
            type: "OUT",
            quantity,
            quantityBefore,
            quantityAfter,
            note: `Stock deducted for order ${currentOrder.orderNumber}.`,
            reference: currentOrder.orderNumber,
            createdBy: user.id,
           },
          ],
          { session },
         );
        }
       }

       currentOrder.statusId = newStatus._id;
       await currentOrder.save({ session });

       /*
        * Create commissions when the order reaches DELIVERED.
        */
       if (newCode === "DELIVERED" && previousCode !== "DELIVERED") {
        if (currentOrder.affiliateId && currentOrder.affiliateStoreId) {
         const affiliateStore = await AffiliateStore.findOne({
          _id: currentOrder.affiliateStoreId,
          affiliateId: currentOrder.affiliateId,
          storeId: currentOrder.storeId,
         }).session(session);

         if (!affiliateStore) {
          throw new Error("AFFILIATE_STORE_NOT_FOUND");
         }

         const orderItems = await OrderItem.find({
          orderId: currentOrder._id,
         })
          .session(session)
          .lean();

         const productIds = Array.from(new Set(orderItems.map((item) => String(item.productId))));

         const productRates = await AffiliateProductRate.find({
          affiliateId: currentOrder.affiliateId,
          storeId: currentOrder.storeId,
          productId: { $in: productIds },
          status: "ACTIVE",
         })
          .session(session)
          .lean();

         const rateMap = new Map(productRates.map((rate) => [String(rate.productId), rate.commissionRate]));

         const commissionDocuments = orderItems.map((item) => {
          const commissionRate = rateMap.get(String(item.productId)) ?? affiliateStore.commissionRate;

          const commissionBase = Number(item.subtotal);
          const quantity = Number(item.quantity);

          const amount = Math.round(((commissionBase * commissionRate) / 100) * 100) / 100;

          if (
           !Number.isFinite(commissionRate) ||
           commissionRate < 0 ||
           commissionRate > 100 ||
           !Number.isFinite(commissionBase) ||
           commissionBase < 0 ||
           !Number.isInteger(quantity) ||
           quantity < 1
          ) {
           throw new Error("INVALID_AFFILIATE_COMMISSION_DATA");
          }

          return {
           affiliateId: currentOrder.affiliateId,
           affiliateStoreId: currentOrder.affiliateStoreId,
           storeId: currentOrder.storeId,
           orderId: currentOrder._id,
           orderItemId: item._id,
           productId: item.productId,
           productName: item.productSnapshot?.name || "",
           quantity,
           orderNumber: currentOrder.orderNumber,
           commissionRate,
           commissionBase,
           amount,
           currency: item.currency,
           status: "PENDING",
           note: "",
          };
         });

         if (commissionDocuments.length > 0) {
          await AffiliateCommission.insertMany(commissionDocuments, {
           session,
           ordered: true,
          });
         }
        }
       }

       /*
        * Record history only when status actually changes.
        * Keep this inside the block where both status variables exist.
        */
       await OrderStatusHistory.create(
        [
         {
          orderId: currentOrder._id,
          storeId: currentOrder.storeId,
          fromStatusId: previousStatus._id,
          fromStatusName: previousStatus.name,
          toStatusId: newStatus._id,
          toStatusName: newStatus.name,
          changedBy: user.id,
          note,
         },
        ],
        { session },
       );
      }
     }

     updatedOrderId = currentOrder._id.toString();
    });
   } finally {
    await session.endSession();
   }

   const [order, items, history, paymentHistory] = await Promise.all([
    Order.findById(updatedOrderId)
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
     .lean(),

    OrderItem.find({ orderId: updatedOrderId }).populate("productId").sort({ createdAt: 1 }).lean(),

    OrderStatusHistory.find({ orderId: updatedOrderId })
     .populate("changedBy", "name email")
     .populate("fromStatusId", "name code color")
     .populate("toStatusId", "name code color")
     .sort({ createdAt: -1 })
     .lean(),

    PaymentStatusHistory.find({ orderId: updatedOrderId }).populate("changedBy", "name email").sort({ createdAt: -1 }).lean(),
   ]);

   return res.status(200).json({
    success: true,
    message: isPaymentUpdate ? "Payment status updated successfully." : "Order status updated successfully.",
    order,
    items,
    history,
    paymentHistory,
   });
  }

  if (req.method === "DELETE") {
   const user = await requirePermission(req, "orders.delete");

   const order = await Order.findOne({
    _id: id,
    isDeleted: { $ne: true },
   });

   if (!order) {
    return res.status(404).json({
     success: false,
     message: "Order not found.",
    });
   }

   if (user.role !== "SUPER_ADMIN" && getId(order.storeId) !== getId(user.storeId)) {
    return res.status(403).json({
     success: false,
     message: "You do not have access to this order.",
    });
   }

   order.isDeleted = true;
   order.deletedAt = new Date();

   await order.save();

   return res.status(200).json({
    success: true,
    message: "Order moved to deleted orders.",
   });
  }

  res.setHeader("Allow", ["GET", "PATCH", "DELETE"]);

  return res.status(405).json({
   success: false,
   message: "Method not allowed.",
  });
 } catch (error: unknown) {
  const message = error instanceof Error ? error.message : "";

  console.error("Admin order detail API error:", error);

  if (message === "UNAUTHORIZED") {
   return res.status(401).json({
    success: false,
    message: "Unauthorized.",
   });
  }

  if (message === "FORBIDDEN") {
   return res.status(403).json({
    success: false,
    message: "You do not have access to this order.",
   });
  }

  if (message === "ORDER_NOT_FOUND") {
   return res.status(404).json({
    success: false,
    message: "Order not found.",
   });
  }

  if (message === "INVALID_PAYMENT_STATUS") {
   return res.status(400).json({
    success: false,
    message: "Invalid payment status.",
   });
  }

  if (message === "INVALID_STATUS_ID") {
   return res.status(400).json({
    success: false,
    message: "A valid statusId is required.",
   });
  }

  if (message === "STATUS_NOT_FOUND") {
   return res.status(404).json({
    success: false,
    message: "The requested order status was not found.",
   });
  }

  if (message === "INVALID_STATUS_TRANSITION") {
   return res.status(400).json({
    success: false,
    message: "This order status transition is not allowed.",
   });
  }

  if (message === "PRODUCT_NOT_FOUND") {
   return res.status(404).json({
    success: false,
    message: "A product associated with this order was not found.",
   });
  }

  if (message === "INVALID_PRODUCT_QUANTITY") {
   return res.status(400).json({
    success: false,
    message: "An order contains an invalid product quantity.",
   });
  }

  if (message.startsWith("INSUFFICIENT_STOCK:")) {
   const details = message.split(":");

   return res.status(400).json({
    success: false,
    message: `Insufficient stock for ${details[1]}. Available: ${details[2]}.`,
   });
  }
  if (message === "AFFILIATE_STORE_NOT_FOUND") {
   return res.status(400).json({
    success: false,
    message: "Affiliate store relationship was not found.",
   });
  }

  if (message === "INVALID_AFFILIATE_COMMISSION_DATA") {
   return res.status(400).json({
    success: false,
    message: "Invalid affiliate commission data.",
   });
  }
  if (message === "CURRENT_STATUS_NOT_FOUND") {
   return res.status(400).json({
    success: false,
    message: "The current order status was not found.",
   });
  }
  if (message === "DELIVERED_ORDER_ITEMS_LOCKED") {
   return res.status(409).json({
    success: false,
    message: "Không thể sửa sản phẩm hoặc số lượng của đơn đã giao và đã phát sinh hoa hồng.",
   });
  }
  if (
   message === "INVALID_CUSTOMER_SNAPSHOT" ||
   message === "INVALID_SHIPPING_ADDRESS" ||
   message === "INVALID_SHIPPING_FEE" ||
   message === "INVALID_DISCOUNT" ||
   message === "INVALID_ORDER_TOTAL" ||
   message === "INVALID_ORDER_NOTE" ||
   message === "INVALID_SHIPPING_METHOD" ||
   message === "INVALID_TRACKING_NUMBER"
  ) {
   return res.status(400).json({
    success: false,
    message: "Thông tin cập nhật đơn hàng không hợp lệ.",
   });
  }
  return res.status(500).json({
   success: false,
   message: message || "Internal server error.",
  });
 }
}
