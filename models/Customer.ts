import mongoose, { Schema, models } from "mongoose";

const CustomerSchema = new Schema(
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
  nameNormalized: {
   type: String,
   required: true,
   index: true,
   trim: true,
  },
  phone: {
   type: String,
   required: true,
   trim: true,
  },

  isActive: {
   type: Boolean,
   default: true,
  },
 },
 {
  timestamps: true,
 },
);

CustomerSchema.index({
 storeId: 1,
 phone: 1,
});

export const Customer = models.Customer || mongoose.model("Customer", CustomerSchema);
