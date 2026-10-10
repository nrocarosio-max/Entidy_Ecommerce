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

   const order = await Order.findById(id)
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
   const note = typeof body.note === "string" ? body.note.trim() : "";

   const session = await mongoose.startSession();

   let updatedOrderId = "";

   let isPaymentUpdate = false;

   try {
    await session.withTransaction(async () => {
     const currentOrder = await Order.findById(id).session(session);

     if (!currentOrder) {
      throw new Error("ORDER_NOT_FOUND");
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

      const previousStatus = currentOrder.paymentStatus as PaymentStatus;
      const newStatus = body.paymentStatus;

      if (previousStatus !== newStatus) {
       currentOrder.paymentStatus = newStatus;

       await currentOrder.save({ session });

       await PaymentStatusHistory.create(
        [
         {
          orderId: currentOrder._id,
          storeId: currentOrder.storeId,
          previousStatus,
          newStatus,
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
      * ORDER STATUS UPDATE
      */
     const requestedStatusId = typeof body.statusId === "string" ? body.statusId : "";

     if (!requestedStatusId || !mongoose.Types.ObjectId.isValid(requestedStatusId)) {
      throw new Error("INVALID_STATUS_ID");
     }

     const previousStatusId = getId(currentOrder.statusId);

     if (previousStatusId === requestedStatusId) {
      updatedOrderId = currentOrder._id.toString();
      return;
     }

     const [previousStatus, newStatus] = await Promise.all([
      OrderStatus.findById(previousStatusId).session(session),

      OrderStatus.findOne({
       _id: requestedStatusId,
       isActive: true,
      }).session(session),
     ]);
     console.log("STATUS TRANSITION DEBUG", {
      orderId: String(currentOrder._id),
      currentStatusId: previousStatus ? String(previousStatus._id) : null,
      currentStatusName: previousStatus?.name ?? null,
      currentStatusCode: previousStatus?.code ?? null,
      requestedStatusId: String(requestedStatusId),
      requestedStatusCode: newStatus?.code ?? null,
      allowedNextStatusIds: (previousStatus?.nextStatusIds ?? []).map((item: any) => String(item?._id ?? item)),
     });
     if (!previousStatus) {
      throw new Error("CURRENT_STATUS_NOT_FOUND");
     }
     if (!newStatus) {
      throw new Error("STATUS_NOT_FOUND");
     }

     const requestedStatusObjectId = String(newStatus._id);
     console.log("ORDER STATUS UPDATE", {
      orderId: String(currentOrder._id),
      fromStatus: previousStatus.name,
      fromStatusCode: previousStatus.code,
      toStatus: newStatus.name,
      toStatusCode: newStatus.code,
     });

     /*
      * Deduct stock when an order first reaches CONFIRMED.
      * This assumes stock has not already been deducted.
      */
     const previousCode = String(previousStatus?.code || "").toUpperCase();
     const newCode = String(newStatus.code || "").toUpperCase();

     if (previousCode !== "CONFIRMED" && newCode === "CONFIRMED") {
      const orderItems = await OrderItem.find({ orderId: id }).session(session).lean();

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

* Create affiliate commissions when an order reaches DELIVERED.
* Each order item receives its own commission record.
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

       const productIds: string[] = [];

       orderItems.forEach((item) => {
        const productId = String(item.productId);

        if (productIds.indexOf(productId) === -1) {
         productIds.push(productId);
        }
       });

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
        const productId = String(item.productId);

        const commissionRate = rateMap.get(productId) ?? affiliateStore.commissionRate;

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

  res.setHeader("Allow", ["GET", "PATCH"]);
  if (req.method === "DELETE") {
   const { id } = req.query;

   if (typeof id !== "string" || !mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
     success: false,
     message: "Invalid order ID.",
    });
   }

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

   order.isDeleted = true;
   order.deletedAt = new Date();

   await order.save();

   return res.status(200).json({
    success: true,
    message: "Order moved to deleted orders.",
   });
  }
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
  return res.status(500).json({
   success: false,
   message: message || "Internal server error.",
  });
 }
}
