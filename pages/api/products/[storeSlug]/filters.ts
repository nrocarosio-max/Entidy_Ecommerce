import type { NextApiRequest, NextApiResponse } from "next";

import { connectDB } from "~/lib/mongodb";
import { Brand } from "~/models/Brand";
import { Category } from "~/models/Category";
import { Store } from "~/models/Store";

type ApiResponse = {
 success: boolean;
 message?: string;
 brands?: Array<{
  _id: string;
  name: string;
  slug: string;
  logo?: string;
 }>;
 categories?: Array<{
  _id: string;
  name: string;
  slug: string;
  image?: string;
  parentId?: string | null;
 }>;
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

  const { storeSlug } = req.query;

  if (typeof storeSlug !== "string") {
   return res.status(400).json({
    success: false,
    message: "Invalid store slug.",
   });
  }

  const normalizedStoreSlug = storeSlug.trim().toLowerCase();

  if (!normalizedStoreSlug) {
   return res.status(400).json({
    success: false,
    message: "Store slug is required.",
   });
  }

  await connectDB();

  const store = await Store.findOne({
   slug: normalizedStoreSlug,
   isActive: true,
  })
   .select("_id")
   .lean();

  if (!store) {
   return res.status(404).json({
    success: false,
    message: "Store not found.",
   });
  }

  const [brands, categories] = await Promise.all([
   Brand.find({
    storeId: store._id,
    isActive: true,
   })
    .select("_id name slug logo")
    .sort({ name: 1 })
    .lean(),

   Category.find({
    storeId: store._id,
    isActive: true,
   })
    .select("_id name slug image parentId")
    .sort({ sortOrder: 1, name: 1 })
    .lean(),
  ]);

  return res.status(200).json({
   success: true,
   brands,
   categories,
  });
 } catch (error) {
  console.error("PUBLIC PRODUCT FILTER API ERROR:", error);

  return res.status(500).json({
   success: false,
   message: "Internal server error.",
  });
 }
}
