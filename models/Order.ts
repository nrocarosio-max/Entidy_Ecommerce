import mongoose, { Schema, models } from "mongoose";

const OrderSchema = new Schema(
 {
  storeId: {
   type: Schema.Types.ObjectId,
   ref: "Store",
   required: true,
   index: true,
  },

  customerId: {
   type: Schema.Types.ObjectId,
   ref: "Customer",
   required: true,
   index: true,
  },

  orderNumber: {
   type: String,
   required: true,
   trim: true,
  },

  /*
   * Order workflow status.
   * The actual status is stored in OrderStatus collection.
   */
  statusId: {
   type: Schema.Types.ObjectId,
   ref: "OrderStatus",
   required: true,
   index: true,
  },

  customerSnapshot: {
   name: {
    type: String,
    required: true,
    trim: true,
   },

   phone: {
    type: String,
    required: true,
    trim: true,
   },

   email: {
    type: String,
    default: "",
    trim: true,
   },
  },

  shippingAddress: {
   province: {
    type: String,
    default: "",
    trim: true,
   },

   district: {
    type: String,
    default: "",
    trim: true,
   },

   ward: {
    type: String,
    default: "",
    trim: true,
   },

   address: {
    type: String,
    required: true,
    trim: true,
   },

   postalCode: {
    type: String,
    default: "",
    trim: true,
   },
  },

  subtotal: {
   type: Number,
   required: true,
   min: 0,
  },

  shippingFee: {
   type: Number,
   default: 0,
   min: 0,
  },

  discount: {
   type: Number,
   default: 0,
   min: 0,
  },

  total: {
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

  paymentMethod: {
   type: String,
   enum: ["COD", "BANK_TRANSFER", "CREDIT_CARD", "DEBIT_CARD", "OTHER"],
   default: "COD",
  },

  paymentStatus: {
   type: String,
   enum: ["PENDING", "PAID", "FAILED", "REFUNDED"],
   default: "PENDING",
  },

  note: {
   type: String,
   default: "",
   trim: true,
  },

  shippingMethod: {
   type: String,
   default: "",
   trim: true,
  },

  trackingNumber: {
   type: String,
   default: "",
   trim: true,
  },

  createdBy: {
   type: Schema.Types.ObjectId,
   ref: "User",
   default: null,
  },
 },
 {
  timestamps: true,
 },
);

OrderSchema.index({ storeId: 1, orderNumber: 1 }, { unique: true });

OrderSchema.index({
 storeId: 1,
 customerId: 1,
 createdAt: -1,
});

OrderSchema.index({
 storeId: 1,
 statusId: 1,
 createdAt: -1,
});

export const Order = models.Order || mongoose.model("Order", OrderSchema);
