import type { NextApiRequest, NextApiResponse } from "next";

import { connectDB } from "~/lib/mongodb";
import { Product } from "~/models/Product";
import { Brand } from "~/models/Brand";
import { Category } from "~/models/Category";
import { Store } from "~/models/Store";

type ApiResponse = {
 success: boolean;
 message?: string;
 product?: any;
 store?: any;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse<ApiResponse>) {
 try {
  if (req.method !== "GET") {
   res.setHeader("Allow", ["GET"]);

   return res.status(405).json({
    success: false,
    message: `Method ${req.method} not allowed.`,
   });
  }

  const { storeSlug, productSlug } = req.query;

  if (typeof storeSlug !== "string" || typeof productSlug !== "string") {
   return res.status(400).json({
    success: false,
    message: "Invalid store slug or product slug.",
   });
  }

  const normalizedStoreSlug = storeSlug.trim().toLowerCase();
  const normalizedProductSlug = productSlug.trim().toLowerCase();

  if (!normalizedStoreSlug || !normalizedProductSlug) {
   return res.status(400).json({
    success: false,
    message: "Store slug and product slug are required.",
   });
  }

  await connectDB();

  /*
   * ============================================================
   * FIND STORE
   * ============================================================
   */

  const store = await Store.findOne({
   slug: normalizedStoreSlug,
   isActive: true,
  })
   .select("_id name slug description logo email phone address")
   .lean();

  if (!store) {
   return res.status(404).json({
    success: false,
    message: "Store not found.",
   });
  }

  /*
   * ============================================================
   * FIND PRODUCT
   * ============================================================
   *
   * Product slug is unique only inside the store.
   *
   * Therefore we MUST query using both:
   *
   * storeId + slug
   */

  const product = await Product.findOne({
   storeId: store._id,
   slug: normalizedProductSlug,
   status: "ACTIVE",
   isActive: true,
  })
   .populate("brandId", "name slug logo description")
   .populate("categoryId", "name slug description image parentId")
   .lean();

  if (!product) {
   return res.status(404).json({
    success: false,
    message: "Product not found.",
   });
  }

  /*
   * ============================================================
   * RETURN PRODUCT
   * ============================================================
   */

  return res.status(200).json({
   success: true,
   store,
   product,
  });
 } catch (error) {
  console.error("PUBLIC PRODUCT DETAIL API ERROR:", error);

  return res.status(500).json({
   success: false,
   message: "Internal server error.",
  });
 }
}
