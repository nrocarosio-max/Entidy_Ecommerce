import type { NextApiRequest, NextApiResponse } from "next";

import { connectDB } from "~/lib/mongodb";
import { Category } from "~/models/Category";
import { Store } from "~/models/Store";
import { requirePermission } from "~/lib/permissions";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
 try {
  const { id } = req.query;

  if (typeof id !== "string") {
   return res.status(400).json({
    success: false,
    message: "Invalid category ID.",
   });
  }

  /*
   * GET
   */
  if (req.method === "GET") {
   const user = await requirePermission(req, "categories.read");

   await connectDB();

   const category = await Category.findById(id).lean();

   if (!category) {
    return res.status(404).json({
     success: false,
     message: "Category not found.",
    });
   }

   /*
    * SUPER_ADMIN can access any store.
    * Other users can only access their own store.
    */
   if (user.role !== "SUPER_ADMIN" && category.storeId.toString() !== user.storeId) {
    return res.status(403).json({
     success: false,
     message: "You do not have access to this category.",
    });
   }

   return res.status(200).json({
    success: true,
    category,
   });
  }

  /*
   * PATCH
   */
  if (req.method === "PATCH") {
   const user = await requirePermission(req, "categories.update");

   await connectDB();

   const category = await Category.findById(id);

   if (!category) {
    return res.status(404).json({
     success: false,
     message: "Category not found.",
    });
   }

   /*
    * Check store access.
    */
   if (user.role !== "SUPER_ADMIN" && category.storeId.toString() !== user.storeId) {
    return res.status(403).json({
     success: false,
     message: "You do not have access to this category.",
    });
   }

   const { name, slug, description, image, parentId, sortOrder, isActive } = req.body;

   /*
    * Normalize incoming values.
    */
   const normalizedName = name !== undefined ? String(name).trim() : category.name;

   const normalizedSlug = slug !== undefined ? String(slug).trim().toLowerCase() : category.slug;

   if (!normalizedName || !normalizedSlug) {
    return res.status(400).json({
     success: false,
     message: "Name and slug cannot be empty.",
    });
   }

   /*
    * Prevent duplicate name or slug
    * inside the same store.
    */
   const duplicateCategory = await Category.findOne({
    storeId: category.storeId,

    _id: {
     $ne: category._id,
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

   if (duplicateCategory) {
    return res.status(409).json({
     success: false,
     message: "A category with this name or slug already exists in this store.",
    });
   }

   /*
    * Determine the new parent.
    *
    * If parentId is not included in the request,
    * keep the existing parent.
    */
   const newParentId = parentId === undefined ? category.parentId : parentId || null;

   /*
    * Prevent a category from being
    * its own parent.
    */
   if (newParentId && newParentId.toString() === category._id.toString()) {
    return res.status(400).json({
     success: false,
     message: "A category cannot be its own parent.",
    });
   }

   /*
    * Validate parent category.
    */
   if (newParentId) {
    const parentCategory = await Category.findOne({
     _id: newParentId,
     storeId: category.storeId,
    }).lean();

    if (!parentCategory) {
     return res.status(400).json({
      success: false,
      message: "Parent category not found in this store.",
     });
    }
   }

   /*
    * Validate store for SUPER_ADMIN.
    *
    * Category storeId is normally unchanged.
    * We do not allow changing storeId here.
    */
   const store = await Store.findOne({
    _id: category.storeId,
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
   category.name = normalizedName;

   category.slug = normalizedSlug;

   if (description !== undefined) {
    category.description = String(description).trim();
   }

   if (image !== undefined) {
    category.image = String(image).trim();
   }

   category.parentId = newParentId;

   if (sortOrder !== undefined) {
    const parsedSortOrder = Number(sortOrder);

    if (Number.isNaN(parsedSortOrder)) {
     return res.status(400).json({
      success: false,
      message: "sortOrder must be a valid number.",
     });
    }

    category.sortOrder = parsedSortOrder;
   }

   if (isActive !== undefined) {
    category.isActive = Boolean(isActive);
   }

   await category.save();

   return res.status(200).json({
    success: true,
    message: "Category updated successfully.",
    category,
   });
  }

  /*
   * DELETE
   */
  if (req.method === "DELETE") {
   const user = await requirePermission(req, "categories.delete");

   await connectDB();

   const category = await Category.findById(id);

   if (!category) {
    return res.status(404).json({
     success: false,
     message: "Category not found.",
    });
   }

   /*
    * Check store access.
    */
   if (user.role !== "SUPER_ADMIN" && category.storeId.toString() !== user.storeId) {
    return res.status(403).json({
     success: false,
     message: "You do not have access to this category.",
    });
   }

   /*
    * Do not delete a category
    * that still has children.
    */
   const childCategory = await Category.findOne({
    storeId: category.storeId,
    parentId: category._id,
   }).lean();

   if (childCategory) {
    return res.status(409).json({
     success: false,
     message: "Cannot delete this category because it has child categories.",
    });
   }

   await Category.deleteOne({
    _id: category._id,
   });

   return res.status(200).json({
    success: true,
    message: "Category deleted successfully.",
   });
  }

  res.setHeader("Allow", ["GET", "PATCH", "DELETE"]);

  return res.status(405).json({
   success: false,
   message: `Method ${req.method} not allowed.`,
  });
 } catch (error) {
  console.error("CATEGORY [ID] API ERROR:", error);

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
     message: "You do not have permission to manage this category.",
    });
   }
  }

  return res.status(500).json({
   success: false,
   message: "Internal server error.",
  });
 }
}
