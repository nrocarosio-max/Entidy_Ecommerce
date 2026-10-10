"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";

type AffiliateStatus = "PENDING" | "ACTIVE" | "REJECTED" | "SUSPENDED";
type LinkStatus = "ACTIVE" | "INACTIVE" | "SUSPENDED";

interface AffiliateUser {
 _id: string;
 name: string;
 email: string;
 phone?: string;
}

interface Affiliate {
 _id: string;
 userId: AffiliateUser | string;
 code: string;
 status: AffiliateStatus;
}

interface Store {
 _id: string;
 name: string;
 slug: string;
 isActive: boolean;
}

interface AffiliateStore {
 _id: string;
 affiliateId: Affiliate | string;
 storeId: Store | string;
 commissionRate: number;
 status: LinkStatus;
 note?: string;
 approvedAt?: string | null;
 createdAt: string;
}

interface Pagination {
 page: number;
 limit: number;
 total: number;
 totalPages: number;
}

interface LinkForm {
 affiliateId: string;
 storeId: string;
 commissionRate: number;
 status: LinkStatus;
 note: string;
}

const emptyForm: LinkForm = {
 affiliateId: "",
 storeId: "",
 commissionRate: 5,
 status: "ACTIVE",
 note: "",
};

const defaultPagination: Pagination = {
 page: 1,
 limit: 20,
 total: 0,
 totalPages: 1,
};

export default function AffiliateStoresPage() {
 const { data: session, status: sessionStatus } = useSession();

 const [affiliateStores, setAffiliateStores] = useState<AffiliateStore[]>([]);
 const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
 const [stores, setStores] = useState<Store[]>([]);

 const [loading, setLoading] = useState(true);
 const [loadingOptions, setLoadingOptions] = useState(true);
 const [saving, setSaving] = useState(false);
 const [deletingId, setDeletingId] = useState("");

 const [error, setError] = useState("");
 const [notice, setNotice] = useState("");

 const [search, setSearch] = useState("");
 const [affiliateId, setAffiliateId] = useState("");
 const [storeId, setStoreId] = useState("");
 const [statusFilter, setStatusFilter] = useState("");
 const [page, setPage] = useState(1);

 const [pagination, setPagination] = useState(defaultPagination);

 const [showForm, setShowForm] = useState(false);
 const [editingId, setEditingId] = useState<string | null>(null);
 const [form, setForm] = useState<LinkForm>(emptyForm);
 const [formError, setFormError] = useState("");

 const isSuperAdmin = session?.user?.role === "SUPER_ADMIN";

 const loadOptions = useCallback(async () => {
  try {
   setLoadingOptions(true);

   const [affiliateResponse, storeResponse] = await Promise.all([fetch("/api/admin/affiliates?limit=100"), fetch("/api/admin/stores")]);

   const [affiliateData, storeData] = await Promise.all([affiliateResponse.json(), storeResponse.json()]);

   if (!affiliateResponse.ok) {
    throw new Error(affiliateData.message || "Failed to load Affiliates.");
   }

   if (!storeResponse.ok) {
    throw new Error(storeData.message || "Failed to load Stores.");
   }

   setAffiliates(affiliateData.affiliates || []);
   setStores(storeData.stores || []);
  } catch (err) {
   setError(err instanceof Error ? err.message : "Failed to load options.");
  } finally {
   setLoadingOptions(false);
  }
 }, []);

 const loadAffiliateStores = useCallback(async () => {
  try {
   setLoading(true);
   setError("");

   const params = new URLSearchParams({
    page: String(page),
    limit: "20",
   });

   if (search.trim()) params.set("search", search.trim());
   if (affiliateId) params.set("affiliateId", affiliateId);
   if (storeId) params.set("storeId", storeId);
   if (statusFilter) params.set("status", statusFilter);

   const response = await fetch(`/api/admin/affiliate-stores?${params.toString()}`);

   const data = await response.json();

   if (!response.ok) {
    throw new Error(data.message || "Failed to load Affiliate Store links.");
   }

   setAffiliateStores(data.affiliateStores || []);
   setPagination(data.pagination || defaultPagination);
  } catch (err) {
   setError(err instanceof Error ? err.message : "Failed to load Affiliate Store links.");
   setAffiliateStores([]);
  } finally {
   setLoading(false);
  }
 }, [page, search, affiliateId, storeId, statusFilter]);

 useEffect(() => {
  if (sessionStatus !== "authenticated" || !isSuperAdmin) return;

  void loadOptions();
 }, [sessionStatus, isSuperAdmin, loadOptions]);

 useEffect(() => {
  if (sessionStatus !== "authenticated" || !isSuperAdmin) return;

  void loadAffiliateStores();
 }, [sessionStatus, isSuperAdmin, loadAffiliateStores]);

 const getAffiliate = (item: AffiliateStore) => (typeof item.affiliateId === "object" ? item.affiliateId : null);

 const getStore = (item: AffiliateStore) => (typeof item.storeId === "object" ? item.storeId : null);

 const getAffiliateUser = (affiliate: Affiliate | null) => (affiliate && typeof affiliate.userId === "object" ? affiliate.userId : null);

 const formatDate = (value?: string | null) => {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("vi-VN", {
   dateStyle: "medium",
   timeStyle: "short",
  }).format(date);
 };

 const statusClass = (value: string) => {
  switch (value) {
   case "ACTIVE":
    return "bg-green-100 text-green-700";
   case "INACTIVE":
   case "REJECTED":
    return "bg-gray-100 text-gray-600";
   case "PENDING":
    return "bg-amber-100 text-amber-700";
   case "SUSPENDED":
    return "bg-red-100 text-red-700";
   default:
    return "bg-gray-100 text-gray-600";
  }
 };

 const openCreateForm = () => {
  setEditingId(null);
  setForm(emptyForm);
  setFormError("");
  setNotice("");
  setShowForm(true);
 };

 const openEditForm = (item: AffiliateStore) => {
  setEditingId(item._id);
  setForm({
   affiliateId: typeof item.affiliateId === "object" ? item.affiliateId._id : item.affiliateId,
   storeId: typeof item.storeId === "object" ? item.storeId._id : item.storeId,
   commissionRate: item.commissionRate,
   status: item.status,
   note: item.note || "",
  });
  setFormError("");
  setNotice("");
  setShowForm(true);
 };

 const closeForm = () => {
  if (saving) return;

  setShowForm(false);
  setEditingId(null);
  setForm(emptyForm);
  setFormError("");
 };

 const saveLink = async () => {
  setFormError("");
  setNotice("");

  if (!editingId && !form.affiliateId) {
   setFormError("Please select an Affiliate.");
   return;
  }

  if (!editingId && !form.storeId) {
   setFormError("Please select a Store.");
   return;
  }

  if (!Number.isFinite(form.commissionRate) || form.commissionRate < 0 || form.commissionRate > 100) {
   setFormError("Commission rate must be between 0 and 100.");
   return;
  }

  try {
   setSaving(true);

   const url = editingId ? `/api/admin/affiliate-stores/${editingId}` : "/api/admin/affiliate-stores";

   const payload = editingId
    ? {
       commissionRate: form.commissionRate,
       status: form.status,
       note: form.note,
      }
    : form;

   const response = await fetch(url, {
    method: editingId ? "PUT" : "POST",
    headers: {
     "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
   });

   const data = await response.json();

   if (!response.ok) {
    throw new Error(data.message || "Failed to save Affiliate Store.");
   }

   setShowForm(false);
   setEditingId(null);
   setForm(emptyForm);
   setNotice(data.message || (editingId ? "Affiliate Store updated successfully." : "Affiliate Store created successfully."));

   await loadAffiliateStores();
  } catch (err) {
   setFormError(err instanceof Error ? err.message : "Failed to save Affiliate Store.");
  } finally {
   setSaving(false);
  }
 };

 const deleteLink = async (item: AffiliateStore) => {
  const affiliate = getAffiliate(item);
  const user = getAffiliateUser(affiliate);
  const store = getStore(item);

  const confirmed = window.confirm(
   `Delete the Affiliate Store link?\n\nAffiliate: ${
    user?.name || affiliate?.code || "Unknown"
   }\nStore: ${store?.name || "Unknown"}\n\nIf this link has commission or payment history, it must be set to INACTIVE instead.`,
  );

  if (!confirmed) return;

  try {
   setDeletingId(item._id);
   setError("");
   setNotice("");

   const response = await fetch(`/api/admin/affiliate-stores/${item._id}`, {
    method: "DELETE",
   });

   const data = await response.json();

   if (!response.ok) {
    throw new Error(data.message || "Failed to delete Affiliate Store.");
   }

   setNotice(data.message || "Affiliate Store deleted successfully.");
   await loadAffiliateStores();
  } catch (err) {
   setError(err instanceof Error ? err.message : "Failed to delete Affiliate Store.");
  } finally {
   setDeletingId("");
  }
 };

 const resetFilters = () => {
  setSearch("");
  setAffiliateId("");
  setStoreId("");
  setStatusFilter("");
  setPage(1);
 };

 if (sessionStatus === "loading") {
  return <div className="flex min-h-[60vh] items-center justify-center text-sm text-gray-500">Loading...</div>;
 }

 if (!isSuperAdmin) {
  return (
   <div className="p-6">
    <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
     <h1 className="text-lg font-semibold text-red-700">Access denied</h1>
     <p className="mt-2 text-sm text-red-600">Only SUPER_ADMIN can manage Affiliate Stores.</p>
     <Link href="/admin" className="mt-4 inline-block text-sm font-medium underline">
      Back to Admin
     </Link>
    </div>
   </div>
  );
 }

 return (
  <div className="space-y-6 p-6">
   {/* Header */}
   <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
    <div>
     <h1 className="text-2xl font-semibold text-gray-900">Affiliate Store Management</h1>
     <p className="mt-1 text-sm text-gray-500">Manage Affiliate–Store assignments and commission rates.</p>
    </div>

    <button
     type="button"
     onClick={openCreateForm}
     className="inline-flex items-center justify-center rounded-lg bg-black px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-800">
     + Add Affiliate Store
    </button>
   </div>

   {/* Summary */}
   <div className="grid gap-4 sm:grid-cols-3">
    <div className="rounded-xl border border-gray-200 bg-white p-5">
     <p className="text-sm text-gray-500">Total links</p>
     <p className="mt-2 text-2xl font-semibold text-gray-900">{pagination.total}</p>
    </div>

    <div className="rounded-xl border border-gray-200 bg-white p-5">
     <p className="text-sm text-gray-500">Displayed links</p>
     <p className="mt-2 text-2xl font-semibold text-gray-900">{affiliateStores.length}</p>
    </div>

    <div className="rounded-xl border border-gray-200 bg-white p-5">
     <p className="text-sm text-gray-500">Active on this page</p>
     <p className="mt-2 text-2xl font-semibold text-green-700">{affiliateStores.filter((item) => item.status === "ACTIVE").length}</p>
    </div>
   </div>

   {/* Notifications */}
   {notice && (
    <div className="flex items-start justify-between gap-3 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-700">
     <span>{notice}</span>
     <button type="button" onClick={() => setNotice("")} className="font-medium">
      ×
     </button>
    </div>
   )}

   {/* Filters */}
   <div className="rounded-xl border border-gray-200 bg-white p-4">
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
     <input
      type="text"
      value={search}
      onChange={(event) => {
       setSearch(event.target.value);
       setPage(1);
      }}
      placeholder="Search Affiliate code or Store..."
      className="rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-black"
     />

     <select
      value={affiliateId}
      onChange={(event) => {
       setAffiliateId(event.target.value);
       setPage(1);
      }}
      className="rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-black">
      <option value="">All Affiliates</option>
      {affiliates.map((affiliate) => {
       const user = getAffiliateUser(affiliate);

       return (
        <option key={affiliate._id} value={affiliate._id}>
         {user?.name || affiliate.code} ({affiliate.code})
        </option>
       );
      })}
     </select>

     <select
      value={storeId}
      onChange={(event) => {
       setStoreId(event.target.value);
       setPage(1);
      }}
      className="rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-black">
      <option value="">All Stores</option>
      {stores.map((store) => (
       <option key={store._id} value={store._id}>
        {store.name}
       </option>
      ))}
     </select>

     <select
      value={statusFilter}
      onChange={(event) => {
       setStatusFilter(event.target.value);
       setPage(1);
      }}
      className="rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-black">
      <option value="">All statuses</option>
      <option value="ACTIVE">Active</option>
      <option value="INACTIVE">Inactive</option>
      <option value="SUSPENDED">Suspended</option>
     </select>
    </div>

    <div className="mt-3 flex justify-end">
     <button type="button" onClick={resetFilters} className="text-sm font-medium text-gray-600 underline hover:text-black">
      Reset filters
     </button>
    </div>
   </div>

   {/* Create / Edit Form */}
   {showForm && (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
     <div className="mb-5 flex items-center justify-between gap-3">
      <div>
       <h2 className="text-lg font-semibold text-gray-900">{editingId ? "Edit Affiliate Store" : "Create Affiliate Store"}</h2>
       <p className="mt-1 text-sm text-gray-500">{editingId ? "Update the commission rate, status or note." : "Assign a Store to an Affiliate."}</p>
      </div>

      <button
       type="button"
       onClick={closeForm}
       disabled={saving}
       className="rounded-lg border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50 disabled:opacity-50">
       Cancel
      </button>
     </div>

     {loadingOptions ? (
      <p className="py-5 text-sm text-gray-500">Loading Affiliate and Store options...</p>
     ) : (
      <>
       <div className="grid gap-4 md:grid-cols-2">
        <label className="text-sm font-medium text-gray-700">
         Affiliate
         <select
          value={form.affiliateId}
          disabled={Boolean(editingId)}
          onChange={(event) => setForm({ ...form, affiliateId: event.target.value })}
          className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 disabled:bg-gray-100">
          <option value="">Select Affiliate</option>
          {affiliates.map((affiliate) => {
           const user = getAffiliateUser(affiliate);

           return (
            <option key={affiliate._id} value={affiliate._id}>
             {user?.name || affiliate.code} — {affiliate.code}
            </option>
           );
          })}
         </select>
        </label>

        <label className="text-sm font-medium text-gray-700">
         Store
         <select
          value={form.storeId}
          disabled={Boolean(editingId)}
          onChange={(event) => setForm({ ...form, storeId: event.target.value })}
          className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 disabled:bg-gray-100">
          <option value="">Select Store</option>
          {stores.map((store) => (
           <option key={store._id} value={store._id}>
            {store.name}
            {!store.isActive ? " (Inactive)" : ""}
           </option>
          ))}
         </select>
        </label>

        <label className="text-sm font-medium text-gray-700">
         Commission rate (%)
         <input
          type="number"
          min="0"
          max="100"
          step="0.1"
          value={form.commissionRate}
          onChange={(event) =>
           setForm({
            ...form,
            commissionRate: event.target.value === "" ? 0 : Number(event.target.value),
           })
          }
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2.5 outline-none focus:border-black"
         />
        </label>

        <label className="text-sm font-medium text-gray-700">
         Link status
         <select
          value={form.status}
          onChange={(event) =>
           setForm({
            ...form,
            status: event.target.value as LinkStatus,
           })
          }
          className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5">
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
          <option value="SUSPENDED">Suspended</option>
         </select>
        </label>
       </div>

       <label className="mt-4 block text-sm font-medium text-gray-700">
        Admin note
        <textarea
         rows={3}
         value={form.note}
         onChange={(event) => setForm({ ...form, note: event.target.value })}
         placeholder="Optional note..."
         className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2.5 outline-none focus:border-black"
        />
       </label>
      </>
     )}

     {formError && <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">{formError}</p>}

     <div className="mt-5 flex justify-end">
      <button
       type="button"
       disabled={saving || loadingOptions}
       onClick={saveLink}
       className="rounded-lg bg-black px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50">
       {saving ? "Saving..." : editingId ? "Save changes" : "Create link"}
      </button>
     </div>
    </div>
   )}

   {/* Table */}
   <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
    <div className="overflow-x-auto">
     <table className="min-w-full">
      <thead className="border-b border-gray-200 bg-gray-50">
       <tr>
        <th className="px-5 py-3 text-left text-xs font-semibold uppercase text-gray-500">Affiliate</th>
        <th className="px-5 py-3 text-left text-xs font-semibold uppercase text-gray-500">Store</th>
        <th className="px-5 py-3 text-left text-xs font-semibold uppercase text-gray-500">Commission</th>
        <th className="px-5 py-3 text-left text-xs font-semibold uppercase text-gray-500">Status</th>
        <th className="px-5 py-3 text-left text-xs font-semibold uppercase text-gray-500">Created At</th>
        <th className="px-5 py-3 text-left text-xs font-semibold uppercase text-gray-500">Actions</th>
       </tr>
      </thead>

      <tbody className="divide-y divide-gray-100">
       {loading ? (
        <tr>
         <td colSpan={6} className="px-5 py-12 text-center text-sm text-gray-500">
          Loading Affiliate Stores...
         </td>
        </tr>
       ) : error ? (
        <tr>
         <td colSpan={6} className="px-5 py-12 text-center text-sm text-red-600">
          {error}
          <button type="button" onClick={() => void loadAffiliateStores()} className="ml-3 underline">
           Retry
          </button>
         </td>
        </tr>
       ) : affiliateStores.length === 0 ? (
        <tr>
         <td colSpan={6} className="px-5 py-12 text-center text-sm text-gray-500">
          No Affiliate Store links found.
         </td>
        </tr>
       ) : (
        affiliateStores.map((item) => {
         const affiliate = getAffiliate(item);
         const user = getAffiliateUser(affiliate);
         const store = getStore(item);

         return (
          <tr key={item._id} className="hover:bg-gray-50">
           <td className="px-5 py-4">
            <div className="font-medium text-gray-900">{user?.name || affiliate?.code || "Unknown Affiliate"}</div>
            <div className="text-sm text-gray-500">{user?.email || "No email"}</div>
            <div className="mt-1 font-mono text-xs text-gray-400">{affiliate?.code || "—"}</div>
           </td>

           <td className="px-5 py-4">
            <div className="font-medium text-gray-900">{store?.name || "Unknown Store"}</div>
            <div className="text-sm text-gray-500">{store?.slug || "—"}</div>
            {store && !store.isActive && <span className="mt-1 inline-block text-xs text-red-600">Store disabled</span>}
           </td>

           <td className="px-5 py-4">
            <span className="text-lg font-semibold text-gray-900">{item.commissionRate}%</span>
           </td>

           <td className="px-5 py-4">
            <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${statusClass(item.status)}`}>{item.status}</span>
           </td>

           <td className="whitespace-nowrap px-5 py-4 text-sm text-gray-500">{formatDate(item.createdAt)}</td>

           <td className="px-5 py-4">
            <div className="flex flex-wrap gap-2">
             <button
              type="button"
              onClick={() => openEditForm(item)}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100">
              Edit
             </button>

             <button
              type="button"
              disabled={deletingId === item._id}
              onClick={() => void deleteLink(item)}
              className="rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50">
              {deletingId === item._id ? "Deleting..." : "Delete"}
             </button>
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
    <div className="flex flex-col gap-3 border-t border-gray-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
     <span className="text-sm text-gray-500">
      {pagination.total} links · Page {pagination.page} of {pagination.totalPages}
     </span>

     <div className="flex gap-2">
      <button
       type="button"
       disabled={loading || pagination.page <= 1}
       onClick={() => setPage((value) => value - 1)}
       className="rounded-lg border border-gray-300 px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-40">
       Previous
      </button>

      <button
       type="button"
       disabled={loading || pagination.page >= pagination.totalPages}
       onClick={() => setPage((value) => value + 1)}
       className="rounded-lg border border-gray-300 px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-40">
       Next
      </button>
     </div>
    </div>
   </div>
  </div>
 );
}

AffiliateStoresPage.Layout = "Admin";
