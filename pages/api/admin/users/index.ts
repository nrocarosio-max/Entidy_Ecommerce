import type { NextApiRequest, NextApiResponse } from "next";
import bcrypt from "bcryptjs";

import { connectDB } from "~/lib/mongodb";
import { requireSuperAdmin } from "~/lib/permissions";

import { User } from "~/models/User";
import { Role } from "~/models/Role";
import { Store } from "~/models/Store";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
 try {
  await connectDB();

  // Only SUPER_ADMIN can manage users
  await requireSuperAdmin(req);

  /*
   * ============================================================
   * GET USERS
   * ============================================================
   */
  if (req.method === "GET") {
   const { search = "", roleId = "", storeId = "", isActive = "", page = "1", limit = "20" } = req.query;

   const currentPage = Math.max(Number(page) || 1, 1);
   const currentLimit = Math.min(Math.max(Number(limit) || 20, 1), 100);

   const filter: Record<string, any> = {};

   /*
    * Search by name, email or phone
    */
   if (typeof search === "string" && search.trim()) {
    const searchRegex = new RegExp(search.trim(), "i");

    filter.$or = [{ name: searchRegex }, { email: searchRegex }, { phone: searchRegex }];
   }

   /*
    * Filter by role
    */
   if (typeof roleId === "string" && roleId.trim()) {
    filter.roleId = roleId.trim();
   }

   /*
    * Filter by store
    */
   if (typeof storeId === "string" && storeId.trim()) {
    filter.storeId = storeId.trim();
   }

   /*
    * Filter by active status
    */
   if (typeof isActive === "string" && (isActive === "true" || isActive === "false")) {
    filter.isActive = isActive === "true";
   }

   const total = await User.countDocuments(filter);

   const users = await User.find(filter)
    .select("_id name email phone roleId storeId isActive lastLoginAt createdAt updatedAt")
    .populate({
     path: "roleId",
     select: "_id name code description permissions isActive",
    })
    .populate({
     path: "storeId",
     select: "_id name slug isActive",
    })
    .sort({ createdAt: -1 })
    .skip((currentPage - 1) * currentLimit)
    .limit(currentLimit)
    .lean();

   const totalPages = Math.max(Math.ceil(total / currentLimit), 1);

   return res.status(200).json({
    success: true,
    users,
    pagination: {
     page: currentPage,
     limit: currentLimit,
     total,
     totalPages,
    },
   });
  }

  /*
   * ============================================================
   * CREATE USER
   * ============================================================
   */
  if (req.method === "POST") {
   const { name, email, phone = "", password, roleId, storeId, isActive = true } = req.body;

   /*
    * Validate name
    */
   if (typeof name !== "string" || !name.trim()) {
    return res.status(400).json({
     success: false,
     message: "Name is required.",
    });
   }

   /*
    * Validate email
    */
   if (typeof email !== "string" || !email.trim()) {
    return res.status(400).json({
     success: false,
     message: "Email is required.",
    });
   }

   /*
    * Validate password
    */
   if (typeof password !== "string" || password.length < 6) {
    return res.status(400).json({
     success: false,
     message: "Password must be at least 6 characters.",
    });
   }

   /*
    * Validate role
    */
   if (typeof roleId !== "string" || !roleId.trim()) {
    return res.status(400).json({
     success: false,
     message: "Role is required.",
    });
   }

   /*
    * Validate store
    */
   if (typeof storeId !== "string" || !storeId.trim()) {
    return res.status(400).json({
     success: false,
     message: "Store is required.",
    });
   }

   const normalizedEmail = email.trim().toLowerCase();

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
    * Check role
    */
   const role = await Role.findById(roleId);

   if (!role) {
    return res.status(400).json({
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
    * Never allow creating another SUPER_ADMIN
    */
   if (role.code === "SUPER_ADMIN") {
    return res.status(403).json({
     success: false,
     message: "You cannot create a SUPER_ADMIN user.",
    });
   }

   /*
    * Check store
    */
   const store = await Store.findById(storeId);

   if (!store) {
    return res.status(400).json({
     success: false,
     message: "Store not found.",
    });
   }

   if (!store.isActive) {
    return res.status(400).json({
     success: false,
     message: "This store is inactive.",
    });
   }

   /*
    * Hash password
    */
   const passwordHash = await bcrypt.hash(password, 12);

   /*
    * Create user
    */
   const user = await User.create({
    name: name.trim(),
    email: normalizedEmail,
    phone: typeof phone === "string" ? phone.trim() : "",
    passwordHash,
    roleId: role._id,
    storeId: store._id,
    isActive: Boolean(isActive),
   });

   /*
    * Return user without passwordHash
    */
   const createdUser = await User.findById(user._id)
    .select("_id name email phone roleId storeId isActive lastLoginAt createdAt updatedAt")
    .populate({
     path: "roleId",
     select: "_id name code description permissions isActive",
    })
    .populate({
     path: "storeId",
     select: "_id name slug isActive",
    })
    .lean();

   return res.status(201).json({
    success: true,
    message: "User created successfully.",
    user: createdUser,
   });
  }

  /*
   * ============================================================
   * METHOD NOT ALLOWED
   * ============================================================
   */
  res.setHeader("Allow", ["GET", "POST"]);

  return res.status(405).json({
   success: false,
   message: `Method ${req.method} not allowed.`,
  });
 } catch (error: any) {
  console.error("Users API error:", error);

  /*
   * Authentication
   */
  if (error?.message === "UNAUTHORIZED") {
   return res.status(401).json({
    success: false,
    message: "Unauthorized.",
   });
  }

  /*
   * Authorization
   */
  if (error?.message === "FORBIDDEN") {
   return res.status(403).json({
    success: false,
    message: "Only SUPER_ADMIN can manage users.",
   });
  }

  /*
   * MongoDB duplicate key
   */
  if (error?.code === 11000) {
   return res.status(409).json({
    success: false,
    message: "A user with this email already exists.",
   });
  }

  /*
   * Mongoose validation
   */
  if (error?.name === "ValidationError") {
   return res.status(400).json({
    success: false,
    message: error.message,
   });
  }

  return res.status(500).json({
   success: false,
   message: error?.message || "Internal server error.",
  });
 }
}
