import type { NextApiRequest, NextApiResponse } from "next";
import mongoose from "mongoose";

import { connectDB } from "~/lib/mongodb";
import { requirePermission, requireStoreAccess } from "~/lib/permissions";

import { Order } from "~/models/Order";
import { Payment } from "~/models/Payment";
import { PaymentHistory } from "~/models/PaymentHistory";
import { Store } from "~/models/Store";

const paymentStatuses = ["PENDING", "AUTHORIZED", "PAID", "FAILED", "REFUNDED", "PARTIALLY_REFUNDED", "CANCELLED"] as const;

const reconciliationStatuses = ["PENDING", "RECONCILED", "DISPUTED"] as const;

const paymentMethods = ["COD", "BANK_TRANSFER", "CREDIT_CARD", "DEBIT_CARD", "OTHER"] as const;

function isValidObjectId(value: string) {
 return mongoose.Types.ObjectId.isValid(value);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
 try {
  await connectDB();

  const { id } = req.query;

  if (typeof id !== "string" || !isValidObjectId(id)) {
   return res.status(400).json({
    message: "Invalid order ID.",
   });
  }

  if (req.method === "GET") {
   const user = await requirePermission(req, "payments.read");

   const order = await Order.findById(id).lean();

   if (!order) {
    return res.status(404).json({
     message: "Order not found.",
    });
   }

   await requireStoreAccess(req, order.storeId.toString());

   const payment = await Payment.findOne({
    orderId: order._id,
   }).lean();

   if (!payment) {
    return res.status(404).json({
     message: "Payment not found for this order.",
    });
   }

   const paymentHistory = await PaymentHistory.find({
    paymentId: payment._id,
   })
    .populate("changedBy", "name email")
    .sort({ createdAt: -1 })
    .lean();

   return res.status(200).json({
    payment,
    paymentHistory,
    orderId: order._id,
    storeId: user.role === "SUPER_ADMIN" ? order.storeId : user.storeId,
   });
  }

  if (req.method === "POST") {
   const user = await requirePermission(req, "payments.create");

   const order = await Order.findById(id);

   if (!order) {
    return res.status(404).json({
     message: "Order not found.",
    });
   }

   await requireStoreAccess(req, order.storeId.toString());

   const existingPayment = await Payment.findOne({
    orderId: order._id,
   });

   if (existingPayment) {
    return res.status(409).json({
     message: "Payment already exists for this order.",
     payment: existingPayment,
    });
   }

   const store = await Store.findById(order.storeId).lean();

   if (!store || !store.isActive) {
    return res.status(400).json({
     message: "Store is not active.",
    });
   }

   const { method, amount, currency, status, transactionId, paidAt, refundedAt, reconciliationStatus, reconciledAt, note } = req.body;

   const paymentMethod = method || order.paymentMethod || "COD";

   if (!paymentMethods.includes(paymentMethod)) {
    return res.status(400).json({
     message: "Invalid payment method.",
    });
   }

   const paymentAmount = amount !== undefined ? Number(amount) : order.total;

   if (!Number.isFinite(paymentAmount) || paymentAmount < 0) {
    return res.status(400).json({
     message: "Invalid payment amount.",
    });
   }

   const paymentCurrency = String(currency || order.currency || "")
    .trim()
    .toUpperCase();

   if (!paymentCurrency) {
    return res.status(400).json({
     message: "Currency is required.",
    });
   }

   const paymentStatus = status || "PENDING";

   if (!paymentStatuses.includes(paymentStatus)) {
    return res.status(400).json({
     message: "Invalid payment status.",
    });
   }

   const paymentReconciliationStatus = reconciliationStatus || "PENDING";

   if (!reconciliationStatuses.includes(paymentReconciliationStatus)) {
    return res.status(400).json({
     message: "Invalid reconciliation status.",
    });
   }

   const payment = await Payment.create({
    orderId: order._id,
    storeId: order.storeId,
    method: paymentMethod,
    amount: paymentAmount,
    currency: paymentCurrency,
    status: paymentStatus,
    transactionId: String(transactionId || "").trim(),
    paidAt: paidAt || null,
    refundedAt: refundedAt || null,
    reconciliationStatus: paymentReconciliationStatus,
    reconciledAt: reconciledAt || null,
    note: String(note || "").trim(),
    createdBy: user.id,
    updatedBy: user.id,
   });

   return res.status(201).json({
    message: "Payment created successfully.",
    payment,
   });
  }

  if (req.method === "PATCH") {
   const user = await requirePermission(req, "payments.update");

   const order = await Order.findById(id);

   if (!order) {
    return res.status(404).json({
     message: "Order not found.",
    });
   }

   await requireStoreAccess(req, order.storeId.toString());

   const payment = await Payment.findOne({
    orderId: order._id,
   });

   if (!payment) {
    return res.status(404).json({
     message: "Payment not found for this order.",
    });
   }

   const { method, amount, currency, status, transactionId, paidAt, refundedAt, reconciliationStatus, reconciledAt, note } = req.body;

   const oldStatus = payment.status;
   const oldReconciliationStatus = payment.reconciliationStatus;

   if (status !== undefined && !paymentStatuses.includes(status)) {
    return res.status(400).json({
     message: "Invalid payment status.",
    });
   }

   if (reconciliationStatus !== undefined && !reconciliationStatuses.includes(reconciliationStatus)) {
    return res.status(400).json({
     message: "Invalid reconciliation status.",
    });
   }

   if (method !== undefined && !paymentMethods.includes(method)) {
    return res.status(400).json({
     message: "Invalid payment method.",
    });
   }

   if (amount !== undefined) {
    const numericAmount = Number(amount);

    if (!Number.isFinite(numericAmount) || numericAmount < 0) {
     return res.status(400).json({
      message: "Invalid payment amount.",
     });
    }

    payment.amount = numericAmount;
   }

   if (currency !== undefined) {
    const normalizedCurrency = String(currency).trim().toUpperCase();

    if (!normalizedCurrency) {
     return res.status(400).json({
      message: "Currency cannot be empty.",
     });
    }

    payment.currency = normalizedCurrency;
   }

   if (method !== undefined) {
    payment.method = method;
   }

   if (status !== undefined) {
    payment.status = status;
   }

   if (transactionId !== undefined) {
    payment.transactionId = String(transactionId).trim();
   }

   if (paidAt !== undefined) {
    payment.paidAt = paidAt || null;
   }

   if (refundedAt !== undefined) {
    payment.refundedAt = refundedAt || null;
   }

   if (reconciliationStatus !== undefined) {
    payment.reconciliationStatus = reconciliationStatus;
   }

   if (reconciledAt !== undefined) {
    payment.reconciledAt = reconciledAt || null;
   }

   if (note !== undefined) {
    payment.note = String(note).trim();
   }

   payment.updatedBy = new mongoose.Types.ObjectId(user.id);

   await payment.save();

   const statusChanged = oldStatus !== payment.status;

   const reconciliationChanged = oldReconciliationStatus !== payment.reconciliationStatus;

   if (statusChanged || reconciliationChanged) {
    await PaymentHistory.create({
     paymentId: payment._id,
     fromStatus: oldStatus,
     toStatus: payment.status,
     fromReconciliationStatus: oldReconciliationStatus,
     toReconciliationStatus: payment.reconciliationStatus,
     changedBy: user.id,
     note: String(note || "").trim(),
    });
   }

   return res.status(200).json({
    message: "Payment updated successfully.",
    payment,
   });
  }

  return res.status(405).json({
   message: "Method not allowed.",
  });
 } catch (error) {
  console.error("Payment API error:", error);

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
