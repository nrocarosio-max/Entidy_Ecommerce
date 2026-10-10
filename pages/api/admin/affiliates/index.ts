import type { NextApiRequest, NextApiResponse } from "next";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";

import { connectDB } from "~/lib/mongodb";
import { requireSuperAdmin } from "~/lib/permissions";

import { User } from "~/models/User";
import { Role } from "~/models/Role";
import { Store } from "~/models/Store";
import { Affiliate } from "~/models/Affiliate";
import { AffiliateStore } from "~/models/AffiliateStore";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
 let session: mongoose.ClientSession | null = null;

 try {
  await connectDB();
  await requireSuperAdmin(req);

  /*
   * ============================================================
   * GET AFFILIATES
   * ============================================================
   */
  if (req.method === "GET") {
   const { search = "", status = "", storeId = "", page = "1", limit = "20" } = req.query;

   const currentPage = Math.max(Number(page) || 1, 1);
   const currentLimit = Math.min(Math.max(Number(limit) || 20, 1), 100);

   const filter: Record<string, any> = {};

   if (typeof status === "string" && status.trim()) {
    if (!["PENDING", "ACTIVE", "REJECTED", "SUSPENDED"].includes(status.trim())) {
     return res.status(400).json({
      success: false,
      message: "Invalid Affiliate status.",
     });
    }

    filter.status = status.trim();
   }

   if (typeof storeId === "string" && storeId.trim()) {
    if (!mongoose.isValidObjectId(storeId)) {
     return res.status(400).json({
      success: false,
      message: "Invalid store ID.",
     });
    }

    filter._id = {
     $in: await AffiliateStore.distinct("affiliateId", {
      storeId,
     }),
    };
   }

   const searchValue = typeof search === "string" ? search.trim() : "";

   if (searchValue) {
    const regex = new RegExp(searchValue.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");

    const matchingUsers = await User.find({
     $or: [{ name: regex }, { email: regex }, { phone: regex }],
    })
     .select("_id")
     .lean();

    filter.$and = [
     {
      $or: [{ code: regex }, { userId: { $in: matchingUsers.map((user) => user._id) } }],
     },
    ];
   }

   const total = await Affiliate.countDocuments(filter);

   const affiliates = await Affiliate.find(filter)
    .populate({
     path: "userId",
     select: "_id name email phone isActive createdAt",
    })
    .sort({ createdAt: -1 })
    .skip((currentPage - 1) * currentLimit)
    .limit(currentLimit)
    .lean();

   const affiliateIds = affiliates.map((affiliate) => affiliate._id);

   const affiliateStores = await AffiliateStore.find({
    affiliateId: { $in: affiliateIds },
   })
    .populate({
     path: "storeId",
     select: "_id name slug isActive",
    })
    .sort({ createdAt: -1 })
    .lean();

   const storesByAffiliate = new Map<string, typeof affiliateStores>();

   for (const affiliateStore of affiliateStores) {
    const key = String(affiliateStore.affiliateId);
    const existing = storesByAffiliate.get(key) || [];

    existing.push(affiliateStore);
    storesByAffiliate.set(key, existing);
   }

   const results = affiliates.map((affiliate) => ({
    ...affiliate,
    stores: storesByAffiliate.get(String(affiliate._id)) || [],
   }));

   return res.status(200).json({
    success: true,
    affiliates: results,
    pagination: {
     page: currentPage,
     limit: currentLimit,
     total,
     totalPages: Math.max(Math.ceil(total / currentLimit), 1),
    },
   });
  }

  /*
   * ============================================================
   * CREATE AFFILIATE
   * ============================================================
   */
  if (req.method === "POST") {
   const { name, email, phone = "", password, storeId, commissionRate = 5, note = "", isActive = true } = req.body ?? {};

   if (typeof name !== "string" || !name.trim()) {
    return res.status(400).json({
     success: false,
     message: "Name is required.",
    });
   }

   if (typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return res.status(400).json({
     success: false,
     message: "A valid email is required.",
    });
   }

   if (typeof password !== "string" || password.length < 8) {
    return res.status(400).json({
     success: false,
     message: "Password must be at least 8 characters.",
    });
   }

   if (typeof storeId !== "string" || !mongoose.isValidObjectId(storeId)) {
    return res.status(400).json({
     success: false,
     message: "A valid store is required.",
    });
   }

   if (typeof commissionRate !== "number" || !Number.isFinite(commissionRate) || commissionRate < 0 || commissionRate > 100) {
    return res.status(400).json({
     success: false,
     message: "Commission rate must be between 0 and 100.",
    });
   }

   if (typeof phone !== "string" || typeof note !== "string" || typeof isActive !== "boolean") {
    return res.status(400).json({
     success: false,
     message: "Invalid phone, note or active status.",
    });
   }

   const normalizedEmail = email.trim().toLowerCase();

   const existingUser = await User.findOne({
    email: normalizedEmail,
   }).lean();

   if (existingUser) {
    return res.status(409).json({
     success: false,
     message: "A user with this email already exists.",
    });
   }

   const [role, store] = await Promise.all([
    Role.findOne({
     code: "AFFILIATE",
     isActive: true,
    }),
    Store.findById(storeId),
   ]);

   if (!role) {
    return res.status(400).json({
     success: false,
     message: "Active AFFILIATE role was not found.",
    });
   }

   if (!store || !store.isActive) {
    return res.status(400).json({
     success: false,
     message: "Store not found or inactive.",
    });
   }

   const passwordHash = await bcrypt.hash(password, 12);

   session = await mongoose.startSession();

   let responseData: {
    userId: mongoose.Types.ObjectId;
    affiliateId: mongoose.Types.ObjectId;
    code: string;
   } | null = null;

   await session.withTransaction(async () => {
    const [user] = await User.create(
     [
      {
       name: name.trim(),
       email: normalizedEmail,
       phone: phone.trim(),
       passwordHash,
       roleId: role._id,
       storeId: null,
       isActive,
      },
     ],
     { session },
    );

    const code = `AFF${randomBytes(5).toString("hex").toUpperCase()}`;

    const [affiliate] = await Affiliate.create(
     [
      {
       userId: user._id,
       code,
       status: isActive ? "ACTIVE" : "SUSPENDED",
       note: note.trim(),
      },
     ],
     { session },
    );

    await AffiliateStore.create(
     [
      {
       affiliateId: affiliate._id,
       storeId: store._id,
       commissionRate,
       status: isActive ? "ACTIVE" : "INACTIVE",
       approvedBy: null,
       approvedAt: null,
       note: note.trim(),
      },
     ],
     { session },
    );

    responseData = {
     userId: user._id,
     affiliateId: affiliate._id,
     code: affiliate.code,
    };
   });

   return res.status(201).json({
    success: true,
    message: "Affiliate account created successfully.",
    affiliate: responseData,
   });
  }

  /*
   * ============================================================
   * UPDATE AFFILIATE
   * ============================================================
   */
  if (req.method === "PUT") {
   const { affiliateId, name, email, phone, isActive, status, code, note, stores } = req.body ?? {};

   if (typeof affiliateId !== "string" || !mongoose.isValidObjectId(affiliateId)) {
    return res.status(400).json({
     success: false,
     message: "Invalid Affiliate ID.",
    });
   }

   const allowedStatuses = ["PENDING", "ACTIVE", "REJECTED", "SUSPENDED"];

   if (status !== undefined && !allowedStatuses.includes(status)) {
    return res.status(400).json({
     success: false,
     message: "Invalid Affiliate status.",
    });
   }

   if (name !== undefined && (typeof name !== "string" || !name.trim())) {
    return res.status(400).json({
     success: false,
     message: "Name cannot be empty.",
    });
   }

   if (email !== undefined && (typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))) {
    return res.status(400).json({
     success: false,
     message: "A valid email is required.",
    });
   }

   if (phone !== undefined && typeof phone !== "string") {
    return res.status(400).json({
     success: false,
     message: "Invalid phone number.",
    });
   }

   if (isActive !== undefined && typeof isActive !== "boolean") {
    return res.status(400).json({
     success: false,
     message: "Invalid account status.",
    });
   }

   if (code !== undefined && (typeof code !== "string" || !/^[A-Z0-9_-]{3,50}$/i.test(code.trim()))) {
    return res.status(400).json({
     success: false,
     message: "Affiliate code must be 3-50 characters.",
    });
   }

   if (note !== undefined && typeof note !== "string") {
    return res.status(400).json({
     success: false,
     message: "Invalid note.",
    });
   }

   if (stores !== undefined && !Array.isArray(stores)) {
    return res.status(400).json({
     success: false,
     message: "Stores must be an array.",
    });
   }

   const affiliate = await Affiliate.findById(affiliateId);

   if (!affiliate) {
    return res.status(404).json({
     success: false,
     message: "Affiliate not found.",
    });
   }

   const user = await User.findById(affiliate.userId);

   if (!user) {
    return res.status(404).json({
     success: false,
     message: "Affiliate user not found.",
    });
   }

   // Validate store configuration before updating.
   const storeUpdates: Array<{
    storeId: string;
    commissionRate?: number;
    status?: string;
   }> = [];

   if (stores !== undefined) {
    const seenStoreIds = new Set<string>();

    for (const item of stores) {
     if (!item || typeof item.storeId !== "string" || !mongoose.isValidObjectId(item.storeId)) {
      return res.status(400).json({
       success: false,
       message: "Invalid store ID.",
      });
     }

     const normalizedStoreId = item.storeId;

     if (seenStoreIds.has(normalizedStoreId)) {
      return res.status(400).json({
       success: false,
       message: "Duplicate store ID.",
      });
     }

     seenStoreIds.add(normalizedStoreId);

     if (
      item.commissionRate !== undefined &&
      (typeof item.commissionRate !== "number" || !Number.isFinite(item.commissionRate) || item.commissionRate < 0 || item.commissionRate > 100)
     ) {
      return res.status(400).json({
       success: false,
       message: "Commission rate must be between 0 and 100.",
      });
     }

     if (item.status !== undefined && !["ACTIVE", "INACTIVE", "SUSPENDED"].includes(item.status)) {
      return res.status(400).json({
       success: false,
       message: "Invalid AffiliateStore status.",
      });
     }

     storeUpdates.push({
      storeId: normalizedStoreId,
      commissionRate: item.commissionRate,
      status: item.status,
     });
    }

    const requestedStoreIds = storeUpdates.map((item) => item.storeId);

    const [existingLinks, storesInDatabase] = await Promise.all([
     AffiliateStore.find({
      affiliateId: affiliate._id,
      storeId: { $in: requestedStoreIds },
     }).select("storeId"),

     Store.find({
      _id: { $in: requestedStoreIds },
     }).select("_id name isActive"),
    ]);

    const existingStoreIds = new Set(existingLinks.map((item) => String(item.storeId)));

    const storeMap = new Map(storesInDatabase.map((store) => [String(store._id), store]));

    for (const item of storeUpdates) {
     const store = storeMap.get(item.storeId);

     if (!store) {
      return res.status(400).json({
       success: false,
       message: `Store ${item.storeId} not found.`,
      });
     }

     // New links can only be created for active stores.
     if (!existingStoreIds.has(item.storeId) && !store.isActive) {
      return res.status(400).json({
       success: false,
       message: `Store "${store.name}" is inactive.`,
      });
     }
    }
   }

   const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : undefined;

   if (normalizedEmail !== undefined) {
    const duplicateEmail = await User.findOne({
     email: normalizedEmail,
     _id: { $ne: user._id },
    }).select("_id");

    if (duplicateEmail) {
     return res.status(409).json({
      success: false,
      message: "Email is already used by another account.",
     });
    }
   }

   const normalizedCode = typeof code === "string" ? code.trim().toUpperCase() : undefined;

   if (normalizedCode !== undefined) {
    const duplicateCode = await Affiliate.findOne({
     code: normalizedCode,
     _id: { $ne: affiliate._id },
    }).select("_id");

    if (duplicateCode) {
     return res.status(409).json({
      success: false,
      message: "Affiliate code is already in use.",
     });
    }
   }

   // Update user information.
   if (name !== undefined) user.name = name.trim();
   if (normalizedEmail !== undefined) user.email = normalizedEmail;
   if (phone !== undefined) user.phone = phone.trim();
   if (isActive !== undefined) user.isActive = isActive;

   // Update Affiliate information.
   if (status !== undefined) affiliate.status = status;
   if (normalizedCode !== undefined) affiliate.code = normalizedCode;
   if (note !== undefined) affiliate.note = note.trim();

   // Create new store links or update existing links.
   for (const item of storeUpdates) {
    const existingLink = await AffiliateStore.findOne({
     affiliateId: affiliate._id,
     storeId: item.storeId,
    });

    if (existingLink) {
     // Update only the fields explicitly provided.
     if (item.commissionRate !== undefined) {
      existingLink.commissionRate = item.commissionRate;
     }

     if (item.status !== undefined) {
      existingLink.status = item.status;
     }

     await existingLink.save();
     continue;
    }

    // Default status depends on the Affiliate and User status.
    const shouldActivate = affiliate.status === "ACTIVE" && user.isActive === true;

    await AffiliateStore.create({
     affiliateId: affiliate._id,
     storeId: item.storeId,
     commissionRate: item.commissionRate ?? 5,
     status: shouldActivate ? "ACTIVE" : "INACTIVE",
     approvedBy: null,
     approvedAt: null,
     note: "",
    });
   }

   await Promise.all([user.save(), affiliate.save()]);

   await Promise.all([user.save(), affiliate.save()]);

   return res.status(200).json({
    success: true,
    message: "Affiliate updated successfully.",
   });
  }
  res.setHeader("Allow", ["GET", "POST", "PUT"]);

  return res.status(405).json({
   success: false,
   message: `Method ${req.method} not allowed.`,
  });
 } catch (error: any) {
  console.error("Admin Affiliates API error:", error);

  if (error?.message === "UNAUTHORIZED") {
   return res.status(401).json({
    success: false,
    message: "Unauthorized.",
   });
  }

  if (error?.message === "FORBIDDEN") {
   return res.status(403).json({
    success: false,
    message: "Only SUPER_ADMIN can manage Affiliates.",
   });
  }

  if (error?.code === 11000) {
   return res.status(409).json({
    success: false,
    message: "Email or Affiliate code already exists.",
   });
  }

  if (error?.name === "ValidationError") {
   return res.status(400).json({
    success: false,
    message: error.message,
   });
  }

  return res.status(500).json({
   success: false,
   message: error?.message || "Internal server error.",
  });
 } finally {
  if (session) {
   await session.endSession();
  }
 }
}
