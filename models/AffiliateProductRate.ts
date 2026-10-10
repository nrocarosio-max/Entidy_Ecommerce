import mongoose, { Schema, models } from "mongoose";

const AffiliateProductRateSchema = new Schema(
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

  productId: {
   type: Schema.Types.ObjectId,
   ref: "Product",
   required: true,
   index: true,
  },

  commissionRate: {
   type: Number,
   required: true,
   min: 0,
   max: 100,
  },

  status: {
   type: String,
   enum: ["ACTIVE", "INACTIVE"],
   default: "ACTIVE",
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
 { timestamps: true },
);

// Mỗi Affiliate chỉ có một cấu hình cho mỗi sản phẩm tại mỗi cửa hàng.
AffiliateProductRateSchema.index({ affiliateId: 1, storeId: 1, productId: 1 }, { unique: true });

AffiliateProductRateSchema.index({
 affiliateId: 1,
 storeId: 1,
 status: 1,
});

export const AffiliateProductRate = models.AffiliateProductRate || mongoose.model("AffiliateProductRate", AffiliateProductRateSchema);
