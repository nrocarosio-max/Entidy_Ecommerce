import type { NextApiRequest, NextApiResponse } from "next";

import { normalizeText } from "~/lib/normalizeText";
import { connectDB } from "~/lib/mongodb";
import { requirePermission } from "~/lib/permissions";

import { Customer } from "~/models/Customer";
import { Store } from "~/models/Store";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
 try {
  await connectDB();

  /*
   * GET /api/admin/customers
   */
  if (req.method === "GET") {
   const user = await requirePermission(req, "customers.read");

   const { storeId, search, isActive, page = "1", limit = "20" } = req.query;

   /*
    * Determine store access
    */
   let targetStoreId: string | null = null;

   if (user.role === "SUPER_ADMIN") {
    if (storeId && typeof storeId === "string") {
     targetStoreId = storeId;
    }
   } else {
    targetStoreId = user.storeId;
   }

   if (!targetStoreId) {
    return res.status(400).json({
     success: false,
     message: "Store is required.",
    });
   }

   /*
    * Build filter
    */
   const filter: Record<string, any> = {
    storeId: targetStoreId,
   };

   /*
    * Active filter
    */
   if (isActive === "true") {
    filter.isActive = true;
   }

   if (isActive === "false") {
    filter.isActive = false;
   }

   /*
    * Search
    */
   if (search && typeof search === "string") {
    const keyword = search.trim();

    if (keyword) {
     const normalizedKeyword = normalizeText(keyword);

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
      {
       nameNormalized: {
        $regex: normalizedKeyword,
        $options: "i",
       },
      },
     ];
    }
   }

   /*
    * Pagination
    */
   const currentPage = Math.max(1, Number.parseInt(String(page), 10) || 1);

   const perPage = Math.min(100, Math.max(1, Number.parseInt(String(limit), 10) || 20));

   const skip = (currentPage - 1) * perPage;

   /*
    * Get customers
    */
   const [customers, total] = await Promise.all([
    Customer.find(filter).sort({ createdAt: -1 }).skip(skip).limit(perPage).lean(),

    Customer.countDocuments(filter),
   ]);

   /*
    * Attach store name without populate
    */
   const store = await Store.findById(targetStoreId).select("_id name slug").lean();

   const customersWithStore = customers.map((customer) => ({
    ...customer,
    storeId: store
     ? {
        _id: store._id.toString(),
        name: store.name,
        slug: store.slug,
       }
     : customer.storeId,
   }));

   return res.status(200).json({
    success: true,
    customers: customersWithStore,
    pagination: {
     page: currentPage,
     limit: perPage,
     total,
     totalPages: Math.max(1, Math.ceil(total / perPage)),
    },
   });
  }

  /*
   * POST /api/admin/customers
   */
  if (req.method === "POST") {
   const user = await requirePermission(req, "customers.create");

   const { storeId, name, phone, isActive = true } = req.body;

   if (!name || typeof name !== "string" || !name.trim()) {
    return res.status(400).json({
     success: false,
     message: "Customer name is required.",
    });
   }

   if (!phone || typeof phone !== "string" || !phone.trim()) {
    return res.status(400).json({
     success: false,
     message: "Customer phone is required.",
    });
   }

   /*
    * Determine target store
    */
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

   /*
    * Check store
    */
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

   /*
    * Create customer
    */
   const customerName = name.trim();
   const customerPhone = phone.trim();

   const customer = await Customer.create({
    storeId: targetStoreId,
    name: customerName,
    nameNormalized: normalizeText(customerName),
    phone: customerPhone,
    isActive: Boolean(isActive),
   });

   return res.status(201).json({
    success: true,
    message: "Customer created successfully.",
    customer,
   });
  }

  /*
   * Method not allowed
   */
  res.setHeader("Allow", ["GET", "POST"]);

  return res.status(405).json({
   success: false,
   message: `Method ${req.method} not allowed.`,
  });
 } catch (error: any) {
  console.error("CUSTOMERS API ERROR:", error);

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
   message: error instanceof Error ? error.message : String(error),
  });
 }
}
