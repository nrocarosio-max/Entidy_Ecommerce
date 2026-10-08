import type { NextApiRequest, NextApiResponse } from "next";
import { normalizeText } from "~/lib/normalizeText";
import { connectDB } from "~/lib/mongodb";
import { requirePermission } from "~/lib/permissions";

import { Customer } from "~/models/Customer";
import { Store } from "~/models/Store";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
 try {
  await connectDB();

  if (req.method === "GET") {
   const user = await requirePermission(req, "customers.read");

   const { storeId, search } = req.query;

   let targetStoreId: string | null = null;

   if (user.role === "SUPER_ADMIN") {
    if (storeId && typeof storeId === "string") {
     targetStoreId = storeId;
    }
   } else {
    targetStoreId = user.storeId;
   }

   const filter: Record<string, any> = {};

   if (targetStoreId) {
    filter.storeId = targetStoreId;
   }

   if (search && typeof search === "string") {
    const keyword = search.trim();

    if (keyword) {
     filter.$or = [
      {
       name: {
        $regex: keyword,
        $options: "i",
       },
      },
      {
       phone: {
        $regex: keyword,
        $options: "i",
       },
      },
     ];
    }
   }

   const customers = await Customer.find(filter).populate("storeId", "name slug").sort({ createdAt: -1 }).lean();

   return res.status(200).json({
    success: true,
    customers,
   });
  }

  if (req.method === "POST") {
   const user = await requirePermission(req, "customers.create");

   const { storeId, name, phone, isActive = true } = req.body;

   if (!name || typeof name !== "string") {
    return res.status(400).json({
     success: false,
     message: "Customer name is required.",
    });
   }

   if (!phone || typeof phone !== "string") {
    return res.status(400).json({
     success: false,
     message: "Customer phone is required.",
    });
   }

   let targetStoreId: string | null = null;

   if (user.role === "SUPER_ADMIN") {
    if (!storeId || typeof storeId !== "string") {
     return res.status(400).json({
      success: false,
      message: "storeId is required.",
     });
    }

    targetStoreId = storeId;
   } else {
    targetStoreId = user.storeId;
   }

   if (!targetStoreId) {
    return res.status(400).json({
     success: false,
     message: "Store is required.",
    });
   }

   const store = await Store.findById(targetStoreId).lean();

   if (!store) {
    return res.status(404).json({
     success: false,
     message: "Store not found.",
    });
   }

   if (!store.isActive) {
    return res.status(400).json({
     success: false,
     message: "Store is inactive.",
    });
   }

   const customerName = String(name).trim();

   const customer = await Customer.create({
    storeId: targetStoreId,
    name: customerName,
    nameNormalized: normalizeText(customerName),
    phone: String(phone).trim(),
    isActive: true,
   });

   return res.status(201).json({
    success: true,
    message: "Customer created successfully.",
    customer,
   });
  }

  res.setHeader("Allow", ["GET", "POST"]);

  return res.status(405).json({
   success: false,
   message: `Method ${req.method} not allowed.`,
  });
 } catch (error: any) {
  console.error("Customers API error:", error);

  if (error.message === "UNAUTHORIZED") {
   return res.status(401).json({
    success: false,
    message: "Unauthorized.",
   });
  }

  if (error.message === "FORBIDDEN") {
   return res.status(403).json({
    success: false,
    message: "Forbidden.",
   });
  }

  if (error.code === 11000) {
   return res.status(409).json({
    success: false,
    message: "Customer already exists.",
   });
  }

  return res.status(500).json({
   success: false,
   message: "Internal server error.",
  });
 }
}
