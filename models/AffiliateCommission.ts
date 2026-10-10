import mongoose, { Schema, models } from "mongoose";

const AffiliateCommissionSchema = new Schema(
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
  },

  storeId: {
   type: Schema.Types.ObjectId,
   ref: "Store",
   required: true,
   index: true,
  },

  orderId: {
   type: Schema.Types.ObjectId,
   ref: "Order",
   required: true,
  },

  orderItemId: {
   type: Schema.Types.ObjectId,
   ref: "OrderItem",
   required: true,
  },

  productId: {
   type: Schema.Types.ObjectId,
   ref: "Product",
   required: true,
   index: true,
  },

  productName: {
   type: String,
   default: "",
   trim: true,
  },

  quantity: {
   type: Number,
   required: true,
   min: 1,
  },

  orderNumber: {
   type: String,
   default: "",
   trim: true,
  },

  // Commission rate captured when the commission is created.
  commissionRate: {
   type: Number,
   required: true,
   min: 0,
   max: 100,
  },

  // Product subtotal used to calculate this commission.
  commissionBase: {
   type: Number,
   required: true,
   min: 0,
  },

  // Final commission amount captured at creation time.
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
   enum: ["PENDING", "APPROVED", "PAID", "REVERSED"],
   default: "PENDING",
   required: true,
   index: true,
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

  paidAt: {
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

// Prevent duplicate commission records for the same order item.
AffiliateCommissionSchema.index({ orderId: 1, orderItemId: 1 }, { unique: true });

AffiliateCommissionSchema.index({
 affiliateId: 1,
 storeId: 1,
 createdAt: -1,
});

AffiliateCommissionSchema.index({
 affiliateId: 1,
 status: 1,
 createdAt: -1,
});

export const AffiliateCommission = models.AffiliateCommission || mongoose.model("AffiliateCommission", AffiliateCommissionSchema);
