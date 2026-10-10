import type { NextApiRequest, NextApiResponse } from "next";

import { connectDB } from "~/lib/mongodb";
import { requireAuth } from "~/lib/permissions";

import { Affiliate } from "~/models/Affiliate";
import { AffiliateStore } from "~/models/AffiliateStore";
import { Store } from "~/models/Store";

type ApiResponse = {
 success: boolean;
 message?: string;
 data?: {
  id: string;
  code: string;
  status: string;
  stores: {
   id: string;
   name: string;
   code?: string;
   commissionRate: number;
   status: string;
  }[];
 };
};

function getErrorStatus(error: unknown) {
 const message = error instanceof Error ? error.message : "";

 if (message === "UNAUTHORIZED") return 401;
 if (message === "FORBIDDEN") return 403;

 return 500;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<ApiResponse>) {
 if (req.method !== "GET") {
  res.setHeader("Allow", ["GET"]);

  return res.status(405).json({
   success: false,
   message: "Phương thức không được hỗ trợ.",
  });
 }

 try {
  await connectDB();

  const user = await requireAuth(req);

  if (user.role !== "AFFILIATE") {
   return res.status(403).json({
    success: false,
    message: "Bạn không có quyền truy cập dữ liệu affiliate.",
   });
  }

  const affiliate = await Affiliate.findOne({
   userId: user.id,
  })
   .select("_id code status")
   .lean();

  if (!affiliate) {
   return res.status(404).json({
    success: false,
    message: "Không tìm thấy tài khoản affiliate.",
   });
  }

  const affiliateStores = await AffiliateStore.find({
   affiliateId: affiliate._id,
   status: "ACTIVE",
  })
   .select("storeId commissionRate status")
   .lean();

  const storeIds = affiliateStores.map((item) => item.storeId);

  const stores = storeIds.length
   ? await Store.find({
      _id: { $in: storeIds },
     })
      .select("_id name code")
      .lean()
   : [];

  const storeById = new Map(stores.map((store) => [store._id.toString(), store]));

  const linkedStores = affiliateStores
   .map((affiliateStore) => {
    const store = storeById.get(affiliateStore.storeId.toString());

    if (!store) return null;

    return {
     id: store._id.toString(),
     name: store.name,
     code: store.code,
     commissionRate: affiliateStore.commissionRate,
     status: affiliateStore.status,
    };
   })
   .filter((store) => store !== null);

  return res.status(200).json({
   success: true,
   data: {
    id: affiliate._id.toString(),
    code: affiliate.code,
    status: affiliate.status,
    stores: linkedStores,
   },
  });
 } catch (error) {
  console.error("Affiliate me API error:", error);

  const statusCode = getErrorStatus(error);

  return res.status(statusCode).json({
   success: false,
   message: statusCode === 401 ? "Bạn chưa đăng nhập." : statusCode === 403 ? "Bạn không có quyền truy cập dữ liệu này." : "Đã xảy ra lỗi máy chủ.",
  });
 }
}
