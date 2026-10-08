import mongoose, { Schema, models } from "mongoose";

const UserSchema = new Schema(
 {
  name: {
   type: String,
   required: true,
   trim: true,
  },

  email: {
   type: String,
   required: true,
   unique: true,
   lowercase: true,
   trim: true,
  },

  phone: {
   type: String,
   default: "",
   trim: true,
  },

  passwordHash: {
   type: String,
   required: true,
  },

  roleId: {
   type: Schema.Types.ObjectId,
   ref: "Role",
   required: true,
  },

  storeId: {
   type: Schema.Types.ObjectId,
   ref: "Store",
   default: null,
  },

  isActive: {
   type: Boolean,
   default: true,
  },

  lastLoginAt: {
   type: Date,
   default: null,
  },
 },
 {
  timestamps: true,
 },
);

export const User = models.User || mongoose.model("User", UserSchema);
