import type { NextApiRequest, NextApiResponse } from "next";

import { connectDB } from "~/lib/mongodb";
import { Product } from "~/models/Product";
import { Brand } from "~/models/Brand";
import { Category } from "~/models/Category";
import { Store } from "~/models/Store";
import { requirePermission } from "~/lib/permissions";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
 try {
  const { id } = req.query;

  if (typeof id !== "string") {
   return res.status(400).json({
    success: false,
    message: "Invalid product ID.",
   });
  }

  /*
   * GET ONE PRODUCT
   */
  if (req.method === "GET") {
   const user = await requirePermission(req, "products.read");

   await connectDB();

   const product = await Product.findById(id).populate("brandId", "name slug logo").populate("categoryId", "name slug parentId").lean();

   if (!product) {
    return res.status(404).json({
     success: false,
     message: "Product not found.",
    });
   }

   /*
    * SUPER_ADMIN can access any store.
    * Other users can only access their own store.
    */
   if (user.role !== "SUPER_ADMIN" && product.storeId.toString() !== user.storeId) {
    return res.status(403).json({
     success: false,
     message: "You do not have access to this product.",
    });
   }

   return res.status(200).json({
    success: true,
    product,
   });
  }

  /*
   * UPDATE PRODUCT
   */
  if (req.method === "PATCH") {
   const user = await requirePermission(req, "products.update");

   await connectDB();

   const product = await Product.findById(id);

   if (!product) {
    return res.status(404).json({
     success: false,
     message: "Product not found.",
    });
   }

   /*
    * Check store access.
    */
   if (user.role !== "SUPER_ADMIN" && product.storeId.toString() !== user.storeId) {
    return res.status(403).json({
     success: false,
     message: "You do not have access to this product.",
    });
   }

   /*
    * Store cannot be changed.
    */
   if (req.body.storeId !== undefined && req.body.storeId.toString() !== product.storeId.toString()) {
    return res.status(400).json({
     success: false,
     message: "Product store cannot be changed.",
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
    quantity,
    lowStockThreshold,
    status,
    isFeatured,
    isActive,
   } = req.body;

   const normalizedName = name !== undefined ? String(name).trim() : product.name;

   const normalizedSlug = slug !== undefined ? String(slug).trim().toLowerCase() : product.slug;

   const normalizedSku = sku !== undefined ? String(sku).trim().toUpperCase() : product.sku;

   const normalizedCurrency = currency !== undefined ? String(currency).trim().toUpperCase() : product.currency;

   if (!normalizedName || !normalizedSlug || !normalizedSku || !normalizedCurrency) {
    return res.status(400).json({
     success: false,
     message: "Name, slug, SKU and currency cannot be empty.",
    });
   }

   /*
    * Validate price.
    */
   const parsedPrice = price === undefined ? product.price : Number(price);

   if (Number.isNaN(parsedPrice) || parsedPrice < 0) {
    return res.status(400).json({
     success: false,
     message: "Price must be a valid number greater than or equal to 0.",
    });
   }

   /*
    * Validate compareAtPrice.
    */
   const parsedCompareAtPrice =
    compareAtPrice === undefined ? product.compareAtPrice : compareAtPrice === null || compareAtPrice === "" ? null : Number(compareAtPrice);

   if (parsedCompareAtPrice !== null && (Number.isNaN(parsedCompareAtPrice) || parsedCompareAtPrice < 0)) {
    return res.status(400).json({
     success: false,
     message: "compareAtPrice must be a valid number.",
    });
   }

   /*
    * Validate costPrice.
    */
   const parsedCostPrice = costPrice === undefined ? product.costPrice : costPrice === null || costPrice === "" ? null : Number(costPrice);

   if (parsedCostPrice !== null && (Number.isNaN(parsedCostPrice) || parsedCostPrice < 0)) {
    return res.status(400).json({
     success: false,
     message: "costPrice must be a valid number.",
    });
   }

   /*
    * Prevent duplicate SKU or slug.
    */
   const duplicateProduct = await Product.findOne({
    storeId: product.storeId,
    _id: {
     $ne: product._id,
    },
    $or: [
     {
      sku: normalizedSku,
     },
     {
      slug: normalizedSlug,
     },
    ],
   }).lean();

   if (duplicateProduct) {
    return res.status(409).json({
     success: false,
     message: "A product with this SKU or slug already exists in this store.",
    });
   }

   /*
    * Validate brand.
    */
   const targetBrandId = brandId === undefined ? product.brandId : brandId || null;

   if (targetBrandId) {
    const brand = await Brand.findOne({
     _id: targetBrandId,
     storeId: product.storeId,
     isActive: true,
    }).lean();

    if (!brand) {
     return res.status(400).json({
      success: false,
      message: "Brand not found or does not belong to this store.",
     });
    }
   }

   /*
    * Validate category.
    */
   const targetCategoryId = categoryId === undefined ? product.categoryId : categoryId || null;

   if (targetCategoryId) {
    const category = await Category.findOne({
     _id: targetCategoryId,
     storeId: product.storeId,
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
    * Validate quantity.
    */
   const parsedQuantity = quantity === undefined ? product.quantity : Number(quantity);

   if (Number.isNaN(parsedQuantity) || parsedQuantity < 0) {
    return res.status(400).json({
     success: false,
     message: "Quantity must be a valid number greater than or equal to 0.",
    });
   }

   /*
    * Validate low stock threshold.
    */
   const parsedLowStockThreshold = lowStockThreshold === undefined ? product.lowStockThreshold : Number(lowStockThreshold);

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

   const normalizedStatus = status === undefined ? product.status : String(status).trim().toUpperCase();

   if (!allowedStatuses.includes(normalizedStatus)) {
    return res.status(400).json({
     success: false,
     message: "Invalid product status.",
    });
   }

   /*
    * Validate store.
    */
   const store = await Store.findOne({
    _id: product.storeId,
    isActive: true,
   }).lean();

   if (!store) {
    return res.status(400).json({
     success: false,
     message: "Store not found or inactive.",
    });
   }

   /*
    * Normalize images.
    */
   const normalizedImages = images === undefined ? product.images : Array.isArray(images) ? images.map((image) => String(image).trim()).filter(Boolean) : [];

   /*
    * Update product fields.
    */
   product.name = normalizedName;
   product.slug = normalizedSlug;
   product.sku = normalizedSku;
   product.description = description !== undefined ? String(description).trim() : product.description;

   product.categoryId = targetCategoryId;
   product.brandId = targetBrandId;

   product.price = parsedPrice;
   product.compareAtPrice = parsedCompareAtPrice;
   product.costPrice = parsedCostPrice;
   product.currency = normalizedCurrency;

   product.images = normalizedImages;

   product.quantity = parsedQuantity;
   product.lowStockThreshold = parsedLowStockThreshold;

   product.status = normalizedStatus;

   if (isFeatured !== undefined) {
    product.isFeatured = Boolean(isFeatured);
   }

   if (isActive !== undefined) {
    product.isActive = Boolean(isActive);
   }

   await product.save();

   const populatedProduct = await Product.findById(product._id).populate("brandId", "name slug logo").populate("categoryId", "name slug parentId").lean();

   return res.status(200).json({
    success: true,
    message: "Product updated successfully.",
    product: populatedProduct,
   });
  }

  /*
   * DELETE PRODUCT
   */
  if (req.method === "DELETE") {
   const user = await requirePermission(req, "products.delete");

   await connectDB();

   const product = await Product.findById(id);

   if (!product) {
    return res.status(404).json({
     success: false,
     message: "Product not found.",
    });
   }

   /*
    * Check store access.
    */
   if (user.role !== "SUPER_ADMIN" && product.storeId.toString() !== user.storeId) {
    return res.status(403).json({
     success: false,
     message: "You do not have access to this product.",
    });
   }

   await Product.deleteOne({
    _id: product._id,
   });

   return res.status(200).json({
    success: true,
    message: "Product deleted successfully.",
   });
  }

  res.setHeader("Allow", ["GET", "PATCH", "DELETE"]);

  return res.status(405).json({
   success: false,
   message: `Method ${req.method} not allowed.`,
  });
 } catch (error) {
  console.error("PRODUCT [ID] API ERROR:", error);

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
     message: "You do not have permission to manage this product.",
    });
   }
  }

  return res.status(500).json({
   success: false,
   message: "Internal server error.",
  });
 }
}
