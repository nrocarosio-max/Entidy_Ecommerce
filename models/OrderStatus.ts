import mongoose, { Schema, models } from "mongoose";

const OrderStatusSchema = new Schema(
 {
  storeId: {
   type: Schema.Types.ObjectId,
   ref: "Store",
   required: true,
   index: true,
  },

  name: {
   type: String,
   required: true,
   trim: true,
  },

  code: {
   type: String,
   required: true,
   uppercase: true,
   trim: true,
  },

  description: {
   type: String,
   default: "",
   trim: true,
  },

  color: {
   type: String,
   default: "#6B7280",
   trim: true,
  },

  icon: {
   type: String,
   default: "",
   trim: true,
  },

  sortOrder: {
   type: Number,
   default: 0,
  },

  isActive: {
   type: Boolean,
   default: true,
  },

  isInitial: {
   type: Boolean,
   default: false,
  },

  isFinal: {
   type: Boolean,
   default: false,
  },

  nextStatusIds: [
   {
    type: Schema.Types.ObjectId,
    ref: "OrderStatus",
   },
  ],
 },
 {
  timestamps: true,
 },
);

OrderStatusSchema.index({ storeId: 1, code: 1 }, { unique: true });

OrderStatusSchema.index({
 storeId: 1,
 sortOrder: 1,
});

export const OrderStatus = models.OrderStatus || mongoose.model("OrderStatus", OrderStatusSchema);
