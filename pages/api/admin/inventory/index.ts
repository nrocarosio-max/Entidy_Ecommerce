import type { NextApiRequest, NextApiResponse } from "next";
import { connectDB } from "~/lib/mongodb";
import { requirePermission } from "~/lib/permissions";
import { Inventory } from "~/models/Inventory";
import { Product } from "~/models/Product";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
 try {
  const user = await requirePermission(req, req.method === "GET" ? "inventory.read" : "inventory.update");

  await connectDB();

  if (req.method === "GET") {
   const { storeId, productId, type, page = "1", limit = "20" } = req.query;

   const pageNumber = Math.max(Number(page) || 1, 1);

   const limitNumber = Math.min(Math.max(Number(limit) || 20, 1), 100);

   const filter: Record<string, any> = {};

   if (user.role === "SUPER_ADMIN") {
    if (typeof storeId === "string" && storeId) {
     filter.storeId = storeId;
    }
   } else {
    if (!user.storeId) {
     return res.status(403).json({
      message: "Store access denied.",
     });
    }

    filter.storeId = user.storeId;
   }

   if (typeof productId === "string" && productId) {
    filter.productId = productId;
   }

   if (typeof type === "string" && ["IN", "OUT", "ADJUSTMENT"].includes(type)) {
    filter.type = type;
   }

   const skip = (pageNumber - 1) * limitNumber;

   const [records, total] = await Promise.all([
    Inventory.find(filter)
     .populate("productId", "name sku quantity currency")
     .populate("createdBy", "name email")
     .sort({ createdAt: -1 })
     .skip(skip)
     .limit(limitNumber)
     .lean(),

    Inventory.countDocuments(filter),
   ]);

   return res.status(200).json({
    inventory: records,
    pagination: {
     page: pageNumber,
     limit: limitNumber,
     total,
     totalPages: Math.ceil(total / limitNumber),
    },
   });
  }

  if (req.method === "POST") {
   const { storeId, productId, quantity, note, reference } = req.body;

   const targetStoreId = user.role === "SUPER_ADMIN" ? storeId : user.storeId;

   if (!targetStoreId) {
    return res.status(400).json({
     message: "storeId is required.",
    });
   }

   if (!productId) {
    return res.status(400).json({
     message: "productId is required.",
    });
   }

   const adjustment = Number(quantity);

   if (!Number.isInteger(adjustment) || adjustment === 0) {
    return res.status(400).json({
     message: "quantity must be a non-zero integer.",
    });
   }

   const product = await Product.findOne({
    _id: productId,
    storeId: targetStoreId,
    isActive: true,
   });

   if (!product) {
    return res.status(404).json({
     message: "Product not found.",
    });
   }

   const quantityBefore = product.quantity;

   const quantityAfter = quantityBefore + adjustment;

   if (quantityAfter < 0) {
    return res.status(400).json({
     message: "Inventory quantity cannot be negative.",
    });
   }

   product.quantity = quantityAfter;

   if (quantityAfter === 0) {
    product.status = "OUT_OF_STOCK";
   } else if (product.status === "OUT_OF_STOCK") {
    product.status = "ACTIVE";
   }

   await product.save();

   const inventory = await Inventory.create({
    storeId: targetStoreId,
    productId: product._id,
    type: adjustment > 0 ? "IN" : "ADJUSTMENT",
    quantity: adjustment,
    quantityBefore,
    quantityAfter,
    note: note || "",
    reference: reference || "",
    createdBy: user.id,
   });

   return res.status(201).json({
    message: "Inventory updated successfully.",
    inventory,
   });
  }

  return res.status(405).json({
   message: "Method not allowed.",
  });
 } catch (error: any) {
  if (error?.message === "UNAUTHORIZED") {
   return res.status(401).json({
    message: "Unauthorized.",
   });
  }

  if (error?.message === "FORBIDDEN") {
   return res.status(403).json({
    message: "Forbidden.",
   });
  }

  console.error("Inventory API error:", error);

  return res.status(500).json({
   message: "Internal server error.",
  });
 }
}
