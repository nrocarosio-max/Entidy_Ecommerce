import mongoose, { Schema, models } from "mongoose";

const BrandSchema = new Schema(
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

  slug: {
   type: String,
   required: true,
   trim: true,
  },

  description: {
   type: String,
   default: "",
   trim: true,
  },

  logo: {
   type: String,
   default: "",
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

/*
 * A brand name must be unique within a store.
 */
BrandSchema.index(
 {
  storeId: 1,
  name: 1,
 },
 {
  unique: true,
 },
);

/*
 * A brand slug must be unique within a store.
 */
BrandSchema.index(
 {
  storeId: 1,
  slug: 1,
 },
 {
  unique: true,
 },
);

export const Brand = models.Brand || mongoose.model("Brand", BrandSchema);
