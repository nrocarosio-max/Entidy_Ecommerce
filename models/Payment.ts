import mongoose, { Schema, models } from "mongoose";

const PaymentSchema = new Schema(
 {
  orderId: {
   type: Schema.Types.ObjectId,
   ref: "Order",
   required: true,
   unique: true,
   index: true,
  },

  storeId: {
   type: Schema.Types.ObjectId,
   ref: "Store",
   required: true,
   index: true,
  },

  method: {
   type: String,
   enum: ["COD", "BANK_TRANSFER", "CREDIT_CARD", "DEBIT_CARD", "OTHER"],
   default: "COD",
  },

  amount: {
   type: Number,
   required: true,
   min: 0,
  },

  currency: {
   type: String,
   required: true,
   uppercase: true,
   trim: true,
  },

  status: {
   type: String,
   enum: ["PENDING", "AUTHORIZED", "PAID", "FAILED", "REFUNDED", "PARTIALLY_REFUNDED", "CANCELLED"],
   default: "PENDING",
   index: true,
  },

  transactionId: {
   type: String,
   default: "",
   trim: true,
   index: true,
  },

  paidAt: {
   type: Date,
   default: null,
  },

  refundedAt: {
   type: Date,
   default: null,
  },

  reconciliationStatus: {
   type: String,
   enum: ["PENDING", "RECONCILED", "DISPUTED"],
   default: "PENDING",
   index: true,
  },

  reconciledAt: {
   type: Date,
   default: null,
  },

  note: {
   type: String,
   default: "",
   trim: true,
  },

  createdBy: {
   type: Schema.Types.ObjectId,
   ref: "User",
   default: null,
  },

  updatedBy: {
   type: Schema.Types.ObjectId,
   ref: "User",
   default: null,
  },
 },
 {
  timestamps: true,
 },
);

PaymentSchema.index({
 storeId: 1,
 status: 1,
 createdAt: -1,
});

PaymentSchema.index({
 storeId: 1,
 reconciliationStatus: 1,
 createdAt: -1,
});

export const Payment = models.Payment || mongoose.model("Payment", PaymentSchema);
