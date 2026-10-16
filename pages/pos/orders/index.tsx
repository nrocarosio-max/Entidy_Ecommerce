import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/router";
import { FaSearch, FaEye, FaSyncAlt, FaFilter, FaChevronLeft, FaChevronRight, FaShoppingBag, FaEdit } from "react-icons/fa";

interface OrderStatus {
 _id: string;
 name: string;
 code: string;
 color?: string;
 sortOrder?: number;
 isActive?: boolean;
 isFinal?: boolean;
 nextStatusIds?: string[];
}

interface Customer {
 _id: string;
 name?: string;
 phone?: string;
 nameNormalized?: string;
}

interface OrderItem {
 _id: string;
 productId: string;
 productSnapshot?: {
  name?: string;
  sku?: string;
  slug?: string;
  image?: string;
 };
 quantity: number;
 price: number;
 subtotal: number;
 currency?: string;
}

interface Order {
 _id: string;
 orderNumber: string;

 customerId?:
  | {
     _id: string;
     name?: string;
     phone?: string;
    }
  | string
  | null;

 customerSnapshot?: {
  name?: string;
  phone?: string;
  email?: string;
 };

 shippingAddress?: {
  province?: string;
  district?: string;
  ward?: string;
  address?: string;
  postalCode?: string;
 };

 statusId?: OrderStatus | string | null;

 subtotal: number;
 shippingFee: number;
 discount: number;
 total: number;
 currency: string;

 paymentMethod: string;
 paymentStatus: string;

 note?: string;
 shippingMethod?: string;
 trackingNumber?: string;

 createdAt: string;
 updatedAt?: string;

 items?: OrderItem[];
}

interface OrdersResponse {
 orders: Order[];
 statuses: OrderStatus[];
 total: number;
 page: number;
 limit: number;
 totalPages: number;
}

const PAYMENT_OPTIONS = [
 { value: "", label: "Tất cả thanh toán" },
 { value: "PENDING", label: "Chưa thanh toán" },
 { value: "PAID", label: "Đã thanh toán" },
 { value: "FAILED", label: "Thanh toán thất bại" },
 { value: "REFUNDED", label: "Đã hoàn tiền" },
];

const PAYMENT_STATUS_OPTIONS = [
 {
  value: "PENDING",
  label: "Chờ thanh toán",
  color: "#92400e",
  background: "#fef3c7",
 },
 {
  value: "PAID",
  label: "Đã thanh toán",
  color: "#166534",
  background: "#dcfce7",
 },
 {
  value: "FAILED",
  label: "Thanh toán thất bại",
  color: "#991b1b",
  background: "#fee2e2",
 },
 {
  value: "REFUNDED",
  label: "Đã hoàn tiền",
  color: "#6b21a8",
  background: "#f3e8ff",
 },
] as const;

function getPaymentStatusLabel(status: string) {
 return PAYMENT_STATUS_OPTIONS.find((option) => option.value === status)?.label ?? status;
}

function formatDateTime(value?: string) {
 if (!value) return "—";

 const date = new Date(value);

 if (Number.isNaN(date.getTime())) return "—";

 return date.toLocaleString("vi-VN");
}

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

 const date = new Date(value);

 if (Number.isNaN(date.getTime())) return "—";

 return new Intl.DateTimeFormat("vi-VN", {
  dateStyle: "short",
  timeStyle: "short",
 }).format(date);
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
 const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
 const [updatingPaymentOrderId, setUpdatingPaymentOrderId] = useState<string | null>(null);
 const fetchOrders = useCallback(async () => {
  setLoading(true);
  setError("");

  try {
   const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
   });

   if (search) params.set("keyword", search);

   // Giữ bộ lọc thanh toán hiện tại.
   // API danh sách cần hỗ trợ paymentStatus thì bộ lọc này mới có hiệu lực.
   if (paymentStatus) params.set("paymentStatus", paymentStatus);

   if (statusId) params.set("statusId", statusId);

   const response = await fetch(`/api/pos/orders?${params.toString()}`, {
    method: "GET",
    credentials: "include",
   });

   const result = (await response.json()) as OrdersResponse | { message?: string };

   if (!response.ok) {
    throw new Error(("message" in result && result.message) || `Lỗi tải đơn hàng (HTTP ${response.status}).`);
   }

   const data = result as OrdersResponse;
   const orderList = Array.isArray(data.orders) ? data.orders : [];
   const statusList = Array.isArray(data.statuses) ? data.statuses : [];

   setOrders(orderList);
   setTotal(Number(data.total) || 0);
   setTotalPages(Math.max(1, Number(data.totalPages) || 1));

   setStatuses([...statusList].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0)));
  } catch (err: unknown) {
   setError(err instanceof Error ? err.message : "Đã xảy ra lỗi khi tải đơn hàng.");
  } finally {
   setLoading(false);
  }
 }, [page, limit, search, paymentStatus, statusId]);

 useEffect(() => {
  void fetchOrders();
 }, [fetchOrders]);

 const handleStatusChange = async (order: Order, nextStatusId: string) => {
  const previousStatusId = typeof order.statusId === "string" ? order.statusId : order.statusId?._id || "";

  if (!nextStatusId || nextStatusId === previousStatusId || updatingOrderId !== null) {
   return;
  }

  try {
   setUpdatingOrderId(order._id);
   setError("");

   const response = await fetch(`/api/pos/orders/${order._id}/status`, {
    method: "PATCH",
    credentials: "include",
    headers: {
     "Content-Type": "application/json",
    },
    body: JSON.stringify({
     statusId: nextStatusId,
    }),
   });

   const result = await response.json();

   if (!response.ok) {
    throw new Error(result.message || "Không thể cập nhật trạng thái đơn hàng.");
   }

   await fetchOrders();
  } catch (err: unknown) {
   alert(err instanceof Error ? err.message : "Đã xảy ra lỗi khi cập nhật trạng thái.");

   await fetchOrders();
  } finally {
   setUpdatingOrderId(null);
  }
 };

 const handlePaymentStatusChange = async (order: Order, nextPaymentStatus: string) => {
  if (!PAYMENT_STATUS_OPTIONS.some((option) => option.value === nextPaymentStatus)) {
   return;
  }

  if (nextPaymentStatus === order.paymentStatus) {
   return;
  }

  setUpdatingPaymentOrderId(order._id);

  try {
   const response = await fetch(`/api/pos/orders/${order._id}/payment-status`, {
    method: "PATCH",
    headers: {
     "Content-Type": "application/json",
    },
    body: JSON.stringify({
     paymentStatus: nextPaymentStatus,
    }),
   });

   const result = await response.json();

   if (!response.ok) {
    throw new Error(result.message || "Không thể cập nhật trạng thái thanh toán.");
   }

   await fetchOrders();
  } catch (error) {
   console.error(error);

   alert(error instanceof Error ? error.message : "Đã xảy ra lỗi khi cập nhật thanh toán.");
  } finally {
   setUpdatingPaymentOrderId(null);
  }
 };

 const handleSearch = (event: FormEvent<HTMLFormElement>) => {
  event.preventDefault();
  setPage(1);
  setSearch(searchInput.trim());
 };

 const handleStatusFilterChange = (value: string) => {
  setPage(1);
  setStatusId(value);
 };

 const handlePaymentChange = (value: string) => {
  setPage(1);
  setPaymentStatus(value);
 };

 const handleClearFilters = () => {
  setSearchInput("");
  setSearch("");
  setPaymentStatus("");
  setStatusId("");
  setPage(1);
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
      onChange={(event) => handleStatusFilterChange(event.target.value)}
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
      <button type="button" onClick={handleClearFilters} className="h-10 rounded-lg px-3 text-sm font-medium text-blue-600 hover:bg-blue-50">
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

      <tbody className="divide-y divide-gray-100 bg-white">
       {orders.length === 0 ? (
        <tr>
         <td colSpan={19} className="px-6 py-12 text-center text-gray-500">
          Không tìm thấy đơn hàng nào.
         </td>
        </tr>
       ) : (
        orders.map((order) => {
         const currentStatus =
          typeof order.statusId === "object" && order.statusId !== null ? order.statusId : statuses.find((status) => status._id === order.statusId);

         const currentSortOrder = currentStatus?.sortOrder ?? -1;

         const availableStatuses = statuses.filter((status) => status.isActive !== false && (status.sortOrder ?? 0) > currentSortOrder);

         const paymentOption = PAYMENT_STATUS_OPTIONS.find((option) => option.value === order.paymentStatus);

         const customerName =
          order.customerSnapshot?.name || (typeof order.customerId === "object" && order.customerId !== null ? order.customerId.name : "") || "Khách hàng";

         const customerPhone =
          order.customerSnapshot?.phone || (typeof order.customerId === "object" && order.customerId !== null ? order.customerId.phone : "") || "—";

         const customerEmail = order.customerSnapshot?.email || "—";

         const address = order.shippingAddress;

         const fullAddress = [address?.address, address?.ward, address?.district, address?.province].filter(Boolean).join(", ");

         const totalQuantity = (order.items ?? []).reduce((sum, item) => sum + (item.quantity || 0), 0);

         return (
          <tr key={order._id} className="align-top transition-colors hover:bg-gray-50">
           {/* 1. Mã đơn hàng */}
           <td className="whitespace-nowrap px-4 py-4">
            <div className="font-semibold text-gray-900">{order.orderNumber}</div>
            <div className="mt-1 text-xs text-gray-400">ID: {order._id}</div>
           </td>

           {/* 2. Ngày tạo */}
           <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-600">{formatDateTime(order.createdAt)}</td>

           {/* 3. Cập nhật lần cuối */}
           <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-600">{formatDateTime(order.updatedAt)}</td>

           {/* 4. Khách hàng */}
           <td className="px-4 py-4">
            <div className="min-w-[160px]">
             <p className="font-medium text-gray-900">{customerName}</p>
             <p className="mt-1 text-sm text-gray-500">{customerPhone}</p>
            </div>
           </td>

           {/* 5. Email */}
           <td className="px-4 py-4 text-sm text-gray-600">
            <div className="min-w-[180px] break-words">{customerEmail}</div>
           </td>

           {/* 6. Địa chỉ giao hàng */}
           <td className="px-4 py-4 text-sm text-gray-600">
            <div className="min-w-[220px] max-w-[300px]">
             <p className="whitespace-normal">{fullAddress || "Chưa có địa chỉ"}</p>

             {address?.postalCode && <p className="mt-1 text-xs text-gray-400">Mã bưu chính: {address.postalCode}</p>}
            </div>
           </td>

           {/* 7. Sản phẩm */}
           <td className="px-4 py-4">
            <div className="min-w-[260px] space-y-3">
             {(order.items ?? []).map((item) => (
              <div key={item._id} className="border-b border-gray-100 pb-3 last:border-0 last:pb-0">
               <p className="whitespace-normal font-medium text-gray-800">{item.productSnapshot?.name || "Sản phẩm"}</p>

               <p className="mt-1 text-xs text-gray-500">SKU: {item.productSnapshot?.sku || "—"}</p>

               <p className="mt-1 text-sm text-gray-600">Đơn giá: {formatMoney(item.price, item.currency || order.currency)}</p>

               <p className="mt-1 text-sm font-medium text-gray-800">Thành tiền: {formatMoney(item.subtotal, item.currency || order.currency)}</p>
              </div>
             ))}

             {(!order.items || order.items.length === 0) && <span className="text-sm text-gray-400">Không có dữ liệu sản phẩm</span>}
            </div>
           </td>

           {/* 8. Tổng số lượng */}
           <td className="whitespace-nowrap px-4 py-4 text-center text-sm font-medium text-gray-700">{totalQuantity}</td>

           {/* 9. Tiền hàng */}
           <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-700">{formatMoney(order.subtotal, order.currency)}</td>

           {/* 10. Phí vận chuyển */}
           <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-700">{formatMoney(order.shippingFee, order.currency)}</td>

           {/* 11. Giảm giá */}
           <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-700">{formatMoney(order.discount, order.currency)}</td>

           {/* 12. Tổng tiền */}
           <td className="whitespace-nowrap px-4 py-4">
            <span className="font-semibold text-gray-900">{formatMoney(order.total, order.currency)}</span>
           </td>

           {/* 13. Phương thức thanh toán */}
           <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-700">{order.paymentMethod || "—"}</td>

           {/* 14. Trạng thái đơn hàng */}
           <td className="px-4 py-4">
            <div className="min-w-[170px]">
             <select
              value={currentStatus?._id || (typeof order.statusId === "string" ? order.statusId : "")}
              disabled={updatingOrderId === order._id || availableStatuses.length === 0}
              onChange={(event) => handleStatusChange(order, event.target.value)}
              className="w-full rounded-lg border-0 px-3 py-2 text-sm font-medium outline-none ring-1 ring-inset ring-black/5 disabled:cursor-not-allowed disabled:opacity-60"
              style={{
               color: currentStatus?.color || "#374151",
               backgroundColor: currentStatus?.color ? `${currentStatus.color}18` : "#f3f4f6",
              }}>
              {currentStatus && <option value={currentStatus._id}>{currentStatus.name}</option>}

              {availableStatuses.map((status) => (
               <option key={status._id} value={status._id}>
                {status.name}
               </option>
              ))}
             </select>

             {updatingOrderId === order._id && <p className="mt-1 text-xs text-gray-500">Đang cập nhật...</p>}
            </div>
           </td>

           {/* 15. Trạng thái thanh toán */}
           <td className="px-4 py-4">
            <div className="min-w-[180px]">
             <select
              value={order.paymentStatus || "PENDING"}
              disabled={updatingPaymentOrderId === order._id}
              onChange={(event) => handlePaymentStatusChange(order, event.target.value)}
              className="w-full rounded-lg border-0 px-3 py-2 text-sm font-medium outline-none ring-1 ring-inset ring-black/5 disabled:cursor-wait disabled:opacity-60"
              style={{
               color: paymentOption?.color || "#374151",
               backgroundColor: paymentOption?.background || "#f3f4f6",
              }}>
              {PAYMENT_STATUS_OPTIONS.map((option) => (
               <option key={option.value} value={option.value}>
                {option.label}
               </option>
              ))}
             </select>

             {updatingPaymentOrderId === order._id && <p className="mt-1 text-xs text-gray-500">Đang cập nhật...</p>}
            </div>
           </td>

           {/* 16. Phương thức vận chuyển */}
           <td className="px-4 py-4 text-sm text-gray-700">
            <div className="min-w-[150px] whitespace-normal">{order.shippingMethod || "—"}</div>
           </td>

           {/* 17. Mã vận đơn */}
           <td className="px-4 py-4 text-sm text-gray-700">
            <div className="min-w-[130px] break-words">{order.trackingNumber || "—"}</div>
           </td>

           {/* 18. Ghi chú */}
           <td className="px-4 py-4 text-sm text-gray-600">
            <div className="min-w-[180px] max-w-[260px] whitespace-normal break-words">{order.note || "—"}</div>
           </td>

           {/* 19. Thao tác */}
           <td className="whitespace-nowrap px-4 py-4">
            <button
             type="button"
             onClick={() => router.push(`/pos/orders/${order._id}`)}
             className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:border-gray-300 hover:bg-gray-100">
             <FaEdit size={16} />
             Chi tiết
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
