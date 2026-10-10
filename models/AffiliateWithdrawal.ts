import mongoose, { Schema, models } from "mongoose";

const AffiliateWithdrawalSchema = new Schema(
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
  status: {
   type: String,
   enum: ["PENDING", "APPROVED", "REJECTED", "PAID"],
   default: "PENDING",
   required: true,
   index: true,
  },
  paymentMethod: {
   type: String,
   default: "",
   trim: true,
  },
  paymentDetails: {
   type: String,
   default: "",
   trim: true,
  },
  note: {
   type: String,
   default: "",
   trim: true,
  },
  reviewedBy: {
   type: Schema.Types.ObjectId,
   ref: "User",
   default: null,
  },
  reviewedAt: {
   type: Date,
   default: null,
  },
  paidBy: {
   type: Schema.Types.ObjectId,
   ref: "User",
   default: null,
  },
  paidAt: {
   type: Date,
   default: null,
  },
  rejectionReason: {
   type: String,
   default: "",
   trim: true,
  },
 },
 {
  timestamps: true,
 },
);

AffiliateWithdrawalSchema.index({
 affiliateId: 1,
 status: 1,
 createdAt: -1,
});

AffiliateWithdrawalSchema.index({
 affiliateStoreId: 1,
 status: 1,
 createdAt: -1,
});

AffiliateWithdrawalSchema.index({
 storeId: 1,
 status: 1,
 createdAt: -1,
});

export const AffiliateWithdrawal = models.AffiliateWithdrawal || mongoose.model("AffiliateWithdrawal", AffiliateWithdrawalSchema);
