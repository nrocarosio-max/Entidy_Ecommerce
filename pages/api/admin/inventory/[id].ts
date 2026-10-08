import type { NextApiRequest, NextApiResponse } from "next";

import { connectDB } from "~/lib/mongodb";
import { Inventory } from "~/models/Inventory";
import { requirePermission } from "~/lib/permissions";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
 try {
  const { id } = req.query;

  if (typeof id !== "string") {
   return res.status(400).json({
    success: false,
    message: "Inventory ID is required.",
   });
  }

  /*
   * GET INVENTORY DETAIL
   */
  if (req.method === "GET") {
   const user = await requirePermission(req, "inventory.read");

   await connectDB();

   const inventory = await Inventory.findById(id)
    .populate("productId", "name slug sku description price currency images quantity status")
    .populate("storeId", "name slug email phone address")
    .populate("createdBy", "name email roleId storeId")
    .lean();

   if (!inventory) {
    return res.status(404).json({
     success: false,
     message: "Inventory record not found.",
    });
   }

   /*
    * Store access check.
    */
   if (user.role !== "SUPER_ADMIN" && inventory.storeId && typeof inventory.storeId === "object" && "_id" in inventory.storeId) {
    const inventoryStoreId = String(inventory.storeId._id);

    if (!user.storeId || user.storeId !== inventoryStoreId) {
     return res.status(403).json({
      success: false,
      message: "You do not have access to this inventory record.",
     });
    }
   }

   return res.status(200).json({
    success: true,
    inventory,
   });
  }

  /*
   * Inventory transactions are immutable.
   *
   * We intentionally do not support PATCH or DELETE
   * because changing/deleting historical stock records
   * would make inventory history unreliable.
   */
  res.setHeader("Allow", ["GET"]);

  return res.status(405).json({
   success: false,
   message: `Method ${req.method} not allowed.`,
  });
 } catch (error) {
  console.error("INVENTORY DETAIL API ERROR:", error);

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
     message: "You do not have permission to view this inventory record.",
    });
   }
  }

  return res.status(500).json({
   success: false,
   message: "Internal server error.",
  });
 }
}
