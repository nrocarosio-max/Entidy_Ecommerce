import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { FaEye, FaSearch, FaShoppingBag, FaPlus } from "react-icons/fa";

interface Store {
 _id: string;
 name: string;
 slug?: string;
}

interface Customer {
 _id: string;
 name: string;
 phone: string;
 isActive?: boolean;
}

interface Order {
 _id: string;
 storeId: string | Store;
 customerId: string | Customer;
 orderNumber: string;

 customerSnapshot: {
  name: string;
  phone: string;
  email: string;
 };

 shippingAddress: {
  province: string;
  district: string;
  ward: string;
  address: string;
  postalCode: string;
 };

 subtotal: number;
 shippingFee: number;
 discount: number;
 total: number;
 currency: string;

 paymentMethod: string;
 paymentStatus: string;

 status: string;

 note: string;
 shippingMethod: string;
 trackingNumber: string;

 createdBy:
  | string
  | {
     _id: string;
     name: string;
     email: string;
    }
  | null;

 createdAt: string;
 updatedAt: string;
}

interface Pagination {
 page: number;
 limit: number;
 total: number;
 totalPages: number;
}

interface OrdersResponse {
 orders: Order[];
 pagination: Pagination;

 summary?: {
  totalOrders: number;
  totalAmount: number;
  statusCounts?: Record<string, number>;
 };
}

const statusLabels: Record<string, string> = {
 PENDING: "Mới",
 CONFIRMED: "Đã xác nhận",
 PROCESSING: "Đang xử lý",
 SHIPPED: "Đang giao",
 DELIVERED: "Đã giao",
 CANCELLED: "Đã hủy",
 RETURNED: "Đã trả hàng",
};

const statusOptions = [
 {
  value: "",
  label: "Tất cả trạng thái",
 },
 {
  value: "PENDING",
  label: "Mới",
 },
 {
  value: "CONFIRMED",
  label: "Đã xác nhận",
 },
 {
  value: "PROCESSING",
  label: "Đang xử lý",
 },
 {
  value: "SHIPPED",
  label: "Đang giao",
 },
 {
  value: "DELIVERED",
  label: "Đã giao",
 },
 {
  value: "CANCELLED",
  label: "Đã hủy",
 },
 {
  value: "RETURNED",
  label: "Đã trả hàng",
 },
];

const paymentStatusOptions = [
 {
  value: "",
  label: "Tất cả thanh toán",
 },
 {
  value: "PENDING",
  label: "Chờ thanh toán",
 },
 {
  value: "PAID",
  label: "Đã thanh toán",
 },
 {
  value: "FAILED",
  label: "Thanh toán thất bại",
 },
 {
  value: "REFUNDED",
  label: "Đã hoàn tiền",
 },
];

/*
 * Only these transitions are allowed.
 * The backend also validates this,
 * so frontend validation is only for better UX.
 */
const allowedTransitions: Record<string, string[]> = {
 PENDING: ["CONFIRMED", "CANCELLED"],
 CONFIRMED: ["PROCESSING", "CANCELLED"],
 PROCESSING: ["SHIPPED", "CANCELLED"],
 SHIPPED: ["DELIVERED", "RETURNED"],
 DELIVERED: ["RETURNED"],
 CANCELLED: [],
 RETURNED: [],
};

function getStatusLabel(status: string) {
 return statusLabels[status] || status;
}

function getStatusSelectClass(status: string) {
 switch (status) {
  case "PENDING":
   return "border-yellow-300 bg-yellow-50 text-yellow-700";

  case "CONFIRMED":
   return "border-blue-300 bg-blue-50 text-blue-700";

  case "PROCESSING":
   return "border-purple-300 bg-purple-50 text-purple-700";

  case "SHIPPED":
   return "border-indigo-300 bg-indigo-50 text-indigo-700";

  case "DELIVERED":
   return "border-green-300 bg-green-50 text-green-700";

  case "CANCELLED":
   return "border-red-300 bg-red-50 text-red-700";

  case "RETURNED":
   return "border-orange-300 bg-orange-50 text-orange-700";

  default:
   return "border-gray-300 bg-gray-50 text-gray-700";
 }
}

function getPaymentStatusClass(status: string) {
 switch (status) {
  case "PAID":
   return "bg-green-100 text-green-700";

  case "FAILED":
   return "bg-red-100 text-red-700";

  case "REFUNDED":
   return "bg-orange-100 text-orange-700";

  case "PENDING":
   return "bg-yellow-100 text-yellow-700";

  default:
   return "bg-gray-100 text-gray-600";
 }
}

function getPaymentStatusLabel(status: string) {
 switch (status) {
  case "PAID":
   return "Đã thanh toán";

  case "FAILED":
   return "Thất bại";

  case "REFUNDED":
   return "Đã hoàn tiền";

  case "PENDING":
   return "Chờ thanh toán";

  default:
   return status;
 }
}

function formatMoney(value: number, currency: string) {
 try {
  return new Intl.NumberFormat("vi-VN", {
   style: "currency",
   currency: currency || "VND",
   maximumFractionDigits: 0,
  }).format(value);
 } catch {
  return `${value.toLocaleString("vi-VN")} ${currency || ""}`;
 }
}

export default function OrdersPage() {
 const { data: session, status } = useSession();

 const [stores, setStores] = useState<Store[]>([]);
 const [selectedStore, setSelectedStore] = useState("");

 const [orders, setOrders] = useState<Order[]>([]);

 const [pagination, setPagination] = useState<Pagination>({
  page: 1,
  limit: 20,
  total: 0,
  totalPages: 1,
 });

 const [summary, setSummary] = useState({
  totalOrders: 0,
  totalAmount: 0,
 });

 const [searchInput, setSearchInput] = useState("");
 const [search, setSearch] = useState("");

 const [orderStatus, setOrderStatus] = useState("");
 const [paymentStatus, setPaymentStatus] = useState("");

 const [fromDate, setFromDate] = useState("");
 const [toDate, setToDate] = useState("");

 const [loadingStores, setLoadingStores] = useState(false);
 const [loadingOrders, setLoadingOrders] = useState(false);

 const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

 const [error, setError] = useState("");
 const [success, setSuccess] = useState("");

 const isSuperAdmin = session?.user?.role === "SUPER_ADMIN";

 /*
  * Load stores for SUPER_ADMIN
  */
 useEffect(() => {
  if (status !== "authenticated") return;
  if (!isSuperAdmin) return;

  const loadStores = async () => {
   try {
    setLoadingStores(true);
    setError("");

    const response = await fetch("/api/admin/stores");

    const data = await response.json().catch(() => null);

    if (!response.ok) {
     throw new Error(data?.message || "Failed to load stores.");
    }

    const storeList: Store[] = data.stores || [];

    setStores(storeList);

    if (storeList.length > 0) {
     setSelectedStore((current) => {
      return current || storeList[0]._id;
     });
    }
   } catch (err) {
    setError(err instanceof Error ? err.message : "Failed to load stores.");
   } finally {
    setLoadingStores(false);
   }
  };

  loadStores();
 }, [status, isSuperAdmin]);

 /*
  * Set store for non-SUPER_ADMIN
  */
 useEffect(() => {
  if (status !== "authenticated") return;

  if (!isSuperAdmin && session?.user?.storeId) {
   setSelectedStore(session.user.storeId);
  }
 }, [status, isSuperAdmin, session?.user?.storeId]);

 /*
  * Load orders
  */
 useEffect(() => {
  if (status !== "authenticated") return;
  if (!selectedStore) return;

  const loadOrders = async () => {
   try {
    setLoadingOrders(true);
    setError("");

    const params = new URLSearchParams({
     storeId: selectedStore,
     page: String(pagination.page),
     limit: "20",
    });

    if (search.trim()) {
     params.set("search", search.trim());
    }

    if (orderStatus) {
     params.set("status", orderStatus);
    }

    if (paymentStatus) {
     params.set("paymentStatus", paymentStatus);
    }

    if (fromDate) {
     params.set("fromDate", fromDate);
    }

    if (toDate) {
     params.set("toDate", toDate);
    }

    const response = await fetch(`/api/admin/orders?${params.toString()}`);

    const data = await response.json().catch(() => null);

    if (!response.ok) {
     throw new Error(data?.message || "Failed to load orders.");
    }

    const result: OrdersResponse = data;

    setOrders(result.orders || []);

    if (result.pagination) {
     setPagination(result.pagination);
    }

    if (result.summary) {
     setSummary({
      totalOrders: result.summary.totalOrders || 0,
      totalAmount: result.summary.totalAmount || 0,
     });
    } else {
     setSummary({
      totalOrders: result.pagination?.total || 0,
      totalAmount: 0,
     });
    }
   } catch (err) {
    setError(err instanceof Error ? err.message : "Failed to load orders.");
   } finally {
    setLoadingOrders(false);
   }
  };

  loadOrders();
 }, [status, selectedStore, search, orderStatus, paymentStatus, fromDate, toDate, pagination.page]);

 /*
  * Search
  */
 const handleSearch = () => {
  setPagination((current) => ({
   ...current,
   page: 1,
  }));

  setSearch(searchInput.trim());
 };

 /*
  * Reset filters
  */
 const handleReset = () => {
  setSearchInput("");
  setSearch("");
  setOrderStatus("");
  setPaymentStatus("");
  setFromDate("");
  setToDate("");

  setPagination((current) => ({
   ...current,
   page: 1,
  }));
 };

 /*
  * Update order status directly from table.
  */
 const handleStatusChange = async (order: Order, newStatus: string) => {
  if (newStatus === order.status) {
   return;
  }

  const allowed = allowedTransitions[order.status] || [];

  if (!allowed.includes(newStatus)) {
   setError(`Không thể chuyển đơn từ "${getStatusLabel(order.status)}" sang "${getStatusLabel(newStatus)}".`);

   return;
  }

  try {
   setUpdatingOrderId(order._id);
   setError("");
   setSuccess("");

   const response = await fetch(`/api/admin/orders/${order._id}`, {
    method: "PATCH",
    headers: {
     "Content-Type": "application/json",
    },
    body: JSON.stringify({
     status: newStatus,
    }),
   });

   const data = await response.json().catch(() => null);

   if (!response.ok) {
    throw new Error(data?.message || "Không thể cập nhật trạng thái đơn hàng.");
   }

   const updatedOrder: Order = data.order || data;

   setOrders((currentOrders) =>
    currentOrders.map((item) =>
     item._id === order._id
      ? {
         ...item,
         status: updatedOrder.status || newStatus,
         updatedAt: updatedOrder.updatedAt || item.updatedAt,
        }
      : item,
    ),
   );

   setSuccess(`Đơn ${order.orderNumber} đã chuyển sang "${getStatusLabel(newStatus)}".`);

   /*
    * Automatically hide success message.
    */
   window.setTimeout(() => {
    setSuccess("");
   }, 3000);
  } catch (err) {
   setError(err instanceof Error ? err.message : "Không thể cập nhật trạng thái đơn hàng.");
  } finally {
   setUpdatingOrderId(null);
  }
 };

 if (status === "loading") {
  return <div className="flex min-h-[60vh] items-center justify-center text-sm text-gray-500">Loading...</div>;
 }

 if (!session) {
  return <div className="flex min-h-[60vh] items-center justify-center text-sm text-gray-500">Please sign in.</div>;
 }

 return (
  <div className="min-h-screen bg-gray-100 p-4 md:p-6">
   {/* Header */}
   <div className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
    <div className="flex items-center gap-3">
     <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gray-900 text-white">
      <FaShoppingBag />
     </div>

     <div>
      <h1 className="text-2xl font-bold text-gray-900">Orders</h1>

      <p className="text-sm text-gray-500">Quản lý và xử lý đơn hàng</p>
     </div>
    </div>

    <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
     {/* Store selector */}
     {isSuperAdmin && (
      <div className="w-full sm:w-72">
       <label className="mb-1 block text-sm font-medium text-gray-700">Store</label>

       <select
        value={selectedStore}
        onChange={(event) => {
         setSelectedStore(event.target.value);

         setPagination((current) => ({
          ...current,
          page: 1,
         }));
        }}
        disabled={loadingStores}
        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-gray-900">
        <option value="">{loadingStores ? "Loading stores..." : "Select store"}</option>

        {stores.map((store) => (
         <option key={store._id} value={store._id}>
          {store.name}
         </option>
        ))}
       </select>
      </div>
     )}

     {/* Add order */}
     <Link
      href="/admin/orders/create"
      className="inline-flex h-[42px] items-center justify-center gap-2 rounded-lg bg-gray-900 px-4 text-sm font-semibold text-white transition hover:bg-gray-800">
      <FaPlus className="text-xs" />

      <span>Thêm đơn hàng</span>
     </Link>
    </div>
   </div>

   {/* Error */}
   {error && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

   {/* Success */}
   {success && <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">{success}</div>}

   {/* Summary */}
   <div className="mb-6 grid gap-4 md:grid-cols-2">
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
     <p className="text-sm text-gray-500">Tổng đơn hàng</p>

     <p className="mt-2 text-2xl font-bold text-gray-900">{summary.totalOrders}</p>
    </div>

    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
     <p className="text-sm text-gray-500">Tổng giá trị</p>

     <p className="mt-2 text-2xl font-bold text-gray-900">{summary.totalAmount.toLocaleString("vi-VN")}</p>
    </div>
   </div>

   {/* Filters */}
   <div className="mb-6 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
    <div className="grid gap-4 xl:grid-cols-[1.5fr_1fr_1fr_1fr_1fr_auto]">
     {/* Search */}
     <div>
      <label className="mb-1 block text-sm font-medium text-gray-700">Tìm kiếm</label>

      <div className="flex">
       <input
        type="text"
        value={searchInput}
        onChange={(event) => setSearchInput(event.target.value)}
        onKeyDown={(event) => {
         if (event.key === "Enter") {
          handleSearch();
         }
        }}
        placeholder="Mã đơn, tên khách, SĐT..."
        className="w-full rounded-l-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-gray-900"
       />

       <button
        type="button"
        onClick={handleSearch}
        className="inline-flex items-center justify-center rounded-r-lg bg-gray-900 px-4 text-white hover:bg-gray-800">
        <FaSearch />
       </button>
      </div>
     </div>

     {/* Order status */}
     <div>
      <label className="mb-1 block text-sm font-medium text-gray-700">Trạng thái</label>

      <select
       value={orderStatus}
       onChange={(event) => {
        setOrderStatus(event.target.value);

        setPagination((current) => ({
         ...current,
         page: 1,
        }));
       }}
       className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-gray-900">
       {statusOptions.map((option) => (
        <option key={option.value} value={option.value}>
         {option.label}
        </option>
       ))}
      </select>
     </div>

     {/* Payment */}
     <div>
      <label className="mb-1 block text-sm font-medium text-gray-700">Thanh toán</label>

      <select
       value={paymentStatus}
       onChange={(event) => {
        setPaymentStatus(event.target.value);

        setPagination((current) => ({
         ...current,
         page: 1,
        }));
       }}
       className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-gray-900">
       {paymentStatusOptions.map((option) => (
        <option key={option.value} value={option.value}>
         {option.label}
        </option>
       ))}
      </select>
     </div>

     {/* From */}
     <div>
      <label className="mb-1 block text-sm font-medium text-gray-700">Từ ngày</label>

      <input
       type="date"
       value={fromDate}
       onChange={(event) => {
        setFromDate(event.target.value);

        setPagination((current) => ({
         ...current,
         page: 1,
        }));
       }}
       className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-gray-900"
      />
     </div>

     {/* To */}
     <div>
      <label className="mb-1 block text-sm font-medium text-gray-700">Đến ngày</label>

      <input
       type="date"
       value={toDate}
       onChange={(event) => {
        setToDate(event.target.value);

        setPagination((current) => ({
         ...current,
         page: 1,
        }));
       }}
       className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-gray-900"
      />
     </div>

     {/* Reset */}
     <div className="flex items-end">
      <button
       type="button"
       onClick={handleReset}
       className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50">
       Đặt lại
      </button>
     </div>
    </div>
   </div>

   {/* Orders table */}
   <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
    <div className="overflow-x-auto">
     <table className="min-w-full text-sm">
      <thead className="border-b border-gray-200 bg-gray-50">
       <tr>
        <th className="whitespace-nowrap px-4 py-3 text-left font-semibold text-gray-700">Đơn hàng</th>

        <th className="whitespace-nowrap px-4 py-3 text-left font-semibold text-gray-700">Khách hàng</th>

        {isSuperAdmin && <th className="whitespace-nowrap px-4 py-3 text-left font-semibold text-gray-700">Store</th>}

        <th className="whitespace-nowrap px-4 py-3 text-left font-semibold text-gray-700">Tổng tiền</th>

        <th className="whitespace-nowrap px-4 py-3 text-left font-semibold text-gray-700">Trạng thái</th>

        <th className="whitespace-nowrap px-4 py-3 text-left font-semibold text-gray-700">Thanh toán</th>

        <th className="whitespace-nowrap px-4 py-3 text-left font-semibold text-gray-700">Ngày tạo</th>

        <th className="whitespace-nowrap px-4 py-3 text-right font-semibold text-gray-700">Xem</th>
       </tr>
      </thead>

      <tbody className="divide-y divide-gray-100">
       {loadingOrders ? (
        <tr>
         <td colSpan={isSuperAdmin ? 8 : 7} className="px-4 py-12 text-center text-gray-500">
          Đang tải đơn hàng...
         </td>
        </tr>
       ) : orders.length === 0 ? (
        <tr>
         <td colSpan={isSuperAdmin ? 8 : 7} className="px-4 py-12 text-center text-gray-500">
          Không có đơn hàng.
         </td>
        </tr>
       ) : (
        orders.map((order) => {
         const customer = typeof order.customerId === "object" ? order.customerId : null;

         const store = typeof order.storeId === "object" ? order.storeId : stores.find((item) => item._id === order.storeId);

         const isUpdating = updatingOrderId === order._id;

         const nextStatuses = allowedTransitions[order.status] || [];

         return (
          <tr key={order._id} className="transition hover:bg-gray-50">
           {/* Order */}
           <td className="px-4 py-4">
            <div className="font-semibold text-gray-900">{order.orderNumber}</div>

            <div className="mt-1 text-xs text-gray-400">{order._id}</div>
           </td>

           {/* Customer */}
           <td className="px-4 py-4">
            <div className="font-medium text-gray-900">{order.customerSnapshot?.name || customer?.name || "Không xác định"}</div>

            <div className="mt-1 text-xs text-gray-500">{order.customerSnapshot?.phone || customer?.phone || "-"}</div>
           </td>

           {/* Store */}
           {isSuperAdmin && <td className="px-4 py-4 text-gray-600">{store?.name || "-"}</td>}

           {/* Total */}
           <td className="whitespace-nowrap px-4 py-4">
            <span className="font-semibold text-gray-900">{formatMoney(order.total, order.currency)}</span>
           </td>

           {/* STATUS DROPDOWN */}
           <td className="px-4 py-4">
            <div className="relative min-w-[155px]">
             <select
              value={order.status}
              disabled={isUpdating || nextStatuses.length === 0}
              onChange={(event) => handleStatusChange(order, event.target.value)}
              className={`w-full appearance-none rounded-lg border px-3 py-2 text-xs font-medium outline-none transition focus:ring-2 focus:ring-gray-200 disabled:cursor-not-allowed disabled:opacity-60 ${getStatusSelectClass(
               order.status,
              )}`}>
              <option value={order.status}>{isUpdating ? "Đang cập nhật..." : getStatusLabel(order.status)}</option>

              {nextStatuses.map((nextStatus) => (
               <option key={nextStatus} value={nextStatus}>
                {getStatusLabel(nextStatus)}
               </option>
              ))}
             </select>

             {/* Custom arrow */}
             <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-current">
              <svg width="12" height="12" viewBox="0 0 20 20" fill="currentColor">
               <path d="M5.5 7.5L10 12l4.5-4.5L16 9l-6 6-6-6 1.5-1.5Z" />
              </svg>
             </div>
            </div>
           </td>

           {/* Payment */}
           <td className="px-4 py-4">
            <span className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ${getPaymentStatusClass(order.paymentStatus)}`}>
             {getPaymentStatusLabel(order.paymentStatus)}
            </span>
           </td>

           {/* Created */}
           <td className="whitespace-nowrap px-4 py-4 text-gray-600">{new Date(order.createdAt).toLocaleString("vi-VN")}</td>

           {/* View */}
           <td className="px-4 py-4">
            <div className="flex justify-end">
             <Link
              href={`/admin/orders/${order._id}`}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-300 text-gray-700 transition hover:bg-gray-50"
              title="Xem đơn hàng">
              <FaEye />
             </Link>
            </div>
           </td>
          </tr>
         );
        })
       )}
      </tbody>
     </table>
    </div>

    {/* Pagination */}
    {pagination.totalPages > 1 && (
     <div className="flex flex-col gap-3 border-t border-gray-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="text-sm text-gray-500">
       Trang {pagination.page} / {pagination.totalPages}
       {" · "}
       {pagination.total} đơn hàng
      </div>

      <div className="flex gap-2">
       <button
        type="button"
        disabled={pagination.page <= 1 || loadingOrders}
        onClick={() =>
         setPagination((current) => ({
          ...current,
          page: current.page - 1,
         }))
        }
        className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40">
        Trước
       </button>

       <button
        type="button"
        disabled={pagination.page >= pagination.totalPages || loadingOrders}
        onClick={() =>
         setPagination((current) => ({
          ...current,
          page: current.page + 1,
         }))
        }
        className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40">
        Sau
       </button>
      </div>
     </div>
    )}
   </div>
  </div>
 );
}

OrdersPage.Layout = "Admin";
