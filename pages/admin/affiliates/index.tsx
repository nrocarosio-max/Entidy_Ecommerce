"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";

interface AffiliateUser {
 _id: string;
 name: string;
 email: string;
 phone?: string;
 isActive: boolean;
}

interface Store {
 _id: string;
 name: string;
 slug: string;
 isActive: boolean;
}

interface AffiliateStore {
 _id: string;
 storeId: Store | string;
 commissionRate: number;
 status: "ACTIVE" | "INACTIVE" | "SUSPENDED";
}

interface Affiliate {
 _id: string;
 userId: AffiliateUser | string;
 code: string;
 status: "PENDING" | "ACTIVE" | "REJECTED" | "SUSPENDED";
 note?: string;
 createdAt: string;
 stores: AffiliateStore[];
}

interface AffiliatesResponse {
 success: boolean;
 affiliates: Affiliate[];
 pagination: {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
 };
 message?: string;
}
interface EditForm {
 name: string;
 email: string;
 phone: string;
 isActive: boolean;
 status: "PENDING" | "ACTIVE" | "REJECTED" | "SUSPENDED";
 code: string;
 note: string;
 stores: {
  storeId: string;
  commissionRate: number;
  status: "ACTIVE" | "INACTIVE" | "SUSPENDED";
 }[];
}
export default function AffiliatesPage() {
 const { data: session, status: sessionStatus } = useSession();

 const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
 const [stores, setStores] = useState<Store[]>([]);
 const [loading, setLoading] = useState(true);
 const [error, setError] = useState("");

 const [search, setSearch] = useState("");
 const [affiliateStatus, setAffiliateStatus] = useState("");
 const [storeId, setStoreId] = useState("");
 const [page, setPage] = useState(1);

 const [pagination, setPagination] = useState({
  page: 1,
  limit: 20,
  total: 0,
  totalPages: 1,
 });
 const [editingAffiliate, setEditingAffiliate] = useState<Affiliate | null>(null);
 const [editForm, setEditForm] = useState<EditForm | null>(null);
 const [saving, setSaving] = useState(false);
 const [editMessage, setEditMessage] = useState("");
 const loadStores = useCallback(async () => {
  const response = await fetch("/api/admin/stores");
  const data = await response.json();

  if (!response.ok) {
   throw new Error(data.message || "Failed to load stores.");
  }

  setStores(data.stores || []);
 }, []);

 const loadAffiliates = useCallback(async () => {
  try {
   setLoading(true);
   setError("");

   const params = new URLSearchParams({
    page: String(page),
    limit: "20",
   });

   if (search.trim()) {
    params.set("search", search.trim());
   }

   if (affiliateStatus) {
    params.set("status", affiliateStatus);
   }

   if (storeId) {
    params.set("storeId", storeId);
   }

   const response = await fetch(`/api/admin/affiliates?${params.toString()}`);

   const data = (await response.json()) as AffiliatesResponse;

   if (!response.ok) {
    throw new Error(data.message || "Failed to load Affiliates.");
   }

   setAffiliates(data.affiliates || []);
   setPagination(
    data.pagination || {
     page: 1,
     limit: 20,
     total: 0,
     totalPages: 1,
    },
   );
  } catch (err) {
   console.error("Failed to load Affiliates:", err);
   setError(err instanceof Error ? err.message : "Failed to load Affiliates.");
   setAffiliates([]);
  } finally {
   setLoading(false);
  }
 }, [page, search, affiliateStatus, storeId]);

 useEffect(() => {
  if (sessionStatus !== "authenticated") return;
  if (session?.user?.role !== "SUPER_ADMIN") return;

  loadStores().catch((err) => {
   console.error("Failed to load stores:", err);
  });
 }, [sessionStatus, session?.user?.role, loadStores]);

 useEffect(() => {
  if (sessionStatus !== "authenticated") return;
  if (session?.user?.role !== "SUPER_ADMIN") return;

  loadAffiliates();
 }, [sessionStatus, session?.user?.role, loadAffiliates]);

 const openEditForm = (affiliate: Affiliate) => {
  const user = typeof affiliate.userId === "object" ? affiliate.userId : null;

  if (!user) {
   setError("Cannot edit Affiliate because its user information is missing.");
   return;
  }

  setEditingAffiliate(affiliate);
  setEditMessage("");

  setEditForm({
   name: user.name || "",
   email: user.email || "",
   phone: user.phone || "",
   isActive: user.isActive,
   status: affiliate.status,
   code: affiliate.code || "",
   note: affiliate.note || "",
   stores: affiliate.stores.map((item) => ({
    storeId: typeof item.storeId === "object" ? item.storeId._id : item.storeId,
    commissionRate: item.commissionRate,
    status: item.status,
   })),
  });
 };

 const saveAffiliate = async () => {
  if (!editingAffiliate || !editForm) return;

  try {
   setSaving(true);
   setEditMessage("");

   const response = await fetch("/api/admin/affiliates", {
    method: "PUT",
    headers: {
     "Content-Type": "application/json",
    },
    body: JSON.stringify({
     affiliateId: editingAffiliate._id,
     ...editForm,
    }),
   });

   const data = await response.json();

   if (!response.ok) {
    throw new Error(data.message || "Failed to update Affiliate.");
   }

   setEditMessage("Affiliate updated successfully.");
   setEditingAffiliate(null);
   setEditForm(null);

   await loadAffiliates();
  } catch (err) {
   setEditMessage(err instanceof Error ? err.message : "Failed to update Affiliate.");
  } finally {
   setSaving(false);
  }
 };
 const getUser = (affiliate: Affiliate) => {
  return typeof affiliate.userId === "object" ? affiliate.userId : null;
 };

 const getStore = (affiliateStore: AffiliateStore) => {
  return typeof affiliateStore.storeId === "object" ? affiliateStore.storeId : null;
 };

 const formatDate = (value?: string | Date | null) => {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
   return "—";
  }

  return new Intl.DateTimeFormat("vi-VN", {
   dateStyle: "medium",
   timeStyle: "short",
  }).format(date);
 };

 const statusClass = (value: string) => {
  switch (value) {
   case "ACTIVE":
    return "bg-green-100 text-green-700";
   case "PENDING":
    return "bg-amber-100 text-amber-700";
   case "SUSPENDED":
   case "REJECTED":
   case "INACTIVE":
    return "bg-red-100 text-red-700";
   default:
    return "bg-gray-100 text-gray-600";
  }
 };

 if (sessionStatus === "loading") {
  return <div className="flex min-h-[60vh] items-center justify-center">Loading...</div>;
 }

 if (session?.user?.role !== "SUPER_ADMIN") {
  return (
   <div className="p-6">
    <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
     <h1 className="text-lg font-semibold text-red-700">Access denied</h1>
     <p className="mt-2 text-sm text-red-600">Only SUPER_ADMIN can manage Affiliates.</p>
    </div>
   </div>
  );
 }

 return (
  <div className="space-y-6 p-6">
   {/* Header */}
   <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
    <div>
     <h1 className="text-2xl font-semibold text-gray-900">Affiliate Management</h1>
     <p className="mt-1 text-sm text-gray-500">Manage Affiliate accounts, referral codes and store commissions.</p>
    </div>

    <Link
     href="/admin/affiliates/create"
     className="inline-flex items-center justify-center rounded-lg bg-black px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-800">
     + Create Affiliate
    </Link>
   </div>

   {/* Summary */}
   <div className="grid gap-4 sm:grid-cols-2">
    <div className="rounded-xl border border-gray-200 bg-white p-5">
     <p className="text-sm text-gray-500">Total Affiliates</p>
     <p className="mt-2 text-2xl font-semibold text-gray-900">{pagination.total}</p>
    </div>

    <div className="rounded-xl border border-gray-200 bg-white p-5">
     <p className="text-sm text-gray-500">Currently displayed</p>
     <p className="mt-2 text-2xl font-semibold text-gray-900">{affiliates.length}</p>
    </div>
   </div>

   {/* Filters */}
   <div className="rounded-xl border border-gray-200 bg-white p-4">
    <div className="grid gap-4 md:grid-cols-3">
     <input
      type="text"
      value={search}
      onChange={(event) => {
       setSearch(event.target.value);
       setPage(1);
      }}
      placeholder="Search name, email or referral code..."
      className="rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-black"
     />

     <select
      value={storeId}
      onChange={(event) => {
       setStoreId(event.target.value);
       setPage(1);
      }}
      className="rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-black">
      <option value="">All stores</option>
      {stores.map((store) => (
       <option key={store._id} value={store._id}>
        {store.name}
       </option>
      ))}
     </select>

     <select
      value={affiliateStatus}
      onChange={(event) => {
       setAffiliateStatus(event.target.value);
       setPage(1);
      }}
      className="rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-black">
      <option value="">All statuses</option>
      <option value="ACTIVE">Active</option>
      <option value="PENDING">Pending</option>
      <option value="SUSPENDED">Suspended</option>
      <option value="REJECTED">Rejected</option>
     </select>
    </div>
   </div>

   {/* Table */}
   <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
    <div className="overflow-x-auto">
     <table className="min-w-full">
      <thead className="border-b border-gray-200 bg-gray-50">
       <tr>
        <th className="px-5 py-3 text-left text-xs font-semibold uppercase text-gray-500">Affiliate</th>
        <th className="px-5 py-3 text-left text-xs font-semibold uppercase text-gray-500">Referral Code</th>
        <th className="px-5 py-3 text-left text-xs font-semibold uppercase text-gray-500">Stores / Commission</th>
        <th className="px-5 py-3 text-left text-xs font-semibold uppercase text-gray-500">Status</th>
        <th className="px-5 py-3 text-left text-xs font-semibold uppercase text-gray-500">Created At</th>
        <th className="px-5 py-3 text-left text-xs font-semibold uppercase text-gray-500">Actions</th>
       </tr>
      </thead>

      <tbody className="divide-y divide-gray-100">
       {loading ? (
        <tr>
         <td colSpan={6} className="px-5 py-12 text-center text-sm text-gray-500">
          Loading Affiliates...
         </td>
        </tr>
       ) : error ? (
        <tr>
         <td colSpan={6} className="px-5 py-12 text-center text-sm text-red-600">
          {error}
          <button type="button" onClick={loadAffiliates} className="ml-3 underline">
           Retry
          </button>
         </td>
        </tr>
       ) : affiliates.length === 0 ? (
        <tr>
         <td colSpan={6} className="px-5 py-12 text-center text-sm text-gray-500">
          No Affiliates found.
         </td>
        </tr>
       ) : (
        affiliates.map((affiliate) => {
         const user = getUser(affiliate);

         return (
          <tr key={affiliate._id} className="hover:bg-gray-50">
           <td className="px-5 py-4">
            <div className="font-medium text-gray-900">{user?.name || "Unknown user"}</div>
            <div className="text-sm text-gray-500">{user?.email || "No email"}</div>
            {user?.phone && <div className="text-xs text-gray-400">{user.phone}</div>}
           </td>

           <td className="px-5 py-4">
            <span className="rounded-md bg-gray-100 px-2.5 py-1 font-mono text-sm font-medium text-gray-800">{affiliate.code}</span>
           </td>

           <td className="px-5 py-4">
            <div className="space-y-2">
             {affiliate.stores.map((affiliateStore) => {
              const store = getStore(affiliateStore);

              return (
               <div key={affiliateStore._id} className="text-sm">
                <div className="font-medium text-gray-800">{store?.name || "Unknown store"}</div>
                <div className="text-xs text-gray-500">
                 {affiliateStore.commissionRate}% commission
                 {" · "}
                 {affiliateStore.status}
                </div>
               </div>
              );
             })}

             {affiliate.stores.length === 0 && <span className="text-sm text-gray-400">No stores assigned</span>}
            </div>
           </td>

           <td className="px-5 py-4">
            <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusClass(affiliate.status)}`}>{affiliate.status}</span>
            {user && !user.isActive && <div className="mt-1 text-xs text-red-600">User disabled</div>}
           </td>

           <td className="px-5 py-4 text-sm text-gray-500">{formatDate(affiliate.createdAt)}</td>
           <td className="px-5 py-4">
            <div className="flex flex-wrap gap-2">
             <button
              type="button"
              onClick={() => openEditForm(affiliate)}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100">
              Edit
             </button>

             <Link
              href={`/admin/affiliate-payments?affiliateId=${affiliate._id}`}
              className="inline-flex items-center rounded-lg bg-black px-3 py-2 text-sm font-medium text-white hover:bg-gray-800">
              Payments
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

    {editingAffiliate && editForm && (
     <div className="border-t border-gray-200 bg-gray-50 p-5">
      <div className="mb-5 flex items-center justify-between">
       <div>
        <h2 className="text-lg font-semibold text-gray-900">Edit Affiliate</h2>
        <p className="mt-1 text-sm text-gray-500">Update account information and store commissions.</p>
       </div>

       <button
        type="button"
        onClick={() => {
         setEditingAffiliate(null);
         setEditForm(null);
         setEditMessage("");
        }}
        className="rounded-lg border border-gray-300 px-3 py-2 text-sm hover:bg-white">
        Cancel
       </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
       <label className="text-sm font-medium text-gray-700">
        Full name
        <input
         value={editForm.name}
         onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
         className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5"
        />
       </label>

       <label className="text-sm font-medium text-gray-700">
        Email
        <input
         type="email"
         value={editForm.email}
         onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
         className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5"
        />
       </label>

       <label className="text-sm font-medium text-gray-700">
        Phone
        <input
         value={editForm.phone}
         onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
         className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5"
        />
       </label>

       <label className="text-sm font-medium text-gray-700">
        Referral code
        <input
         value={editForm.code}
         onChange={(e) => setEditForm({ ...editForm, code: e.target.value.toUpperCase() })}
         className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5"
        />
       </label>

       <label className="text-sm font-medium text-gray-700">
        Affiliate status
        <select
         value={editForm.status}
         onChange={(e) =>
          setEditForm({
           ...editForm,
           status: e.target.value as EditForm["status"],
          })
         }
         className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5">
         <option value="PENDING">Pending</option>
         <option value="ACTIVE">Active</option>
         <option value="REJECTED">Rejected</option>
         <option value="SUSPENDED">Suspended</option>
        </select>
       </label>

       <label className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-3 text-sm text-gray-700">
        <input type="checkbox" checked={editForm.isActive} onChange={(e) => setEditForm({ ...editForm, isActive: e.target.checked })} className="h-4 w-4" />
        Login account enabled
       </label>
      </div>

      <div className="mt-5">
       <h3 className="mb-3 text-sm font-semibold text-gray-900">Store commissions</h3>

       <div className="space-y-3">
        {editForm.stores.map((item, index) => {
         const store = stores.find((s) => s._id === item.storeId);

         return (
          <div key={item.storeId} className="grid gap-3 rounded-lg border border-gray-200 bg-white p-4 md:grid-cols-[1fr_150px_180px]">
           <div className="self-center">
            <p className="font-medium text-gray-900">{store?.name || "Unknown store"}</p>
            <p className="text-xs text-gray-500">{item.storeId}</p>
           </div>

           <label className="text-sm text-gray-700">
            Commission (%)
            <input
             type="number"
             min="0"
             max="100"
             step="0.1"
             value={item.commissionRate}
             onChange={(e) => {
              const nextStores = [...editForm.stores];
              nextStores[index] = {
               ...nextStores[index],
               commissionRate: Number(e.target.value),
              };
              setEditForm({ ...editForm, stores: nextStores });
             }}
             className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
            />
           </label>

           <label className="text-sm text-gray-700">
            Store status
            <select
             value={item.status}
             onChange={(e) => {
              const nextStores = [...editForm.stores];
              nextStores[index] = {
               ...nextStores[index],
               status: e.target.value as EditForm["stores"][number]["status"],
              };
              setEditForm({ ...editForm, stores: nextStores });
             }}
             className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2">
             <option value="ACTIVE">Active</option>
             <option value="INACTIVE">Inactive</option>
             <option value="SUSPENDED">Suspended</option>
            </select>
           </label>
          </div>
         );
        })}
       </div>
      </div>

      <label className="mt-5 block text-sm font-medium text-gray-700">
       Admin note
       <textarea
        rows={3}
        value={editForm.note}
        onChange={(e) => setEditForm({ ...editForm, note: e.target.value })}
        className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5"
       />
      </label>

      {editMessage && <p className="mt-4 text-sm text-red-600">{editMessage}</p>}

      <div className="mt-5 flex justify-end">
       <button
        type="button"
        disabled={saving}
        onClick={saveAffiliate}
        className="rounded-lg bg-black px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50">
        {saving ? "Saving..." : "Save changes"}
       </button>
      </div>
     </div>
    )}
    {/* Pagination */}
    <div className="flex items-center justify-between border-t border-gray-200 px-5 py-4">
     <span className="text-sm text-gray-500">
      {pagination.total} Affiliates · Page {pagination.page} of {pagination.totalPages}
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

AffiliatesPage.Layout = "Admin";
