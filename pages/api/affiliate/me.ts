import type { NextApiRequest, NextApiResponse } from "next";

import { connectDB } from "~/lib/mongodb";
import { requireAuth } from "~/lib/permissions";

import { Affiliate } from "~/models/Affiliate";
import { AffiliateStore } from "~/models/AffiliateStore";
import { Store } from "~/models/Store";
import { Order } from "~/models/Order";
import { OrderItem } from "~/models/OrderItem";
import { AffiliateCommission } from "~/models/AffiliateCommission";
import { OrderStatus } from "~/models/OrderStatus";
type AffiliateOrderRow = {
 orderId: string;
 orderNumber: string;
 orderDate: Date;
 storeId: string;
 storeName: string;
 orderStatus: {
  name: string;
  code: string;
  color: string;
 } | null;
 productId: string;
 productName: string;
 quantity: number;
 productSubtotal: number;
 currency: string;
 commissionStatus: "PENDING" | "APPROVED" | "PAID" | "REVERSED" | "ADJUSTMENT_PENDING" | "NOT_CREATED";
 commissionMessage: string;
 commissionRate: number;
 commissionAmount: number | null;
 commissionEligible: boolean;
};
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
  orders: {
   orderId: string;
   orderNumber: string;
   orderDate: Date;
   storeId: string;
   storeName: string;
   orderStatus: {
    name: string;
    code: string;
    color: string;
   } | null;
   productId: string;
   productName: string;
   quantity: number;
   productSubtotal: number;
   currency: string;
   commissionStatus: "PENDING" | "APPROVED" | "PAID" | "REVERSED" | "ADJUSTMENT_PENDING" | "NOT_CREATED";
   commissionMessage: string;
   commissionRate: number;
   commissionAmount: number | null;
   commissionEligible: boolean;
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

  const linkedStores = affiliateStores.reduce<
   {
    id: string;
    name: string;
    code?: string;
    commissionRate: number;
    status: string;
   }[]
  >((result, affiliateStore) => {
   const store = storeById.get(affiliateStore.storeId.toString());

   if (!store) {
    return result;
   }

   result.push({
    id: store._id.toString(),
    name: store.name,
    code: store.code,
    commissionRate: affiliateStore.commissionRate,
    status: affiliateStore.status,
   });

   return result;
  }, []);

  const orders = await Order.find({
   affiliateId: affiliate._id,
   isDeleted: { $ne: true },
  })
   .select("_id orderNumber storeId statusId currency createdAt")
   .sort({ createdAt: -1 })
   .lean();

  const orderIds = orders.map((order: any) => order._id);

  const [orderItems, commissions, orderStatuses] = await Promise.all([
   OrderItem.find({
    orderId: { $in: orderIds },
   })
    .select("_id orderId productId productSnapshot quantity subtotal currency affiliateCommissionRate")
    .lean(),

   AffiliateCommission.find({
    affiliateId: affiliate._id,
    orderId: { $in: orderIds },
   })
    .select("_id orderId orderItemId status commissionRate amount currency entryType adjustmentReason relatedCommissionId")
    .lean(),

   OrderStatus.find({
    _id: { $in: orders.map((order) => order.statusId) },
   })
    .select("_id name code color")
    .lean(),
  ]);

  const orderById = new Map(orders.map((order) => [order._id.toString(), order]));

  const orderStatusById = new Map(orderStatuses.map((status) => [status._id.toString(), status]));

  const commissionByItemId = new Map(
   commissions
    .filter((commission) => (commission.entryType ?? "COMMISSION") === "COMMISSION" && commission.orderItemId)
    .map((commission) => [commission.orderItemId!.toString(), commission]),
  );

  const adjustmentsByCommissionId = new Map<string, typeof commissions>();

  for (const commission of commissions) {
   if (commission.entryType !== "ADJUSTMENT" || !commission.relatedCommissionId) {
    continue;
   }

   const commissionId = commission.relatedCommissionId.toString();
   const adjustments = adjustmentsByCommissionId.get(commissionId) ?? [];

   adjustments.push(commission);
   adjustmentsByCommissionId.set(commissionId, adjustments);
  }

  const orderStoreIds = Array.from(new Set(orders.map((order) => order.storeId.toString())));

  const orderStores = orderStoreIds.length
   ? await Store.find({
      _id: { $in: orderStoreIds },
     })
      .select("_id name")
      .lean()
   : [];

  const storeNameById = new Map(orderStores.map((store) => [store._id.toString(), store.name]));

  const orderRows: AffiliateOrderRow[] = orderItems.map((item: any) => {
   const order = orderById.get(item.orderId.toString())!;

   const commission = commissionByItemId.get(item._id.toString());
   const orderStatus = orderStatusById.get(order.statusId.toString());

   const statusCode = String(orderStatus?.code ?? "").toUpperCase();

   const commissionEligible = statusCode === "DELIVERED";

   const adjustments = commission ? (adjustmentsByCommissionId.get(commission._id.toString()) ?? []) : [];

   const hasPendingAdjustment = adjustments.some((adjustment) => adjustment.status === "PENDING");

   let commissionStatus: "PENDING" | "APPROVED" | "PAID" | "REVERSED" | "ADJUSTMENT_PENDING" | "NOT_CREATED" = commission?.status ?? "NOT_CREATED";

   let commissionMessage = "Hoa hồng chưa phát sinh.";

   if (statusCode === "CANCELLED") {
    commissionStatus = commission?.status === "REVERSED" ? "REVERSED" : hasPendingAdjustment ? "ADJUSTMENT_PENDING" : (commission?.status ?? "NOT_CREATED");

    commissionMessage = "Đơn hàng đã hủy. Hoa hồng bị hủy hoặc xử lý thu hồi theo trạng thái thanh toán.";
   } else if (statusCode === "RETURNED") {
    commissionStatus = commission?.status === "REVERSED" ? "REVERSED" : hasPendingAdjustment ? "ADJUSTMENT_PENDING" : (commission?.status ?? "NOT_CREATED");

    commissionMessage = "Đơn hàng đã hoàn trả. Hoa hồng bị hủy hoặc xử lý thu hồi theo trạng thái thanh toán.";
   } else if (statusCode === "RETURNING") {
    commissionMessage = "Đơn hàng đang trong quá trình hoàn trả.";
   } else if (commission?.status === "REVERSED") {
    commissionStatus = "REVERSED";
    commissionMessage = "Hoa hồng đã bị đảo.";
   } else if (hasPendingAdjustment) {
    commissionStatus = "ADJUSTMENT_PENDING";
    commissionMessage = "Hoa hồng đang chờ xử lý thu hồi.";
   } else if (commissionEligible && commission) {
    commissionStatus = commission.status;
    commissionMessage = "Đơn hàng đã giao thành công.";
   } else if (!commissionEligible) {
    commissionMessage = "Hoa hồng chỉ phát sinh khi đơn hàng được giao thành công.";
   }

   return {
    orderId: order._id.toString(),
    orderNumber: order.orderNumber,
    orderDate: order.createdAt,
    storeId: order.storeId.toString(),
    storeName: storeNameById.get(order.storeId.toString()) ?? "Unknown store",
    orderStatus: orderStatus
     ? {
        name: orderStatus.name,
        code: orderStatus.code,
        color: orderStatus.color,
       }
     : null,
    productId: item.productId.toString(),
    productName: item.productSnapshot?.name ?? "",
    quantity: item.quantity,
    productSubtotal: item.subtotal,
    currency: item.currency || order.currency,
    commissionStatus,
    commissionMessage,
    commissionRate: commission?.commissionRate ?? item.affiliateCommissionRate ?? 0,
    commissionAmount: commission?.amount ?? null,
    commissionEligible,
   };
  });

  return res.status(200).json({
   success: true,
   data: {
    id: affiliate._id.toString(),
    code: affiliate.code,
    status: affiliate.status,
    stores: linkedStores,
    orders: orderRows,
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
