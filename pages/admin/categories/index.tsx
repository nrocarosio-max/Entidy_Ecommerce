import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { FaChevronRight, FaEdit, FaFolder, FaPlus, FaSearch, FaTrash } from "react-icons/fa";

import AdminLayout from "~/layout/AdminLayout";

interface Store {
 _id: string;
 name: string;
 slug: string;
}

interface Category {
 _id: string;
 name: string;
 slug: string;
 description: string;
 image: string;
 parentId: string | null;
 sortOrder: number;
 isActive: boolean;
 createdAt: string;
 updatedAt: string;
}

export default function CategoriesPage() {
 const { data: session, status } = useSession();

 const [categories, setCategories] = useState<Category[]>([]);

 const [stores, setStores] = useState<Store[]>([]);

 const [selectedStore, setSelectedStore] = useState("");

 const [storesLoading, setStoresLoading] = useState(false);

 const [loading, setLoading] = useState(true);

 const [error, setError] = useState("");

 const [search, setSearch] = useState("");

 const [deleteId, setDeleteId] = useState<string | null>(null);

 const [deleting, setDeleting] = useState(false);

 const userRole = session?.user?.role ?? "";

 const userStoreId = session?.user?.storeId ?? "";

 const isSuperAdmin = userRole === "SUPER_ADMIN";

 /*
  * Store ID used by the category API.
  *
  * SUPER_ADMIN:
  *   Uses the store selected from the dropdown.
  *
  * Other roles:
  *   Uses the store assigned to their account.
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

    /*
     * Automatically select the first store.
     */
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
 }, [status, isSuperAdmin, selectedStore]);

 /*
  * Load categories.
  */
 const loadCategories = async (storeId: string) => {
  try {
   setLoading(true);
   setError("");

   const params = new URLSearchParams();

   params.set("storeId", storeId);

   const response = await fetch(`/api/admin/categories?${params.toString()}`);

   const data = await response.json();

   if (!response.ok) {
    throw new Error(data?.message || "Failed to load categories.");
   }

   setCategories(data.categories ?? []);
  } catch (error) {
   console.error(error);

   setCategories([]);

   setError(error instanceof Error ? error.message : "Failed to load categories.");
  } finally {
   setLoading(false);
  }
 };

 /*
  * Reload categories whenever the active
  * store changes.
  */
 useEffect(() => {
  if (status !== "authenticated") {
   return;
  }

  if (!activeStoreId) {
   setCategories([]);
   setLoading(false);
   return;
  }

  loadCategories(activeStoreId);
 }, [status, activeStoreId]);

 /*
  * Search.
  */
 const filteredCategories = useMemo(() => {
  const keyword = search.trim().toLowerCase();

  if (!keyword) {
   return categories;
  }

  return categories.filter((category) => {
   return category.name.toLowerCase().includes(keyword) || category.slug.toLowerCase().includes(keyword);
  });
 }, [categories, search]);

 /*
  * Parent category lookup.
  */
 const parentMap = useMemo(() => {
  return new Map(categories.map((category) => [category._id, category.name]));
 }, [categories]);

 /*
  * Delete category.
  */
 const handleDelete = async () => {
  if (!deleteId || !activeStoreId) {
   return;
  }

  try {
   setDeleting(true);
   setError("");

   const params = new URLSearchParams();

   params.set("storeId", activeStoreId);

   const response = await fetch(`/api/admin/categories/${deleteId}?${params.toString()}`, {
    method: "DELETE",
   });

   const data = await response.json();

   if (!response.ok) {
    throw new Error(data?.message || "Failed to delete category.");
   }

   setCategories((current) => current.filter((category) => category._id !== deleteId));

   setDeleteId(null);
  } catch (error) {
   console.error(error);

   setError(error instanceof Error ? error.message : "Failed to delete category.");
  } finally {
   setDeleting(false);
  }
 };

 /*
  * Session loading.
  */
 if (status === "loading") {
  return (
   <AdminLayout>
    <div className="flex min-h-[400px] items-center justify-center">
     <p className="text-sm text-gray-400">Loading...</p>
    </div>
   </AdminLayout>
  );
 }

 return (
  <AdminLayout>
   <div className="p-4 md:p-6">
    {/* Header */}
    <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
     <div>
      <div className="flex items-center gap-2 text-sm text-gray-400">
       <Link href="/admin" className="transition hover:text-gray-700">
        Admin
       </Link>

       <FaChevronRight size={9} />

       <span className="text-gray-500">Categories</span>
      </div>

      <h1 className="mt-2 text-2xl font-bold tracking-tight text-gray-900 md:text-3xl">Categories</h1>

      <p className="mt-1 text-sm text-gray-500">Organize products into categories.</p>
     </div>

     <Link
      href="/admin/categories/create"
      className={`inline-flex h-11 items-center justify-center gap-2 rounded-xl px-5 text-sm font-semibold text-white transition ${
       activeStoreId ? "bg-gray-900 hover:bg-gray-800" : "cursor-not-allowed bg-gray-300"
      }`}
      onClick={(event) => {
       if (!activeStoreId) {
        event.preventDefault();
       }
      }}>
      <FaPlus size={12} />
      Add Category
     </Link>
    </div>

    {/* Error */}
    {error && (
     <div className="mb-6 flex items-center justify-between gap-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
      <span>{error}</span>

      <button type="button" onClick={() => setError("")} className="text-xs font-semibold text-red-500 hover:text-red-700">
       Dismiss
      </button>
     </div>
    )}

    {/* No store selected */}
    {isSuperAdmin && !selectedStore && !storesLoading && (
     <div className="mb-6 rounded-xl border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-700">Please select a store to manage categories.</div>
    )}

    {/* Main Card */}
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
     {/* Toolbar */}
     <div className="flex flex-col gap-3 border-b border-gray-100 p-4 md:flex-row md:items-center md:justify-between">
      <div>
       <p className="text-sm font-semibold text-gray-900">All Categories</p>

       <p className="mt-0.5 text-xs text-gray-400">
        {categories.length} {categories.length === 1 ? "category" : "categories"}
       </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
       {/* Store selector */}
       {isSuperAdmin && (
        <select
         value={selectedStore}
         onChange={(event) => setSelectedStore(event.target.value)}
         disabled={storesLoading}
         className="h-10 min-w-[210px] rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none transition focus:border-gray-400 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400">
         <option value="">Select Store</option>

         {stores.map((store) => (
          <option key={store._id} value={store._id}>
           {store.name}
          </option>
         ))}
        </select>
       )}

       {/* Search */}
       <div className="relative w-full md:w-[280px]">
        <FaSearch size={13} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />

        <input
         type="text"
         value={search}
         onChange={(event) => setSearch(event.target.value)}
         placeholder="Search categories..."
         className="h-10 w-full rounded-xl border border-gray-200 bg-gray-50 pl-9 pr-3 text-sm text-gray-700 outline-none transition placeholder:text-gray-400 focus:border-gray-300 focus:bg-white"
        />
       </div>
      </div>
     </div>

     {/* Loading */}
     {loading ? (
      <div className="divide-y divide-gray-100">
       {Array.from({
        length: 5,
       }).map((_, index) => (
        <div key={index} className="animate-pulse px-5 py-4">
         <div className="h-4 w-40 rounded bg-gray-200" />

         <div className="mt-2 h-3 w-56 rounded bg-gray-100" />
        </div>
       ))}
      </div>
     ) : !activeStoreId ? (
      /* No Store */
      <div className="flex min-h-[360px] flex-col items-center justify-center px-5 text-center">
       <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 text-gray-400">
        <FaFolder size={20} />
       </div>

       <p className="mt-4 text-sm font-semibold text-gray-800">Select a store</p>

       <p className="mt-1 max-w-sm text-xs leading-5 text-gray-400">Select a store above to view and manage its categories.</p>
      </div>
     ) : filteredCategories.length === 0 ? (
      /* Empty */
      <div className="flex min-h-[360px] flex-col items-center justify-center px-5 text-center">
       <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 text-gray-400">
        <FaFolder size={20} />
       </div>

       <p className="mt-4 text-sm font-semibold text-gray-800">{search ? "No categories found" : "No categories yet"}</p>

       <p className="mt-1 max-w-sm text-xs leading-5 text-gray-400">
        {search ? "Try another search keyword." : "Create your first category to start organizing products."}
       </p>

       {!search && (
        <Link
         href="/admin/categories/create"
         className="mt-4 inline-flex h-10 items-center gap-2 rounded-xl bg-gray-900 px-4 text-xs font-semibold text-white transition hover:bg-gray-800">
         <FaPlus size={10} />
         Add Category
        </Link>
       )}
      </div>
     ) : (
      <>
       {/* Desktop */}
       <div className="hidden overflow-x-auto md:block">
        <table className="w-full">
         <thead>
          <tr className="border-b border-gray-100 bg-gray-50/60 text-left">
           <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-gray-400">Category</th>

           <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-gray-400">Slug</th>

           <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-gray-400">Parent</th>

           <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-gray-400">Sort Order</th>

           <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-gray-400">Status</th>

           <th className="px-5 py-3 text-right text-[11px] font-semibold uppercase tracking-wide text-gray-400">Actions</th>
          </tr>
         </thead>

         <tbody>
          {filteredCategories.map((category) => (
           <tr key={category._id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/60">
            <td className="px-5 py-4">
             <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gray-100">
               {category.image ? (
                <img src={category.image} alt={category.name} className="h-full w-full object-cover" />
               ) : (
                <FaFolder size={14} className="text-gray-400" />
               )}
              </div>

              <div className="min-w-0">
               <p className="truncate text-sm font-semibold text-gray-800">{category.name}</p>

               {category.description && <p className="mt-0.5 max-w-[280px] truncate text-xs text-gray-400">{category.description}</p>}
              </div>
             </div>
            </td>

            <td className="px-5 py-4">
             <span className="rounded-md bg-gray-50 px-2 py-1 font-mono text-xs text-gray-500">{category.slug}</span>
            </td>

            <td className="px-5 py-4 text-sm text-gray-500">{category.parentId ? (parentMap.get(category.parentId) ?? "-") : "Root"}</td>

            <td className="px-5 py-4 text-sm text-gray-500">{category.sortOrder}</td>

            <td className="px-5 py-4">
             <span
              className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold ${
               category.isActive ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"
              }`}>
              {category.isActive ? "Active" : "Inactive"}
             </span>
            </td>

            <td className="px-5 py-4">
             <div className="flex justify-end gap-1">
              <Link
               href={`/admin/categories/${category._id}/edit`}
               className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-100 hover:text-gray-900"
               aria-label={`Edit ${category.name}`}>
               <FaEdit size={12} />
              </Link>

              <button
               type="button"
               onClick={() => setDeleteId(category._id)}
               className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition hover:bg-red-50 hover:text-red-600"
               aria-label={`Delete ${category.name}`}>
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
        {filteredCategories.map((category) => (
         <div key={category._id} className="p-4">
          <div className="flex items-start gap-3">
           <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gray-100">
            {category.image ? (
             <img src={category.image} alt={category.name} className="h-full w-full object-cover" />
            ) : (
             <FaFolder size={14} className="text-gray-400" />
            )}
           </div>

           <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
             <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-gray-800">{category.name}</p>

              <p className="mt-0.5 truncate font-mono text-[11px] text-gray-400">{category.slug}</p>
             </div>

             <span
              className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-semibold ${
               category.isActive ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"
              }`}>
              {category.isActive ? "Active" : "Inactive"}
             </span>
            </div>

            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-gray-400">
             <span>Parent: {category.parentId ? (parentMap.get(category.parentId) ?? "-") : "Root"}</span>

             <span>Order: {category.sortOrder}</span>
            </div>

            <div className="mt-3 flex gap-2">
             <Link
              href={`/admin/categories/${category._id}/edit`}
              className="inline-flex h-8 items-center gap-2 rounded-lg border border-gray-200 px-3 text-xs font-medium text-gray-600 transition hover:bg-gray-50">
              <FaEdit size={10} />
              Edit
             </Link>

             <button
              type="button"
              onClick={() => setDeleteId(category._id)}
              className="inline-flex h-8 items-center gap-2 rounded-lg border border-red-100 px-3 text-xs font-medium text-red-500 transition hover:bg-red-50">
              <FaTrash size={10} />
              Delete
             </button>
            </div>
           </div>
          </div>
         </div>
        ))}
       </div>
      </>
     )}
    </div>
   </div>

   {/* Delete Confirmation */}
   {deleteId && (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 p-4">
     <div className="w-full max-w-[420px] rounded-2xl bg-white p-6 shadow-2xl">
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 text-red-500">
       <FaTrash size={15} />
      </div>

      <h2 className="mt-4 text-lg font-bold text-gray-900">Delete category?</h2>

      <p className="mt-2 text-sm leading-6 text-gray-500">
       This action will permanently delete this category. Make sure it is not being used by products or child categories.
      </p>

      <div className="mt-6 flex justify-end gap-2">
       <button
        type="button"
        onClick={() => setDeleteId(null)}
        disabled={deleting}
        className="h-10 rounded-xl border border-gray-200 px-4 text-sm font-medium text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50">
        Cancel
       </button>

       <button
        type="button"
        onClick={handleDelete}
        disabled={deleting || !activeStoreId}
        className="h-10 rounded-xl bg-red-600 px-4 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50">
        {deleting ? "Deleting..." : "Delete"}
       </button>
      </div>
     </div>
    </div>
   )}
  </AdminLayout>
 );
}
