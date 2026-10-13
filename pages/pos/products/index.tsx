import { useCallback, useEffect, useState } from "react";
import { ResponsiveContainer, AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip } from "recharts";
import type { NextPage } from "next";
import Link from "next/link";
import { FaBox, FaBoxes, FaChartLine, FaClipboardList, FaExclamationTriangle, FaRedo, FaShoppingCart, FaUsers } from "react-icons/fa";

import PosLayout from "~/components/pos/PosLayout";

interface RevenueItem {
 currency: string;
 total: number;
}

interface DashboardData {
 stats: {
  totalOrders: number;
  pendingOrders: number;
  deliveredOrders: number;
  totalCustomers: number;
  totalProducts: number;
  lowStockProducts: number;
  revenue: RevenueItem[];
 };
 salesOverview: {
  date: string;
  currency: string;
  total: number;
  orders: number;
 }[];
 recentOrders: {
  _id: string;
  orderNumber: string;
  customerSnapshot?: {
   name?: string;
   phone?: string;
  };
  customerId?: {
   name?: string;
   phone?: string;
  };
  total: number;
  currency: string;
  paymentStatus: string;
  statusId?: {
   name?: string;
   code?: string;
  };
  createdAt: string;
 }[];
 lowStockProducts: {
  _id: string;
  name: string;
  sku: string;
  quantity: number;
  lowStockThreshold: number;
  currency: string;
 }[];
}

interface ApiResponse {
 success: boolean;
 message?: string;
 stats?: DashboardData["stats"];
 salesOverview?: DashboardData["salesOverview"];
 recentOrders?: DashboardData["recentOrders"];
 lowStockProducts?: DashboardData["lowStockProducts"];
}

const formatMoney = (amount: number, currency: string) => {
 try {
  return new Intl.NumberFormat("vi-VN", {
   style: "currency",
   currency,
   maximumFractionDigits: 0,
  }).format(amount);
 } catch {
  return `${amount.toLocaleString("vi-VN")} ${currency}`;
 }
};

const formatDate = (value: string) =>
 new Date(value).toLocaleString("vi-VN", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
 });

const statusLabels: Record<string, string> = {
 PENDING: "Chờ xử lý",
 CONFIRMED: "Đã xác nhận",
 PROCESSING: "Đang xử lý",
 SHIPPED: "Đang giao",
 DELIVERED: "Đã giao",
 CANCELLED: "Đã hủy",
 RETURNED: "Đã trả hàng",
};

const PosDashboard: NextPage & { Layout?: string } = () => {
 const [data, setData] = useState<DashboardData | null>(null);
 const [loading, setLoading] = useState(true);
 const [error, setError] = useState("");

 const loadDashboard = useCallback(async () => {
  setLoading(true);
  setError("");

  try {
   const response = await fetch("/api/pos/dashboard");
   const result: ApiResponse = await response.json();

   if (!response.ok || !result.success || !result.stats) {
    throw new Error(result.message || "Không thể tải dữ liệu dashboard.");
   }

   setData({
    stats: result.stats,
    salesOverview: result.salesOverview ?? [],
    recentOrders: result.recentOrders ?? [],
    lowStockProducts: result.lowStockProducts ?? [],
   });
  } catch (err) {
   setError(err instanceof Error ? err.message : "Đã xảy ra lỗi khi tải dữ liệu.");
  } finally {
   setLoading(false);
  }
 }, []);

 useEffect(() => {
  void loadDashboard();
 }, [loadDashboard]);

 const statCards = data
  ? [
     {
      label: "Tổng đơn hàng",
      value: data.stats.totalOrders,
      icon: FaShoppingCart,
      href: "/pos/orders",
     },
     {
      label: "Đơn chờ xử lý",
      value: data.stats.pendingOrders,
      icon: FaClipboardList,
      href: "/pos/orders",
     },
     {
      label: "Sản phẩm",
      value: data.stats.totalProducts,
      icon: FaBox,
      href: "/pos/products",
     },
     {
      label: "Khách hàng",
      value: data.stats.totalCustomers,
      icon: FaUsers,
      href: "/pos/customers",
     },
     {
      label: "Sản phẩm sắp hết",
      value: data.stats.lowStockProducts,
      icon: FaExclamationTriangle,
      href: "/pos/inventory",
     },
    ]
  : [];

 const chartData = (data?.salesOverview ?? [])
  .reduce<
   Array<{
    date: string;
    currency: string;
    total: number;
    orders: number;
   }>
  >((result, item) => {
   const existing = result.find((entry) => entry.date === item.date && entry.currency === item.currency);

   if (existing) {
    existing.total += item.total;
    existing.orders += item.orders;
   } else {
    result.push({ ...item });
   }

   return result;
  }, [])
  .sort((a, b) => a.date.localeCompare(b.date));

 return (
  <div className="space-y-6 p-4 sm:p-6 lg:p-8">
   <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
    <div>
     <h1 className="text-2xl font-semibold text-gray-900">Tổng quan cửa hàng</h1>
     <p className="mt-1 text-sm text-gray-500">Theo dõi hoạt động kinh doanh và tình trạng đơn hàng.</p>
    </div>

    <button
     type="button"
     onClick={() => void loadDashboard()}
     disabled={loading}
     className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50">
     <FaRedo className={loading ? "animate-spin" : ""} size={13} />
     Làm mới dữ liệu
    </button>
   </div>

   {error && (
    <div className="flex flex-col gap-3 rounded-xl border border-red-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
     <p className="text-sm text-red-600">{error}</p>
     <button type="button" onClick={() => void loadDashboard()} className="text-sm font-medium text-gray-900 underline">
      Thử lại
     </button>
    </div>
   )}

   {loading && !data ? (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
     {Array.from({ length: 5 }).map((_, index) => (
      <div key={index} className="h-32 animate-pulse rounded-xl border border-gray-200 bg-white" />
     ))}
    </div>
   ) : data ? (
    <>
     <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
      {statCards.map((card) => {
       const Icon = card.icon;

       return (
        <Link key={card.label} href={card.href} className="rounded-xl border border-gray-200 bg-white p-5 transition hover:border-gray-300 hover:shadow-sm">
         <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-gray-500">{card.label}</p>
          <Icon className="shrink-0 text-gray-400" size={17} />
         </div>
         <p className="mt-4 text-2xl font-semibold tabular-nums text-gray-900">{card.value.toLocaleString("vi-VN")}</p>
        </Link>
       );
      })}
     </div>

     <section className="rounded-xl border border-gray-200 bg-white p-5 sm:p-6">
      <div className="mb-5 flex items-center gap-2">
       <FaChartLine className="text-gray-500" />
       <h2 className="font-semibold text-gray-900">Doanh thu đã thanh toán</h2>
      </div>

      {data.stats.revenue.length === 0 ? (
       <p className="py-6 text-sm text-gray-500">Chưa có dữ liệu doanh thu trong khoảng thời gian này.</p>
      ) : (
       <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {data.stats.revenue.map((item) => (
         <div key={item.currency} className="rounded-lg border border-gray-100 bg-gray-50 p-4">
          <p className="text-sm text-gray-500">{item.currency}</p>
          <p className="mt-2 text-xl font-semibold text-gray-900">{formatMoney(item.total, item.currency)}</p>
         </div>
        ))}
       </div>
      )}
     </section>

     <section className="rounded-xl border border-gray-200 bg-white p-5">
      <div className="mb-5">
       <h2 className="text-base font-semibold text-gray-900">Doanh thu theo ngày</h2>
       <p className="mt-1 text-sm text-gray-500">Dữ liệu dựa trên các đơn hàng đã thanh toán.</p>
      </div>

      {chartData.length === 0 ? (
       <div className="flex h-64 items-center justify-center text-sm text-gray-500">Chưa có dữ liệu doanh thu trong khoảng thời gian này.</div>
      ) : (
       <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
         <AreaChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="date" tickFormatter={(value: string) => value.slice(5)} tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} width={70} />
          <Tooltip
           labelFormatter={(value) => `Ngày: ${value}`}
           formatter={(value, name, item) => [
            name === "total"
             ? new Intl.NumberFormat("vi-VN", {
                maximumFractionDigits: 2,
               }).format(Number(value)) + ` ${item.payload.currency}`
             : value,
            name === "total" ? "Doanh thu" : "Số đơn",
           ]}
          />
          <Area type="monotone" dataKey="total" stroke="#111827" fill="#E5E7EB" strokeWidth={2} connectNulls />
         </AreaChart>
        </ResponsiveContainer>
       </div>
      )}
     </section>

     <section className="overflow-hidden rounded-xl border border-gray-200 bg-white">
      <div className="flex items-center justify-between gap-3 border-b border-gray-100 px-5 py-4">
       <div>
        <h2 className="font-semibold text-gray-900">Đơn hàng gần đây</h2>
        <p className="mt-1 text-xs text-gray-500">Các đơn hàng mới nhất trong khoảng thời gian thống kê.</p>
       </div>
       <Link href="/pos/orders" className="shrink-0 text-sm font-medium text-gray-700 hover:text-black">
        Xem tất cả
       </Link>
      </div>

      <div className="overflow-x-auto">
       <table className="w-full min-w-[760px] text-left text-sm">
        <thead className="bg-gray-50 text-xs uppercase text-gray-500">
         <tr>
          <th className="px-5 py-3 font-medium">Mã đơn</th>
          <th className="px-5 py-3 font-medium">Khách hàng</th>
          <th className="px-5 py-3 font-medium">Ngày tạo</th>
          <th className="px-5 py-3 font-medium">Thanh toán</th>
          <th className="px-5 py-3 font-medium">Trạng thái</th>
          <th className="px-5 py-3 text-right font-medium">Tổng tiền</th>
         </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
         {data.recentOrders.length === 0 ? (
          <tr>
           <td colSpan={6} className="px-5 py-10 text-center text-gray-500">
            Chưa có đơn hàng.
           </td>
          </tr>
         ) : (
          data.recentOrders.map((order) => {
           const statusCode = order.statusId?.code ?? "";
           const customerName = order.customerSnapshot?.name ?? order.customerId?.name ?? "Khách hàng";

           return (
            <tr key={order._id} className="hover:bg-gray-50">
             <td className="px-5 py-4 font-medium text-gray-900">{order.orderNumber}</td>
             <td className="px-5 py-4 text-gray-600">{customerName}</td>
             <td className="px-5 py-4 text-gray-500">{formatDate(order.createdAt)}</td>
             <td className="px-5 py-4">
              <span className="text-gray-600">
               {order.paymentStatus === "PAID"
                ? "Đã thanh toán"
                : order.paymentStatus === "REFUNDED"
                  ? "Đã hoàn tiền"
                  : order.paymentStatus === "FAILED"
                    ? "Thất bại"
                    : "Chưa thanh toán"}
              </span>
             </td>
             <td className="px-5 py-4 text-gray-600">{statusLabels[statusCode] ?? order.statusId?.name ?? "Chưa xác định"}</td>
             <td className="px-5 py-4 text-right font-medium text-gray-900">{formatMoney(order.total, order.currency)}</td>
            </tr>
           );
          })
         )}
        </tbody>
       </table>
      </div>
     </section>

     <section className="overflow-hidden rounded-xl border border-gray-200 bg-white">
      <div className="flex items-center justify-between gap-3 border-b border-gray-100 px-5 py-4">
       <div className="flex items-center gap-2">
        <FaBoxes className="text-gray-500" />
        <h2 className="font-semibold text-gray-900">Sản phẩm sắp hết hàng</h2>
       </div>
       <Link href="/pos/inventory" className="shrink-0 text-sm font-medium text-gray-700 hover:text-black">
        Xem kho hàng
       </Link>
      </div>

      <div className="overflow-x-auto">
       <table className="w-full min-w-[600px] text-left text-sm">
        <thead className="bg-gray-50 text-xs uppercase text-gray-500">
         <tr>
          <th className="px-5 py-3 font-medium">Sản phẩm</th>
          <th className="px-5 py-3 font-medium">SKU</th>
          <th className="px-5 py-3 text-right font-medium">Tồn kho</th>
          <th className="px-5 py-3 text-right font-medium">Ngưỡng cảnh báo</th>
         </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
         {data.lowStockProducts.length === 0 ? (
          <tr>
           <td colSpan={4} className="px-5 py-10 text-center text-gray-500">
            Không có sản phẩm sắp hết hàng.
           </td>
          </tr>
         ) : (
          data.lowStockProducts.map((product) => (
           <tr key={product._id} className="hover:bg-gray-50">
            <td className="px-5 py-4 font-medium text-gray-900">{product.name}</td>
            <td className="px-5 py-4 text-gray-500">{product.sku}</td>
            <td className="px-5 py-4 text-right">
             <span className="font-semibold text-gray-900">{product.quantity}</span>
            </td>
            <td className="px-5 py-4 text-right text-gray-500">{product.lowStockThreshold}</td>
           </tr>
          ))
         )}
        </tbody>
       </table>
      </div>
     </section>
    </>
   ) : null}
  </div>
 );
};

PosDashboard.Layout = "Pos";

export default PosDashboard;
