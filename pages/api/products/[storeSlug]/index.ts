import type { NextApiRequest, NextApiResponse } from "next";

import { connectDB } from "~/lib/mongodb";
import { Product } from "~/models/Product";
import { Brand } from "~/models/Brand";
import { Category } from "~/models/Category";
import { Store } from "~/models/Store";

type ApiResponse = {
 success: boolean;
 message?: string;
 store?: any;
 products?: any[];
 pagination?: {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
 };
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

  const pageParam = Array.isArray(req.query.page) ? req.query.page[0] : req.query.page;

  const limitParam = Array.isArray(req.query.limit) ? req.query.limit[0] : req.query.limit;

  const searchParam = Array.isArray(req.query.search) ? req.query.search[0] : req.query.search;

  const categoryParam = Array.isArray(req.query.category) ? req.query.category[0] : req.query.category;

  const brandParam = Array.isArray(req.query.brand) ? req.query.brand[0] : req.query.brand;

  const sortParam = Array.isArray(req.query.sort) ? req.query.sort[0] : req.query.sort;

  const page = Math.max(Number(pageParam) || 1, 1);
  const limit = Math.min(Math.max(Number(limitParam) || 20, 1), 100);

  const search = typeof searchParam === "string" ? searchParam.trim() : "";

  const category = typeof categoryParam === "string" ? categoryParam.trim().toLowerCase() : "";

  const brand = typeof brandParam === "string" ? brandParam.trim().toLowerCase() : "";

  const sort = typeof sortParam === "string" ? sortParam : "newest";

  await connectDB();

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

  const filter: Record<string, any> = {
   storeId: store._id,
   status: "ACTIVE",
   isActive: true,
  };

  if (search) {
   const searchRegex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");

   filter.$or = [{ name: searchRegex }, { sku: searchRegex }];
  }

  if (category) {
   const categoryDoc = await Category.findOne({
    storeId: store._id,
    slug: category,
    isActive: true,
   })
    .select("_id")
    .lean();

   if (!categoryDoc) {
    return res.status(200).json({
     success: true,
     store,
     products: [],
     pagination: {
      page,
      limit,
      total: 0,
      totalPages: 0,
     },
    });
   }

   filter.categoryId = categoryDoc._id;
  }

  if (brand) {
   const brandDoc = await Brand.findOne({
    storeId: store._id,
    slug: brand,
    isActive: true,
   })
    .select("_id")
    .lean();

   if (!brandDoc) {
    return res.status(200).json({
     success: true,
     store,
     products: [],
     pagination: {
      page,
      limit,
      total: 0,
      totalPages: 0,
     },
    });
   }

   filter.brandId = brandDoc._id;
  }

  let sortQuery: Record<string, 1 | -1>;

  switch (sort) {
   case "price_asc":
    sortQuery = { price: 1, createdAt: -1 };
    break;

   case "price_desc":
    sortQuery = { price: -1, createdAt: -1 };
    break;

   case "name_asc":
    sortQuery = { name: 1 };
    break;

   case "name_desc":
    sortQuery = { name: -1 };
    break;

   case "newest":
   default:
    sortQuery = { createdAt: -1 };
    break;
  }

  const total = await Product.countDocuments(filter);

  const totalPages = Math.ceil(total / limit);

  const products = await Product.find(filter)
   .populate("brandId", "name slug logo description")
   .populate("categoryId", "name slug description image parentId")
   .sort(sortQuery)
   .skip((page - 1) * limit)
   .limit(limit)
   .lean();

  return res.status(200).json({
   success: true,
   store,
   products,
   pagination: {
    page,
    limit,
    total,
    totalPages,
   },
  });
 } catch (error) {
  console.error("PUBLIC PRODUCT LIST API ERROR:", error);

  return res.status(500).json({
   success: false,
   message: "Internal server error.",
  });
 }
}
