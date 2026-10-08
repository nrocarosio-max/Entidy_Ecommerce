import type { NextApiRequest, NextApiResponse } from "next";

import mongoose from "mongoose";

import { connectDB } from "~/lib/mongodb";
import { Inventory } from "~/models/Inventory";
import { Product } from "~/models/Product";
import { requirePermission } from "~/lib/permissions";

type ApiResponse = {
 success: boolean;
 message?: string;
 inventory?: unknown;
 inventories?: unknown[];
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
   * GET INVENTORY
   */
  if (req.method === "GET") {
   const user = await requirePermission(req, "inventory.read");

   const { productId, type, search, page = "1", limit = "20" } = req.query;

   const currentPage = Math.max(Number(page) || 1, 1);

   const currentLimit = Math.min(Math.max(Number(limit) || 20, 1), 100);

   const query: Record<string, unknown> = {};

   /*
    * Store access.
    *
    * SUPER_ADMIN can optionally filter by storeId.
    * Other users can only access their own store.
    */
   if (user.role === "SUPER_ADMIN") {
    if (typeof req.query.storeId === "string" && mongoose.Types.ObjectId.isValid(req.query.storeId)) {
     query.storeId = new mongoose.Types.ObjectId(req.query.storeId);
    }
   } else {
    if (!user.storeId) {
     return res.status(403).json({
      success: false,
      message: "You are not assigned to a store.",
     });
    }

    query.storeId = new mongoose.Types.ObjectId(user.storeId);
   }

   /*
    * Product filter.
    */
   if (typeof productId === "string" && mongoose.Types.ObjectId.isValid(productId)) {
    query.productId = new mongoose.Types.ObjectId(productId);
   }

   /*
    * Movement type filter.
    */
   if (typeof type === "string" && ["IN", "OUT", "ADJUSTMENT"].includes(type)) {
    query.type = type;
   }

   /*
    * Search by product name or SKU.
    */
   if (typeof search === "string" && search.trim()) {
    const productQuery: Record<string, unknown> = {
     $or: [
      {
       name: {
        $regex: escapeRegex(search.trim()),
        $options: "i",
       },
      },
      {
       sku: {
        $regex: escapeRegex(search.trim()),
        $options: "i",
       },
      },
     ],
    };

    if (user.role !== "SUPER_ADMIN") {
     productQuery.storeId = new mongoose.Types.ObjectId(user.storeId as string);
    } else if (typeof req.query.storeId === "string" && mongoose.Types.ObjectId.isValid(req.query.storeId)) {
     productQuery.storeId = new mongoose.Types.ObjectId(req.query.storeId);
    }

    const products = await Product.find(productQuery).select("_id").lean();

    query.productId = {
     $in: products.map((product) => product._id),
    };
   }

   const skip = (currentPage - 1) * currentLimit;

   const [inventories, total] = await Promise.all([
    Inventory.find(query)
     .populate({
      path: "productId",
      select: "name sku images price currency quantity status",
     })
     .populate({
      path: "createdBy",
      select: "name email",
     })
     .populate({
      path: "storeId",
      select: "name slug",
     })
     .sort({ createdAt: -1 })
     .skip(skip)
     .limit(currentLimit)
     .lean(),

    Inventory.countDocuments(query),
   ]);

   return res.status(200).json({
    success: true,
    inventories,
    pagination: {
     page: currentPage,
     limit: currentLimit,
     total,
     totalPages: Math.ceil(total / currentLimit),
    },
   });
  }

  /*
   * CREATE INVENTORY MOVEMENT
   */
  if (req.method === "POST") {
   const user = await requirePermission(req, "inventory.update");

   const { productId, type, quantity, note = "", reference = "" } = req.body;

   /*
    * Validate product.
    */
   if (!productId) {
    return res.status(400).json({
     success: false,
     message: "Product ID is required.",
    });
   }

   if (!mongoose.Types.ObjectId.isValid(productId)) {
    return res.status(400).json({
     success: false,
     message: "Invalid product ID.",
    });
   }

   /*
    * Validate movement type.
    */
   if (!["IN", "OUT", "ADJUSTMENT"].includes(type)) {
    return res.status(400).json({
     success: false,
     message: "Invalid inventory type.",
    });
   }

   /*
    * Validate quantity.
    */
   const numericQuantity = Number(quantity);

   if (!Number.isFinite(numericQuantity)) {
    return res.status(400).json({
     success: false,
     message: "Quantity must be a valid number.",
    });
   }

   if (type !== "ADJUSTMENT" && numericQuantity <= 0) {
    return res.status(400).json({
     success: false,
     message: "Quantity must be greater than 0.",
    });
   }

   if (type === "ADJUSTMENT" && numericQuantity < 0) {
    return res.status(400).json({
     success: false,
     message: "Adjustment quantity cannot be negative.",
    });
   }

   /*
    * Find product.
    *
    * SUPER_ADMIN can access products from any store.
    * Other users can only access products from their store.
    */
   const productQuery: Record<string, unknown> = {
    _id: productId,
   };

   if (user.role !== "SUPER_ADMIN") {
    if (!user.storeId) {
     return res.status(403).json({
      success: false,
      message: "You are not assigned to a store.",
     });
    }

    productQuery.storeId = user.storeId;
   }

   const product = await Product.findOne(productQuery);

   if (!product) {
    return res.status(404).json({
     success: false,
     message: "Product not found or you do not have access to it.",
    });
   }

   /*
    * Store ID is always taken from the product.
    *
    * The client does not control storeId.
    */
   const storeId = product.storeId.toString();

   const quantityBefore = product.quantity || 0;

   let quantityAfter = quantityBefore;

   /*
    * STOCK IN
    */
   if (type === "IN") {
    quantityAfter = quantityBefore + numericQuantity;
   }

   /*
    * STOCK OUT
    */
   if (type === "OUT") {
    quantityAfter = quantityBefore - numericQuantity;

    if (quantityAfter < 0) {
     return res.status(400).json({
      success: false,
      message: "Insufficient stock.",
     });
    }
   }

   /*
    * ADJUSTMENT
    *
    * The submitted quantity becomes
    * the new actual stock quantity.
    */
   if (type === "ADJUSTMENT") {
    quantityAfter = numericQuantity;
   }

   /*
    * Update Product quantity.
    */
   product.quantity = quantityAfter;

   /*
    * Automatically update product status.
    */
   if (quantityAfter <= 0) {
    product.status = "OUT_OF_STOCK";
   } else if (product.status === "OUT_OF_STOCK") {
    product.status = "ACTIVE";
   }

   await product.save();

   /*
    * Create inventory history.
    */
   const inventory = await Inventory.create({
    storeId,
    productId,
    type,
    quantity: numericQuantity,
    quantityBefore,
    quantityAfter,
    note: typeof note === "string" ? note.trim() : "",
    reference: typeof reference === "string" ? reference.trim() : "",
    createdBy: user.id,
   });

   /*
    * Return populated inventory record.
    */
   const populatedInventory = await Inventory.findById(inventory._id)
    .populate({
     path: "productId",
     select: "name sku images price currency quantity status",
    })
    .populate({
     path: "createdBy",
     select: "name email",
    })
    .populate({
     path: "storeId",
     select: "name slug",
    })
    .lean();

   return res.status(201).json({
    success: true,
    message: "Inventory updated successfully.",
    inventory: populatedInventory,
   });
  }

  /*
   * METHOD NOT ALLOWED
   */
  return res.status(405).json({
   success: false,
   message: "Method not allowed.",
  });
 } catch (error) {
  console.error("Inventory API error:", error);

  const message = error instanceof Error ? error.message : "Something went wrong.";

  if (message === "UNAUTHORIZED") {
   return res.status(401).json({
    success: false,
    message: "Unauthorized.",
   });
  }

  if (message === "FORBIDDEN") {
   return res.status(403).json({
    success: false,
    message: "Forbidden.",
   });
  }

  return res.status(500).json({
   success: false,
   message: "Internal server error.",
  });
 }
}
