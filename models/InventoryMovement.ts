import mongoose, { Schema, models } from "mongoose";

const InventoryMovementSchema = new Schema(
 {
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

  type: {
   type: String,
   enum: ["STOCK_IN", "STOCK_OUT", "ADJUSTMENT", "ORDER", "RETURN"],
   required: true,
  },

  quantity: {
   type: Number,
   required: true,
  },

  beforeQuantity: {
   type: Number,
   required: true,
   min: 0,
  },

  afterQuantity: {
   type: Number,
   required: true,
   min: 0,
  },

  reason: {
   type: String,
   default: "",
   trim: true,
  },

  referenceId: {
   type: String,
   default: "",
   trim: true,
  },

  createdBy: {
   type: Schema.Types.ObjectId,
   ref: "User",
   required: true,
  },
 },
 {
  timestamps: true,
 },
);

InventoryMovementSchema.index({
 storeId: 1,
 productId: 1,
 createdAt: -1,
});

export const InventoryMovement = models.InventoryMovement || mongoose.model("InventoryMovement", InventoryMovementSchema);
