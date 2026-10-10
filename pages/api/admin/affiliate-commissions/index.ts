import type { NextApiRequest, NextApiResponse } from "next";
import mongoose from "mongoose";

import { connectDB } from "~/lib/mongodb";
import { requireSuperAdmin } from "~/lib/permissions";

import { AffiliateCommission } from "~/models/AffiliateCommission";
import { Affiliate } from "~/models/Affiliate";
import { Product } from "~/models/Product";
import { User } from "~/models/User";

const COMMISSION_STATUSES = ["PENDING", "APPROVED", "PAID", "REVERSED"] as const;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
 await connectDB();

 const authorized = await requireSuperAdmin(req);

 if (!authorized) {
  return res.status(403).json({
   success: false,
   message: "Bạn không có quyền truy cập.",
  });
 }

 if (req.method !== "GET") {
  res.setHeader("Allow", ["GET"]);
  return res.status(405).json({
   success: false,
   message: "Method not allowed.",
  });
 }

 try {
  const search = typeof req.query.search === "string" ? req.query.search.trim() : "";

  const status = typeof req.query.status === "string" ? req.query.status.trim().toUpperCase() : "";

  const storeId = typeof req.query.storeId === "string" ? req.query.storeId.trim() : "";

  const affiliateId = typeof req.query.affiliateId === "string" ? req.query.affiliateId.trim() : "";

  const page = Math.max(1, Number.parseInt(String(req.query.page || "1"), 10) || 1);

  const limit = Math.min(100, Math.max(1, Number.parseInt(String(req.query.limit || "10"), 10) || 10));

  if (status && !COMMISSION_STATUSES.includes(status as (typeof COMMISSION_STATUSES)[number])) {
   return res.status(400).json({
    success: false,
    message: "Trạng thái hoa hồng không hợp lệ.",
   });
  }

  if ((storeId && !mongoose.isValidObjectId(storeId)) || (affiliateId && !mongoose.isValidObjectId(affiliateId))) {
   return res.status(400).json({
    success: false,
    message: "ID cửa hàng hoặc Affiliate không hợp lệ.",
   });
  }

  const filter: Record<string, unknown> = {};

  if (status) {
   filter.status = status;
  }

  if (storeId) {
   filter.storeId = new mongoose.Types.ObjectId(storeId);
  }

  if (affiliateId) {
   filter.affiliateId = new mongoose.Types.ObjectId(affiliateId);
  }

  if (search) {
   const regex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");

   const [affiliateIds, userIds, productIds] = await Promise.all([
    Affiliate.find({ code: regex }).distinct("_id"),

    User.find({
     $or: [{ name: regex }, { email: regex }, { phone: regex }],
    }).distinct("_id"),

    Product.find({ name: regex }).distinct("_id"),
   ]);

   const matchedAffiliates = await Affiliate.find({
    $or: [{ _id: { $in: affiliateIds } }, { userId: { $in: userIds } }],
   }).distinct("_id");

   const conditions: Record<string, unknown>[] = [{ orderNumber: regex }, { productName: regex }, { affiliateId: { $in: matchedAffiliates } }];

   if (mongoose.isValidObjectId(search)) {
    conditions.push({
     orderId: new mongoose.Types.ObjectId(search),
    });
    conditions.push({
     productId: new mongoose.Types.ObjectId(search),
    });
   }

   if (productIds.length) {
    conditions.push({ productId: { $in: productIds } });
   }

   filter.$or = conditions;
  }

  const skip = (page - 1) * limit;

  const [commissions, total] = await Promise.all([
   AffiliateCommission.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate({
     path: "affiliateId",
     select: "code status userId",
     populate: {
      path: "userId",
      select: "name email phone",
     },
    })
    .populate({
     path: "affiliateStoreId",
     select: "commissionRate status",
    })
    .populate({
     path: "storeId",
     select: "name slug",
    })
    .populate({
     path: "orderId",
     select: "orderNumber code status totalAmount",
    })
    .populate({
     path: "productId",
     select: "name slug",
    })
    .populate({
     path: "approvedBy",
     select: "name email",
    })
    .lean(),

   AffiliateCommission.countDocuments(filter),
  ]);

  return res.status(200).json({
   success: true,
   commissions,
   pagination: {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
   },
  });
 } catch (error) {
  console.error("GET /api/admin/affiliate-commissions error:", error);

  return res.status(500).json({
   success: false,
   message: "Không thể tải danh sách hoa hồng.",
  });
 }
}
