import { useCallback, useEffect, useState } from "react";
import type { NextPage } from "next";
import Head from "next/head";

type AffiliateStore = {
 id: string;
 name: string;
 code?: string;
 commissionRate: number;
 status: string;
};

type AffiliateProfile = {
 id: string;
 code: string;
 status: string;
 stores: AffiliateStore[];
};

type CommissionStats = {
 conversions: number;
 deliveredOrders: number;
 estimatedCommission: number;
 actualCommission: number;
 paidAmount: number;
 remainingCommission: number;
 ordersMissingRate: number;
 currency: "VND";
};

type Commission = {
 _id: string;
 orderNumber?: string;
 productName?: string;
 quantity: number;
 commissionRate: number;
 commissionBase: number;
 amount: number;
 currency: string;
 status: "PENDING" | "APPROVED" | "PAID" | "REVERSED";
 createdAt: string;
 storeId?: {
  _id: string;
  name: string;
  code?: string;
 };
 orderId?: {
  _id: string;
  orderNumber?: string;
  statusId?:
   | {
      code?: string;
      name?: string;
     }
   | string;
  createdAt?: string;
 };
 orderItemId?: {
  productSnapshot?: {
   name?: string;
  };
  quantity?: number;
 };
 productId?: {
  name?: string;
 };
};

type ApiResult<T> = {
 success: boolean;
 message?: string;
 data?: T;
 pagination?: {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
 };
};

const currencyFormatter = new Intl.NumberFormat("vi-VN", {
 style: "currency",
 currency: "VND",
 maximumFractionDigits: 0,
});

const dateFormatter = new Intl.DateTimeFormat("vi-VN", {
 day: "2-digit",
 month: "2-digit",
 year: "numeric",
});

const statusLabels: Record<Commission["status"], string> = {
 PENDING: "Đang chờ",
 APPROVED: "Đã duyệt",
 PAID: "Đã thanh toán",
 REVERSED: "Đã thu hồi",
};

const statusStyles: Record<Commission["status"], string> = {
 PENDING: "bg-amber-50 text-amber-700 ring-amber-200",
 APPROVED: "bg-blue-50 text-blue-700 ring-blue-200",
 PAID: "bg-emerald-50 text-emerald-700 ring-emerald-200",
 REVERSED: "bg-red-50 text-red-700 ring-red-200",
};

function formatCurrency(value: number) {
 return currencyFormatter.format(value || 0);
}

function formatDate(value?: string) {
 if (!value) return "—";

 const date = new Date(value);

 if (Number.isNaN(date.getTime())) return "—";

 return dateFormatter.format(date);
}

function getProductName(commission: Commission) {
 return commission.orderItemId?.productSnapshot?.name || commission.productId?.name || commission.productName || "Sản phẩm";
}

function getOrderNumber(commission: Commission) {
 return commission.orderId?.orderNumber || commission.orderNumber || commission.orderId?._id || "—";
}

export default function AffiliateDashboard() {
 const [profile, setProfile] = useState<AffiliateProfile | null>(null);
 const [stats, setStats] = useState<CommissionStats | null>(null);
 const [commissions, setCommissions] = useState<Commission[]>([]);

 const [storeId, setStoreId] = useState("");
 const [status, setStatus] = useState("");
 const [page, setPage] = useState(1);
 const [totalPages, setTotalPages] = useState(1);
 const [totalRecords, setTotalRecords] = useState(0);

 const [loading, setLoading] = useState(true);
 const [tableLoading, setTableLoading] = useState(false);
 const [error, setError] = useState("");

 const loadProfile = useCallback(async () => {
  const response = await fetch("/api/affiliate/me");
  const result: ApiResult<AffiliateProfile> = await response.json();

  if (!response.ok || !result.success || !result.data) {
   throw new Error(result.message || "Không thể tải thông tin affiliate.");
  }

  setProfile(result.data);
  return result.data;
 }, []);

 const loadStats = useCallback(async (selectedStoreId: string) => {
  const params = new URLSearchParams();

  if (selectedStoreId) {
   params.set("storeId", selectedStoreId);
  }

  const response = await fetch(`/api/affiliate/commissions/stats?${params.toString()}`);

  const result: ApiResult<CommissionStats> = await response.json();

  if (!response.ok || !result.success || !result.data) {
   throw new Error(result.message || "Không thể tải thống kê hoa hồng.");
  }

  setStats(result.data);
 }, []);

 const loadCommissions = useCallback(async (selectedStoreId: string, selectedStatus: string, selectedPage: number) => {
  const params = new URLSearchParams({
   page: String(selectedPage),
   limit: "10",
  });

  if (selectedStoreId) params.set("storeId", selectedStoreId);
  if (selectedStatus) params.set("status", selectedStatus);

  const response = await fetch(`/api/affiliate/commissions?${params.toString()}`);

  const result: ApiResult<Commission[]> = await response.json();

  if (!response.ok || !result.success) {
   throw new Error(result.message || "Không thể tải danh sách hoa hồng.");
  }

  setCommissions(result.data || []);
  setTotalPages(result.pagination?.totalPages || 1);
  setTotalRecords(result.pagination?.total || 0);
 }, []);

 useEffect(() => {
  let cancelled = false;

  async function initialize() {
   setLoading(true);
   setError("");

   try {
    const response = await fetch("/api/affiliate/me");
    const result: ApiResult<AffiliateProfile> = await response.json();

    if (!response.ok || !result.success || !result.data) {
     throw new Error(result.message || "Không thể tải thông tin affiliate.");
    }

    if (cancelled) return;

    setProfile(result.data);

    const [statsResponse, commissionResponse] = await Promise.all([
     fetch("/api/affiliate/commissions/stats"),
     fetch("/api/affiliate/commissions?page=1&limit=10"),
    ]);

    const statsResult: ApiResult<CommissionStats> = await statsResponse.json();

    const commissionResult: ApiResult<Commission[]> = await commissionResponse.json();

    if (!statsResponse.ok || !statsResult.success || !statsResult.data) {
     throw new Error(statsResult.message || "Không thể tải thống kê.");
    }

    if (!commissionResponse.ok || !commissionResult.success) {
     throw new Error(commissionResult.message || "Không thể tải danh sách hoa hồng.");
    }

    if (cancelled) return;

    setStats(statsResult.data);
    setCommissions(commissionResult.data || []);
    setTotalPages(commissionResult.pagination?.totalPages || 1);
    setTotalRecords(commissionResult.pagination?.total || 0);
   } catch (err) {
    if (!cancelled) {
     setError(err instanceof Error ? err.message : "Đã xảy ra lỗi khi tải dữ liệu.");
    }
   } finally {
    if (!cancelled) setLoading(false);
   }
  }

  initialize();

  return () => {
   cancelled = true;
  };
 }, []);

 const applyFilters = useCallback(
  async (selectedStoreId: string, selectedStatus: string, selectedPage: number) => {
   setTableLoading(true);
   setError("");

   try {
    await Promise.all([loadStats(selectedStoreId), loadCommissions(selectedStoreId, selectedStatus, selectedPage)]);
   } catch (err) {
    setError(err instanceof Error ? err.message : "Không thể cập nhật dữ liệu.");
   } finally {
    setTableLoading(false);
   }
  },
  [loadStats, loadCommissions],
 );

 function handleStoreChange(value: string) {
  setStoreId(value);
  setPage(1);
  void applyFilters(value, status, 1);
 }

 function handleStatusChange(value: string) {
  setStatus(value);
  setPage(1);
  void applyFilters(storeId, value, 1);
 }

 function handlePageChange(value: number) {
  const nextPage = Math.max(1, Math.min(value, totalPages));

  setPage(nextPage);
  void loadCommissions(storeId, status, nextPage).catch((err) => {
   setError(err instanceof Error ? err.message : "Không thể tải dữ liệu.");
  });
 }

 if (loading) {
  return (
   <div className="flex min-h-screen items-center justify-center bg-slate-50">
    <div className="text-sm font-medium text-slate-500">Đang tải dữ liệu affiliate...</div>
   </div>
  );
 }

 return (
  <>
   <Head>
    <title>Tổng quan Affiliate</title>
    <meta name="description" content="Theo dõi đơn hàng và hoa hồng affiliate." />
   </Head>

   <main className="min-h-screen bg-slate-50 text-slate-900">
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
     <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
      <div>
       <p className="text-sm font-medium text-emerald-700">AFFILIATE PORTAL</p>
       <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">Tổng quan hoa hồng</h1>
       <p className="mt-2 text-sm text-slate-500">Theo dõi đơn hàng, hoa hồng và lịch sử thanh toán của bạn.</p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
       <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Mã affiliate</p>
       <p className="mt-1 text-lg font-bold text-emerald-700">{profile?.code || "—"}</p>
      </div>
     </div>

     {error && (
      <div
       role="alert"
       className="mt-6 flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 sm:flex-row sm:items-center sm:justify-between">
       <span>{error}</span>
       <button type="button" onClick={() => void applyFilters(storeId, status, page)} className="self-start font-semibold underline sm:self-auto">
        Thử lại
       </button>
      </div>
     )}

     <section className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      <StatCard title="Tổng đơn hàng" value={String(stats?.conversions || 0)} description="Đơn hàng gắn với affiliate" icon="▤" />
      <StatCard title="Đơn đã giao" value={String(stats?.deliveredOrders || 0)} description="Đơn có trạng thái DELIVERED" icon="✓" />
      <StatCard title="Hoa hồng ước tính" value={formatCurrency(stats?.estimatedCommission || 0)} description="Các đơn đủ điều kiện" icon="◷" />
      <StatCard title="Hoa hồng thực nhận" value={formatCurrency(stats?.actualCommission || 0)} description="Từ các đơn đã giao" icon="↗" />
      <StatCard title="Đã thanh toán" value={formatCurrency(stats?.paidAmount || 0)} description="Khoản thanh toán đã ghi nhận" icon="₫" />
      <StatCard title="Còn phải trả" value={formatCurrency(stats?.remainingCommission || 0)} description="Hoa hồng thực nhận trừ đã trả" icon="◉" highlight />
     </section>

     {Boolean(stats?.ordersMissingRate) && (
      <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
       Có {stats?.ordersMissingRate} sản phẩm chưa có tỷ lệ hoa hồng. Số tiền ước tính có thể chưa đầy đủ.
      </div>
     )}

     <section className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-5 py-5 sm:px-6">
       <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
         <h2 className="text-lg font-bold">Chi tiết hoa hồng</h2>
         <p className="mt-1 text-sm text-slate-500">{totalRecords} bản ghi hoa hồng</p>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
         <label className="block">
          <span className="mb-1.5 block text-xs font-semibold text-slate-600">Cửa hàng</span>
          <select
           value={storeId}
           onChange={(event) => handleStoreChange(event.target.value)}
           className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100">
           <option value="">Tất cả cửa hàng</option>
           {profile?.stores.map((store) => (
            <option key={store.id} value={store.id}>
             {store.name}
            </option>
           ))}
          </select>
         </label>

         <label className="block">
          <span className="mb-1.5 block text-xs font-semibold text-slate-600">Trạng thái hoa hồng</span>
          <select
           value={status}
           onChange={(event) => handleStatusChange(event.target.value)}
           className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100">
           <option value="">Tất cả trạng thái</option>
           <option value="PENDING">Đang chờ</option>
           <option value="APPROVED">Đã duyệt</option>
           <option value="PAID">Đã thanh toán</option>
           <option value="REVERSED">Đã thu hồi</option>
          </select>
         </label>
        </div>
       </div>
      </div>

      {tableLoading && <div className="border-b border-slate-100 bg-slate-50 px-5 py-2 text-xs text-slate-500">Đang cập nhật dữ liệu...</div>}

      <div className="overflow-x-auto">
       <table className="w-full min-w-[900px] text-left text-sm">
        <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
         <tr>
          <th className="px-5 py-4 font-semibold">Đơn hàng</th>
          <th className="px-5 py-4 font-semibold">Sản phẩm</th>
          <th className="px-5 py-4 font-semibold">Cửa hàng</th>
          <th className="px-5 py-4 text-right font-semibold">Tỷ lệ</th>
          <th className="px-5 py-4 text-right font-semibold">Hoa hồng</th>
          <th className="px-5 py-4 font-semibold">Ngày tạo</th>
          <th className="px-5 py-4 font-semibold">Trạng thái</th>
         </tr>
        </thead>

        <tbody className="divide-y divide-slate-100">
         {commissions.map((commission) => (
          <tr key={commission._id} className="transition hover:bg-slate-50">
           <td className="px-5 py-4">
            <p className="font-semibold text-slate-800">{getOrderNumber(commission)}</p>
            <p className="mt-1 text-xs text-slate-400">ID: {commission._id.slice(-8)}</p>
           </td>

           <td className="px-5 py-4">
            <p className="max-w-xs truncate font-medium text-slate-800">{getProductName(commission)}</p>
            <p className="mt-1 text-xs text-slate-500">Số lượng: {commission.quantity || commission.orderItemId?.quantity || 1}</p>
           </td>

           <td className="px-5 py-4 text-slate-600">{commission.storeId?.name || "—"}</td>

           <td className="px-5 py-4 text-right text-slate-600">{commission.commissionRate}%</td>

           <td className="px-5 py-4 text-right font-semibold text-slate-900">{formatCurrency(commission.amount)}</td>

           <td className="whitespace-nowrap px-5 py-4 text-slate-600">{formatDate(commission.createdAt)}</td>

           <td className="px-5 py-4">
            <span
             className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${statusStyles[commission.status]}`}>
             {statusLabels[commission.status]}
            </span>
           </td>
          </tr>
         ))}

         {!commissions.length && (
          <tr>
           <td colSpan={7} className="px-5 py-14 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-xl text-slate-400">▤</div>
            <p className="mt-3 font-semibold text-slate-700">Chưa có dữ liệu hoa hồng</p>
            <p className="mt-1 text-sm text-slate-500">Hoa hồng sẽ xuất hiện khi hệ thống tạo bản ghi tương ứng.</p>
           </td>
          </tr>
         )}
        </tbody>
       </table>
      </div>

      <div className="flex flex-col gap-3 border-t border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
       <p className="text-sm text-slate-500">
        Trang {page} / {totalPages}
       </p>

       <div className="flex gap-2">
        <button
         type="button"
         disabled={page <= 1 || tableLoading}
         onClick={() => handlePageChange(page - 1)}
         className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40">
         Trước
        </button>

        <button
         type="button"
         disabled={page >= totalPages || tableLoading}
         onClick={() => handlePageChange(page + 1)}
         className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40">
         Tiếp
        </button>
       </div>
      </div>
     </section>

     <p className="mt-5 text-xs leading-5 text-slate-400">
      Số liệu dựa trên dữ liệu đơn hàng và các bản ghi hoa hồng hiện có. Số tiền thanh toán được ghi nhận bởi quản trị viên.
     </p>
    </div>
   </main>
  </>
 );
}

type StatCardProps = {
 title: string;
 value: string;
 description: string;
 icon: string;
 highlight?: boolean;
};

function StatCard({ title, value, description, icon, highlight = false }: StatCardProps) {
 return (
  <div
   className={`rounded-2xl border p-5 shadow-sm transition hover:shadow-md ${highlight ? "border-emerald-200 bg-emerald-50/70" : "border-slate-200 bg-white"}`}>
   <div className="flex items-start justify-between gap-3">
    <p className="text-sm font-medium text-slate-500">{title}</p>
    <span
     className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-lg ${
      highlight ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"
     }`}>
     {icon}
    </span>
   </div>

   <p className={`mt-4 break-words text-2xl font-bold tracking-tight sm:text-3xl ${highlight ? "text-emerald-800" : "text-slate-900"}`}>{value}</p>

   <p className="mt-2 text-xs text-slate-500">{description}</p>
  </div>
 );
}

AffiliateDashboard.Layout = "Default";
