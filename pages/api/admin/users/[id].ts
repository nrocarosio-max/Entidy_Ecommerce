import type { NextApiRequest, NextApiResponse } from "next";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";

import { connectDB } from "~/lib/mongodb";
import { requireSuperAdmin } from "~/lib/permissions";

import { User } from "~/models/User";
import { Role } from "~/models/Role";
import { Store } from "~/models/Store";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
 try {
  await connectDB();

  const currentUser = await requireSuperAdmin(req);

  const { id } = req.query;

  if (typeof id !== "string" || !mongoose.Types.ObjectId.isValid(id)) {
   return res.status(400).json({
    success: false,
    message: "Invalid user ID.",
   });
  }

  const userId = new mongoose.Types.ObjectId(id);

  /**
   * GET USER
   */
  if (req.method === "GET") {
   const user = await User.findById(userId)
    .select("_id name email phone roleId storeId isActive lastLoginAt createdAt updatedAt")
    .populate("roleId", "_id name code description permissions")
    .populate("storeId", "_id name slug isActive")
    .lean();

   if (!user) {
    return res.status(404).json({
     success: false,
     message: "User not found.",
    });
   }

   return res.status(200).json({
    success: true,
    user,
   });
  }

  /**
   * UPDATE USER
   */
  if (req.method === "PATCH") {
   const user = await User.findById(userId);

   if (!user) {
    return res.status(404).json({
     success: false,
     message: "User not found.",
    });
   }

   const { name, email, phone, password, roleId, storeId, isActive } = req.body;

   if (name !== undefined) {
    const newName = String(name).trim();

    if (!newName) {
     return res.status(400).json({
      success: false,
      message: "Name is required.",
     });
    }

    user.name = newName;
   }

   if (email !== undefined) {
    const newEmail = String(email).trim().toLowerCase();

    if (!newEmail) {
     return res.status(400).json({
      success: false,
      message: "Email is required.",
     });
    }

    const existingUser = await User.findOne({
     email: newEmail,
     _id: { $ne: userId },
    }).lean();

    if (existingUser) {
     return res.status(409).json({
      success: false,
      message: "Another user already uses this email.",
     });
    }

    user.email = newEmail;
   }

   if (phone !== undefined) {
    user.phone = String(phone || "").trim();
   }

   if (roleId !== undefined) {
    if (!roleId || !mongoose.Types.ObjectId.isValid(roleId)) {
     return res.status(400).json({
      success: false,
      message: "Invalid role ID.",
     });
    }

    const role = await Role.findById(roleId).lean();

    if (!role || !role.isActive) {
     return res.status(400).json({
      success: false,
      message: "Role not found or inactive.",
     });
    }

    if (role.code === "SUPER_ADMIN") {
     return res.status(403).json({
      success: false,
      message: "You cannot assign SUPER_ADMIN role.",
     });
    }

    user.roleId = role._id;
   }

   if (storeId !== undefined) {
    if (!storeId || !mongoose.Types.ObjectId.isValid(storeId)) {
     return res.status(400).json({
      success: false,
      message: "Valid store is required.",
     });
    }

    const store = await Store.findById(storeId).lean();

    if (!store) {
     return res.status(404).json({
      success: false,
      message: "Store not found.",
     });
    }

    if (!store.isActive) {
     return res.status(400).json({
      success: false,
      message: "Selected store is inactive.",
     });
    }

    user.storeId = store._id;
   }

   if (password !== undefined && String(password).trim()) {
    if (String(password).length < 6) {
     return res.status(400).json({
      success: false,
      message: "Password must be at least 6 characters.",
     });
    }

    user.passwordHash = await bcrypt.hash(String(password), 12);
   }

   if (isActive !== undefined) {
    if (user._id.toString() === currentUser.id) {
     return res.status(400).json({
      success: false,
      message: "You cannot change your own status.",
     });
    }

    user.isActive = Boolean(isActive);
   }

   await user.save();

   const updatedUser = await User.findById(user._id)
    .select("_id name email phone roleId storeId isActive lastLoginAt createdAt updatedAt")
    .populate("roleId", "_id name code description")
    .populate("storeId", "_id name slug isActive")
    .lean();

   return res.status(200).json({
    success: true,
    message: "User updated successfully.",
    user: updatedUser,
   });
  }

  /**
   * DELETE USER
   */
  if (req.method === "DELETE") {
   if (id === currentUser.id) {
    return res.status(400).json({
     success: false,
     message: "You cannot delete your own account.",
    });
   }

   const user = await User.findById(userId);

   if (!user) {
    return res.status(404).json({
     success: false,
     message: "User not found.",
    });
   }

   await User.findByIdAndDelete(userId);

   return res.status(200).json({
    success: true,
    message: "User deleted successfully.",
   });
  }

  res.setHeader("Allow", ["GET", "PATCH", "DELETE"]);

  return res.status(405).json({
   success: false,
   message: `Method ${req.method} not allowed.`,
  });
 } catch (error: any) {
  console.error("User detail API error:", error);

  if (error?.message === "UNAUTHORIZED") {
   return res.status(401).json({
    success: false,
    message: "Unauthorized.",
   });
  }

  if (error?.message === "FORBIDDEN") {
   return res.status(403).json({
    success: false,
    message: "Only SUPER_ADMIN can manage users.",
   });
  }

  if (error?.code === 11000) {
   return res.status(409).json({
    success: false,
    message: "A user with this email already exists.",
   });
  }

  return res.status(500).json({
   success: false,
   message: error?.message || "Internal server error.",
  });
 }
}
