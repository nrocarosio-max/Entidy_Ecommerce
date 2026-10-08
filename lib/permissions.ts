import type { NextApiRequest } from "next";
import { getToken } from "next-auth/jwt";

import { connectDB } from "~/lib/mongodb";
import { User } from "~/models/User";
import { Role } from "~/models/Role";

import type { RoleCode } from "~/types/role";

/**
 * Get the currently authenticated user.
 *
 * The user and role are loaded from MongoDB instead of
 * relying only on JWT role/permission data.
 *
 * This means changes to roles, permissions, store assignment,
 * or active status take effect immediately.
 */
export async function getCurrentUser(req: NextApiRequest) {
 const token = await getToken({
  req,
  secret: process.env.AUTH_SECRET,
 });

 if (!token?.id) {
  return null;
 }

 await connectDB();

 const user = await User.findById(token.id).lean();

 if (!user) {
  return null;
 }

 if (!user.isActive) {
  return null;
 }

 const role = await Role.findById(user.roleId).lean();

 if (!role) {
  return null;
 }

 if (!role.isActive) {
  return null;
 }

 return {
  id: user._id.toString(),

  name: user.name,

  email: user.email,

  roleId: role._id.toString(),

  role: role.code as RoleCode,

  permissions: role.permissions,

  storeId: user.storeId ? user.storeId.toString() : null,
 };
}

/**
 * Require an authenticated user.
 */
export async function requireAuth(req: NextApiRequest) {
 const user = await getCurrentUser(req);

 if (!user) {
  throw new Error("UNAUTHORIZED");
 }

 return user;
}

/**
 * Require SUPER_ADMIN role.
 *
 * Only SUPER_ADMIN can perform system-wide
 * administrative actions such as managing users.
 */
export async function requireSuperAdmin(req: NextApiRequest) {
 const user = await requireAuth(req);

 if (user.role !== "SUPER_ADMIN") {
  throw new Error("FORBIDDEN");
 }

 return user;
}

/**
 * Require one of the specified roles.
 */
export async function requireRole(req: NextApiRequest, roles: RoleCode[]) {
 const user = await requireAuth(req);

 if (!roles.includes(user.role)) {
  throw new Error("FORBIDDEN");
 }

 return user;
}

/**
 * Check whether the user has a specific permission.
 *
 * Supports:
 *
 * "*"
 * "products.read"
 * "products.*"
 *
 * Examples:
 *
 * products.*
 * → products.read
 * → products.create
 * → products.update
 * → products.delete
 */
export async function requirePermission(req: NextApiRequest, permission: string) {
 const user = await requireAuth(req);

 const permissions = user.permissions ?? [];

 const hasPermission = permissions.some((item: any) => {
  /*
   * Full system access.
   */
  if (item === "*") {
   return true;
  }

  /*
   * Exact permission.
   *
   * Example:
   *
   * products.read
   */
  if (item === permission) {
   return true;
  }

  /*
   * Resource wildcard.
   *
   * Example:
   *
   * products.*
   *
   * Matches:
   *
   * products.read
   * products.create
   * products.update
   * products.delete
   */
  if (item.endsWith(".*")) {
   const prefix = item.slice(0, -2);

   return permission === prefix || permission.startsWith(`${prefix}.`);
  }

  return false;
 });

 if (!hasPermission) {
  throw new Error("FORBIDDEN");
 }

 return user;
}

/**
 * Require access to a specific store.
 *
 * SUPER_ADMIN:
 * - Can access any store.
 *
 * Other roles:
 * - Can only access their own store.
 */
export async function requireStoreAccess(req: NextApiRequest, storeId: string) {
 const user = await requireAuth(req);

 /*
  * SUPER_ADMIN can access every store.
  */
 if (user.role === "SUPER_ADMIN") {
  return user;
 }

 /*
  * Non-SUPER_ADMIN users must belong
  * to a store.
  */
 if (!user.storeId) {
  throw new Error("FORBIDDEN");
 }

 /*
  * User can only access their own store.
  */
 if (user.storeId !== storeId) {
  throw new Error("FORBIDDEN");
 }

 return user;
}

/**
 * Get the authorized store ID for the current user.
 *
 * SUPER_ADMIN:
 * - Returns null because SUPER_ADMIN is not
 *   tied to a specific store.
 *
 * Other roles:
 * - Returns their assigned storeId.
 */
export async function getAuthorizedStoreId(req: NextApiRequest) {
 const user = await requireAuth(req);

 /*
  * SUPER_ADMIN does not belong to a specific store.
  */
 if (user.role === "SUPER_ADMIN") {
  return null;
 }

 /*
  * Every other role must belong to
  * exactly one store.
  */
 if (!user.storeId) {
  throw new Error("FORBIDDEN");
 }

 return user.storeId;
}
