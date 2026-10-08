import type { NextApiRequest, NextApiResponse } from "next";
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

  /*
   * GET USERS
   */
  if (req.method === "GET") {
   const users = await User.find({})
    .select("-passwordHash")
    .populate("roleId", "name code description permissions isActive")
    .populate("storeId", "name slug isActive")
    .sort({
     createdAt: -1,
    })
    .lean();

   return res.status(200).json({
    success: true,
    users,
   });
  }

  /*
   * CREATE USER
   */
  if (req.method === "POST") {
   const { name, email, phone, password, roleId, storeId, isActive } = req.body;

   /*
    * Validate basic fields
    */
   if (!name || !email || !password || !roleId) {
    return res.status(400).json({
     success: false,
     message: "Name, email, password and roleId are required.",
    });
   }

   const normalizedName = String(name).trim();

   const normalizedEmail = String(email).trim().toLowerCase();

   const normalizedPhone = phone ? String(phone).trim() : "";

   /*
    * Validate password
    */
   if (String(password).length < 8) {
    return res.status(400).json({
     success: false,
     message: "Password must be at least 8 characters.",
    });
   }

   /*
    * Check duplicate email
    */
   const existingUser = await User.findOne({
    email: normalizedEmail,
   });

   if (existingUser) {
    return res.status(409).json({
     success: false,
     message: "A user with this email already exists.",
    });
   }

   /*
    * Find role
    */
   const role = await Role.findById(roleId);

   if (!role) {
    return res.status(404).json({
     success: false,
     message: "Role not found.",
    });
   }

   if (!role.isActive) {
    return res.status(400).json({
     success: false,
     message: "This role is inactive.",
    });
   }

   /*
    * SUPER_ADMIN rules
    *
    * SUPER_ADMIN:
    * - does not belong to a store
    *
    * Other roles:
    * - must belong to a store
    */
   if (role.code === "SUPER_ADMIN") {
    if (storeId) {
     return res.status(400).json({
      success: false,
      message: "SUPER_ADMIN cannot be assigned to a store.",
     });
    }
   } else {
    if (!storeId) {
     return res.status(400).json({
      success: false,
      message: "storeId is required for this role.",
     });
    }

    /*
     * Check store
     */
    const store = await Store.findById(storeId);

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
   }

   /*
    * Hash password
    */
   const passwordHash = await bcrypt.hash(String(password), 12);

   /*
    * Create user
    */
   const user = await User.create({
    name: normalizedName,
    email: normalizedEmail,
    phone: normalizedPhone,
    passwordHash,
    roleId: role._id,
    storeId: storeId || null,
    isActive: isActive === undefined ? true : Boolean(isActive),
   });

   /*
    * Return user without passwordHash
    */
   const createdUser = await User.findById(user._id)
    .select("-passwordHash")
    .populate("roleId", "name code description permissions isActive")
    .populate("storeId", "name slug isActive")
    .lean();

   return res.status(201).json({
    success: true,
    message: "User created successfully.",
    user: createdUser,
   });
  }

  /*
   * Method not allowed
   */
  res.setHeader("Allow", ["GET", "POST"]);

  return res.status(405).json({
   success: false,
   message: `Method ${req.method} not allowed.`,
  });
 } catch (error) {
  console.error("ADMIN USERS API ERROR:", error);

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
