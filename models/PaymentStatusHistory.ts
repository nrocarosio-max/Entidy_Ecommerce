import mongoose, { Document, Model, Schema, Types } from "mongoose";

export type PaymentStatus = "PENDING" | "PAID" | "FAILED" | "REFUNDED";

export interface IPaymentStatusHistory extends Document {
 orderId: Types.ObjectId;
 storeId: Types.ObjectId;
 previousStatus: PaymentStatus;
 newStatus: PaymentStatus;
 changedBy: Types.ObjectId | null;
 note: string;
 createdAt: Date;
 updatedAt: Date;
}

const PaymentStatusHistorySchema = new Schema<IPaymentStatusHistory>(
 {
  orderId: {
   type: Schema.Types.ObjectId,
   ref: "Order",
   required: true,
   index: true,
  },

  storeId: {
   type: Schema.Types.ObjectId,
   ref: "Store",
   required: true,
   index: true,
  },

  previousStatus: {
   type: String,
   enum: ["PENDING", "PAID", "FAILED", "REFUNDED"],
   required: true,
  },

  newStatus: {
   type: String,
   enum: ["PENDING", "PAID", "FAILED", "REFUNDED"],
   required: true,
  },

  changedBy: {
   type: Schema.Types.ObjectId,
   ref: "User",
   default: null,
  },

  note: {
   type: String,
   default: "",
   trim: true,
   maxlength: 1000,
  },
 },
 {
  timestamps: true,
 },
);

PaymentStatusHistorySchema.index({
 orderId: 1,
 createdAt: -1,
});

export const PaymentStatusHistory: Model<IPaymentStatusHistory> =
 (mongoose.models.PaymentStatusHistory as Model<IPaymentStatusHistory> | undefined) ||
 mongoose.model<IPaymentStatusHistory>("PaymentStatusHistory", PaymentStatusHistorySchema);
