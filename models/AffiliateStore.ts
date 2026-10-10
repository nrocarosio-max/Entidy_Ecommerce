import mongoose, { Schema, models } from "mongoose";

const AffiliateStoreSchema = new Schema(
 {
  affiliateId: {
   type: Schema.Types.ObjectId,
   ref: "Affiliate",
   required: true,
   index: true,
  },

  storeId: {
   type: Schema.Types.ObjectId,
   ref: "Store",
   required: true,
   index: true,
  },

  commissionRate: {
   type: Number,
   required: true,
   default: 5,
   min: 0,
   max: 100,
  },

  status: {
   type: String,
   enum: ["ACTIVE", "INACTIVE", "SUSPENDED"],
   default: "ACTIVE",
   required: true,
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

AffiliateStoreSchema.index({ affiliateId: 1, storeId: 1 }, { unique: true });

export const AffiliateStore = models.AffiliateStore || mongoose.model("AffiliateStore", AffiliateStoreSchema);
