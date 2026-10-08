import mongoose, { Schema, models } from "mongoose";

const OrderItemSchema = new Schema(
 {
  orderId: {
   type: Schema.Types.ObjectId,
   ref: "Order",
   required: true,
   index: true,
  },

  productId: {
   type: Schema.Types.ObjectId,
   ref: "Product",
   required: true,
   index: true,
  },

  /*
   * Product snapshot
   *
   * Keeps product information
   * exactly as it was when purchased.
   */
  productSnapshot: {
   name: {
    type: String,
    required: true,
    trim: true,
   },

   sku: {
    type: String,
    required: true,
    trim: true,
   },

   slug: {
    type: String,
    default: "",
    trim: true,
   },

   image: {
    type: String,
    default: "",
    trim: true,
   },
  },

  quantity: {
   type: Number,
   required: true,
   min: 1,
  },

  /*
   * Price at the moment of purchase.
   *
   * Never use Product.price later
   * to recalculate an old order.
   */
  price: {
   type: Number,
   required: true,
   min: 0,
  },

  subtotal: {
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
 },
 {
  timestamps: true,
 },
);

OrderItemSchema.index({
 orderId: 1,
});

OrderItemSchema.index({
 productId: 1,
});

export const OrderItem = models.OrderItem || mongoose.model("OrderItem", OrderItemSchema);
