import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useSession } from "next-auth/react";

interface PopulatedUser {
 _id?: string;
 name?: string;
 email?: string;
 phone?: string;
}

interface PopulatedAffiliate {
 _id?: string;
 code?: string;
 status?: string;
 userId?: PopulatedUser | string | null;
}

interface PopulatedStore {
 _id?: string;
 name?: string;
 slug?: string;
}

interface PopulatedOrderStatus {
 _id?: string;
 name?: string;
 code?: string;
 color?: string;
}

interface PopulatedOrder {
 _id?: string;
 orderNumber?: string;
 code?: string;
 status?: string | PopulatedOrderStatus | null;
 statusId?: PopulatedOrderStatus | string | null;
 total?: number;
 totalAmount?: number;
}

interface PopulatedProduct {
 _id?: string;
 name?: string;
 slug?: string;
}

interface PopulatedAffiliateStore {
 commissionRate?: number;
 status?: string;
}

interface AffiliateCommissionItem {
 _id: string;
 affiliateId?: PopulatedAffiliate | string | null;
 affiliateStoreId?: PopulatedAffiliateStore | string | null;
 storeId?: PopulatedStore | string | null;
 orderId?: PopulatedOrder | string | null;
 productId?: PopulatedProduct | string | null;
 orderNumber?: string;
 productName?: string;
 status?: string;
 commissionRate?: number;
 commissionAmount?: number;
 amount?: number;
 orderAmount?: number;
 subtotal?: number;
 currency?: string;
 createdAt?: string;
 updatedAt?: string;
 approvedBy?: PopulatedUser | string | null;
 [key: string]: unknown;
}

interface Pagination {
 page: number;
 limit: number;
 total: number;
 totalPages: number;
}

interface CommissionResponse {
 success: boolean;
 message?: string;
 commissions?: AffiliateCommissionItem[];
 pagination?: Pagination;
}

const STATUS_OPTIONS = [
 { value: "", label: "Tất cả trạng thái" },
 { value: "PENDING", label: "Chờ xử lý" },
 { value: "APPROVED", label: "Đã duyệt" },
 { value: "PAID", label: "Đã thanh toán" },
 { value: "REVERSED", label: "Đã hoàn tác" },
];
const ALLOWED_TRANSITIONS: Record<string, string[]> = {
 PENDING: ["APPROVED", "REVERSED"],
 APPROVED: ["PAID", "REVERSED"],
 PAID: [],
 REVERSED: [],
};
const EMPTY_PAGINATION: Pagination = {
 page: 1,
 limit: 10,
 total: 0,
 totalPages: 0,
};

function getPopulated<T extends object>(value: T | string | null | undefined): T | null {
 return value && typeof value === "object" ? value : null;
}

function getId(value: unknown): string {
 if (typeof value === "string") return value;

 if (value && typeof value === "object" && "_id" in value) {
  const id = (value as { _id?: unknown })._id;
  return id == null ? "" : String(id);
 }

 return "";
}

function getAffiliateUser(affiliate: PopulatedAffiliate | null): PopulatedUser | null {
 return getPopulated(affiliate?.userId);
}

function formatDate(value?: string): string {
 if (!value) return "—";

 const date = new Date(value);

 if (Number.isNaN(date.getTime())) return "—";

 return new Intl.DateTimeFormat("vi-VN", {
  dateStyle: "short",
  timeStyle: "short",
 }).format(date);
}

function formatMoney(value: number | undefined, currency?: string): string {
 if (typeof value !== "number" || !Number.isFinite(value)) {
  return "—";
 }

 const currencyCode = currency || "VND";

 try {
  return new Intl.NumberFormat("vi-VN", {
   style: "currency",
   currency: currencyCode,
   maximumFractionDigits: 2,
  }).format(value);
 } catch {
  return `${value.toLocaleString("vi-VN")} ${currencyCode}`;
 }
}

function getStatusLabel(status?: string): string {
 const option = STATUS_OPTIONS.find((item) => item.value === status);

 return option?.label || status || "Không xác định";
}

function getStatusClass(status?: string): string {
 switch (status) {
  case "PENDING":
   return "bg-amber-100 text-amber-700";
  case "APPROVED":
   return "bg-blue-100 text-blue-700";
  case "PAID":
   return "bg-emerald-100 text-emerald-700";
  case "REVERSED":
   return "bg-red-100 text-red-700";
  default:
   return "bg-gray-100 text-gray-600";
 }
}

function getCommissionAmount(commission: AffiliateCommissionItem): number | undefined {
 if (typeof commission.commissionAmount === "number") {
  return commission.commissionAmount;
 }

 if (typeof commission.amount === "number") {
  return commission.amount;
 }

 return undefined;
}

function getCommissionRate(commission: AffiliateCommissionItem): number | undefined {
 if (typeof commission.commissionRate === "number") {
  return commission.commissionRate;
 }

 const affiliateStore = getPopulated(commission.affiliateStoreId);

 return typeof affiliateStore?.commissionRate === "number" ? affiliateStore.commissionRate : undefined;
}

export default function AffiliateCommissionsPage() {
 const { status: sessionStatus } = useSession();

 const [commissions, setCommissions] = useState<AffiliateCommissionItem[]>([]);
 const [pagination, setPagination] = useState<Pagination>(EMPTY_PAGINATION);

 const [searchInput, setSearchInput] = useState("");
 const [search, setSearch] = useState("");
 const [statusFilter, setStatusFilter] = useState("");
 const [storeId, setStoreId] = useState("");
 const [affiliateId, setAffiliateId] = useState("");
 const [page, setPage] = useState(1);
 const [limit, setLimit] = useState(10);

 const [loading, setLoading] = useState(false);
 const [error, setError] = useState("");
 const [updatingId, setUpdatingId] = useState("");
 const [selectedStatuses, setSelectedStatuses] = useState<Record<string, string>>({});
 const [actionMessage, setActionMessage] = useState("");
 const [actionError, setActionError] = useState("");
 const loadCommissions = useCallback(async () => {
  if (sessionStatus !== "authenticated") return;

  const controller = new AbortController();

  try {
   setLoading(true);
   setError("");

   const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
   });

   if (search) params.set("search", search);
   if (statusFilter) params.set("status", statusFilter);
   if (storeId.trim()) params.set("storeId", storeId.trim());
   if (affiliateId.trim()) params.set("affiliateId", affiliateId.trim());

   const response = await fetch(`/api/admin/affiliate-commissions?${params.toString()}`, {
    method: "GET",
    headers: { Accept: "application/json" },
    signal: controller.signal,
   });

   const result = (await response.json()) as CommissionResponse;

   if (!response.ok || !result.success) {
    throw new Error(result.message || "Không thể tải danh sách hoa hồng.");
   }

   setCommissions(Array.isArray(result.commissions) ? result.commissions : []);
   setPagination(result.pagination || EMPTY_PAGINATION);
  } catch (err) {
   if (err instanceof Error && err.name === "AbortError") return;

   setCommissions([]);
   setError(err instanceof Error ? err.message : "Đã xảy ra lỗi khi tải danh sách hoa hồng.");
  } finally {
   setLoading(false);
  }

  return () => controller.abort();
 }, [sessionStatus, page, limit, search, statusFilter, storeId, affiliateId]);

 useEffect(() => {
  void loadCommissions();
 }, [loadCommissions]);

 const handleUpdateCommissionStatus = async (commission: AffiliateCommissionItem) => {
  const nextStatus = selectedStatuses[commission._id];

  if (!nextStatus || nextStatus === commission.status) {
   return;
  }

  const allowedStatuses = ALLOWED_TRANSITIONS[commission.status || ""] || [];

  if (!allowedStatuses.includes(nextStatus)) {
   setActionError("Không thể chuyển sang trạng thái hoa hồng đã chọn.");
   setActionMessage("");
   return;
  }

  try {
   setUpdatingId(commission._id);
   setActionError("");
   setActionMessage("");

   const response = await fetch(`/api/admin/affiliate-commissions/${commission._id}`, {
    method: "PATCH",
    headers: {
     "Content-Type": "application/json",
     Accept: "application/json",
    },
    body: JSON.stringify({
     status: nextStatus,
    }),
   });

   const result = (await response.json()) as {
    success?: boolean;
    message?: string;
   };

   if (!response.ok || !result.success) {
    throw new Error(result.message || "Không thể cập nhật trạng thái hoa hồng.");
   }

   setActionMessage("Cập nhật trạng thái hoa hồng thành công.");

   setSelectedStatuses((current) => {
    const next = { ...current };
    delete next[commission._id];
    return next;
   });

   await loadCommissions();
  } catch (err) {
   setActionError(err instanceof Error ? err.message : "Đã xảy ra lỗi khi cập nhật trạng thái hoa hồng.");
  } finally {
   setUpdatingId("");
  }
 };

 const handleSearch = (event: FormEvent<HTMLFormElement>) => {
  event.preventDefault();
  setPage(1);
  setSearch(searchInput.trim());
 };

 const handleStatusChange = (value: string) => {
  setPage(1);
  setStatusFilter(value);
 };

 const handleLimitChange = (value: string) => {
  setPage(1);
  setLimit(Number(value));
 };

 if (sessionStatus === "loading") {
  return <div className="flex min-h-[50vh] items-center justify-center text-sm text-gray-500">Đang kiểm tra quyền truy cập...</div>;
 }

 if (sessionStatus !== "authenticated") {
  return <div className="p-6 text-sm text-gray-600">Vui lòng đăng nhập để xem danh sách hoa hồng.</div>;
 }

 return (
  <div className="min-h-screen bg-gray-50 p-4 md:p-6">
   <div className="mx-auto max-w-[1600px] space-y-6">
    <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
     <div>
      <h1 className="text-2xl font-bold text-gray-900">Quản lý hoa hồng Affiliate</h1>
      <p className="mt-1 text-sm text-gray-500">Theo dõi hoa hồng phát sinh từ đơn hàng của Affiliate.</p>
     </div>

     <div className="rounded-xl border border-gray-200 bg-white px-5 py-3 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Tổng bản ghi</p>
      <p className="mt-1 text-2xl font-bold text-gray-900">{pagination.total.toLocaleString("vi-VN")}</p>
     </div>
    </div>

    <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm md:p-5">
     <form onSubmit={handleSearch} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
       <div>
        <label htmlFor="commission-search" className="mb-1.5 block text-sm font-medium text-gray-700">
         Tìm kiếm
        </label>
        <input
         id="commission-search"
         type="search"
         value={searchInput}
         onChange={(event) => setSearchInput(event.target.value)}
         placeholder="Mã Affiliate, email, đơn hàng, sản phẩm..."
         className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        />
       </div>

       <div>
        <label htmlFor="commission-status" className="mb-1.5 block text-sm font-medium text-gray-700">
         Trạng thái hoa hồng
        </label>
        <select
         id="commission-status"
         value={statusFilter}
         onChange={(event) => handleStatusChange(event.target.value)}
         className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100">
         {STATUS_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
           {option.label}
          </option>
         ))}
        </select>
       </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
       <div>
        <label htmlFor="commission-store" className="mb-1.5 block text-sm font-medium text-gray-700">
         ID cửa hàng
        </label>
        <input
         id="commission-store"
         value={storeId}
         onChange={(event) => setStoreId(event.target.value)}
         placeholder="Nhập Store ID (không bắt buộc)"
         className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        />
       </div>

       <div>
        <label htmlFor="commission-affiliate" className="mb-1.5 block text-sm font-medium text-gray-700">
         ID Affiliate
        </label>
        <input
         id="commission-affiliate"
         value={affiliateId}
         onChange={(event) => setAffiliateId(event.target.value)}
         placeholder="Nhập Affiliate ID (không bắt buộc)"
         className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        />
       </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
       <button type="submit" className="rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-700">
        Tìm kiếm
       </button>

       <button
        type="button"
        onClick={() => {
         setSearchInput("");
         setSearch("");
         setStatusFilter("");
         setStoreId("");
         setAffiliateId("");
         setPage(1);
        }}
        className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50">
        Xóa bộ lọc
       </button>
      </div>
     </form>
    </section>

    {error && (
     <div
      role="alert"
      className="flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 sm:flex-row sm:items-center sm:justify-between">
      <span>{error}</span>
      <button type="button" onClick={() => void loadCommissions()} className="self-start font-semibold underline sm:self-auto">
       Thử lại
      </button>
     </div>
    )}

    {actionMessage && (
     <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
      {actionMessage}
     </div>
    )}

    {actionError && (
     <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
      {actionError}
     </div>
    )}

    <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
     <div className="flex flex-col justify-between gap-3 border-b border-gray-200 px-4 py-4 sm:flex-row sm:items-center md:px-5">
      <div>
       <h2 className="font-semibold text-gray-900">Danh sách hoa hồng</h2>
       <p className="mt-1 text-xs text-gray-500">{loading ? "Đang tải dữ liệu..." : `Hiển thị ${commissions.length} / ${pagination.total} bản ghi`}</p>
      </div>

      <div className="flex items-center gap-2 text-sm text-gray-600">
       <label htmlFor="commission-limit">Số dòng:</label>
       <select
        id="commission-limit"
        value={limit}
        onChange={(event) => handleLimitChange(event.target.value)}
        className="rounded-lg border border-gray-300 bg-white px-2 py-2 outline-none focus:border-blue-500">
        <option value={10}>10</option>
        <option value={20}>20</option>
        <option value={50}>50</option>
        <option value={100}>100</option>
       </select>
      </div>
     </div>

     <div className="overflow-x-auto">
      <table className="w-full min-w-[1200px] border-collapse text-left text-sm">
       <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
        <tr>
         <th className="px-4 py-3 font-semibold">Affiliate</th>
         <th className="px-4 py-3 font-semibold">Cửa hàng</th>
         <th className="px-4 py-3 font-semibold">Đơn hàng</th>
         <th className="px-4 py-3 font-semibold">Sản phẩm</th>
         <th className="px-4 py-3 text-right font-semibold">Giá trị đơn</th>
         <th className="px-4 py-3 text-right font-semibold">Tỷ lệ</th>
         <th className="px-4 py-3 text-right font-semibold">Hoa hồng</th>
         <th className="px-4 py-3 font-semibold">Trạng thái</th>
         <th className="px-4 py-3 font-semibold">Thao tác</th>
         <th className="px-4 py-3 font-semibold">Ngày tạo</th>
        </tr>
       </thead>

       <tbody className="divide-y divide-gray-100">
        {loading && commissions.length === 0 ? (
         <tr>
          <td colSpan={10} className="px-4 py-16 text-center text-gray-500">
           Đang tải danh sách hoa hồng...
          </td>
         </tr>
        ) : commissions.length === 0 ? (
         <tr>
          <td colSpan={10} className="px-4 py-16 text-center text-gray-500">
           Không tìm thấy bản ghi hoa hồng phù hợp.
          </td>
         </tr>
        ) : (
         commissions.map((commission) => {
          const affiliate = getPopulated(commission.affiliateId);
          const affiliateUser = getAffiliateUser(affiliate);
          const store = getPopulated(commission.storeId);
          const order = getPopulated(commission.orderId);
          const product = getPopulated(commission.productId);
          const commissionAmount = getCommissionAmount(commission);
          const commissionRate = getCommissionRate(commission);

          const orderNumber = commission.orderNumber || order?.orderNumber || order?.code || getId(commission.orderId);

          const productName = commission.productName || product?.name || "Sản phẩm không xác định";

          const currency = commission.currency || "VND";

          return (
           <tr key={commission._id} className="transition hover:bg-gray-50">
            <td className="px-4 py-4">
             <div className="font-semibold text-gray-900">{affiliateUser?.name || "—"}</div>
             <div className="mt-1 text-xs text-gray-500">{affiliate?.code || "Chưa có mã"}</div>
             <div className="mt-1 text-xs text-gray-500">{affiliateUser?.email || ""}</div>
            </td>

            <td className="px-4 py-4">
             <div className="font-medium text-gray-800">{store?.name || "—"}</div>
             {store?.slug && <div className="mt-1 text-xs text-gray-500">{store.slug}</div>}
            </td>

            <td className="px-4 py-4">
             <div className="font-medium text-blue-700">{orderNumber || "—"}</div>

             {(() => {
              const orderStatus =
               typeof order?.statusId === "object" && order.statusId
                ? order.statusId.name || order.statusId.code || ""
                : typeof order?.status === "object" && order.status
                  ? order.status.name || order.status.code || ""
                  : typeof order?.status === "string"
                    ? order.status
                    : typeof order?.statusId === "string"
                      ? order.statusId
                      : "";

              return orderStatus ? (
               <div className="mt-1 text-xs text-gray-500">Trạng thái đơn: {orderStatus}</div>
              ) : (
               <div className="mt-1 text-xs text-gray-400">Chưa có trạng thái đơn hàng</div>
              );
             })()}
            </td>

            <td className="px-4 py-4">
             <div className="max-w-[220px] truncate font-medium text-gray-800">{productName}</div>
            </td>

            <td className="px-4 py-4 text-right tabular-nums text-gray-700">
             {formatMoney(
              typeof commission.orderAmount === "number"
               ? commission.orderAmount
               : typeof commission.subtotal === "number"
                 ? commission.subtotal
                 : order?.totalAmount,
              currency,
             )}
            </td>

            <td className="px-4 py-4 text-right tabular-nums text-gray-700">{commissionRate === undefined ? "—" : `${commissionRate}%`}</td>

            <td className="px-4 py-4 text-right font-semibold tabular-nums text-gray-900">{formatMoney(commissionAmount, currency)}</td>

            <td className="px-4 py-4">
             <span className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusClass(commission.status)}`}>
              {getStatusLabel(commission.status)}
             </span>
            </td>

            <td className="px-4 py-4">
             {(() => {
              const allowedStatuses = ALLOWED_TRANSITIONS[commission.status || ""] || [];

              const selectedStatus = selectedStatuses[commission._id] || "";

              return allowedStatuses.length > 0 ? (
               <div className="flex min-w-[210px] flex-col gap-2">
                <select
                 aria-label={`Trạng thái mới của hoa hồng ${commission._id}`}
                 value={selectedStatus}
                 disabled={updatingId === commission._id}
                 onChange={(event) => {
                  setSelectedStatuses((current) => ({
                   ...current,
                   [commission._id]: event.target.value,
                  }));
                  setActionMessage("");
                  setActionError("");
                 }}
                 className="rounded-lg border border-gray-300 bg-white px-2 py-2 text-sm outline-none focus:border-blue-500 disabled:opacity-50">
                 <option value="">Chọn trạng thái mới</option>
                 {allowedStatuses.map((status) => (
                  <option key={status} value={status}>
                   {getStatusLabel(status)}
                  </option>
                 ))}
                </select>

                <button
                 type="button"
                 disabled={!selectedStatus || selectedStatus === commission.status || updatingId === commission._id}
                 onClick={() => void handleUpdateCommissionStatus(commission)}
                 className="rounded-lg bg-gray-900 px-3 py-2 text-xs font-semibold text-white transition hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-40">
                 {updatingId === commission._id ? "Đang cập nhật..." : "Cập nhật"}
                </button>
               </div>
              ) : (
               <span className="text-xs text-gray-400">Không thể chuyển trạng thái</span>
              );
             })()}
            </td>

            <td className="whitespace-nowrap px-4 py-4 text-gray-600">{formatDate(commission.createdAt)}</td>
           </tr>
          );
         })
        )}
       </tbody>
      </table>
     </div>

     <div className="flex flex-col justify-between gap-3 border-t border-gray-200 px-4 py-4 sm:flex-row sm:items-center md:px-5">
      <p className="text-sm text-gray-500">
       Trang {pagination.page} / {Math.max(pagination.totalPages, 1)}
       {" · "}
       Tổng {pagination.total.toLocaleString("vi-VN")} bản ghi
      </p>

      <div className="flex items-center gap-2">
       <button
        type="button"
        disabled={loading || page <= 1}
        onClick={() => setPage((current) => Math.max(1, current - 1))}
        className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40">
        Trước
       </button>

       <button
        type="button"
        disabled={loading || page >= Math.max(pagination.totalPages, 1)}
        onClick={() => setPage((current) => Math.min(Math.max(pagination.totalPages, 1), current + 1))}
        className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40">
        Tiếp
       </button>
      </div>
     </div>
    </section>
   </div>
  </div>
 );
}

AffiliateCommissionsPage.Layout = "Admin";
