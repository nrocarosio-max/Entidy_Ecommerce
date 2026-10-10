import mongoose, { Schema, models } from "mongoose";

const AffiliatePaymentSchema = new Schema(
 {
  affiliateId: {
   type: Schema.Types.ObjectId,
   ref: "Affiliate",
   required: true,
   index: true,
  },

  affiliateStoreId: {
   type: Schema.Types.ObjectId,
   ref: "AffiliateStore",
   required: true,
   index: true,
  },

  storeId: {
   type: Schema.Types.ObjectId,
   ref: "Store",
   required: true,
   index: true,
  },

  amount: {
   type: Number,
   required: true,
   min: 1,
  },

  currency: {
   type: String,
   enum: ["VND"],
   default: "VND",
   required: true,
  },

  paymentDate: {
   type: Date,
   required: true,
   default: Date.now,
  },

  paymentMethod: {
   type: String,
   enum: ["BANK_TRANSFER", "CASH", "E_WALLET", "OTHER"],
   default: "BANK_TRANSFER",
   required: true,
  },

  transactionReference: {
   type: String,
   default: "",
   trim: true,
  },

  note: {
   type: String,
   default: "",
   trim: true,
  },

  recordedBy: {
   type: Schema.Types.ObjectId,
   ref: "User",
   required: true,
  },

  updatedBy: {
   type: Schema.Types.ObjectId,
   ref: "User",
   default: null,
  },

  isDeleted: {
   type: Boolean,
   default: false,
   index: true,
  },

  deletedAt: {
   type: Date,
   default: null,
  },
 },
 {
  timestamps: true,
 },
);

AffiliatePaymentSchema.index({
 affiliateId: 1,
 paymentDate: -1,
});

AffiliatePaymentSchema.index({
 affiliateId: 1,
 storeId: 1,
 paymentDate: -1,
});

AffiliatePaymentSchema.index({
 storeId: 1,
 isDeleted: 1,
 paymentDate: -1,
});

export const AffiliatePayment = models.AffiliatePayment || mongoose.model("AffiliatePayment", AffiliatePaymentSchema);
