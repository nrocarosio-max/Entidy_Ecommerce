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
 pagination?: {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
 };
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

  // Ensure referenced models are registered on the default connection.
  // This also helps diagnose MissingSchemaError during populate().
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

  const { page: pageQuery, limit: limitQuery, search: searchQuery, categoryId, brandId, status, storeId: requestedStoreId } = req.query;

  const page = Math.max(1, Number.parseInt(String(pageQuery || "1"), 10) || 1);

  const limit = Math.min(100, Math.max(1, Number.parseInt(String(limitQuery || "20"), 10) || 20));

  const search = String(searchQuery || "").trim();

  const filter: Record<string, any> = {
   isActive: true,
  };

  // Store isolation:
  // SUPER_ADMIN can optionally select a store.
  // Other roles must use their assigned store.
  if (role === "SUPER_ADMIN") {
   if (requestedStoreId) {
    const selectedStoreId = String(requestedStoreId);

    if (!mongoose.Types.ObjectId.isValid(selectedStoreId)) {
     return res.status(400).json({
      success: false,
      message: "Invalid storeId.",
     });
    }

    filter.storeId = new mongoose.Types.ObjectId(selectedStoreId);
   }
  } else {
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
  }

  // Search by product name or SKU.
  if (search) {
   const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

   filter.$or = [{ name: { $regex: escapedSearch, $options: "i" } }, { sku: { $regex: escapedSearch, $options: "i" } }];
  }

  // Filter by category.
  if (categoryId) {
   const id = String(categoryId);

   if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
     success: false,
     message: "Invalid categoryId.",
    });
   }

   filter.categoryId = new mongoose.Types.ObjectId(id);
  }

  // Filter by brand.
  if (brandId) {
   const id = String(brandId);

   if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
     success: false,
     message: "Invalid brandId.",
    });
   }

   filter.brandId = new mongoose.Types.ObjectId(id);
  }

  // Filter by product status.
  const allowedStatuses = ["DRAFT", "ACTIVE", "INACTIVE", "OUT_OF_STOCK"];

  if (status) {
   const normalizedStatus = String(status).toUpperCase();

   if (!allowedStatuses.includes(normalizedStatus)) {
    return res.status(400).json({
     success: false,
     message: "Invalid product status.",
    });
   }

   filter.status = normalizedStatus;
  }

  // Include inactive products when explicitly requesting INACTIVE.
  // The API still excludes products with isActive=false by default.
  if (String(status || "").toUpperCase() === "INACTIVE") {
   delete filter.isActive;
   filter.isActive = false;
  }

  const skip = (page - 1) * limit;

  const [products, total] = await Promise.all([
   Product.find(filter).populate("categoryId", "name").populate("brandId", "name").sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),

   Product.countDocuments(filter),
  ]);

  return res.status(200).json({
   success: true,
   data: products,
   pagination: {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
   },
  });
 } catch (error: unknown) {
  console.error("POS products API error:", error);

  const message = error instanceof Error ? error.message : "Unknown error";

  return res.status(500).json({
   success: false,
   message: process.env.NODE_ENV === "development" ? message : "Internal server error.",
  });
 }
}
