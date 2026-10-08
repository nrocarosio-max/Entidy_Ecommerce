import type { NextApiRequest, NextApiResponse } from "next";

import { connectDB } from "~/lib/mongodb";
import { Product } from "~/models/Product";
import { Brand } from "~/models/Brand";
import { Category } from "~/models/Category";
import { Store } from "~/models/Store";
import { requirePermission } from "~/lib/permissions";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
 try {
  /*
   * GET PRODUCTS
   */
  if (req.method === "GET") {
   const user = await requirePermission(req, "products.read");

   await connectDB();

   const storeId = user.role === "SUPER_ADMIN" ? req.query.storeId : user.storeId;

   if (!storeId) {
    return res.status(400).json({
     success: false,
     message: "storeId is required.",
    });
   }

   const products = await Product.find({
    storeId,
   })
    .populate("brandId", "name slug logo")
    .populate("categoryId", "name slug parentId")
    .sort({
     createdAt: -1,
    })
    .lean();

   return res.status(200).json({
    success: true,
    products,
   });
  }

  /*
   * CREATE PRODUCT
   */
  if (req.method === "POST") {
   const user = await requirePermission(req, "products.create");

   await connectDB();

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
    quantity,
    lowStockThreshold,
    status,
    isFeatured,
    isActive,
   } = req.body;

   /*
    * Required fields.
    */
   if (!name || !slug || !sku || price === undefined || !currency) {
    return res.status(400).json({
     success: false,
     message: "Name, slug, SKU, price and currency are required.",
    });
   }

   /*
    * Determine target store.
    */
   const targetStoreId = user.role === "SUPER_ADMIN" ? req.body.storeId : user.storeId;

   if (!targetStoreId) {
    return res.status(400).json({
     success: false,
     message: "storeId is required.",
    });
   }

   /*
    * Make sure store exists
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

   const normalizedSku = String(sku).trim().toUpperCase();

   const normalizedCurrency = String(currency).trim().toUpperCase();

   if (!normalizedName || !normalizedSlug || !normalizedSku || !normalizedCurrency) {
    return res.status(400).json({
     success: false,
     message: "Name, slug, SKU and currency cannot be empty.",
    });
   }

   /*
    * Validate price.
    */
   const parsedPrice = Number(price);

   if (Number.isNaN(parsedPrice) || parsedPrice < 0) {
    return res.status(400).json({
     success: false,
     message: "Price must be a valid number greater than or equal to 0.",
    });
   }

   /*
    * Validate compareAtPrice.
    */
   let parsedCompareAtPrice = compareAtPrice === null || compareAtPrice === undefined || compareAtPrice === "" ? null : Number(compareAtPrice);

   if (parsedCompareAtPrice !== null && (Number.isNaN(parsedCompareAtPrice) || parsedCompareAtPrice < 0)) {
    return res.status(400).json({
     success: false,
     message: "compareAtPrice must be a valid number.",
    });
   }

   /*
    * Validate costPrice.
    */
   let parsedCostPrice = costPrice === null || costPrice === undefined || costPrice === "" ? null : Number(costPrice);

   if (parsedCostPrice !== null && (Number.isNaN(parsedCostPrice) || parsedCostPrice < 0)) {
    return res.status(400).json({
     success: false,
     message: "costPrice must be a valid number.",
    });
   }

   /*
    * Check duplicate SKU / slug.
    */
   const existingProduct = await Product.findOne({
    storeId: targetStoreId,
    $or: [
     {
      sku: normalizedSku,
     },
     {
      slug: normalizedSlug,
     },
    ],
   }).lean();

   if (existingProduct) {
    return res.status(409).json({
     success: false,
     message: "A product with this SKU or slug already exists in this store.",
    });
   }

   /*
    * Validate brand.
    */
   if (brandId) {
    const brand = await Brand.findById(brandId).lean();

    if (!brand) {
     return res.status(400).json({
      success: false,
      message: "Brand not found.",
     });
    }

    if (brand.isActive !== true) {
     return res.status(400).json({
      success: false,
      message: "Brand is inactive.",
     });
    }

    if (brand.storeId?.toString() !== targetStoreId.toString()) {
     console.log("BRAND STORE DEBUG:", {
      brandId: brand._id.toString(),
      brandStoreId: brand.storeId?.toString(),
      targetStoreId: targetStoreId.toString(),
     });

     return res.status(400).json({
      success: false,
      message: "Brand belongs to another store.",
      debug: {
       brandStoreId: brand.storeId?.toString(),
       targetStoreId: targetStoreId.toString(),
      },
     });
    }
   }

   /*
    * Validate category.
    */
   if (categoryId) {
    const category = await Category.findOne({
     _id: categoryId,
     storeId: targetStoreId,
     isActive: true,
    }).lean();

    if (!category) {
     return res.status(400).json({
      success: false,
      message: "Category not found or does not belong to this store.",
     });
    }
   }

   /*
    * Validate images.
    */
   const normalizedImages = Array.isArray(images) ? images.map((image) => String(image).trim()).filter(Boolean) : [];

   /*
    * Validate quantity.
    */
   const parsedQuantity = quantity === undefined ? 0 : Number(quantity);

   if (Number.isNaN(parsedQuantity) || parsedQuantity < 0) {
    return res.status(400).json({
     success: false,
     message: "Quantity must be a valid number greater than or equal to 0.",
    });
   }

   /*
    * Validate low stock threshold.
    */
   const parsedLowStockThreshold = lowStockThreshold === undefined ? 5 : Number(lowStockThreshold);

   if (Number.isNaN(parsedLowStockThreshold) || parsedLowStockThreshold < 0) {
    return res.status(400).json({
     success: false,
     message: "lowStockThreshold must be a valid number greater than or equal to 0.",
    });
   }

   /*
    * Validate status.
    */
   const allowedStatuses = ["DRAFT", "ACTIVE", "INACTIVE", "OUT_OF_STOCK"];

   const normalizedStatus = status === undefined ? "DRAFT" : String(status).trim().toUpperCase();

   if (!allowedStatuses.includes(normalizedStatus)) {
    return res.status(400).json({
     success: false,
     message: "Invalid product status.",
    });
   }

   const product = await Product.create({
    storeId: targetStoreId,

    name: normalizedName,

    slug: normalizedSlug,

    sku: normalizedSku,

    description: description ? String(description).trim() : "",

    categoryId: categoryId || null,

    brandId: brandId || null,

    price: parsedPrice,

    compareAtPrice: parsedCompareAtPrice,

    costPrice: parsedCostPrice,

    currency: normalizedCurrency,

    images: normalizedImages,

    quantity: parsedQuantity,

    lowStockThreshold: parsedLowStockThreshold,

    status: normalizedStatus,

    isFeatured: isFeatured === undefined ? false : Boolean(isFeatured),

    isActive: isActive === undefined ? true : Boolean(isActive),
   });

   /*
    * Return populated product.
    */
   const populatedProduct = await Product.findById(product._id).populate("brandId", "name slug logo").populate("categoryId", "name slug parentId").lean();

   return res.status(201).json({
    success: true,
    message: "Product created successfully.",
    product: populatedProduct,
   });
  }

  res.setHeader("Allow", ["GET", "POST"]);

  return res.status(405).json({
   success: false,
   message: `Method ${req.method} not allowed.`,
  });
 } catch (error) {
  console.error("PRODUCT API ERROR:", error);

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
     message: "You do not have permission to manage products.",
    });
   }
  }

  return res.status(500).json({
   success: false,
   message: "Internal server error.",
  });
 }
}
