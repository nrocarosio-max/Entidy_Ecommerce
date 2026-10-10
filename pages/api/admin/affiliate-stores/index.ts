import type { NextApiRequest, NextApiResponse } from "next";
import mongoose from "mongoose";

import { connectDB } from "~/lib/mongodb";
import { requireSuperAdmin } from "~/lib/permissions";
import { Affiliate } from "~/models/Affiliate";
import { AffiliateStore } from "~/models/AffiliateStore";
import { Store } from "~/models/Store";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
 try {
  await connectDB();
  await requireSuperAdmin(req);

  if (req.method === "GET") {
   const { search = "", storeId = "", affiliateId = "", status = "", page = "1", limit = "10" } = req.query;

   const currentPage = Math.max(Number(page) || 1, 1);
   const currentLimit = Math.min(Math.max(Number(limit) || 10, 1), 100);

   const filter: Record<string, unknown> = {};

   if (typeof storeId === "string" && storeId) {
    if (!mongoose.isValidObjectId(storeId)) {
     return res.status(400).json({
      success: false,
      message: "Invalid store ID.",
     });
    }

    filter.storeId = new mongoose.Types.ObjectId(storeId);
   }

   if (typeof affiliateId === "string" && affiliateId) {
    if (!mongoose.isValidObjectId(affiliateId)) {
     return res.status(400).json({
      success: false,
      message: "Invalid affiliate ID.",
     });
    }

    filter.affiliateId = new mongoose.Types.ObjectId(affiliateId);
   }

   if (typeof status === "string" && status) {
    if (!["ACTIVE", "INACTIVE", "SUSPENDED"].includes(status)) {
     return res.status(400).json({
      success: false,
      message: "Invalid Affiliate Store status.",
     });
    }

    filter.status = status;
   }

   if (typeof search === "string" && search.trim()) {
    const regex = new RegExp(search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");

    const matchingAffiliates = await Affiliate.find({
     $or: [{ code: regex }],
    })
     .select("_id")
     .lean();

    const matchingStores = await Store.find({
     $or: [{ name: regex }, { slug: regex }],
    })
     .select("_id")
     .lean();

    filter.$or = [{ affiliateId: { $in: matchingAffiliates.map((item) => item._id) } }, { storeId: { $in: matchingStores.map((item) => item._id) } }];
   }

   const [affiliateStores, total, summary] = await Promise.all([
    AffiliateStore.find(filter)
     .populate({
      path: "affiliateId",
      select: "code status userId",
      populate: {
       path: "userId",
       select: "name email phone",
      },
     })
     .populate({
      path: "storeId",
      select: "name slug isActive",
     })
     .populate("approvedBy", "name email")
     .sort({ createdAt: -1 })
     .skip((currentPage - 1) * currentLimit)
     .limit(currentLimit)
     .lean(),

    AffiliateStore.countDocuments(filter),

    AffiliateStore.aggregate([
     { $match: filter },
     {
      $group: {
       _id: null,
       totalLinks: { $sum: 1 },
       activeLinks: {
        $sum: {
         $cond: [{ $eq: ["$status", "ACTIVE"] }, 1, 0],
        },
       },
       averageCommissionRate: { $avg: "$commissionRate" },
      },
     },
    ]),
   ]);

   return res.status(200).json({
    success: true,
    affiliateStores,
    pagination: {
     page: currentPage,
     limit: currentLimit,
     total,
     totalPages: Math.max(Math.ceil(total / currentLimit), 1),
    },
    summary: {
     totalLinks: summary[0]?.totalLinks ?? 0,
     activeLinks: summary[0]?.activeLinks ?? 0,
     averageCommissionRate: summary[0]?.averageCommissionRate ?? 0,
    },
   });
  }

  if (req.method === "POST") {
   const { affiliateId, storeId, commissionRate = 5, status = "ACTIVE", note = "" } = req.body ?? {};

   if (typeof affiliateId !== "string" || !mongoose.isValidObjectId(affiliateId) || typeof storeId !== "string" || !mongoose.isValidObjectId(storeId)) {
    return res.status(400).json({
     success: false,
     message: "Valid affiliateId and storeId are required.",
    });
   }

   if (typeof commissionRate !== "number" || !Number.isFinite(commissionRate) || commissionRate < 0 || commissionRate > 100) {
    return res.status(400).json({
     success: false,
     message: "Commission rate must be between 0 and 100.",
    });
   }

   if (!["ACTIVE", "INACTIVE", "SUSPENDED"].includes(status)) {
    return res.status(400).json({
     success: false,
     message: "Invalid Affiliate Store status.",
    });
   }

   if (typeof note !== "string") {
    return res.status(400).json({
     success: false,
     message: "Invalid note.",
    });
   }

   const [affiliate, store] = await Promise.all([Affiliate.findById(affiliateId).select("_id"), Store.findById(storeId).select("_id isActive")]);

   if (!affiliate) {
    return res.status(404).json({
     success: false,
     message: "Affiliate not found.",
    });
   }

   if (!store || !store.isActive) {
    return res.status(400).json({
     success: false,
     message: "Store not found or inactive.",
    });
   }

   const existingLink = await AffiliateStore.findOne({
    affiliateId,
    storeId,
   });

   if (existingLink) {
    return res.status(409).json({
     success: false,
     message: "This Affiliate is already linked to the store.",
    });
   }

   const affiliateStore = await AffiliateStore.create({
    affiliateId,
    storeId,
    commissionRate,
    status,
    note: note.trim(),
    approvedBy: null,
    approvedAt: null,
   });

   return res.status(201).json({
    success: true,
    message: "Affiliate Store link created successfully.",
    affiliateStore,
   });
  }

  res.setHeader("Allow", ["GET", "POST"]);

  return res.status(405).json({
   success: false,
   message: `Method ${req.method} not allowed.`,
  });
 } catch (error: unknown) {
  console.error("AFFILIATE STORES API ERROR:", error);

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

  if (typeof error === "object" && error !== null && "code" in error && error.code === 11000) {
   return res.status(409).json({
    success: false,
    message: "This Affiliate is already linked to the store.",
   });
  }

  return res.status(500).json({
   success: false,
   message: "Internal server error.",
  });
 }
}
