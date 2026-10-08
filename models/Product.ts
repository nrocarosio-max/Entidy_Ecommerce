import mongoose, { Schema, models } from "mongoose";

const ProductSchema = new Schema(
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

  sku: {
   type: String,
   required: true,
   trim: true,
   uppercase: true,
  },

  description: {
   type: String,
   default: "",
   trim: true,
  },

  categoryId: {
   type: Schema.Types.ObjectId,
   ref: "Category",
   default: null,
  },

  brandId: {
   type: Schema.Types.ObjectId,
   ref: "Brand",
   default: null,
  },

  price: {
   type: Number,
   required: true,
   min: 0,
  },

  compareAtPrice: {
   type: Number,
   default: null,
   min: 0,
  },

  costPrice: {
   type: Number,
   default: null,
   min: 0,
  },

  currency: {
   type: String,
   required: true,
   uppercase: true,
   trim: true,
  },

  /*
   * Product images
   */
  images: {
   type: [String],
   default: [],
  },

  /*
   * Product videos
   */
  videos: {
   type: [String],
   default: [],
  },

  quantity: {
   type: Number,
   default: 0,
   min: 0,
  },

  lowStockThreshold: {
   type: Number,
   default: 5,
   min: 0,
  },

  status: {
   type: String,
   enum: ["DRAFT", "ACTIVE", "INACTIVE", "OUT_OF_STOCK"],
   default: "DRAFT",
  },

  isFeatured: {
   type: Boolean,
   default: false,
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
 * SKU must be unique inside a store.
 */
ProductSchema.index(
 {
  storeId: 1,
  sku: 1,
 },
 {
  unique: true,
 },
);

/*
 * Slug must be unique inside a store.
 */
ProductSchema.index(
 {
  storeId: 1,
  slug: 1,
 },
 {
  unique: true,
 },
);

export const Product = models.Product || mongoose.model("Product", ProductSchema);
