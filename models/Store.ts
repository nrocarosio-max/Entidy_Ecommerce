import mongoose, { Schema, models } from "mongoose";

const StoreSchema = new Schema(
 {
  name: {
   type: String,
   required: true,
   trim: true,
  },

  slug: {
   type: String,
   required: true,
   unique: true,
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

  email: {
   type: String,
   default: "",
   trim: true,
   lowercase: true,
  },

  phone: {
   type: String,
   default: "",
   trim: true,
  },

  secondaryPhone: {
   type: String,
   default: "",
   trim: true,
  },

  address: {
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

export const Store = models.Store || mongoose.model("Store", StoreSchema);
