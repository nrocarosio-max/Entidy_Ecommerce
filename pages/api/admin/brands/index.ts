import type { NextApiRequest, NextApiResponse } from "next";

import { connectDB } from "~/lib/mongodb";
import { Brand } from "~/models/Brand";
import { Store } from "~/models/Store";
import { requirePermission } from "~/lib/permissions";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
 try {
  /*
   * GET
   */
  if (req.method === "GET") {
   const user = await requirePermission(req, "brands.read");

   await connectDB();

   const storeId = user.role === "SUPER_ADMIN" ? req.query.storeId : user.storeId;

   if (!storeId) {
    return res.status(400).json({
     success: false,
     message: "storeId is required.",
    });
   }

   const brands = await Brand.find({
    storeId,
   })
    .sort({
     name: 1,
    })
    .lean();

   return res.status(200).json({
    success: true,
    brands,
   });
  }

  /*
   * POST
   */
  if (req.method === "POST") {
   const user = await requirePermission(req, "brands.create");

   await connectDB();

   const { name, slug, description, logo, isActive } = req.body;

   if (!name || !slug) {
    return res.status(400).json({
     success: false,
     message: "Name and slug are required.",
    });
   }

   /*
    * SUPER_ADMIN can specify a storeId.
    * Other users must use their own store.
    */
   const targetStoreId = user.role === "SUPER_ADMIN" ? req.body.storeId : user.storeId;

   if (!targetStoreId) {
    return res.status(400).json({
     success: false,
     message: "storeId is required.",
    });
   }

   /*
    * Make sure the store exists
    * and is active.
    */
   const store = await Store.findOne({
    _id: targetStoreId,
    isActive: true,
   }).lean();

   if (!store) {
    return res.status(400).json({
     success: false,
     message: "Store not found or inactive.",
    });
   }

   const normalizedName = String(name).trim();

   const normalizedSlug = String(slug).trim().toLowerCase();

   if (!normalizedName || !normalizedSlug) {
    return res.status(400).json({
     success: false,
     message: "Name and slug cannot be empty.",
    });
   }

   /*
    * Prevent duplicate brand name
    * or slug inside the same store.
    */
   const existingBrand = await Brand.findOne({
    storeId: targetStoreId,
    $or: [
     {
      name: normalizedName,
     },
     {
      slug: normalizedSlug,
     },
    ],
   }).lean();

   if (existingBrand) {
    return res.status(409).json({
     success: false,
     message: "A brand with this name or slug already exists in this store.",
    });
   }

   const brand = await Brand.create({
    storeId: targetStoreId,

    name: normalizedName,

    slug: normalizedSlug,

    description: description ? String(description).trim() : "",

    logo: logo ? String(logo).trim() : "",

    isActive: isActive === undefined ? true : Boolean(isActive),
   });

   return res.status(201).json({
    success: true,
    message: "Brand created successfully.",
    brand,
   });
  }

  res.setHeader("Allow", ["GET", "POST"]);

  return res.status(405).json({
   success: false,
   message: `Method ${req.method} not allowed.`,
  });
 } catch (error) {
  console.error("BRAND API ERROR:", error);

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
     message: "You do not have permission to manage brands.",
    });
   }
  }

  return res.status(500).json({
   success: false,
   message: "Internal server error.",
  });
 }
}
