import type { NextApiRequest, NextApiResponse } from "next";

import mongoose from "mongoose";

import { connectDB } from "~/lib/mongodb";
import { requirePermission, getAuthorizedStoreId } from "~/lib/permissions";

import { Product } from "~/models/Product";
import { Category } from "~/models/Category";
import { Brand } from "~/models/Brand";

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

   if (user.role === "SUPER_ADMIN") {
    storeId = typeof req.body?.storeId === "string" ? req.body.storeId : null;
   } else {
    storeId = await getAuthorizedStoreId(req);
   }

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
    videos,
    quantity,
    lowStockThreshold,
    status,
    isFeatured,
    isActive,
   } = req.body;

   /*
    * Basic validation.
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

   if (price === undefined || price === null || Number(price) < 0) {
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
    * Validate category.
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
    * Validate brand.
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
    * Check duplicate SKU.
    */
   const existingSku = await Product.findOne({
    storeId,
    sku: String(sku).trim().toUpperCase(),
   }).lean();

   if (existingSku) {
    return res.status(409).json({
     success: false,
     message: "A product with this SKU already exists in this store.",
    });
   }

   /*
    * Check duplicate slug.
    */
   const existingSlug = await Product.findOne({
    storeId,
    slug: String(slug).trim(),
   }).lean();

   if (existingSlug) {
    return res.status(409).json({
     success: false,
     message: "A product with this slug already exists in this store.",
    });
   }

   /*
    * Normalize images.
    */
   const normalizedImages = Array.isArray(images)
    ? images
       .filter((image) => typeof image === "string")
       .map((image) => image.trim())
       .filter(Boolean)
    : [];

   /*
    * Normalize videos.
    */
   const normalizedVideos = Array.isArray(videos)
    ? videos
       .filter((video) => typeof video === "string")
       .map((video) => video.trim())
       .filter(Boolean)
    : [];

   /*
    * Create product.
    */
   const product = await Product.create({
    storeId,

    name: String(name).trim(),

    slug: String(slug).trim(),

    sku: String(sku).trim().toUpperCase(),

    description: description ? String(description).trim() : "",

    categoryId: categoryId || null,

    brandId: brandId || null,

    price: Number(price),

    compareAtPrice: compareAtPrice === null || compareAtPrice === undefined || compareAtPrice === "" ? null : Number(compareAtPrice),

    costPrice: costPrice === null || costPrice === undefined || costPrice === "" ? null : Number(costPrice),

    currency: String(currency).trim().toUpperCase(),

    images: normalizedImages,

    videos: normalizedVideos,

    quantity: quantity === undefined || quantity === null || quantity === "" ? 0 : Number(quantity),

    lowStockThreshold: lowStockThreshold === undefined || lowStockThreshold === null || lowStockThreshold === "" ? 5 : Number(lowStockThreshold),

    status: status || "DRAFT",

    isFeatured: Boolean(isFeatured),

    isActive: isActive === undefined ? true : Boolean(isActive),
   });

   /*
    * Return populated product.
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
  return res.status(405).json({
   success: false,
   message: "Method not allowed.",
  });
 } catch (error: any) {
  console.error("Products API error:", error);

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
   * MongoDB duplicate key.
   */
  if (error?.code === 11000) {
   const duplicatedField = Object.keys(error.keyPattern || {})[0];

   return res.status(409).json({
    success: false,
    message: duplicatedField ? `A product with this ${duplicatedField} already exists.` : "Duplicate product data.",
   });
  }

  return res.status(500).json({
   success: false,
   message: error?.message || "Internal server error.",
  });
 }
}
