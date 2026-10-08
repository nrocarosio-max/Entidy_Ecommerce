import mongoose, { Schema, models } from "mongoose";

const RoleSchema = new Schema(
 {
  name: {
   type: String,
   required: true,
   trim: true,
  },

  code: {
   type: String,
   required: true,
   unique: true,
   uppercase: true,
   trim: true,
  },

  description: {
   type: String,
   default: "",
   trim: true,
  },

  permissions: {
   type: [String],
   default: [],
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

export const Role = models.Role || mongoose.model("Role", RoleSchema);
