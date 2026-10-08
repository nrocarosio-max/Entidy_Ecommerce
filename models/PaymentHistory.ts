import mongoose, { Schema, models } from "mongoose";

const PaymentHistorySchema = new Schema(
 {
  paymentId: {
   type: Schema.Types.ObjectId,
   ref: "Payment",
   required: true,
   index: true,
  },

  fromStatus: {
   type: String,
   enum: ["PENDING", "AUTHORIZED", "PAID", "FAILED", "REFUNDED", "PARTIALLY_REFUNDED", "CANCELLED"],
   required: true,
  },

  toStatus: {
   type: String,
   enum: ["PENDING", "AUTHORIZED", "PAID", "FAILED", "REFUNDED", "PARTIALLY_REFUNDED", "CANCELLED"],
   required: true,
  },

  fromReconciliationStatus: {
   type: String,
   enum: ["PENDING", "RECONCILED", "DISPUTED"],
   required: true,
  },

  toReconciliationStatus: {
   type: String,
   enum: ["PENDING", "RECONCILED", "DISPUTED"],
   required: true,
  },

  changedBy: {
   type: Schema.Types.ObjectId,
   ref: "User",
   default: null,
  },

  note: {
   type: String,
   default: "",
   trim: true,
  },
 },
 {
  timestamps: true,
 },
);

PaymentHistorySchema.index({
 paymentId: 1,
 createdAt: -1,
});

export const PaymentHistory = models.PaymentHistory || mongoose.model("PaymentHistory", PaymentHistorySchema);
