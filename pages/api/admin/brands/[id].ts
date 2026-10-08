import type { NextApiRequest, NextApiResponse } from "next";

import { connectDB } from "~/lib/mongodb";
import { Brand } from "~/models/Brand";
import { Store } from "~/models/Store";
import { requirePermission } from "~/lib/permissions";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
 try {
  const { id } = req.query;

  if (typeof id !== "string") {
   return res.status(400).json({
    success: false,
    message: "Invalid brand ID.",
   });
  }

  /*
   * GET ONE BRAND
   */
  if (req.method === "GET") {
   const user = await requirePermission(req, "brands.read");

   await connectDB();

   const brand = await Brand.findById(id).lean();

   if (!brand) {
    return res.status(404).json({
     success: false,
     message: "Brand not found.",
    });
   }

   /*
    * SUPER_ADMIN can access any store.
    *
    * Other users can only access
    * their own store.
    */
   if (user.role !== "SUPER_ADMIN" && brand.storeId.toString() !== user.storeId) {
    return res.status(403).json({
     success: false,
     message: "You do not have access to this brand.",
    });
   }

   return res.status(200).json({
    success: true,
    brand,
   });
  }

  /*
   * UPDATE BRAND
   */
  if (req.method === "PATCH") {
   const user = await requirePermission(req, "brands.update");

   await connectDB();

   const brand = await Brand.findById(id);

   if (!brand) {
    return res.status(404).json({
     success: false,
     message: "Brand not found.",
    });
   }

   /*
    * Check store access.
    */
   if (user.role !== "SUPER_ADMIN" && brand.storeId.toString() !== user.storeId) {
    return res.status(403).json({
     success: false,
     message: "You do not have access to this brand.",
    });
   }

   const { name, slug, description, logo, isActive } = req.body;

   const normalizedName = name !== undefined ? String(name).trim() : brand.name;

   const normalizedSlug = slug !== undefined ? String(slug).trim().toLowerCase() : brand.slug;

   if (!normalizedName || !normalizedSlug) {
    return res.status(400).json({
     success: false,
     message: "Name and slug cannot be empty.",
    });
   }

   /*
    * Check duplicate name / slug.
    */
   const duplicateBrand = await Brand.findOne({
    storeId: brand.storeId,

    _id: {
     $ne: brand._id,
    },

    $or: [
     {
      name: normalizedName,
     },
     {
      slug: normalizedSlug,
     },
    ],
   }).lean();

   if (duplicateBrand) {
    return res.status(409).json({
     success: false,
     message: "A brand with this name or slug already exists in this store.",
    });
   }

   /*
    * Make sure the store is active.
    */
   const store = await Store.findOne({
    _id: brand.storeId,
    isActive: true,
   }).lean();

   if (!store) {
    return res.status(400).json({
     success: false,
     message: "Store not found or inactive.",
    });
   }

   /*
    * Update fields.
    */
   brand.name = normalizedName;

   brand.slug = normalizedSlug;

   if (description !== undefined) {
    brand.description = String(description).trim();
   }

   if (logo !== undefined) {
    brand.logo = String(logo).trim();
   }

   if (isActive !== undefined) {
    brand.isActive = Boolean(isActive);
   }

   await brand.save();

   return res.status(200).json({
    success: true,
    message: "Brand updated successfully.",
    brand,
   });
  }

  /*
   * DELETE BRAND
   */
  if (req.method === "DELETE") {
   const user = await requirePermission(req, "brands.delete");

   await connectDB();

   const brand = await Brand.findById(id);

   if (!brand) {
    return res.status(404).json({
     success: false,
     message: "Brand not found.",
    });
   }

   /*
    * Check store access.
    */
   if (user.role !== "SUPER_ADMIN" && brand.storeId.toString() !== user.storeId) {
    return res.status(403).json({
     success: false,
     message: "You do not have access to this brand.",
    });
   }

   await Brand.deleteOne({
    _id: brand._id,
   });

   return res.status(200).json({
    success: true,
    message: "Brand deleted successfully.",
   });
  }

  res.setHeader("Allow", ["GET", "PATCH", "DELETE"]);

  return res.status(405).json({
   success: false,
   message: `Method ${req.method} not allowed.`,
  });
 } catch (error) {
  console.error("BRAND [ID] API ERROR:", error);

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
     message: "You do not have permission to manage this brand.",
    });
   }
  }

  return res.status(500).json({
   success: false,
   message: "Internal server error.",
  });
 }
}
