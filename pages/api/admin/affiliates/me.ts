import type { NextApiRequest, NextApiResponse } from "next";

import { connectDB } from "~/lib/mongodb";
import { requireAuth } from "~/lib/permissions";
import { Affiliate } from "~/models/Affiliate";
import { AffiliateStore } from "~/models/AffiliateStore";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
 if (req.method !== "GET") {
  res.setHeader("Allow", ["GET"]);

  return res.status(405).json({
   success: false,
   message: "Method not allowed.",
  });
 }

 try {
  await connectDB();

  const user = await requireAuth(req);

  if (user.role !== "AFFILIATE") {
   return res.status(403).json({
    success: false,
    message: "Chỉ tài khoản affiliate mới được truy cập.",
   });
  }

  const affiliate = await Affiliate.findOne({
   userId: user.id,
   status: "ACTIVE",
  })
   .select("_id code status")
   .lean();

  if (!affiliate) {
   return res.status(404).json({
    success: false,
    message: "Không tìm thấy hồ sơ affiliate đang hoạt động.",
   });
  }

  const affiliateStores = await AffiliateStore.find({
   affiliateId: affiliate._id,
   status: "ACTIVE",
  })
   .populate({
    path: "storeId",
    select: "_id name slug",
   })
   .select("_id storeId commissionRate status")
   .lean();

  return res.status(200).json({
   success: true,
   affiliate: {
    id: String(affiliate._id),
    code: affiliate.code,
    status: affiliate.status,
   },
   stores: affiliateStores,
  });
 } catch (error: any) {
  if (error?.message === "UNAUTHORIZED") {
   return res.status(401).json({
    success: false,
    message: "Vui lòng đăng nhập.",
   });
  }

  if (error?.message === "FORBIDDEN") {
   return res.status(403).json({
    success: false,
    message: "Bạn không có quyền truy cập.",
   });
  }

  console.error("GET /api/affiliate/me error:", error);

  return res.status(500).json({
   success: false,
   message: "Không thể tải thông tin affiliate.",
  });
 }
}
