"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";

interface AffiliateOption {
 _id: string;
 code: string;
 status?: string;
 userId?:
  | {
     name?: string;
     email?: string;
    }
  | string;
}

interface StoreOption {
 _id: string;
 name: string;
 code?: string;
}

interface PopulatedAffiliate {
 _id: string;
 code?: string;
 userId?: {
  name?: string;
  email?: string;
 };
}

interface PopulatedStore {
 _id: string;
 name?: string;
 code?: string;
}

interface AffiliatePayment {
 _id: string;
 affiliateId: string | PopulatedAffiliate;
 affiliateStoreId: string | { _id: string; commissionRate?: number };
 storeId: string | PopulatedStore;
 amount: number;
 currency: "VND";
 paymentDate: string;
 paymentMethod: "BANK_TRANSFER" | "CASH" | "E_WALLET" | "OTHER";
 transactionReference?: string;
 note?: string;
 recordedBy?: { name?: string; email?: string };
 updatedBy?: { name?: string; email?: string };
 createdAt: string;
}

interface CommissionStats {
 deliveredOrders: number;
 estimatedCommission: number;
 actualCommission: number;
 paidAmount: number;
 remainingCommission: number;
 ordersMissingRate: number;
 currency: "VND";
}

interface PaymentForm {
 affiliateId: string;
 storeId: string;
 amount: string;
 paymentDate: string;
 paymentMethod: "BANK_TRANSFER" | "CASH" | "E_WALLET" | "OTHER";
 transactionReference: string;
 note: string;
}

const EMPTY_STATS: CommissionStats = {
 deliveredOrders: 0,
 estimatedCommission: 0,
 actualCommission: 0,
 paidAmount: 0,
 remainingCommission: 0,
 ordersMissingRate: 0,
 currency: "VND",
};

function getLocalDate(): string {
 const date = new Date();
 const year = date.getFullYear();
 const month = String(date.getMonth() + 1).padStart(2, "0");
 const day = String(date.getDate()).padStart(2, "0");

 return `${year}-${month}-${day}`;
}

function createEmptyForm(affiliateId = "", storeId = ""): PaymentForm {
 return {
  affiliateId,
  storeId,
  amount: "",
  paymentDate: getLocalDate(),
  paymentMethod: "BANK_TRANSFER",
  transactionReference: "",
  note: "",
 };
}

function getId(value: string | { _id: string } | null | undefined): string {
 if (!value) return "";
 return typeof value === "string" ? value : value._id;
}

function formatVND(value: number | undefined | null): string {
 return new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
  maximumFractionDigits: 0,
 }).format(Number(value) || 0);
}

function formatDate(value?: string): string {
 if (!value) return "—";

 const date = new Date(value);

 if (Number.isNaN(date.getTime())) return "—";

 return new Intl.DateTimeFormat("vi-VN", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
 }).format(date);
}

function getAffiliateName(affiliate: AffiliateOption | PopulatedAffiliate | undefined): string {
 if (!affiliate) return "—";

 const user = typeof affiliate.userId === "object" && affiliate.userId ? affiliate.userId : undefined;

 return user?.name || user?.email || affiliate.code || affiliate._id;
}

function getPaymentAffiliateName(payment: AffiliatePayment): string {
 if (typeof payment.affiliateId === "string") {
  return payment.affiliateId;
 }

 return payment.affiliateId.userId?.name || payment.affiliateId.userId?.email || payment.affiliateId.code || payment.affiliateId._id;
}

function getPaymentStoreName(payment: AffiliatePayment): string {
 if (typeof payment.storeId === "string") {
  return payment.storeId;
 }

 return payment.storeId.name || payment.storeId.code || payment.storeId._id;
}

function getPaymentMethodLabel(method: string): string {
 const labels: Record<string, string> = {
  BANK_TRANSFER: "Chuyển khoản ngân hàng",
  CASH: "Tiền mặt",
  E_WALLET: "Ví điện tử",
  OTHER: "Khác",
 };

 return labels[method] || method;
}

export default function AffiliatePaymentsPage() {
 const { status: sessionStatus } = useSession();

 const [affiliates, setAffiliates] = useState<AffiliateOption[]>([]);
 const [stores, setStores] = useState<StoreOption[]>([]);
 const [payments, setPayments] = useState<AffiliatePayment[]>([]);
 const [stats, setStats] = useState<CommissionStats>(EMPTY_STATS);

 const [affiliateFilter, setAffiliateFilter] = useState("");
 const [storeFilter, setStoreFilter] = useState("");
 const [search, setSearch] = useState("");

 const [form, setForm] = useState<PaymentForm>(() => createEmptyForm());
 const [editingId, setEditingId] = useState<string | null>(null);
 const [showForm, setShowForm] = useState(false);

 const [loading, setLoading] = useState(true);
 const [saving, setSaving] = useState(false);
 const [deletingId, setDeletingId] = useState<string | null>(null);
 const [error, setError] = useState("");
 const [success, setSuccess] = useState("");

 const selectedAffiliate = useMemo(() => affiliates.find((item) => item._id === affiliateFilter), [affiliates, affiliateFilter]);

 const selectedStore = useMemo(() => stores.find((item) => item._id === storeFilter), [stores, storeFilter]);

 const fetchAffiliates = useCallback(async () => {
  const response = await fetch("/api/admin/affiliates");
  const result = await response.json();

  if (!response.ok) {
   throw new Error(result.message || "Không thể tải danh sách affiliate.");
  }

  setAffiliates(Array.isArray(result.affiliates) ? result.affiliates : []);
 }, []);

 const fetchStores = useCallback(async () => {
  const response = await fetch("/api/admin/stores");
  const result = await response.json();

  if (!response.ok) {
   throw new Error(result.message || "Không thể tải danh sách cửa hàng.");
  }

  setStores(Array.isArray(result.stores) ? result.stores : []);
 }, []);

 const fetchPayments = useCallback(async () => {
  const params = new URLSearchParams();

  if (affiliateFilter) params.set("affiliateId", affiliateFilter);
  if (storeFilter) params.set("storeId", storeFilter);
  if (search.trim()) params.set("search", search.trim());

  const response = await fetch(`/api/admin/affiliate-payments?${params.toString()}`);
  const result = await response.json();

  if (!response.ok) {
   throw new Error(result.message || "Không thể tải lịch sử thanh toán.");
  }

  const rows = Array.isArray(result.data) ? result.data : Array.isArray(result.payments) ? result.payments : [];

  setPayments(rows);
 }, [affiliateFilter, storeFilter, search]);

 const fetchStats = useCallback(async () => {
  if (!affiliateFilter) {
   setStats(EMPTY_STATS);
   return;
  }

  const params = new URLSearchParams({
   affiliateId: affiliateFilter,
  });

  if (storeFilter) params.set("storeId", storeFilter);

  const response = await fetch(`/api/admin/affiliate-commissions/stats?${params.toString()}`);
  const result = await response.json();

  if (!response.ok) {
   throw new Error(result.message || "Không thể tải thống kê hoa hồng.");
  }

  const data = result.data || result.stats || result;

  setStats({
   deliveredOrders: Number(data.deliveredOrders) || 0,
   estimatedCommission: Number(data.estimatedCommission) || 0,
   actualCommission: Number(data.actualCommission) || 0,
   paidAmount: Number(data.paidAmount) || 0,
   remainingCommission: Number(data.remainingCommission) || 0,
   ordersMissingRate: Number(data.ordersMissingRate) || 0,
   currency: "VND",
  });
 }, [affiliateFilter, storeFilter]);

 const refreshData = useCallback(async () => {
  setLoading(true);
  setError("");

  try {
   await Promise.all([fetchPayments(), fetchStats()]);
  } catch (err) {
   setError(err instanceof Error ? err.message : "Không thể tải dữ liệu.");
  } finally {
   setLoading(false);
  }
 }, [fetchPayments, fetchStats]);

 useEffect(() => {
  const params = new URLSearchParams(window.location.search);
  const initialAffiliateId = params.get("affiliateId") || "";
  const initialStoreId = params.get("storeId") || "";

  if (initialAffiliateId) {
   setAffiliateFilter(initialAffiliateId);
   setForm((previous) => ({
    ...previous,
    affiliateId: initialAffiliateId,
   }));
  }

  if (initialStoreId) {
   setStoreFilter(initialStoreId);
   setForm((previous) => ({
    ...previous,
    storeId: initialStoreId,
   }));
  }
 }, []);

 useEffect(() => {
  if (sessionStatus !== "authenticated") return;

  let cancelled = false;

  async function loadOptions() {
   setLoading(true);
   setError("");

   try {
    await Promise.all([fetchAffiliates(), fetchStores()]);
   } catch (err) {
    if (!cancelled) {
     setError(err instanceof Error ? err.message : "Không thể tải dữ liệu.");
    }
   } finally {
    if (!cancelled) setLoading(false);
   }
  }

  void loadOptions();

  return () => {
   cancelled = true;
  };
 }, [sessionStatus, fetchAffiliates, fetchStores]);

 useEffect(() => {
  if (sessionStatus !== "authenticated") return;

  void refreshData();
 }, [sessionStatus, refreshData]);

 const resetForm = () => {
  setForm(createEmptyForm(affiliateFilter, storeFilter));
  setEditingId(null);
  setShowForm(false);
 };

 const openCreateForm = () => {
  setError("");
  setSuccess("");
  setEditingId(null);
  setForm(createEmptyForm(affiliateFilter, storeFilter));
  setShowForm(true);
 };

 const openEditForm = (payment: AffiliatePayment) => {
  setError("");
  setSuccess("");
  setEditingId(payment._id);

  setForm({
   affiliateId: getId(payment.affiliateId),
   storeId: getId(payment.storeId),
   amount: String(payment.amount),
   paymentDate: payment.paymentDate ? payment.paymentDate.slice(0, 10) : getLocalDate(),
   paymentMethod: payment.paymentMethod,
   transactionReference: payment.transactionReference || "",
   note: payment.note || "",
  });

  setShowForm(true);
 };

 const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
  event.preventDefault();
  setError("");
  setSuccess("");

  if (!form.affiliateId) {
   setError("Vui lòng chọn affiliate.");
   return;
  }

  if (!form.storeId) {
   setError("Vui lòng chọn cửa hàng.");
   return;
  }

  const amount = Number(form.amount);

  if (!Number.isSafeInteger(amount) || amount < 1) {
   setError("Số tiền phải là số nguyên VND lớn hơn 0.");
   return;
  }

  if (!form.paymentDate || Number.isNaN(new Date(`${form.paymentDate}T12:00:00`).getTime())) {
   setError("Vui lòng chọn ngày thanh toán hợp lệ.");
   return;
  }

  setSaving(true);

  try {
   const payload = {
    affiliateId: form.affiliateId,
    storeId: form.storeId,
    amount,
    currency: "VND",
    paymentDate: new Date(`${form.paymentDate}T12:00:00`).toISOString(),
    paymentMethod: form.paymentMethod,
    transactionReference: form.transactionReference.trim(),
    note: form.note.trim(),
   };

   const response = await fetch(editingId ? `/api/admin/affiliate-payments/${editingId}` : "/api/admin/affiliate-payments", {
    method: editingId ? "PUT" : "POST",
    headers: {
     "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
   });

   const result = await response.json();

   if (!response.ok) {
    throw new Error(result.message || "Không thể lưu thông tin thanh toán.");
   }

   setSuccess(editingId ? "Đã cập nhật khoản thanh toán." : "Đã ghi nhận khoản thanh toán.");

   setShowForm(false);
   setEditingId(null);

   await Promise.all([fetchPayments(), fetchStats()]);
  } catch (err) {
   setError(err instanceof Error ? err.message : "Đã xảy ra lỗi khi lưu.");
  } finally {
   setSaving(false);
  }
 };

 const handleDelete = async (payment: AffiliatePayment) => {
  const confirmed = window.confirm(`Bạn có chắc muốn xóa khoản thanh toán ${formatVND(payment.amount)} không?`);

  if (!confirmed) return;

  setError("");
  setSuccess("");
  setDeletingId(payment._id);

  try {
   const response = await fetch(`/api/admin/affiliate-payments/${payment._id}`, { method: "DELETE" });

   const result = await response.json();

   if (!response.ok) {
    throw new Error(result.message || "Không thể xóa khoản thanh toán.");
   }

   setSuccess("Đã xóa khoản thanh toán khỏi danh sách.");
   await Promise.all([fetchPayments(), fetchStats()]);
  } catch (err) {
   setError(err instanceof Error ? err.message : "Đã xảy ra lỗi khi xóa.");
  } finally {
   setDeletingId(null);
  }
 };

 const handleSearch = async (event: FormEvent<HTMLFormElement>) => {
  event.preventDefault();
  await refreshData();
 };

 if (sessionStatus === "loading") {
  return <div className="flex min-h-[300px] items-center justify-center text-sm text-gray-500">Đang kiểm tra đăng nhập...</div>;
 }

 if (sessionStatus !== "authenticated") {
  return (
   <div className="p-8 text-center">
    <h1 className="text-xl font-semibold text-gray-900">Vui lòng đăng nhập</h1>
    <p className="mt-2 text-sm text-gray-500">Bạn cần đăng nhập để quản lý thanh toán affiliate.</p>
   </div>
  );
 }

 const statCards = [
  {
   label: "Đơn hàng đã giao",
   value: stats.deliveredOrders.toLocaleString("vi-VN"),
   description: "Đơn có trạng thái DELIVERED",
   color: "text-gray-900",
  },
  {
   label: "Hoa hồng thực tế",
   value: formatVND(stats.actualCommission),
   description: "Hoa hồng từ dữ liệu đã ghi nhận",
   color: "text-blue-700",
  },
  {
   label: "Đã thanh toán",
   value: formatVND(stats.paidAmount),
   description: "Tổng các khoản thanh toán còn hiệu lực",
   color: "text-emerald-700",
  },
  {
   label: "Còn lại",
   value: formatVND(stats.remainingCommission),
   description: "Hoa hồng thực tế trừ khoản đã trả",
   color: stats.remainingCommission < 0 ? "text-red-700" : "text-orange-700",
  },
 ];

 return (
  <div className="min-h-screen bg-gray-50 p-4 md:p-8">
   <div className="mx-auto max-w-7xl space-y-6">
    <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
     <div>
      <div className="mb-2 flex items-center gap-2 text-sm text-gray-500">
       <Link href="/admin/affiliates" className="transition hover:text-gray-900">
        Affiliates
       </Link>
       <span>/</span>
       <span className="text-gray-900">Payments</span>
      </div>

      <h1 className="text-2xl font-bold tracking-tight text-gray-900 md:text-3xl">Thanh toán hoa hồng</h1>

      <p className="mt-2 text-sm text-gray-500">Quản lý các khoản thanh toán hoa hồng affiliate bằng VND.</p>
     </div>

     <button
      type="button"
      onClick={openCreateForm}
      className="inline-flex items-center justify-center rounded-lg bg-gray-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-gray-700">
      <span className="mr-2 text-lg">+</span>
      Ghi nhận thanh toán
     </button>
    </div>

    {error && (
     <div role="alert" className="flex items-start justify-between gap-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
      <span>{error}</span>
      <button type="button" onClick={() => setError("")} className="font-semibold" aria-label="Đóng thông báo lỗi">
       ×
      </button>
     </div>
    )}

    {success && (
     <div
      role="status"
      className="flex items-start justify-between gap-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
      <span>{success}</span>
      <button type="button" onClick={() => setSuccess("")} className="font-semibold" aria-label="Đóng thông báo thành công">
       ×
      </button>
     </div>
    )}

    <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm md:p-5">
     <div className="mb-4">
      <h2 className="font-semibold text-gray-900">Bộ lọc dữ liệu</h2>
      <p className="mt-1 text-sm text-gray-500">Chọn affiliate để xem thống kê hoa hồng tương ứng.</p>
     </div>

     <form onSubmit={handleSearch} className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-[1fr_1fr_1.5fr_auto]">
      <div>
       <label htmlFor="affiliateFilter" className="mb-2 block text-sm font-medium text-gray-700">
        Affiliate
       </label>
       <select
        id="affiliateFilter"
        value={affiliateFilter}
        onChange={(event) => {
         setAffiliateFilter(event.target.value);
        }}
        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900">
        <option value="">Tất cả affiliate</option>
        {affiliates.map((affiliate) => (
         <option key={affiliate._id} value={affiliate._id}>
          {affiliate.code} — {getAffiliateName(affiliate)}
         </option>
        ))}
       </select>
      </div>

      <div>
       <label htmlFor="storeFilter" className="mb-2 block text-sm font-medium text-gray-700">
        Cửa hàng
       </label>
       <select
        id="storeFilter"
        value={storeFilter}
        onChange={(event) => setStoreFilter(event.target.value)}
        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900">
        <option value="">Tất cả cửa hàng</option>
        {stores.map((store) => (
         <option key={store._id} value={store._id}>
          {store.name}
          {store.code ? ` (${store.code})` : ""}
         </option>
        ))}
       </select>
      </div>

      <div>
       <label htmlFor="paymentSearch" className="mb-2 block text-sm font-medium text-gray-700">
        Tìm kiếm
       </label>
       <input
        id="paymentSearch"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder="Mã giao dịch, ghi chú..."
        className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
       />
      </div>

      <div className="flex items-end gap-2">
       <button
        type="submit"
        disabled={loading}
        className="flex-1 rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50">
        {loading ? "Đang tải..." : "Lọc dữ liệu"}
       </button>

       <button
        type="button"
        onClick={() => {
         setAffiliateFilter("");
         setStoreFilter("");
         setSearch("");
         window.history.replaceState({}, "", window.location.pathname);
        }}
        className="rounded-lg border border-gray-300 px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50">
        Xóa lọc
       </button>
      </div>
     </form>
    </section>

    {affiliateFilter && (
     <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm md:p-5">
      <div className="mb-5 flex flex-col justify-between gap-2 md:flex-row md:items-center">
       <div>
        <h2 className="font-semibold text-gray-900">Thống kê hoa hồng</h2>
        <p className="mt-1 text-sm text-gray-500">
         {selectedAffiliate ? `${selectedAffiliate.code} — ${getAffiliateName(selectedAffiliate)}` : "Affiliate đang được chọn"}
         {selectedStore ? ` · ${selectedStore.name}` : ""}
        </p>
       </div>

       <span className="inline-flex w-fit rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600">Đơn vị: VND</span>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
       {statCards.map((card) => (
        <div key={card.label} className="rounded-xl border border-gray-200 bg-white p-4">
         <p className="text-sm text-gray-500">{card.label}</p>
         <p className={`mt-3 break-words text-xl font-bold ${card.color}`}>{card.value}</p>
         <p className="mt-2 text-xs leading-5 text-gray-500">{card.description}</p>
        </div>
       ))}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
       <div className="rounded-lg bg-gray-50 p-4">
        <p className="text-sm text-gray-500">Hoa hồng ước tính</p>
        <p className="mt-1 font-semibold text-gray-900">{formatVND(stats.estimatedCommission)}</p>
       </div>

       <div className="rounded-lg bg-amber-50 p-4">
        <p className="text-sm text-amber-800">Đơn thiếu tỷ lệ hoa hồng</p>
        <p className="mt-1 font-semibold text-amber-900">{stats.ordersMissingRate.toLocaleString("vi-VN")}</p>
       </div>
      </div>

      {stats.remainingCommission < 0 && (
       <p className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
        Số tiền đã thanh toán đang lớn hơn hoa hồng thực tế. Vui lòng kiểm tra lại các khoản đã ghi nhận.
       </p>
      )}
     </section>
    )}

    {showForm && (
     <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm md:p-6">
      <div className="mb-5 flex items-start justify-between gap-4">
       <div>
        <h2 className="text-lg font-semibold text-gray-900">{editingId ? "Chỉnh sửa khoản thanh toán" : "Ghi nhận khoản thanh toán mới"}</h2>
        <p className="mt-1 text-sm text-gray-500">Nhập số tiền đã thực sự thanh toán cho affiliate.</p>
       </div>

       <button
        type="button"
        onClick={resetForm}
        className="rounded-lg px-3 py-1 text-xl text-gray-500 hover:bg-gray-100 hover:text-gray-900"
        aria-label="Đóng biểu mẫu">
        ×
       </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
       <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
         <label htmlFor="formAffiliate" className="mb-2 block text-sm font-medium text-gray-700">
          Affiliate <span className="text-red-500">*</span>
         </label>
         <select
          id="formAffiliate"
          required
          value={form.affiliateId}
          disabled={Boolean(editingId)}
          onChange={(event) => {
           setForm((previous) => ({
            ...previous,
            affiliateId: event.target.value,
           }));
          }}
          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-gray-900 disabled:bg-gray-100">
          <option value="">Chọn affiliate</option>
          {affiliates.map((affiliate) => (
           <option key={affiliate._id} value={affiliate._id}>
            {affiliate.code} — {getAffiliateName(affiliate)}
           </option>
          ))}
         </select>
         {editingId && <p className="mt-1 text-xs text-gray-500">Không thể đổi affiliate của khoản thanh toán đã tạo.</p>}
        </div>

        <div>
         <label htmlFor="formStore" className="mb-2 block text-sm font-medium text-gray-700">
          Cửa hàng <span className="text-red-500">*</span>
         </label>
         <select
          id="formStore"
          required
          value={form.storeId}
          disabled={Boolean(editingId)}
          onChange={(event) => {
           setForm((previous) => ({
            ...previous,
            storeId: event.target.value,
           }));
          }}
          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-gray-900 disabled:bg-gray-100">
          <option value="">Chọn cửa hàng</option>
          {stores.map((store) => (
           <option key={store._id} value={store._id}>
            {store.name}
            {store.code ? ` (${store.code})` : ""}
           </option>
          ))}
         </select>
         {editingId && <p className="mt-1 text-xs text-gray-500">Không thể đổi cửa hàng của khoản thanh toán đã tạo.</p>}
        </div>

        <div>
         <label htmlFor="formAmount" className="mb-2 block text-sm font-medium text-gray-700">
          Số tiền (VND) <span className="text-red-500">*</span>
         </label>
         <input
          id="formAmount"
          type="number"
          required
          min={1}
          step={1}
          inputMode="numeric"
          value={form.amount}
          onChange={(event) => {
           setForm((previous) => ({
            ...previous,
            amount: event.target.value,
           }));
          }}
          placeholder="Ví dụ: 1500000"
          className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
         />
         {form.amount && Number(form.amount) > 0 && <p className="mt-1 text-xs text-gray-500">{formatVND(Number(form.amount))}</p>}
        </div>

        <div>
         <label htmlFor="formDate" className="mb-2 block text-sm font-medium text-gray-700">
          Ngày thanh toán <span className="text-red-500">*</span>
         </label>
         <input
          id="formDate"
          type="date"
          required
          value={form.paymentDate}
          onChange={(event) => {
           setForm((previous) => ({
            ...previous,
            paymentDate: event.target.value,
           }));
          }}
          className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
         />
        </div>

        <div>
         <label htmlFor="formMethod" className="mb-2 block text-sm font-medium text-gray-700">
          Phương thức thanh toán
         </label>
         <select
          id="formMethod"
          value={form.paymentMethod}
          onChange={(event) => {
           setForm((previous) => ({
            ...previous,
            paymentMethod: event.target.value as PaymentForm["paymentMethod"],
           }));
          }}
          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-gray-900">
          <option value="BANK_TRANSFER">Chuyển khoản ngân hàng</option>
          <option value="CASH">Tiền mặt</option>
          <option value="E_WALLET">Ví điện tử</option>
          <option value="OTHER">Khác</option>
         </select>
        </div>

        <div>
         <label htmlFor="formReference" className="mb-2 block text-sm font-medium text-gray-700">
          Mã giao dịch
         </label>
         <input
          id="formReference"
          value={form.transactionReference}
          onChange={(event) => {
           setForm((previous) => ({
            ...previous,
            transactionReference: event.target.value,
           }));
          }}
          placeholder="Mã giao dịch ngân hàng (nếu có)"
          className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
         />
        </div>

        <div className="md:col-span-2">
         <label htmlFor="formNote" className="mb-2 block text-sm font-medium text-gray-700">
          Ghi chú
         </label>
         <textarea
          id="formNote"
          rows={3}
          value={form.note}
          onChange={(event) => {
           setForm((previous) => ({
            ...previous,
            note: event.target.value,
           }));
          }}
          placeholder="Thông tin bổ sung về khoản thanh toán..."
          className="w-full resize-y rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
         />
        </div>
       </div>

       <div className="flex flex-col-reverse gap-3 border-t border-gray-100 pt-4 sm:flex-row sm:justify-end">
        <button
         type="button"
         onClick={resetForm}
         disabled={saving}
         className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50">
         Hủy
        </button>

        <button
         type="submit"
         disabled={saving}
         className="rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50">
         {saving ? "Đang lưu..." : editingId ? "Lưu thay đổi" : "Xác nhận thanh toán"}
        </button>
       </div>
      </form>
     </section>
    )}

    <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
     <div className="flex flex-col justify-between gap-2 border-b border-gray-200 p-4 md:flex-row md:items-center md:p-5">
      <div>
       <h2 className="font-semibold text-gray-900">Lịch sử thanh toán</h2>
       <p className="mt-1 text-sm text-gray-500">{payments.length.toLocaleString("vi-VN")} khoản trong kết quả hiện tại</p>
      </div>

      <button
       type="button"
       onClick={() => void refreshData()}
       disabled={loading}
       className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50">
       Làm mới
      </button>
     </div>

     <div className="overflow-x-auto">
      <table className="w-full min-w-[1050px] text-left text-sm">
       <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
        <tr>
         <th className="px-5 py-4 font-semibold">Ngày thanh toán</th>
         <th className="px-5 py-4 font-semibold">Affiliate</th>
         <th className="px-5 py-4 font-semibold">Cửa hàng</th>
         <th className="px-5 py-4 font-semibold">Số tiền</th>
         <th className="px-5 py-4 font-semibold">Phương thức</th>
         <th className="px-5 py-4 font-semibold">Mã giao dịch</th>
         <th className="px-5 py-4 font-semibold">Ghi chú</th>
         <th className="px-5 py-4 text-right font-semibold">Thao tác</th>
        </tr>
       </thead>

       <tbody className="divide-y divide-gray-100">
        {loading && (
         <tr>
          <td colSpan={8} className="px-5 py-12 text-center text-gray-500">
           Đang tải dữ liệu...
          </td>
         </tr>
        )}

        {!loading && payments.length === 0 && (
         <tr>
          <td colSpan={8} className="px-5 py-14 text-center">
           <div className="text-3xl text-gray-300">₫</div>
           <p className="mt-3 font-medium text-gray-700">Chưa có khoản thanh toán nào</p>
           <p className="mt-1 text-sm text-gray-500">Thử thay đổi bộ lọc hoặc ghi nhận khoản thanh toán mới.</p>
          </td>
         </tr>
        )}

        {!loading &&
         payments.map((payment) => (
          <tr key={payment._id} className="hover:bg-gray-50">
           <td className="whitespace-nowrap px-5 py-4 text-gray-600">{formatDate(payment.paymentDate)}</td>

           <td className="px-5 py-4">
            <div className="font-medium text-gray-900">{getPaymentAffiliateName(payment)}</div>
            {typeof payment.affiliateId !== "string" && payment.affiliateId.code && (
             <div className="mt-1 text-xs text-gray-500">{payment.affiliateId.code}</div>
            )}
           </td>

           <td className="px-5 py-4 text-gray-700">{getPaymentStoreName(payment)}</td>

           <td className="whitespace-nowrap px-5 py-4 font-semibold text-emerald-700">{formatVND(payment.amount)}</td>

           <td className="px-5 py-4 text-gray-600">{getPaymentMethodLabel(payment.paymentMethod)}</td>

           <td className="max-w-[180px] break-words px-5 py-4 text-gray-600">{payment.transactionReference || "—"}</td>

           <td className="max-w-[220px] whitespace-pre-wrap break-words px-5 py-4 text-gray-600">{payment.note || "—"}</td>

           <td className="px-5 py-4">
            <div className="flex justify-end gap-2">
             <button
              type="button"
              onClick={() => openEditForm(payment)}
              className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-100">
              Sửa
             </button>

             <button
              type="button"
              onClick={() => void handleDelete(payment)}
              disabled={deletingId === payment._id}
              className="rounded-md border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50">
              {deletingId === payment._id ? "Đang xóa..." : "Xóa"}
             </button>
            </div>
           </td>
          </tr>
         ))}
       </tbody>
      </table>
     </div>

     <div className="border-t border-gray-200 bg-gray-50 px-5 py-3 text-xs leading-5 text-gray-500">
      Trang này hiển thị các khoản thanh toán được API trả về. Nếu API phân trang, cần bổ sung điều khiển chuyển trang để xem toàn bộ lịch sử.
     </div>
    </section>
   </div>
  </div>
 );
}

AffiliatePaymentsPage.Layout = "Admin";
