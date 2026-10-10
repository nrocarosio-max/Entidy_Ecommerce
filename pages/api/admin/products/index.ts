import type { NextApiRequest, NextApiResponse } from "next";

import mongoose from "mongoose";

import { connectDB } from "~/lib/mongodb";
import { requirePermission, getAuthorizedStoreId } from "~/lib/permissions";

import { Product } from "~/models/Product";
import { Category } from "~/models/Category";
import { Brand } from "~/models/Brand";
import { Store } from "~/models/Store";

type ApiResponse = {
 success: boolean;
 message?: string;
 products?: any[];
 product?: any;
 pagination?: {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
 };
};

function escapeRegex(value: string) {
 return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<ApiResponse>) {
 try {
  await connectDB();

  /*
   * ============================================================
   * GET PRODUCTS
   * ============================================================
   */

  if (req.method === "GET") {
   const user = await requirePermission(req, "products.read");

   let storeId: string | null = null;

   /*
    * SUPER_ADMIN can select a store.
    */

   if (user.role === "SUPER_ADMIN") {
    const queryStoreId = typeof req.query.storeId === "string" ? req.query.storeId : "";

    if (!queryStoreId) {
     return res.status(400).json({
      success: false,
      message: "storeId is required.",
     });
    }

    storeId = queryStoreId;
   } else {
    /*
     * Other users can only access their own store.
     */

    storeId = await getAuthorizedStoreId(req);
   }

   if (!storeId || !mongoose.Types.ObjectId.isValid(storeId)) {
    return res.status(400).json({
     success: false,
     message: "Invalid storeId.",
    });
   }

   const page = Math.max(1, Number(req.query.page) || 1);

   const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));

   const search = typeof req.query.search === "string" ? req.query.search.trim() : "";

   const status = typeof req.query.status === "string" ? req.query.status.trim() : "";

   const categoryId = typeof req.query.categoryId === "string" ? req.query.categoryId.trim() : "";

   const brandId = typeof req.query.brandId === "string" ? req.query.brandId.trim() : "";

   /*
    * By default, only active products
    * are returned.
    *
    * ?includeInactive=true
    * can be used by admin pages that
    * need inactive products as well.
    */

   const includeInactive = req.query.includeInactive === "true";

   const filter: Record<string, any> = {
    storeId,
   };

   if (!includeInactive) {
    filter.isActive = true;
   }

   if (status) {
    filter.status = status;
   }

   if (categoryId && mongoose.Types.ObjectId.isValid(categoryId)) {
    filter.categoryId = categoryId;
   }

   if (brandId && mongoose.Types.ObjectId.isValid(brandId)) {
    filter.brandId = brandId;
   }

   /*
    * Search by:
    * - name
    * - SKU
    * - slug
    */

   if (search) {
    const regex = new RegExp(escapeRegex(search), "i");

    filter.$or = [
     {
      name: regex,
     },
     {
      sku: regex,
     },
     {
      slug: regex,
     },
    ];
   }

   const skip = (page - 1) * limit;

   const [products, total] = await Promise.all([
    Product.find(filter)
     .populate("categoryId", "name slug description")
     .populate("brandId", "name slug logo")
     .sort({
      createdAt: -1,
     })
     .skip(skip)
     .limit(limit)
     .lean(),

    Product.countDocuments(filter),
   ]);

   return res.status(200).json({
    success: true,
    products,
    pagination: {
     page,
     limit,
     total,
     totalPages: Math.ceil(total / limit),
    },
   });
  }

  /*
   * ============================================================
   * CREATE PRODUCT
   * ============================================================
   */

  if (req.method === "POST") {
   const user = await requirePermission(req, "products.create");

   let storeId: string | null = null;

   /*
    * SUPER_ADMIN can select a store.
    */

   if (user.role === "SUPER_ADMIN") {
    storeId = typeof req.body?.storeId === "string" ? req.body.storeId : null;
   } else {
    /*
     * Other users can only create products
     * inside their own store.
     */

    storeId = await getAuthorizedStoreId(req);
   }

   /*
    * Validate storeId.
    */

   if (!storeId) {
    return res.status(400).json({
     success: false,
     message: "storeId is required.",
    });
   }

   if (!mongoose.Types.ObjectId.isValid(storeId)) {
    return res.status(400).json({
     success: false,
     message: "Invalid storeId.",
    });
   }

   /*
    * Make sure the store actually exists.
    */

   const store = await Store.findOne({
    _id: storeId,
    isActive: true,
   }).lean();

   if (!store) {
    return res.status(400).json({
     success: false,
     message: "Store not found or inactive.",
    });
   }

   const {
    name,
    slug,
    sku,
    description,
    categoryId,
    brandId,
    price,
    compareAtPrice,
    costPrice,
    currency,
    images,
    tryOnImage,
    videos,
    quantity,
    lowStockThreshold,
    status,
    isFeatured,
    isActive,
   } = req.body;

   /*
    * ============================================================
    * BASIC VALIDATION
    * ============================================================
    */

   if (!name || !String(name).trim()) {
    return res.status(400).json({
     success: false,
     message: "Product name is required.",
    });
   }

   if (!slug || !String(slug).trim()) {
    return res.status(400).json({
     success: false,
     message: "Product slug is required.",
    });
   }

   if (!sku || !String(sku).trim()) {
    return res.status(400).json({
     success: false,
     message: "Product SKU is required.",
    });
   }

   if (price === undefined || price === null || Number.isNaN(Number(price)) || Number(price) < 0) {
    return res.status(400).json({
     success: false,
     message: "Valid product price is required.",
    });
   }

   if (!currency || !String(currency).trim()) {
    return res.status(400).json({
     success: false,
     message: "Currency is required.",
    });
   }

   /*
    * ============================================================
    * NORMALIZE SLUG / SKU
    * ============================================================
    */

   const normalizedSlug = String(slug).trim().toLowerCase();

   const normalizedSku = String(sku).trim().toUpperCase();

   /*
    * ============================================================
    * VALIDATE CATEGORY
    * ============================================================
    */

   if (categoryId) {
    if (!mongoose.Types.ObjectId.isValid(categoryId)) {
     return res.status(400).json({
      success: false,
      message: "Invalid categoryId.",
     });
    }

    const category = await Category.findOne({
     _id: categoryId,
     storeId,
     isActive: true,
    }).lean();

    if (!category) {
     return res.status(400).json({
      success: false,
      message: "Category does not belong to this store.",
     });
    }
   }

   /*
    * ============================================================
    * VALIDATE BRAND
    * ============================================================
    */

   if (brandId) {
    if (!mongoose.Types.ObjectId.isValid(brandId)) {
     return res.status(400).json({
      success: false,
      message: "Invalid brandId.",
     });
    }

    const brand = await Brand.findOne({
     _id: brandId,
     storeId,
     isActive: true,
    }).lean();

    if (!brand) {
     return res.status(400).json({
      success: false,
      message: "Brand does not belong to this store.",
     });
    }
   }

   /*
    * ============================================================
    * CHECK DUPLICATE SKU
    * ============================================================
    *
    * SKU must be unique inside the same store.
    *
    * Store A + ABC-001 -> allowed
    * Store A + ABC-001 -> duplicate
    * Store B + ABC-001 -> allowed
    */

   const existingSku = await Product.findOne({
    storeId,
    sku: normalizedSku,
   }).lean();

   if (existingSku) {
    return res.status(409).json({
     success: false,
     message: "A product with this SKU already exists in this store.",
    });
   }

   /*
    * ============================================================
    * CHECK DUPLICATE SLUG
    * ============================================================
    *
    * Slug must be unique inside the same store.
    *
    * Store A + adidas-shirt -> allowed
    * Store A + adidas-shirt -> duplicate
    * Store B + adidas-shirt -> allowed
    */

   const existingSlug = await Product.findOne({
    storeId,
    slug: normalizedSlug,
   }).lean();

   if (existingSlug) {
    return res.status(409).json({
     success: false,
     message: "A product with this slug already exists in this store.",
    });
   }

   /*
    * ============================================================
    * NORMALIZE IMAGES
    * ============================================================
    */

   const normalizedImages = Array.isArray(images)
    ? images
       .filter((image) => typeof image === "string")
       .map((image) => image.trim())
       .filter(Boolean)
    : [];

   /*
    * ============================================================
    * NORMALIZE VIDEOS
    * ============================================================
    */

   const normalizedVideos = Array.isArray(videos)
    ? videos
       .filter((video) => typeof video === "string")
       .map((video) => video.trim())
       .filter(Boolean)
    : [];

   /*
    * ============================================================
    * CREATE PRODUCT
    * ============================================================
    */

   const product = await Product.create({
    storeId,

    name: String(name).trim(),

    slug: normalizedSlug,

    sku: normalizedSku,

    description: description ? String(description).trim() : "",

    categoryId: categoryId || null,

    brandId: brandId || null,

    price: Number(price),

    compareAtPrice: compareAtPrice === null || compareAtPrice === undefined || compareAtPrice === "" ? null : Number(compareAtPrice),

    costPrice: costPrice === null || costPrice === undefined || costPrice === "" ? null : Number(costPrice),

    currency: String(currency).trim().toUpperCase(),

    images: normalizedImages,

    tryOnImage: typeof tryOnImage === "string" ? tryOnImage.trim() : "",

    videos: normalizedVideos,

    quantity: quantity === undefined || quantity === null || quantity === "" ? 0 : Number(quantity),

    lowStockThreshold: lowStockThreshold === undefined || lowStockThreshold === null || lowStockThreshold === "" ? 5 : Number(lowStockThreshold),

    status: status || "DRAFT",

    isFeatured: Boolean(isFeatured),

    isActive: isActive === undefined ? true : Boolean(isActive),
   });

   /*
    * ============================================================
    * RETURN POPULATED PRODUCT
    * ============================================================
    */

   const populatedProduct = await Product.findById(product._id).populate("categoryId", "name slug description").populate("brandId", "name slug logo").lean();

   return res.status(201).json({
    success: true,
    product: populatedProduct,
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
  console.error("Products API error:", error);

  /*
   * ============================================================
   * AUTHORIZATION ERRORS
   * ============================================================
   */

  if (error?.message === "UNAUTHORIZED") {
   return res.status(401).json({
    success: false,
    message: "Unauthorized.",
   });
  }

  if (error?.message === "FORBIDDEN") {
   return res.status(403).json({
    success: false,
    message: "Forbidden.",
   });
  }

  /*
   * ============================================================
   * MONGODB DUPLICATE KEY
   * ============================================================
   *
   * This is the final protection in case two requests
   * create the same SKU/slug at almost the same time.
   */

  if (error?.code === 11000) {
   const keyPattern = error?.keyPattern || {};

   if (keyPattern.storeId && keyPattern.slug) {
    return res.status(409).json({
     success: false,
     message: "A product with this slug already exists in this store.",
    });
   }

   if (keyPattern.storeId && keyPattern.sku) {
    return res.status(409).json({
     success: false,
     message: "A product with this SKU already exists in this store.",
    });
   }

   return res.status(409).json({
    success: false,
    message: "Duplicate product data.",
   });
  }

  /*
   * ============================================================
   * INTERNAL SERVER ERROR
   * ============================================================
   */

  return res.status(500).json({
   success: false,
   message: error?.message || "Internal server error.",
  });
 }
}
