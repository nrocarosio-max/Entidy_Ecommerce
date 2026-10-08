import type { NextApiRequest, NextApiResponse } from "next";

import { connectDB } from "~/lib/mongodb";
import { Store } from "~/models/Store";
import { requireSuperAdmin } from "~/lib/permissions";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
 try {
  await requireSuperAdmin(req);
  await connectDB();

  if (req.method === "GET") {
   const stores = await Store.find({}).sort({ createdAt: -1 }).lean();

   return res.status(200).json({
    success: true,
    stores,
   });
  }

  if (req.method === "POST") {
   const { name, slug, description = "", logo = "", email = "", phone = "", secondaryPhone = "", address = "" } = req.body;
   if (!name || !slug) {
    return res.status(400).json({
     success: false,
     message: "Store name and slug are required.",
    });
   }

   const normalizedSlug = String(slug).trim().toLowerCase();

   const existingStore = await Store.findOne({
    slug: normalizedSlug,
   });

   if (existingStore) {
    return res.status(409).json({
     success: false,
     message: "A store with this slug already exists.",
    });
   }

   const store = await Store.create({
    name: String(name).trim(),
    slug: normalizedSlug,
    description: String(description).trim(),
    logo: String(logo).trim(),
    email: String(email).trim().toLowerCase(),
    phone: String(phone).trim(),
    secondaryPhone: String(secondaryPhone).trim(),
    address: String(address).trim(),
    isActive: true,
   });

   return res.status(201).json({
    success: true,
    store,
   });
  }

  res.setHeader("Allow", ["GET", "POST"]);

  return res.status(405).json({
   success: false,
   message: `Method ${req.method} not allowed.`,
  });
 } catch (error) {
  console.error("STORES API ERROR:", error);

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
     message: "You do not have permission to perform this action.",
    });
   }
  }

  return res.status(500).json({
   success: false,
   message: "Internal server error.",
  });
 }
}
