import type { NextApiRequest, NextApiResponse } from "next";
import mongoose from "mongoose";

import { connectDB } from "~/lib/mongodb";
import { requireSuperAdmin } from "~/lib/permissions";
import { AffiliateStore } from "~/models/AffiliateStore";
import { AffiliateCommission } from "~/models/AffiliateCommission";
import { AffiliatePayment } from "~/models/AffiliatePayment";
import { Affiliate } from "~/models/Affiliate";
import { Store } from "~/models/Store";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
 try {
  await connectDB();
  await requireSuperAdmin(req);

  const { id } = req.query;

  if (typeof id !== "string" || !mongoose.isValidObjectId(id)) {
   return res.status(400).json({
    success: false,
    message: "Invalid Affiliate Store ID.",
   });
  }

  const affiliateStore = await AffiliateStore.findById(id);

  if (!affiliateStore) {
   return res.status(404).json({
    success: false,
    message: "Affiliate Store link not found.",
   });
  }

  if (req.method === "GET") {
   await affiliateStore.populate([
    {
     path: "affiliateId",
     select: "code status userId",
     populate: {
      path: "userId",
      select: "name email phone",
     },
    },
    {
     path: "storeId",
     select: "name slug isActive",
    },
    {
     path: "approvedBy",
     select: "name email",
    },
   ]);

   return res.status(200).json({
    success: true,
    affiliateStore,
   });
  }

  if (req.method === "PUT") {
   const { commissionRate, status, note } = req.body ?? {};

   if (commissionRate === undefined && status === undefined && note === undefined) {
    return res.status(400).json({
     success: false,
     message: "No fields provided for update.",
    });
   }

   if (commissionRate !== undefined && (typeof commissionRate !== "number" || !Number.isFinite(commissionRate) || commissionRate < 0 || commissionRate > 100)) {
    return res.status(400).json({
     success: false,
     message: "Commission rate must be between 0 and 100.",
    });
   }

   const allowedStatuses = ["ACTIVE", "INACTIVE", "SUSPENDED"];

   if (status !== undefined && (typeof status !== "string" || !allowedStatuses.includes(status))) {
    return res.status(400).json({
     success: false,
     message: "Invalid Affiliate Store status.",
    });
   }

   if (note !== undefined && typeof note !== "string") {
    return res.status(400).json({
     success: false,
     message: "Note must be a string.",
    });
   }

   if (status === "ACTIVE") {
    const [affiliate, store] = await Promise.all([
     Affiliate.findById(affiliateStore.affiliateId).select("status"),
     Store.findById(affiliateStore.storeId).select("isActive"),
    ]);

    if (!affiliate || affiliate.status !== "ACTIVE") {
     return res.status(400).json({
      success: false,
      message: "Cannot activate a link for an inactive Affiliate.",
     });
    }

    if (!store || !store.isActive) {
     return res.status(400).json({
      success: false,
      message: "Cannot activate a link for an inactive Store.",
     });
    }
   }

   if (commissionRate !== undefined) {
    affiliateStore.commissionRate = commissionRate;
   }

   if (status !== undefined) {
    affiliateStore.status = status;

    if (status === "ACTIVE" && !affiliateStore.approvedAt) {
     affiliateStore.approvedAt = new Date();
     // Set approvedBy here if your auth helper exposes the current user ID.
    }
   }

   if (note !== undefined) {
    affiliateStore.note = note.trim();
   }

   await affiliateStore.save();

   return res.status(200).json({
    success: true,
    message: "Affiliate Store link updated successfully.",
    affiliateStore,
   });
  }

  if (req.method === "DELETE") {
   const [commissionCount, paymentCount] = await Promise.all([
    AffiliateCommission.countDocuments({
     affiliateStoreId: affiliateStore._id,
    }),
    AffiliatePayment.countDocuments({
     affiliateStoreId: affiliateStore._id,
     isDeleted: { $ne: true },
    }),
   ]);

   if (commissionCount > 0 || paymentCount > 0) {
    return res.status(409).json({
     success: false,
     message: "This link has commission or payment history. Set its status to INACTIVE instead of deleting it.",
     commissionCount,
     paymentCount,
    });
   }

   await AffiliateStore.deleteOne({ _id: affiliateStore._id });

   return res.status(200).json({
    success: true,
    message: "Affiliate Store link deleted successfully.",
   });
  }

  res.setHeader("Allow", ["GET", "PUT", "DELETE"]);

  return res.status(405).json({
   success: false,
   message: `Method ${req.method} not allowed.`,
  });
 } catch (error: unknown) {
  console.error("AFFILIATE STORE DETAIL API ERROR:", error);

  const message = error instanceof Error ? error.message : "Internal server error.";

  if (message === "UNAUTHORIZED") {
   return res.status(401).json({
    success: false,
    message: "Unauthorized.",
   });
  }

  if (message === "FORBIDDEN") {
   return res.status(403).json({
    success: false,
    message: "Only SUPER_ADMIN can manage Affiliate Stores.",
   });
  }

  return res.status(500).json({
   success: false,
   message: "Internal server error.",
  });
 }
}
