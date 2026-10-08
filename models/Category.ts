import mongoose, { Schema, models } from "mongoose";

const CategorySchema = new Schema(
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

  image: {
   type: String,
   default: "",
   trim: true,
  },

  parentId: {
   type: Schema.Types.ObjectId,
   ref: "Category",
   default: null,
  },

  sortOrder: {
   type: Number,
   default: 0,
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
 * A category name must be unique within a store.
 */
CategorySchema.index(
 {
  storeId: 1,
  name: 1,
 },
 {
  unique: true,
 },
);

/*
 * A category slug must be unique within a store.
 */
CategorySchema.index(
 {
  storeId: 1,
  slug: 1,
 },
 {
  unique: true,
 },
);

export const Category = models.Category || mongoose.model("Category", CategorySchema);
