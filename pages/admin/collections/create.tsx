import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";
import { FaArrowLeft, FaChevronRight, FaFolder, FaSave } from "react-icons/fa";

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
}

export default function CreateCollectionPage() {
 const router = useRouter();

 const { data: session, status } = useSession();

 const userRole = session?.user?.role ?? "";

 const userStoreId = session?.user?.storeId ?? "";

 const isSuperAdmin = userRole === "SUPER_ADMIN";

 const [stores, setStores] = useState<Store[]>([]);

 const [categories, setCategories] = useState<Category[]>([]);

 const [selectedStore, setSelectedStore] = useState("");

 const [storesLoading, setStoresLoading] = useState(false);

 const [categoriesLoading, setCategoriesLoading] = useState(false);

 const [saving, setSaving] = useState(false);

 const [error, setError] = useState("");

 const [form, setForm] = useState({
  name: "",
  slug: "",
  description: "",
  image: "",
  parentId: "",
  sortOrder: "0",
  isActive: true,
 });

 /*
  * Determine the store used by this page.
  */
 const activeStoreId = isSuperAdmin ? selectedStore : userStoreId;

 /*
  * Generate slug from collection name.
  */
 const generateSlug = (value: string) => {
  return value
   .normalize("NFD")
   .replace(/[\u0300-\u036f]/g, "")
   .toLowerCase()
   .trim()
   .replace(/[^a-z0-9]+/g, "-")
   .replace(/^-+|-+$/g, "");
 };

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
 }, [status, isSuperAdmin]);

 /*
  * Load parent collections whenever
  * the active store changes.
  */
 useEffect(() => {
  if (status !== "authenticated" || !activeStoreId) {
   setCategories([]);
   return;
  }

  const loadCategories = async () => {
   try {
    setCategoriesLoading(true);
    setError("");

    const params = new URLSearchParams();

    params.set("storeId", activeStoreId);

    const response = await fetch(`/api/admin/categories?${params.toString()}`);

    const data = await response.json();

    if (!response.ok) {
     throw new Error(data?.message || "Failed to load collections.");
    }

    setCategories(data.categories ?? []);
   } catch (error) {
    console.error(error);

    setCategories([]);

    setError(error instanceof Error ? error.message : "Failed to load collections.");
   } finally {
    setCategoriesLoading(false);
   }
  };

  loadCategories();
 }, [status, activeStoreId]);

 /*
  * Handle collection name changes.
  */
 const handleNameChange = (value: string) => {
  setForm((current) => ({
   ...current,
   name: value,
   slug: !current.slug || current.slug === generateSlug(current.name) ? generateSlug(value) : current.slug,
  }));
 };

 /*
  * Submit form.
  */
 const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
  event.preventDefault();

  setError("");

  if (!activeStoreId) {
   setError("Please select a store.");
   return;
  }

  const name = form.name.trim();

  const slug = form.slug.trim();

  if (!name) {
   setError("Collection name is required.");
   return;
  }

  if (!slug) {
   setError("Collection slug is required.");
   return;
  }

  const sortOrder = Number(form.sortOrder);

  if (!Number.isInteger(sortOrder) || sortOrder < 0) {
   setError("Sort order must be a non-negative integer.");
   return;
  }

  try {
   setSaving(true);

   const response = await fetch("/api/admin/categories", {
    method: "POST",
    headers: {
     "Content-Type": "application/json",
    },
    body: JSON.stringify({
     storeId: activeStoreId,
     name,
     slug,
     description: form.description.trim(),
     image: form.image.trim(),
     parentId: form.parentId || null,
     sortOrder,
     isActive: form.isActive,
    }),
   });

   const data = await response.json();

   if (!response.ok) {
    throw new Error(data?.message || "Failed to create collection.");
   }

   await router.push("/admin/collections");
  } catch (error) {
   console.error(error);

   setError(error instanceof Error ? error.message : "Failed to create collection.");
  } finally {
   setSaving(false);
  }
 };

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
    <div className="mb-6">
     <div className="flex flex-wrap items-center gap-2 text-sm text-gray-400">
      <Link href="/admin" className="transition hover:text-gray-700">
       Admin
      </Link>

      <FaChevronRight size={9} />

      <Link href="/admin/collections" className="transition hover:text-gray-700">
       Collections
      </Link>

      <FaChevronRight size={9} />

      <span className="text-gray-500">Create</span>
     </div>

     <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
       <h1 className="text-2xl font-bold tracking-tight text-gray-900 md:text-3xl">Create Collection</h1>

       <p className="mt-1 text-sm text-gray-500">Create a new collection for organizing products.</p>
      </div>

      <Link
       href="/admin/collections"
       className="inline-flex h-10 w-fit items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 text-sm font-medium text-gray-600 transition hover:bg-gray-50">
       <FaArrowLeft size={11} />
       Back
      </Link>
     </div>
    </div>

    {/* Error */}
    {error && <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>}

    {/* Store selector */}
    {isSuperAdmin && (
     <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
       <div>
        <h2 className="text-sm font-semibold text-gray-900">Store</h2>

        <p className="mt-1 text-xs text-gray-400">Select the store where this collection will be created.</p>
       </div>

       <select
        value={selectedStore}
        onChange={(event) => {
         setSelectedStore(event.target.value);

         setForm((current) => ({
          ...current,
          parentId: "",
         }));
        }}
        disabled={storesLoading}
        className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none transition focus:border-gray-400 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400 md:w-[300px]">
        <option value="">Select Store</option>

        {stores.map((store) => (
         <option key={store._id} value={store._id}>
          {store.name}
         </option>
        ))}
       </select>
      </div>
     </div>
    )}

    <form onSubmit={handleSubmit} className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
     {/* Main */}
     <div className="space-y-6">
      <section className="rounded-2xl border border-gray-200 bg-white">
       <div className="border-b border-gray-100 px-5 py-4">
        <h2 className="text-base font-semibold text-gray-900">Basic Information</h2>

        <p className="mt-0.5 text-xs text-gray-400">Define the basic information of this collection.</p>
       </div>

       <div className="space-y-5 p-5">
        {/* Name */}
        <div>
         <label htmlFor="name" className="mb-2 block text-sm font-medium text-gray-700">
          Collection Name
          <span className="ml-1 text-red-500">*</span>
         </label>

         <input
          id="name"
          type="text"
          value={form.name}
          onChange={(event) => handleNameChange(event.target.value)}
          placeholder="e.g. Men's Clothing"
          className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none transition placeholder:text-gray-400 focus:border-gray-400"
         />
        </div>

        {/* Slug */}
        <div>
         <label htmlFor="slug" className="mb-2 block text-sm font-medium text-gray-700">
          Slug
          <span className="ml-1 text-red-500">*</span>
         </label>

         <input
          id="slug"
          type="text"
          value={form.slug}
          onChange={(event) =>
           setForm((current) => ({
            ...current,
            slug: generateSlug(event.target.value),
           }))
          }
          placeholder="mens-clothing"
          className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 font-mono text-sm text-gray-700 outline-none transition placeholder:text-gray-400 focus:border-gray-400"
         />

         <p className="mt-1.5 text-[11px] text-gray-400">Used in the collection URL.</p>
        </div>

        {/* Description */}
        <div>
         <label htmlFor="description" className="mb-2 block text-sm font-medium text-gray-700">
          Description
         </label>

         <textarea
          id="description"
          value={form.description}
          onChange={(event) =>
           setForm((current) => ({
            ...current,
            description: event.target.value,
           }))
          }
          rows={5}
          placeholder="Describe this collection..."
          className="w-full resize-none rounded-xl border border-gray-200 bg-white px-3 py-3 text-sm text-gray-700 outline-none transition placeholder:text-gray-400 focus:border-gray-400"
         />
        </div>

        {/* Image */}
        <div>
         <label htmlFor="image" className="mb-2 block text-sm font-medium text-gray-700">
          Image URL
         </label>

         <input
          id="image"
          type="url"
          value={form.image}
          onChange={(event) =>
           setForm((current) => ({
            ...current,
            image: event.target.value,
           }))
          }
          placeholder="https://example.com/image.jpg"
          className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none transition placeholder:text-gray-400 focus:border-gray-400"
         />

         {form.image && (
          <div className="mt-3 flex h-32 w-32 overflow-hidden rounded-xl border border-gray-200 bg-gray-50">
           <img
            src={form.image}
            alt="Collection preview"
            className="h-full w-full object-cover"
            onError={(event) => {
             event.currentTarget.style.display = "none";
            }}
           />
          </div>
         )}
        </div>
       </div>
      </section>
     </div>

     {/* Sidebar */}
     <div className="space-y-6">
      {/* Organization */}
      <section className="rounded-2xl border border-gray-200 bg-white">
       <div className="border-b border-gray-100 px-5 py-4">
        <h2 className="text-base font-semibold text-gray-900">Organization</h2>

        <p className="mt-0.5 text-xs text-gray-400">Set the hierarchy and display order.</p>
       </div>

       <div className="space-y-5 p-5">
        {/* Parent */}
        <div>
         <label htmlFor="parentId" className="mb-2 block text-sm font-medium text-gray-700">
          Parent Collection
         </label>

         <select
          id="parentId"
          value={form.parentId}
          onChange={(event) =>
           setForm((current) => ({
            ...current,
            parentId: event.target.value,
           }))
          }
          disabled={!activeStoreId || categoriesLoading}
          className="h-11 w-full appearance-none rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none transition focus:border-gray-400 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400">
          <option value="">Root Collection</option>

          {categories.map((category) => (
           <option key={category._id} value={category._id}>
            {category.name}
           </option>
          ))}
         </select>

         {categoriesLoading && <p className="mt-1.5 text-[11px] text-gray-400">Loading collections...</p>}

         {!categoriesLoading && activeStoreId && categories.length === 0 && (
          <p className="mt-1.5 text-[11px] text-gray-400">No parent collections available. This will be created as a root collection.</p>
         )}
        </div>

        {/* Sort Order */}
        <div>
         <label htmlFor="sortOrder" className="mb-2 block text-sm font-medium text-gray-700">
          Sort Order
         </label>

         <input
          id="sortOrder"
          type="number"
          min="0"
          step="1"
          value={form.sortOrder}
          onChange={(event) =>
           setForm((current) => ({
            ...current,
            sortOrder: event.target.value,
           }))
          }
          className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none transition focus:border-gray-400"
         />

         <p className="mt-1.5 text-[11px] text-gray-400">Lower numbers appear first.</p>
        </div>
       </div>
      </section>

      {/* Status */}
      <section className="rounded-2xl border border-gray-200 bg-white">
       <div className="border-b border-gray-100 px-5 py-4">
        <h2 className="text-base font-semibold text-gray-900">Status</h2>
       </div>

       <div className="p-5">
        <label className="flex cursor-pointer items-start gap-3">
         <input
          type="checkbox"
          checked={form.isActive}
          onChange={(event) =>
           setForm((current) => ({
            ...current,
            isActive: event.target.checked,
           }))
          }
          className="mt-0.5 h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
         />

         <span>
          <span className="block text-sm font-medium text-gray-700">Active</span>

          <span className="mt-0.5 block text-xs leading-5 text-gray-400">Make this collection available for use.</span>
         </span>
        </label>
       </div>
      </section>

      {/* Save */}
      <button
       type="submit"
       disabled={saving || !activeStoreId}
       className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gray-900 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-300">
       <FaSave size={13} />

       {saving ? "Creating..." : "Create Collection"}
      </button>
     </div>
    </form>
   </div>
  </AdminLayout>
 );
}
