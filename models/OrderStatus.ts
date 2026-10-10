import mongoose, { Schema, models } from "mongoose";

const OrderStatusSchema = new Schema(
 {
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
   min: 0,
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

// Status codes are unique across the entire platform.
OrderStatusSchema.index({ code: 1 }, { unique: true });

// Used when sorting the global status list.
OrderStatusSchema.index({ sortOrder: 1 });

export const OrderStatus = models.OrderStatus || mongoose.model("OrderStatus", OrderStatusSchema);
