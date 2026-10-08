import mongoose, { Schema, models } from "mongoose";

const InventorySchema = new Schema(
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
   enum: ["IN", "OUT", "ADJUSTMENT"],
   required: true,
  },

  quantity: {
   type: Number,
   required: true,
  },

  quantityBefore: {
   type: Number,
   required: true,
   min: 0,
  },

  quantityAfter: {
   type: Number,
   required: true,
   min: 0,
  },

  note: {
   type: String,
   default: "",
   trim: true,
  },

  reference: {
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

InventorySchema.index({
 storeId: 1,
 productId: 1,
 createdAt: -1,
});

export const Inventory = models.Inventory || mongoose.model("Inventory", InventorySchema);
