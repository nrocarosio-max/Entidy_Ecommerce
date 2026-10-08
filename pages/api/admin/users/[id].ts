import type { NextApiRequest, NextApiResponse } from "next";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

import { connectDB } from "~/lib/mongodb";
import { User } from "~/models/User";
import { Role } from "~/models/Role";
import { Store } from "~/models/Store";
import { requireSuperAdmin } from "~/lib/permissions";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
 try {
  await requireSuperAdmin(req);
  await connectDB();

  const { id } = req.query;

  if (typeof id !== "string" || !mongoose.Types.ObjectId.isValid(id)) {
   return res.status(400).json({
    success: false,
    message: "Invalid user ID.",
   });
  }

  const userId = new mongoose.Types.ObjectId(id);

  /*
   * GET USER
   */
  if (req.method === "GET") {
   const user = await User.findById(userId)
    .select("-passwordHash")
    .populate("roleId", "name code description permissions isActive")
    .populate("storeId", "name slug isActive")
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

  /*
   * PATCH USER
   */
  if (req.method === "PATCH") {
   const { name, email, phone, password, roleId, storeId, isActive } = req.body;

   const user = await User.findById(userId);

   if (!user) {
    return res.status(404).json({
     success: false,
     message: "User not found.",
    });
   }

   /*
    * Prevent changing the currently logged-in
    * SUPER_ADMIN into another role.
    *
    * More importantly, do not allow the system
    * admin account to lose SUPER_ADMIN access
    * accidentally.
    */
   const currentRole = await Role.findById(user.roleId);

   if (!currentRole) {
    return res.status(400).json({
     success: false,
     message: "Current user role not found.",
    });
   }

   /*
    * Update name
    */
   if (name !== undefined) {
    const normalizedName = String(name).trim();

    if (!normalizedName) {
     return res.status(400).json({
      success: false,
      message: "Name cannot be empty.",
     });
    }

    user.name = normalizedName;
   }

   /*
    * Update email
    */
   if (email !== undefined) {
    const normalizedEmail = String(email).trim().toLowerCase();

    if (!normalizedEmail) {
     return res.status(400).json({
      success: false,
      message: "Email cannot be empty.",
     });
    }

    const existingUser = await User.findOne({
     email: normalizedEmail,
     _id: {
      $ne: userId,
     },
    });

    if (existingUser) {
     return res.status(409).json({
      success: false,
      message: "A user with this email already exists.",
     });
    }

    user.email = normalizedEmail;
   }

   /*
    * Update phone
    */
   if (phone !== undefined) {
    user.phone = String(phone).trim();
   }

   /*
    * Update password
    */
   if (password !== undefined) {
    const normalizedPassword = String(password);

    if (normalizedPassword.length < 8) {
     return res.status(400).json({
      success: false,
      message: "Password must be at least 8 characters.",
     });
    }

    user.passwordHash = await bcrypt.hash(normalizedPassword, 12);
   }

   /*
    * Update role
    */
   let finalRole = currentRole;

   if (roleId !== undefined) {
    const newRole = await Role.findById(roleId);

    if (!newRole) {
     return res.status(404).json({
      success: false,
      message: "Role not found.",
     });
    }

    if (!newRole.isActive) {
     return res.status(400).json({
      success: false,
      message: "This role is inactive.",
     });
    }

    /*
     * Do not allow the last/current
     * SUPER_ADMIN account to accidentally
     * lose SUPER_ADMIN role.
     */
    if (currentRole.code === "SUPER_ADMIN" && newRole.code !== "SUPER_ADMIN") {
     const superAdminCount = await User.countDocuments({
      roleId: currentRole._id,
      isActive: true,
     });

     if (superAdminCount <= 1) {
      return res.status(400).json({
       success: false,
       message: "Cannot change the last active SUPER_ADMIN.",
      });
     }
    }

    user.roleId = newRole._id;
    finalRole = newRole;
   }

   /*
    * Determine final store
    */
   if (finalRole.code === "SUPER_ADMIN") {
    /*
     * SUPER_ADMIN must not belong
     * to any store.
     */
    if (storeId !== undefined && storeId !== null && storeId !== "") {
     return res.status(400).json({
      success: false,
      message: "SUPER_ADMIN cannot be assigned to a store.",
     });
    }

    user.storeId = null;
   } else {
    /*
     * Non-SUPER_ADMIN must have a store.
     */
    const finalStoreId = storeId !== undefined ? storeId : user.storeId;

    if (!finalStoreId) {
     return res.status(400).json({
      success: false,
      message: "storeId is required for this role.",
     });
    }

    const store = await Store.findById(finalStoreId);

    if (!store) {
     return res.status(404).json({
      success: false,
      message: "Store not found.",
     });
    }

    if (!store.isActive) {
     return res.status(400).json({
      success: false,
      message: "Cannot assign a user to an inactive store.",
     });
    }

    user.storeId = store._id;
   }

   /*
    * Update active status
    */
   if (isActive !== undefined) {
    /*
     * Do not allow disabling the last
     * active SUPER_ADMIN.
     */
    if (isActive === false && finalRole.code === "SUPER_ADMIN") {
     const superAdminCount = await User.countDocuments({
      roleId: finalRole._id,
      isActive: true,
      _id: {
       $ne: userId,
      },
     });

     if (superAdminCount === 0) {
      return res.status(400).json({
       success: false,
       message: "Cannot disable the last active SUPER_ADMIN.",
      });
     }
    }

    user.isActive = Boolean(isActive);
   }

   await user.save();

   /*
    * Return updated user
    */
   const updatedUser = await User.findById(user._id)
    .select("-passwordHash")
    .populate("roleId", "name code description permissions isActive")
    .populate("storeId", "name slug isActive")
    .lean();

   return res.status(200).json({
    success: true,
    message: "User updated successfully.",
    user: updatedUser,
   });
  }

  /*
   * DELETE USER
   *
   * Soft delete:
   * isActive = false
   */
  if (req.method === "DELETE") {
   const user = await User.findById(userId);

   if (!user) {
    return res.status(404).json({
     success: false,
     message: "User not found.",
    });
   }

   const role = await Role.findById(user.roleId);

   if (!role) {
    return res.status(400).json({
     success: false,
     message: "User role not found.",
    });
   }

   /*
    * Never allow deleting the last
    * active SUPER_ADMIN.
    */
   if (role.code === "SUPER_ADMIN") {
    const superAdminCount = await User.countDocuments({
     roleId: role._id,
     isActive: true,
    });

    if (superAdminCount <= 1) {
     return res.status(400).json({
      success: false,
      message: "Cannot disable the last active SUPER_ADMIN.",
     });
    }
   }

   user.isActive = false;

   await user.save();

   return res.status(200).json({
    success: true,
    message: "User disabled successfully.",
   });
  }

  res.setHeader("Allow", ["GET", "PATCH", "DELETE"]);

  return res.status(405).json({
   success: false,
   message: `Method ${req.method} not allowed.`,
  });
 } catch (error) {
  console.error("ADMIN USER DETAIL API ERROR:", error);

  if (error instanceof Error) {
   if (error.message === "UNAUTHORIZED") {
    return res.status(401).json({
     success: false,
     message: "Authentication required.",
    });
   }

   if (error.message === "FORBIDDEN") {
    return res.status(403).json({
     success: false,
     message: "Only SUPER_ADMIN can manage users.",
    });
   }
  }

  return res.status(500).json({
   success: false,
   message: "Internal server error.",
  });
 }
}
