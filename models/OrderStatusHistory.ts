import mongoose, { Schema, models } from "mongoose";

const OrderStatusHistorySchema = new Schema(
 {
  orderId: {
   type: Schema.Types.ObjectId,
   ref: "Order",
   required: true,
   index: true,
  },

  fromStatusId: {
   type: Schema.Types.ObjectId,
   ref: "OrderStatus",
   required: true,
  },

  toStatusId: {
   type: Schema.Types.ObjectId,
   ref: "OrderStatus",
   required: true,
  },

  /*
   * Keep status names as snapshots.
   * This preserves the historical value even if
   * the OrderStatus name is changed later.
   */
  fromStatusName: {
   type: String,
   required: true,
   trim: true,
  },

  toStatusName: {
   type: String,
   required: true,
   trim: true,
  },

  changedBy: {
   type: Schema.Types.ObjectId,
   ref: "User",
   required: true,
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

OrderStatusHistorySchema.index({
 orderId: 1,
 createdAt: -1,
});

export const OrderStatusHistory = models.OrderStatusHistory || mongoose.model("OrderStatusHistory", OrderStatusHistorySchema);
