import type { NextApiRequest, NextApiResponse } from "next";
import mongoose from "mongoose";

import { connectDB } from "~/lib/mongodb";
import { requireAuth } from "~/lib/permissions";

import { Product } from "~/models/Product";
import { Category } from "~/models/Category";
import { Brand } from "~/models/Brand";

const ALLOWED_ROLES = ["SUPER_ADMIN", "STORE_ADMIN", "MARKETING", "SALES", "FULFILLMENT"];

type ApiResponse = {
 success: boolean;
 message?: string;
 data?: unknown;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse<ApiResponse>) {
 if (req.method !== "GET") {
  res.setHeader("Allow", ["GET"]);
  return res.status(405).json({
   success: false,
   message: "Method not allowed.",
  });
 }

 try {
  await connectDB();

  // Ensure referenced models are registered.
  if (!mongoose.models.Category) {
   mongoose.model("Category", Category.schema);
  }

  if (!mongoose.models.Brand) {
   mongoose.model("Brand", Brand.schema);
  }

  const auth = await requireAuth(req);

  if (!auth) {
   return res.status(401).json({
    success: false,
    message: "Unauthorized.",
   });
  }

  const role = String(auth.role || "").toUpperCase();

  if (!ALLOWED_ROLES.includes(role)) {
   return res.status(403).json({
    success: false,
    message: "You do not have permission to access POS products.",
   });
  }

  const { id } = req.query;

  if (typeof id !== "string" || !mongoose.Types.ObjectId.isValid(id)) {
   return res.status(400).json({
    success: false,
    message: "Invalid product ID.",
   });
  }

  const filter: Record<string, any> = {
   _id: new mongoose.Types.ObjectId(id),
  };

  // Non-super-admin users can only access products in their assigned store.
  if (role !== "SUPER_ADMIN") {
   const assignedStoreId = auth.storeId ? String(auth.storeId) : "";

   if (!assignedStoreId) {
    return res.status(403).json({
     success: false,
     message: "Your account is not assigned to a store.",
    });
   }

   if (!mongoose.Types.ObjectId.isValid(assignedStoreId)) {
    return res.status(403).json({
     success: false,
     message: "Invalid assigned store.",
    });
   }

   filter.storeId = new mongoose.Types.ObjectId(assignedStoreId);
  } else if (req.query.storeId) {
   // Super admin may optionally scope the request to a specific store.
   const requestedStoreId = String(req.query.storeId);

   if (!mongoose.Types.ObjectId.isValid(requestedStoreId)) {
    return res.status(400).json({
     success: false,
     message: "Invalid store ID.",
    });
   }

   filter.storeId = new mongoose.Types.ObjectId(requestedStoreId);
  }

  const product = await Product.findOne(filter).populate("categoryId", "name slug").populate("brandId", "name slug").lean();

  if (!product) {
   return res.status(404).json({
    success: false,
    message: "Product not found.",
   });
  }

  return res.status(200).json({
   success: true,
   data: product,
  });
 } catch (error: unknown) {
  console.error("POS product detail API error:", error);

  const message = error instanceof Error ? error.message : "Unknown error";

  return res.status(500).json({
   success: false,
   message: process.env.NODE_ENV === "development" ? message : "Internal server error.",
  });
 }
}
