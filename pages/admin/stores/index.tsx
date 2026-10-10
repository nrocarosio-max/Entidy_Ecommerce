import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { FaArrowRight, FaEdit, FaEnvelope, FaMapMarkerAlt, FaPhone, FaPlus, FaSearch, FaStore, FaSyncAlt } from "react-icons/fa";

interface Store {
 _id: string;
 name: string;
 slug: string;
 description: string;
 logo: string;
 email: string;
 phone: string;
 secondaryPhone: string;
 address: string;
 isActive: boolean;
 createdAt: string;
 updatedAt: string;
}

export default function StoresPage() {
 const [stores, setStores] = useState<Store[]>([]);
 const [loading, setLoading] = useState(true);
 const [error, setError] = useState("");
 const [search, setSearch] = useState("");

 const fetchStores = async () => {
  try {
   setLoading(true);
   setError("");

   const response = await fetch("/api/admin/stores");

   const data = await response.json();

   if (!response.ok) {
    throw new Error(data.message || "Failed to load stores.");
   }

   setStores(data.stores || []);
  } catch (err) {
   setError(err instanceof Error ? err.message : "Failed to load stores.");
  } finally {
   setLoading(false);
  }
 };

 useEffect(() => {
  fetchStores();
 }, []);

 const filteredStores = useMemo(() => {
  const keyword = search.trim().toLowerCase();

  if (!keyword) {
   return stores;
  }

  return stores.filter((store) => {
   return (
    store.name.toLowerCase().includes(keyword) ||
    store.slug.toLowerCase().includes(keyword) ||
    store.email.toLowerCase().includes(keyword) ||
    store.phone.toLowerCase().includes(keyword) ||
    store.address.toLowerCase().includes(keyword)
   );
  });
 }, [stores, search]);

 const formatDate = (date: string) => {
  if (!date) return "-";

  return new Date(date).toLocaleDateString("en-GB", {
   day: "2-digit",
   month: "short",
   year: "numeric",
  });
 };

 return (
  <div className="min-h-screen bg-[#f5f6f8] p-4 md:p-6">
   <div className="mx-auto max-w-7xl">
    {/* Header */}
    <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
     <div>
      <div className="mb-2 flex items-center gap-2 text-sm text-gray-500">
       <span className="text-gray-900">Stores</span>
      </div>

      <h1 className="text-2xl font-bold text-gray-900 md:text-3xl">Stores</h1>

      <p className="mt-1 text-sm text-gray-500">Manage all stores in your system.</p>
     </div>

     <Link
      href="/admin/stores/create"
      className="inline-flex items-center justify-center gap-2 rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800">
      <FaPlus size={12} />
      Create Store
     </Link>
    </div>

    {/* Summary */}
    <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
     <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
       <div>
        <p className="text-sm text-gray-500">Total Stores</p>

        <p className="mt-1 text-2xl font-bold text-gray-900">{stores.length}</p>
       </div>

       <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-gray-100">
        <FaStore className="text-gray-700" size={18} />
       </div>
      </div>
     </div>

     <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
       <div>
        <p className="text-sm text-gray-500">Active Stores</p>

        <p className="mt-1 text-2xl font-bold text-green-600">{stores.filter((store) => store.isActive).length}</p>
       </div>

       <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-green-50">
        <span className="h-3 w-3 rounded-full bg-green-500" />
       </div>
      </div>
     </div>

     <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:col-span-2 lg:col-span-1">
      <div className="flex items-center justify-between">
       <div>
        <p className="text-sm text-gray-500">Inactive Stores</p>

        <p className="mt-1 text-2xl font-bold text-gray-500">{stores.filter((store) => !store.isActive).length}</p>
       </div>

       <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-gray-100">
        <span className="h-3 w-3 rounded-full bg-gray-400" />
       </div>
      </div>
     </div>
    </div>

    {/* Search */}
    <div className="mb-5 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
     <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div className="relative w-full md:max-w-md">
       <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />

       <input
        type="text"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder="Search store name, slug, email..."
        className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
       />
      </div>

      <button
       type="button"
       onClick={fetchStores}
       disabled={loading}
       className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60">
       <FaSyncAlt size={12} className={loading ? "animate-spin" : ""} />
       Refresh
      </button>
     </div>
    </div>

    {/* Error */}
    {error && (
     <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
       <div>
        <span className="font-semibold">Error:</span> {error}
       </div>

       <button
        type="button"
        onClick={fetchStores}
        className="inline-flex items-center justify-center gap-2 rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-medium text-red-700 transition hover:bg-red-50">
        <FaSyncAlt size={10} />
        Try Again
       </button>
      </div>
     </div>
    )}

    {/* Loading */}
    {loading ? (
     <div className="rounded-xl border border-gray-200 bg-white p-10 shadow-sm">
      <div className="flex flex-col items-center justify-center">
       <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-200 border-t-gray-900" />

       <p className="mt-4 text-sm text-gray-500">Loading stores...</p>
      </div>
     </div>
    ) : filteredStores.length === 0 ? (
     /* Empty */
     <div className="rounded-xl border border-gray-200 bg-white p-10 shadow-sm">
      <div className="flex flex-col items-center justify-center text-center">
       <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
        <FaStore className="text-gray-400" size={22} />
       </div>

       <h2 className="mt-4 text-lg font-semibold text-gray-900">{search ? "No stores found" : "No stores yet"}</h2>

       <p className="mt-1 max-w-md text-sm text-gray-500">
        {search ? "Try changing your search keyword." : "Create your first store to start managing your system."}
       </p>

       {!search && (
        <Link
         href="/admin/stores/create"
         className="mt-5 inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800">
         <FaPlus size={12} />
         Create Store
        </Link>
       )}
      </div>
     </div>
    ) : (
     <>
      {/* Desktop Table */}
      <div className="hidden overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm lg:block">
       <div className="overflow-x-auto">
        <table className="w-full min-w-[1000px]">
         <thead>
          <tr className="border-b border-gray-200 bg-gray-50">
           <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Store</th>

           <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Contact</th>

           <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Address</th>

           <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Status</th>

           <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Created</th>

           <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">Actions</th>
          </tr>
         </thead>

         <tbody className="divide-y divide-gray-100">
          {filteredStores.map((store) => (
           <tr key={store._id} className="transition hover:bg-gray-50">
            {/* Store */}
            <td className="px-5 py-4">
             <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
               {store.logo ? (
                <img src={store.logo} alt={store.name} className="h-full w-full object-contain" />
               ) : (
                <FaStore className="text-gray-400" size={17} />
               )}
              </div>

              <div className="min-w-0">
               <p className="truncate font-semibold text-gray-900">{store.name}</p>

               <p className="mt-0.5 truncate text-xs text-gray-500">{store.slug}</p>
              </div>
             </div>
            </td>

            {/* Contact */}
            <td className="px-5 py-4">
             <div className="space-y-1">
              {store.email && (
               <div className="flex items-center gap-2 text-xs text-gray-600">
                <FaEnvelope className="shrink-0 text-gray-400" size={11} />
                <span className="truncate">{store.email}</span>
               </div>
              )}

              {store.phone && (
               <div className="flex items-center gap-2 text-xs text-gray-600">
                <FaPhone className="shrink-0 text-gray-400" size={11} />
                <span>{store.phone}</span>
               </div>
              )}
             </div>
            </td>

            {/* Address */}
            <td className="max-w-[220px] px-5 py-4">
             {store.address ? (
              <div className="flex items-start gap-2 text-xs text-gray-600">
               <FaMapMarkerAlt className="mt-0.5 shrink-0 text-gray-400" size={11} />

               <span className="line-clamp-2">{store.address}</span>
              </div>
             ) : (
              <span className="text-xs text-gray-400">No address</span>
             )}
            </td>

            {/* Status */}
            <td className="px-5 py-4">
             {store.isActive ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-700">
               <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
               Active
              </span>
             ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-600">
               <span className="h-1.5 w-1.5 rounded-full bg-gray-400" />
               Inactive
              </span>
             )}
            </td>

            {/* Created */}
            <td className="px-5 py-4 text-xs text-gray-500">{formatDate(store.createdAt)}</td>

            {/* Actions */}
            <td className="px-5 py-4">
             <div className="flex items-center justify-end gap-2">
              <Link
               href={`/admin/stores/${store._id}`}
               className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-gray-700 transition hover:bg-gray-100">
               View
               <FaArrowRight size={9} />
              </Link>

              <Link
               href={`/admin/stores/${store._id}`}
               className="inline-flex items-center justify-center rounded-lg border border-gray-200 p-2 text-gray-600 transition hover:bg-gray-100 hover:text-gray-900"
               title="Edit store">
               <FaEdit size={12} />
              </Link>
             </div>
            </td>
           </tr>
          ))}
         </tbody>
        </table>
       </div>
      </div>

      {/* Mobile Cards */}
      <div className="space-y-4 lg:hidden">
       {filteredStores.map((store) => (
        <div key={store._id} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
         <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
           <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
            {store.logo ? <img src={store.logo} alt={store.name} className="h-full w-full object-contain" /> : <FaStore className="text-gray-400" size={18} />}
           </div>

           <div className="min-w-0">
            <h2 className="truncate font-semibold text-gray-900">{store.name}</h2>

            <p className="truncate text-xs text-gray-500">{store.slug}</p>
           </div>
          </div>

          {store.isActive ? (
           <span className="shrink-0 rounded-full bg-green-100 px-2.5 py-1 text-[11px] font-semibold text-green-700">Active</span>
          ) : (
           <span className="shrink-0 rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-semibold text-gray-600">Inactive</span>
          )}
         </div>

         <div className="mt-4 space-y-2 border-t border-gray-100 pt-4">
          {store.email && (
           <div className="flex items-center gap-2 text-sm text-gray-600">
            <FaEnvelope className="shrink-0 text-gray-400" size={12} />
            <span className="truncate">{store.email}</span>
           </div>
          )}

          {store.phone && (
           <div className="flex items-center gap-2 text-sm text-gray-600">
            <FaPhone className="shrink-0 text-gray-400" size={12} />
            <span>{store.phone}</span>
           </div>
          )}

          {store.address && (
           <div className="flex items-start gap-2 text-sm text-gray-600">
            <FaMapMarkerAlt className="mt-0.5 shrink-0 text-gray-400" size={12} />
            <span>{store.address}</span>
           </div>
          )}
         </div>

         <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-4">
          <span className="text-xs text-gray-400">Created {formatDate(store.createdAt)}</span>

          <div className="flex items-center gap-2">
           <Link
            href={`/admin/stores/${store._id}`}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-gray-700 transition hover:bg-gray-50">
            View
            <FaArrowRight size={9} />
           </Link>

           <Link
            href={`/admin/stores/${store._id}`}
            className="inline-flex items-center justify-center rounded-lg bg-gray-900 p-2 text-white transition hover:bg-gray-800"
            title="Edit store">
            <FaEdit size={12} />
           </Link>
          </div>
         </div>
        </div>
       ))}
      </div>

      {/* Result count */}
      <div className="mt-4 text-xs text-gray-500">
       Showing <span className="font-medium text-gray-700">{filteredStores.length}</span> of <span className="font-medium text-gray-700">{stores.length}</span>{" "}
       stores
      </div>
     </>
    )}
   </div>
  </div>
 );
}

StoresPage.Layout = "Admin";
