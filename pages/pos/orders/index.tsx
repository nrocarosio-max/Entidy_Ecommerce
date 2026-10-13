import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/router";
import { FaSearch, FaEye, FaSyncAlt, FaFilter, FaChevronLeft, FaChevronRight, FaShoppingBag } from "react-icons/fa";

interface OrderStatus {
 _id: string;
 name: string;
 code: string;
 color?: string;
 sortOrder?: number;
}

interface Customer {
 _id: string;
 name?: string;
 phone?: string;
 nameNormalized?: string;
}

interface Order {
 _id: string;
 orderNumber: string;
 customerId?: Customer | null;
 customerSnapshot?: {
  name?: string;
  phone?: string;
  email?: string;
 };
 statusId?: OrderStatus | string | null;
 subtotal: number;
 shippingFee: number;
 discount: number;
 total: number;
 currency: string;
 paymentMethod: string;
 paymentStatus: string;
 createdAt: string;
}

interface OrdersResponse {
 success: boolean;
 message?: string;
 data?: Order[];
 pagination?: {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
 };
}

const PAYMENT_OPTIONS = [
 { value: "", label: "Tất cả thanh toán" },
 { value: "PENDING", label: "Chưa thanh toán" },
 { value: "PAID", label: "Đã thanh toán" },
 { value: "FAILED", label: "Thanh toán thất bại" },
 { value: "REFUNDED", label: "Đã hoàn tiền" },
];

const getStatus = (statusId?: Order["statusId"]) => {
 if (!statusId || typeof statusId === "string") {
  return {
   name: "Không xác định",
   code: "",
   color: "#6B7280",
  };
 }

 return {
  name: statusId.name || "Không xác định",
  code: statusId.code || "",
  color: statusId.color || "#6B7280",
 };
};

const getPaymentLabel = (status: string) => {
 const labels: Record<string, string> = {
  PENDING: "Chưa thanh toán",
  PAID: "Đã thanh toán",
  FAILED: "Thất bại",
  REFUNDED: "Đã hoàn tiền",
 };

 return labels[status] || status || "Không xác định";
};

const formatMoney = (amount: number, currency: string) => {
 const value = Number(amount || 0);
 const normalizedCurrency = String(currency || "VND").toUpperCase();

 try {
  return new Intl.NumberFormat("vi-VN", {
   style: "currency",
   currency: normalizedCurrency,
   maximumFractionDigits: 0,
  }).format(value);
 } catch {
  return `${value.toLocaleString("vi-VN")} ${normalizedCurrency}`;
 }
};

const formatDate = (value: string) => {
 if (!value) return "—";

 return new Intl.DateTimeFormat("vi-VN", {
  dateStyle: "short",
  timeStyle: "short",
 }).format(new Date(value));
};

export default function PosOrdersPage() {
 const router = useRouter();

 const [orders, setOrders] = useState<Order[]>([]);
 const [searchInput, setSearchInput] = useState("");
 const [search, setSearch] = useState("");
 const [paymentStatus, setPaymentStatus] = useState("");
 const [statusId, setStatusId] = useState("");

 const [statuses, setStatuses] = useState<OrderStatus[]>([]);
 const [page, setPage] = useState(1);
 const [limit] = useState(20);
 const [total, setTotal] = useState(0);
 const [totalPages, setTotalPages] = useState(1);

 const [loading, setLoading] = useState(true);
 const [error, setError] = useState("");

 const fetchOrders = useCallback(async () => {
  setLoading(true);
  setError("");

  try {
   const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
   });

   if (search) params.set("search", search);
   if (paymentStatus) params.set("paymentStatus", paymentStatus);
   if (statusId) params.set("statusId", statusId);

   const response = await fetch(`/api/pos/orders?${params.toString()}`, {
    method: "GET",
    credentials: "include",
   });

   const result: OrdersResponse = await response.json();

   if (!response.ok || !result.success) {
    throw new Error(result.message || "Không thể tải danh sách đơn hàng.");
   }

   setOrders(result.data || []);
   setTotal(result.pagination?.total || 0);
   setTotalPages(Math.max(1, result.pagination?.totalPages || 1));

   const uniqueStatuses = new Map<string, OrderStatus>();

   (result.data || []).forEach((order) => {
    const status = order.statusId;

    if (status && typeof status !== "string" && status._id) {
     uniqueStatuses.set(status._id, status);
    }
   });

   setStatuses((current) => {
    const merged = new Map<string, OrderStatus>();

    current.forEach((status) => merged.set(status._id, status));
    uniqueStatuses.forEach((status) => merged.set(status._id, status));

    return Array.from(merged.values()).sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
   });
  } catch (err: unknown) {
   setError(err instanceof Error ? err.message : "Đã xảy ra lỗi khi tải đơn hàng.");
  } finally {
   setLoading(false);
  }
 }, [page, limit, search, paymentStatus, statusId]);

 useEffect(() => {
  void fetchOrders();
 }, [fetchOrders]);

 const handleSearch = (event: FormEvent<HTMLFormElement>) => {
  event.preventDefault();
  setPage(1);
  setSearch(searchInput.trim());
 };

 const handlePaymentChange = (value: string) => {
  setPage(1);
  setPaymentStatus(value);
 };

 const handleStatusChange = (value: string) => {
  setPage(1);
  setStatusId(value);
 };

 const goToDetail = (id: string) => {
  void router.push(`/pos/orders/${id}`);
 };

 return (
  <div className="mx-auto w-full max-w-[1600px] space-y-5 p-4 sm:p-6">
   {/* Page header */}
   <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
    <div>
     <div className="flex items-center gap-2 text-sm text-gray-500">
      <span>POS</span>
      <span>/</span>
      <span>Đơn hàng</span>
     </div>

     <h1 className="mt-2 text-2xl font-bold text-gray-900">Đơn hàng</h1>

     <p className="mt-1 text-sm text-gray-500">Theo dõi và quản lý các đơn hàng của cửa hàng.</p>
    </div>

    <button
     type="button"
     onClick={() => void fetchOrders()}
     disabled={loading}
     className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:opacity-60">
     <FaSyncAlt className={loading ? "animate-spin" : ""} />
     Làm mới
    </button>
   </div>

   {/* Summary */}
   <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
     <div className="flex items-center justify-between">
      <p className="text-sm text-gray-500">Tổng đơn hàng</p>
      <FaShoppingBag className="text-gray-400" />
     </div>
     <p className="mt-3 text-2xl font-bold text-gray-900">{total.toLocaleString("vi-VN")}</p>
    </div>

    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
     <p className="text-sm text-gray-500">Đang hiển thị</p>
     <p className="mt-3 text-2xl font-bold text-gray-900">{orders.length.toLocaleString("vi-VN")}</p>
    </div>

    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
     <p className="text-sm text-gray-500">Trang hiện tại</p>
     <p className="mt-3 text-2xl font-bold text-gray-900">
      {page} <span className="text-base font-normal text-gray-400">/ {totalPages}</span>
     </p>
    </div>
   </div>

   {/* Search and filters */}
   <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
    <form onSubmit={handleSearch} className="flex flex-col gap-3 lg:flex-row">
     <div className="relative min-w-0 flex-1">
      <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />

      <input
       value={searchInput}
       onChange={(event) => setSearchInput(event.target.value)}
       placeholder="Tìm mã đơn, tên hoặc số điện thoại khách hàng..."
       className="h-11 w-full rounded-lg border border-gray-200 bg-white pl-10 pr-3 text-sm outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
      />
     </div>

     <button
      type="submit"
      className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 text-sm font-medium text-white transition hover:bg-blue-700">
      <FaSearch />
      Tìm kiếm
     </button>
    </form>

    <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
     <div className="flex items-center gap-2 text-sm text-gray-500">
      <FaFilter />
      Bộ lọc
     </div>

     <select
      value={statusId}
      onChange={(event) => handleStatusChange(event.target.value)}
      className="h-10 min-w-0 flex-1 rounded-lg border border-gray-200 bg-white px-3 text-sm outline-none focus:border-blue-500">
      <option value="">Tất cả trạng thái đơn</option>
      {statuses.map((status) => (
       <option key={status._id} value={status._id}>
        {status.name}
       </option>
      ))}
     </select>

     <select
      value={paymentStatus}
      onChange={(event) => handlePaymentChange(event.target.value)}
      className="h-10 min-w-0 flex-1 rounded-lg border border-gray-200 bg-white px-3 text-sm outline-none focus:border-blue-500">
      {PAYMENT_OPTIONS.map((option) => (
       <option key={option.value} value={option.value}>
        {option.label}
       </option>
      ))}
     </select>

     {(search || paymentStatus || statusId) && (
      <button
       type="button"
       onClick={() => {
        setSearchInput("");
        setSearch("");
        setPaymentStatus("");
        setStatusId("");
        setPage(1);
       }}
       className="h-10 rounded-lg px-3 text-sm font-medium text-blue-600 hover:bg-blue-50">
       Xóa bộ lọc
      </button>
     )}
    </div>
   </div>

   {/* Error */}
   {error && (
    <div className="flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 sm:flex-row sm:items-center sm:justify-between">
     <span>{error}</span>
     <button type="button" onClick={() => void fetchOrders()} className="font-semibold underline">
      Thử lại
     </button>
    </div>
   )}

   {/* Orders table */}
   <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
    <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
     <h2 className="font-semibold text-gray-900">Danh sách đơn hàng</h2>
     <span className="text-sm text-gray-500">{total.toLocaleString("vi-VN")} đơn</span>
    </div>

    <div className="overflow-x-auto">
     <table className="w-full min-w-[1050px] text-left text-sm">
      <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
       <tr>
        <th className="px-5 py-4 font-semibold">Mã đơn</th>
        <th className="px-5 py-4 font-semibold">Khách hàng</th>
        <th className="px-5 py-4 font-semibold">Ngày tạo</th>
        <th className="px-5 py-4 text-right font-semibold">Tổng tiền</th>
        <th className="px-5 py-4 font-semibold">Trạng thái đơn</th>
        <th className="px-5 py-4 font-semibold">Thanh toán</th>
        <th className="px-5 py-4 text-center font-semibold">Thao tác</th>
       </tr>
      </thead>

      <tbody className="divide-y divide-gray-100">
       {loading && orders.length === 0 ? (
        <tr>
         <td colSpan={7} className="px-5 py-16 text-center text-gray-500">
          <FaSyncAlt className="mx-auto mb-3 animate-spin text-lg" />
          Đang tải đơn hàng...
         </td>
        </tr>
       ) : orders.length === 0 ? (
        <tr>
         <td colSpan={7} className="px-5 py-16 text-center">
          <FaShoppingBag className="mx-auto mb-3 text-3xl text-gray-300" />
          <p className="font-medium text-gray-700">Không tìm thấy đơn hàng</p>
          <p className="mt-1 text-sm text-gray-500">Thử thay đổi từ khóa hoặc bộ lọc.</p>
         </td>
        </tr>
       ) : (
        orders.map((order) => {
         const status = getStatus(order.statusId);
         const customerName = order.customerSnapshot?.name || order.customerId?.name || "Khách hàng";

         const customerPhone = order.customerSnapshot?.phone || order.customerId?.phone || "";

         const paymentColor =
          order.paymentStatus === "PAID"
           ? "bg-green-50 text-green-700"
           : order.paymentStatus === "FAILED"
             ? "bg-red-50 text-red-700"
             : order.paymentStatus === "REFUNDED"
               ? "bg-purple-50 text-purple-700"
               : "bg-amber-50 text-amber-700";

         return (
          <tr key={order._id} className="transition hover:bg-gray-50">
           <td className="px-5 py-4">
            <button type="button" onClick={() => goToDetail(order._id)} className="font-semibold text-blue-600 hover:text-blue-800 hover:underline">
             {order.orderNumber}
            </button>
           </td>

           <td className="px-5 py-4">
            <p className="max-w-[220px] truncate font-medium text-gray-900">{customerName}</p>
            <p className="mt-1 text-xs text-gray-500">{customerPhone || "Không có số điện thoại"}</p>
           </td>

           <td className="whitespace-nowrap px-5 py-4 text-gray-600">{formatDate(order.createdAt)}</td>

           <td className="whitespace-nowrap px-5 py-4 text-right font-semibold text-gray-900">{formatMoney(order.total, order.currency)}</td>

           <td className="px-5 py-4">
            <span
             className="inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium"
             style={{
              color: status.color,
              backgroundColor: `${status.color}18`,
             }}>
             {status.name}
            </span>
           </td>

           <td className="px-5 py-4">
            <span className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ${paymentColor}`}>
             {getPaymentLabel(order.paymentStatus)}
            </span>
            <p className="mt-1 text-xs text-gray-500">{order.paymentMethod || "—"}</p>
           </td>

           <td className="px-5 py-4 text-center">
            <button
             type="button"
             onClick={() => goToDetail(order._id)}
             title="Xem chi tiết đơn hàng"
             aria-label={`Xem đơn ${order.orderNumber}`}
             className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600">
             <FaEye />
            </button>
           </td>
          </tr>
         );
        })
       )}
      </tbody>
     </table>
    </div>

    {/* Pagination */}
    <div className="flex flex-col gap-3 border-t border-gray-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
     <p className="text-sm text-gray-500">
      {total === 0 ? "Chưa có đơn hàng" : `Hiển thị ${(page - 1) * limit + 1}–${Math.min(page * limit, total)} trong ${total.toLocaleString("vi-VN")} đơn hàng`}
     </p>

     <div className="flex items-center gap-2">
      <button
       type="button"
       disabled={page <= 1 || loading}
       onClick={() => setPage((current) => Math.max(1, current - 1))}
       className="inline-flex h-9 items-center gap-2 rounded-lg border border-gray-200 px-3 text-sm text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40">
       <FaChevronLeft size={11} />
       Trước
      </button>

      <span className="min-w-[80px] text-center text-sm text-gray-600">
       Trang {page}/{totalPages}
      </span>

      <button
       type="button"
       disabled={page >= totalPages || loading}
       onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
       className="inline-flex h-9 items-center gap-2 rounded-lg border border-gray-200 px-3 text-sm text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40">
       Sau
       <FaChevronRight size={11} />
      </button>
     </div>
    </div>
   </div>
  </div>
 );
}

PosOrdersPage.Layout = "Pos";
