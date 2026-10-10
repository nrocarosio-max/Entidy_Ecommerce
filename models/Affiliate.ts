import mongoose, { Schema, models } from "mongoose";

const AffiliateSchema = new Schema(
 {
  userId: {
   type: Schema.Types.ObjectId,
   ref: "User",
   required: true,
   unique: true,
   index: true,
  },

  code: {
   type: String,
   required: true,
   unique: true,
   uppercase: true,
   trim: true,
   index: true,
  },

  status: {
   type: String,
   enum: ["PENDING", "ACTIVE", "REJECTED", "SUSPENDED"],
   default: "PENDING",
   required: true,
   index: true,
  },

  paymentInfo: {
   type: String,
   default: "",
   trim: true,
  },

  note: {
   type: String,
   default: "",
   trim: true,
  },

  approvedBy: {
   type: Schema.Types.ObjectId,
   ref: "User",
   default: null,
  },

  approvedAt: {
   type: Date,
   default: null,
  },
 },
 {
  timestamps: true,
 },
);

export const Affiliate = models.Affiliate || mongoose.model("Affiliate", AffiliateSchema);
