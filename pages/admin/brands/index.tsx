import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { FaChevronDown, FaChevronLeft, FaChevronRight, FaEdit, FaPlus, FaSearch, FaStore, FaTrash } from "react-icons/fa";

interface Store {
 _id: string;
 name: string;
 slug: string;
}

interface Brand {
 _id: string;
 storeId: string;
 name: string;
 slug: string;
 description: string;
 logo: string;
 isActive: boolean;
 createdAt: string;
 updatedAt: string;
}

interface BrandsResponse {
 brands: Brand[];
 pagination?: {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
 };
}

export default function BrandsPage() {
 const { data: session, status } = useSession();

 const userRole = session?.user?.role ?? "";

 const userStoreId = session?.user?.storeId ?? "";

 const isSuperAdmin = userRole === "SUPER_ADMIN";

 const [stores, setStores] = useState<Store[]>([]);

 const [selectedStore, setSelectedStore] = useState("");

 const [brands, setBrands] = useState<Brand[]>([]);

 const [loading, setLoading] = useState(true);

 const [storesLoading, setStoresLoading] = useState(false);

 const [deletingId, setDeletingId] = useState<string | null>(null);

 const [error, setError] = useState("");

 const [search, setSearch] = useState("");

 const [searchInput, setSearchInput] = useState("");

 const [statusFilter, setStatusFilter] = useState("ALL");

 const [page, setPage] = useState(1);

 const [limit] = useState(10);

 const [pagination, setPagination] = useState({
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 1,
 });

 /*
  * Store used by the current user.
  */
 const activeStoreId = isSuperAdmin ? selectedStore : userStoreId;

 /*
  * Load stores for SUPER_ADMIN.
  */
 useEffect(() => {
  if (status !== "authenticated" || !isSuperAdmin) {
   return;
  }

  const loadStores = async () => {
   try {
    setStoresLoading(true);
    setError("");

    const response = await fetch("/api/admin/stores");

    const data = await response.json();

    if (!response.ok) {
     throw new Error(data?.message || "Failed to load stores.");
    }

    const loadedStores = data.stores ?? [];

    setStores(loadedStores);

    if (loadedStores.length > 0 && !selectedStore) {
     setSelectedStore(loadedStores[0]._id);
    }
   } catch (error) {
    console.error(error);

    setError(error instanceof Error ? error.message : "Failed to load stores.");
   } finally {
    setStoresLoading(false);
   }
  };

  loadStores();
 }, [status, isSuperAdmin]);

 /*
  * Load brands.
  */
 useEffect(() => {
  if (status !== "authenticated" || !activeStoreId) {
   setBrands([]);
   setLoading(false);
   return;
  }

  const loadBrands = async () => {
   try {
    setLoading(true);
    setError("");

    const params = new URLSearchParams();

    params.set("storeId", activeStoreId);

    params.set("page", String(page));

    params.set("limit", String(limit));

    if (search.trim()) {
     params.set("search", search.trim());
    }

    if (statusFilter !== "ALL") {
     params.set("isActive", statusFilter === "ACTIVE" ? "true" : "false");
    }

    const response = await fetch(`/api/admin/brands?${params.toString()}`);

    const data: BrandsResponse = await response.json();

    if (!response.ok) {
     throw new Error((data as any)?.message || "Failed to load brands.");
    }

    setBrands(data.brands ?? []);

    setPagination({
     page: data.pagination?.page ?? page,
     limit: data.pagination?.limit ?? limit,
     total: data.pagination?.total ?? data.brands?.length ?? 0,
     totalPages: data.pagination?.totalPages ?? 1,
    });
   } catch (error) {
    console.error(error);

    setBrands([]);

    setError(error instanceof Error ? error.message : "Failed to load brands.");
   } finally {
    setLoading(false);
   }
  };

  loadBrands();
 }, [status, activeStoreId, page, limit, search, statusFilter]);

 /*
  * Search.
  */
 const handleSearch = () => {
  setPage(1);
  setSearch(searchInput.trim());
 };

 /*
  * Delete brand.
  */
 const handleDelete = async (brand: Brand) => {
  const confirmed = window.confirm(`Are you sure you want to delete "${brand.name}"?`);

  if (!confirmed) {
   return;
  }

  try {
   setDeletingId(brand._id);
   setError("");

   const params = new URLSearchParams();

   params.set("storeId", activeStoreId);

   const response = await fetch(`/api/admin/brands/${brand._id}?${params.toString()}`, {
    method: "DELETE",
   });

   const data = await response.json();

   if (!response.ok) {
    throw new Error(data?.message || "Failed to delete brand.");
   }

   /*
    * Reload current page.
    */
   setBrands((current) => current.filter((item) => item._id !== brand._id));

   setPagination((current) => ({
    ...current,
    total: Math.max(0, current.total - 1),
   }));
  } catch (error) {
   console.error(error);

   setError(error instanceof Error ? error.message : "Failed to delete brand.");
  } finally {
   setDeletingId(null);
  }
 };

 /*
  * Authentication loading.
  */
 if (status === "loading") {
  return (
   <div className="p-4 md:p-6">
    <div className="flex min-h-[400px] items-center justify-center">
     <p className="text-sm text-gray-400">Loading...</p>
    </div>
   </div>
  );
 }

 return (
  <div className="p-4 md:p-6">
   {/* Header */}
   <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
    <div>
     <div className="flex items-center gap-2 text-sm text-gray-400">
      <FaStore size={12} />

      <span>Admin</span>

      <span>/</span>

      <span className="text-gray-500">Brands</span>
     </div>

     <h1 className="mt-1 text-2xl font-bold tracking-tight text-gray-900 md:text-3xl">Brands</h1>

     <p className="mt-1 text-sm text-gray-500">Manage brands for your store.</p>
    </div>

    <Link
     href="/admin/brands/create"
     className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-gray-900 px-4 text-sm font-semibold text-white transition hover:bg-gray-800">
     <FaPlus size={12} />
     Create Brand
    </Link>
   </div>

   {/* Error */}
   {error && <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>}

   {/* Filters */}
   <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-4">
    <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
     <div className="flex flex-col gap-3 md:flex-row">
      {/* Store */}
      {isSuperAdmin && (
       <div className="relative">
        <FaStore className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-400" />

        <select
         value={selectedStore}
         onChange={(event) => {
          setSelectedStore(event.target.value);
          setPage(1);
         }}
         disabled={storesLoading}
         className="h-11 min-w-[220px] appearance-none rounded-xl border border-gray-200 bg-white pl-9 pr-9 text-sm text-gray-700 outline-none transition focus:border-gray-400 disabled:cursor-not-allowed disabled:bg-gray-50">
         <option value="">Select Store</option>

         {stores.map((store) => (
          <option key={store._id} value={store._id}>
           {store.name}
          </option>
         ))}
        </select>

        <FaChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400" />
       </div>
      )}

      {/* Status */}
      <select
       value={statusFilter}
       onChange={(event) => {
        setStatusFilter(event.target.value);
        setPage(1);
       }}
       className="h-11 rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none transition focus:border-gray-400">
       <option value="ALL">All Status</option>

       <option value="ACTIVE">Active</option>

       <option value="INACTIVE">Inactive</option>
      </select>
     </div>

     {/* Search */}
     <div className="flex w-full max-w-md">
      <div className="relative flex-1">
       <FaSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-400" />

       <input
        type="text"
        value={searchInput}
        onChange={(event) => setSearchInput(event.target.value)}
        onKeyDown={(event) => {
         if (event.key === "Enter") {
          handleSearch();
         }
        }}
        placeholder="Search brands..."
        className="h-11 w-full rounded-l-xl border border-r-0 border-gray-200 bg-white pl-9 pr-3 text-sm text-gray-700 outline-none transition placeholder:text-gray-400 focus:border-gray-400"
       />
      </div>

      <button type="button" onClick={handleSearch} className="h-11 rounded-r-xl bg-gray-900 px-5 text-sm font-semibold text-white transition hover:bg-gray-800">
       Search
      </button>
     </div>
    </div>
   </div>

   {/* Table */}
   <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
    {loading ? (
     <div className="p-6">
      <div className="space-y-4">
       {Array.from({
        length: 6,
       }).map((_, index) => (
        <div key={index} className="h-16 animate-pulse rounded-xl bg-gray-100" />
       ))}
      </div>
     </div>
    ) : brands.length === 0 ? (
     <div className="flex min-h-[320px] flex-col items-center justify-center px-6 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100">
       <FaStore className="text-gray-400" />
      </div>

      <h2 className="mt-4 text-base font-semibold text-gray-900">No brands found</h2>

      <p className="mt-1 max-w-sm text-sm text-gray-500">There are no brands matching your current filters.</p>

      <Link
       href="/admin/brands/create"
       className="mt-5 inline-flex h-10 items-center gap-2 rounded-xl bg-gray-900 px-4 text-sm font-semibold text-white transition hover:bg-gray-800">
       <FaPlus size={11} />
       Create Brand
      </Link>
     </div>
    ) : (
     <>
      {/* Desktop table */}
      <div className="hidden overflow-x-auto md:block">
       <table className="w-full min-w-[800px]">
        <thead>
         <tr className="border-b border-gray-100 bg-gray-50/70">
          <th className="w-20 px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Logo</th>

          <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Brand</th>

          <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Slug</th>

          <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Status</th>

          <th className="w-32 px-5 py-4 text-right text-xs font-semibold uppercase tracking-wide text-gray-400">Actions</th>
         </tr>
        </thead>

        <tbody>
         {brands.map((brand) => (
          <tr key={brand._id} className="border-b border-gray-100 last:border-0">
           <td className="px-5 py-4">
            {brand.logo ? (
             <div className="h-12 w-12 overflow-hidden rounded-xl border border-gray-100 bg-gray-50">
              <img
               src={brand.logo}
               alt={brand.name}
               className="h-full w-full object-contain"
               onError={(event) => {
                event.currentTarget.style.display = "none";
               }}
              />
             </div>
            ) : (
             <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100 text-gray-400">
              <FaStore size={15} />
             </div>
            )}
           </td>

           <td className="px-5 py-4">
            <div>
             <p className="font-semibold text-gray-900">{brand.name}</p>

             {brand.description && <p className="mt-1 max-w-md truncate text-xs text-gray-400">{brand.description}</p>}
            </div>
           </td>

           <td className="px-5 py-4">
            <span className="font-mono text-xs text-gray-500">{brand.slug}</span>
           </td>

           <td className="px-5 py-4">
            <span
             className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
              brand.isActive ? "bg-green-50 text-green-600" : "bg-gray-100 text-gray-500"
             }`}>
             {brand.isActive ? "Active" : "Inactive"}
            </span>
           </td>

           <td className="px-5 py-4">
            <div className="flex items-center justify-end gap-2">
             <Link
              href={`/admin/brands/${brand._id}/edit`}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition hover:bg-gray-50 hover:text-gray-900"
              title="Edit">
              <FaEdit size={12} />
             </Link>

             <button
              type="button"
              onClick={() => handleDelete(brand)}
              disabled={deletingId === brand._id}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-red-100 text-red-400 transition hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
              title="Delete">
              <FaTrash size={11} />
             </button>
            </div>
           </td>
          </tr>
         ))}
        </tbody>
       </table>
      </div>

      {/* Mobile */}
      <div className="divide-y divide-gray-100 md:hidden">
       {brands.map((brand) => (
        <div key={brand._id} className="p-4">
         <div className="flex gap-3">
          {brand.logo ? (
           <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-gray-100 bg-gray-50">
            <img src={brand.logo} alt={brand.name} className="h-full w-full object-contain" />
           </div>
          ) : (
           <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-gray-400">
            <FaStore size={15} />
           </div>
          )}

          <div className="min-w-0 flex-1">
           <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
             <h3 className="truncate font-semibold text-gray-900">{brand.name}</h3>

             <p className="mt-1 truncate font-mono text-xs text-gray-400">{brand.slug}</p>
            </div>

            <span
             className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
              brand.isActive ? "bg-green-50 text-green-600" : "bg-gray-100 text-gray-500"
             }`}>
             {brand.isActive ? "Active" : "Inactive"}
            </span>
           </div>

           {brand.description && <p className="mt-2 line-clamp-2 text-xs text-gray-500">{brand.description}</p>}

           <div className="mt-3 flex gap-2">
            <Link
             href={`/admin/brands/${brand._id}/edit`}
             className="inline-flex h-9 items-center gap-2 rounded-lg border border-gray-200 px-3 text-xs font-medium text-gray-600 transition hover:bg-gray-50">
             <FaEdit size={11} />
             Edit
            </Link>

            <button
             type="button"
             onClick={() => handleDelete(brand)}
             disabled={deletingId === brand._id}
             className="inline-flex h-9 items-center gap-2 rounded-lg border border-red-100 px-3 text-xs font-medium text-red-500 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50">
             <FaTrash size={10} />
             Delete
            </button>
           </div>
          </div>
         </div>
        </div>
       ))}
      </div>

      {/* Pagination */}
      <div className="flex flex-col gap-3 border-t border-gray-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between md:px-5">
       <p className="text-xs text-gray-500">
        Showing <span className="font-medium text-gray-700">{pagination.total === 0 ? 0 : (pagination.page - 1) * pagination.limit + 1}</span> to{" "}
        <span className="font-medium text-gray-700">{Math.min(pagination.page * pagination.limit, pagination.total)}</span> of{" "}
        <span className="font-medium text-gray-700">{pagination.total}</span> brands
       </p>

       <div className="flex items-center gap-2">
        <button
         type="button"
         onClick={() => setPage((current) => Math.max(1, current - 1))}
         disabled={pagination.page <= 1}
         className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40">
         <FaChevronLeft size={10} />
        </button>

        <span className="px-2 text-xs font-medium text-gray-600">
         Page {pagination.page} of {pagination.totalPages}
        </span>

        <button
         type="button"
         onClick={() => setPage((current) => Math.min(pagination.totalPages, current + 1))}
         disabled={pagination.page >= pagination.totalPages}
         className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40">
         <FaChevronRight size={10} />
        </button>
       </div>
      </div>
     </>
    )}
   </div>
  </div>
 );
}

BrandsPage.Layout = "Admin";
