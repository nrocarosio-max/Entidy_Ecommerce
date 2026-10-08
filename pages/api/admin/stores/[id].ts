import type { NextApiRequest, NextApiResponse } from "next";
import mongoose from "mongoose";

import { connectDB } from "~/lib/mongodb";
import { Store } from "~/models/Store";
import { User } from "~/models/User";
import { requireSuperAdmin } from "~/lib/permissions";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
 try {
  await requireSuperAdmin(req);
  await connectDB();

  const { id } = req.query;

  if (typeof id !== "string" || !mongoose.Types.ObjectId.isValid(id)) {
   return res.status(400).json({
    success: false,
    message: "Invalid store ID.",
   });
  }

  const storeId = new mongoose.Types.ObjectId(id);

  /*
   * GET STORE
   */
  if (req.method === "GET") {
   const store = await Store.findById(storeId).lean();

   if (!store) {
    return res.status(404).json({
     success: false,
     message: "Store not found.",
    });
   }

   const users = await User.find({
    storeId,
   })
    .select("-passwordHash")
    .populate("roleId", "name code description permissions")
    .sort({ createdAt: -1 })
    .lean();

   return res.status(200).json({
    success: true,
    store,
    users,
   });
  }

  /*
   * UPDATE STORE
   */
  if (req.method === "PATCH") {
   const { name, slug, description, logo, email, phone, secondaryPhone, address, isActive } = req.body;

   const updateData: Record<string, unknown> = {};

   if (name !== undefined) {
    const normalizedName = String(name).trim();

    if (!normalizedName) {
     return res.status(400).json({
      success: false,
      message: "Store name is required.",
     });
    }

    updateData.name = normalizedName;
   }

   if (slug !== undefined) {
    const normalizedSlug = String(slug).trim().toLowerCase();

    if (!normalizedSlug) {
     return res.status(400).json({
      success: false,
      message: "Store slug is required.",
     });
    }

    const existingStore = await Store.findOne({
     slug: normalizedSlug,
     _id: {
      $ne: storeId,
     },
    });

    if (existingStore) {
     return res.status(409).json({
      success: false,
      message: "A store with this slug already exists.",
     });
    }

    updateData.slug = normalizedSlug;
   }

   if (description !== undefined) {
    updateData.description = String(description).trim();
   }

   if (logo !== undefined) {
    updateData.logo = String(logo).trim();
   }

   if (email !== undefined) {
    updateData.email = String(email).trim().toLowerCase();
   }

   if (phone !== undefined) {
    updateData.phone = String(phone).trim();
   }

   if (secondaryPhone !== undefined) {
    updateData.secondaryPhone = String(secondaryPhone).trim();
   }

   if (address !== undefined) {
    updateData.address = String(address).trim();
   }

   if (isActive !== undefined) {
    updateData.isActive = Boolean(isActive);
   }

   const store = await Store.findByIdAndUpdate(
    storeId,
    {
     $set: updateData,
    },
    {
     new: true,
     runValidators: true,
    },
   ).lean();

   if (!store) {
    return res.status(404).json({
     success: false,
     message: "Store not found.",
    });
   }

   return res.status(200).json({
    success: true,
    store,
   });
  }

  /*
   * DELETE STORE
   */
  if (req.method === "DELETE") {
   const store = await Store.findById(storeId);

   if (!store) {
    return res.status(404).json({
     success: false,
     message: "Store not found.",
    });
   }

   /*
    * A store cannot be deleted while it
    * still has users assigned to it.
    */
   const userCount = await User.countDocuments({
    storeId,
   });

   if (userCount > 0) {
    return res.status(409).json({
     success: false,
     message: "This store cannot be deleted because it still has users.",
     userCount,
    });
   }

   await Store.deleteOne({
    _id: storeId,
   });

   return res.status(200).json({
    success: true,
    message: "Store deleted successfully.",
   });
  }

  /*
   * METHOD NOT ALLOWED
   */
  res.setHeader("Allow", ["GET", "PATCH", "DELETE"]);

  return res.status(405).json({
   success: false,
   message: `Method ${req.method} not allowed.`,
  });
 } catch (error) {
  console.error("STORE DETAIL API ERROR:", error);

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
