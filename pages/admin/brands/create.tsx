import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";
import { FaArrowLeft, FaSave, FaStore } from "react-icons/fa";

interface Store {
 _id: string;
 name: string;
 slug: string;
}

export default function CreateBrandPage() {
 const router = useRouter();
 const { data: session, status } = useSession();

 const [stores, setStores] = useState<Store[]>([]);
 const [selectedStore, setSelectedStore] = useState("");

 const [name, setName] = useState("");
 const [slug, setSlug] = useState("");
 const [description, setDescription] = useState("");
 const [logo, setLogo] = useState("");
 const [isActive, setIsActive] = useState(true);

 const [loading, setLoading] = useState(false);
 const [storesLoading, setStoresLoading] = useState(false);
 const [error, setError] = useState("");

 const userRole = session?.user?.role;

 useEffect(() => {
  if (status !== "authenticated") return;

  if (userRole === "SUPER_ADMIN") {
   loadStores();
   return;
  }

  if (session?.user?.storeId) {
   setSelectedStore(session.user.storeId);
  }
 }, [status, userRole, session?.user?.storeId]);

 async function loadStores() {
  try {
   setStoresLoading(true);
   setError("");

   const response = await fetch("/api/admin/stores");

   const data = await response.json();

   if (!response.ok) {
    throw new Error(data?.message || "Failed to load stores.");
   }

   setStores(data.stores || []);

   if (data.stores?.length > 0) {
    setSelectedStore(data.stores[0]._id);
   }
  } catch (err) {
   setError(err instanceof Error ? err.message : "Failed to load stores.");
  } finally {
   setStoresLoading(false);
  }
 }

 function generateSlug(value: string) {
  return value
   .normalize("NFD")
   .replace(/[\u0300-\u036f]/g, "")
   .toLowerCase()
   .trim()
   .replace(/[^a-z0-9]+/g, "-")
   .replace(/^-+|-+$/g, "");
 }

 function handleNameChange(value: string) {
  setName(value);

  if (!slug || slug === generateSlug(name)) {
   setSlug(generateSlug(value));
  }
 }

 async function handleSubmit(event: FormEvent<HTMLFormElement>) {
  event.preventDefault();

  if (!selectedStore) {
   setError("Please select a store.");
   return;
  }

  if (!name.trim()) {
   setError("Brand name is required.");
   return;
  }

  if (!slug.trim()) {
   setError("Brand slug is required.");
   return;
  }

  try {
   setLoading(true);
   setError("");

   const response = await fetch("/api/admin/brands", {
    method: "POST",
    headers: {
     "Content-Type": "application/json",
    },
    body: JSON.stringify({
     storeId: selectedStore,
     name: name.trim(),
     slug: slug.trim(),
     description: description.trim(),
     logo: logo.trim(),
     isActive,
    }),
   });

   const data = await response.json();

   if (!response.ok) {
    throw new Error(data?.message || "Failed to create brand.");
   }

   router.push("/admin/brands");
  } catch (err) {
   setError(err instanceof Error ? err.message : "Failed to create brand.");
  } finally {
   setLoading(false);
  }
 }

 if (status === "loading") {
  return (
   <div className="flex min-h-[60vh] items-center justify-center">
    <div className="text-sm text-gray-500">Loading...</div>
   </div>
  );
 }

 return (
  <div className="mx-auto max-w-4xl">
   <div className="mb-6">
    <Link href="/admin/brands" className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-gray-500 transition hover:text-gray-900">
     <FaArrowLeft size={13} />
     Back to Brands
    </Link>

    <div>
     <h1 className="text-2xl font-bold tracking-tight text-gray-900 md:text-3xl">Create Brand</h1>

     <p className="mt-1 text-sm text-gray-500">Add a new brand to your store.</p>
    </div>
   </div>

   {error && <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>}

   <form onSubmit={handleSubmit}>
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
     <div className="border-b border-gray-100 px-6 py-5">
      <h2 className="font-semibold text-gray-900">Brand Information</h2>

      <p className="mt-1 text-sm text-gray-500">Enter the basic information for this brand.</p>
     </div>

     <div className="space-y-6 p-6">
      {userRole === "SUPER_ADMIN" && (
       <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">Store</label>

        <div className="relative">
         <FaStore className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400" />

         <select
          value={selectedStore}
          onChange={(event) => setSelectedStore(event.target.value)}
          disabled={storesLoading}
          className="h-11 w-full appearance-none rounded-xl border border-gray-200 bg-white pl-10 pr-4 text-sm text-gray-700 outline-none transition focus:border-gray-400 disabled:cursor-not-allowed disabled:bg-gray-50">
          <option value="">{storesLoading ? "Loading stores..." : "Select store"}</option>

          {stores.map((store) => (
           <option key={store._id} value={store._id}>
            {store.name}
           </option>
          ))}
         </select>
        </div>
       </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
       <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">Brand Name</label>

        <input
         type="text"
         value={name}
         onChange={(event) => handleNameChange(event.target.value)}
         placeholder="e.g. Adidas"
         className="h-11 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm text-gray-700 outline-none transition placeholder:text-gray-400 focus:border-gray-400"
        />
       </div>

       <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">Slug</label>

        <input
         type="text"
         value={slug}
         onChange={(event) => setSlug(event.target.value)}
         placeholder="e.g. adidas"
         className="h-11 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm text-gray-700 outline-none transition placeholder:text-gray-400 focus:border-gray-400"
        />

        <p className="mt-1.5 text-xs text-gray-400">Used in URLs and internal references.</p>
       </div>
      </div>

      <div>
       <label className="mb-2 block text-sm font-medium text-gray-700">Description</label>

       <textarea
        value={description}
        onChange={(event) => setDescription(event.target.value)}
        placeholder="Enter brand description..."
        rows={5}
        className="w-full resize-none rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 outline-none transition placeholder:text-gray-400 focus:border-gray-400"
       />
      </div>

      <div>
       <label className="mb-2 block text-sm font-medium text-gray-700">Logo URL</label>

       <input
        type="url"
        value={logo}
        onChange={(event) => setLogo(event.target.value)}
        placeholder="https://example.com/logo.png"
        className="h-11 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm text-gray-700 outline-none transition placeholder:text-gray-400 focus:border-gray-400"
       />

       {logo && (
        <div className="mt-3 flex h-24 w-24 items-center justify-center overflow-hidden rounded-xl border border-gray-200 bg-gray-50">
         <img src={logo} alt="Brand logo preview" className="max-h-full max-w-full object-contain" />
        </div>
       )}
      </div>

      <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
       <label className="flex cursor-pointer items-center justify-between gap-4">
        <div>
         <div className="text-sm font-medium text-gray-900">Active Brand</div>

         <p className="mt-1 text-xs text-gray-500">Active brands can be selected when creating products.</p>
        </div>

        <input
         type="checkbox"
         checked={isActive}
         onChange={(event) => setIsActive(event.target.checked)}
         className="h-5 w-5 rounded border-gray-300 text-gray-900 focus:ring-gray-400"
        />
       </label>
      </div>
     </div>

     <div className="flex items-center justify-end gap-3 border-t border-gray-100 px-6 py-5">
      <Link
       href="/admin/brands"
       className="inline-flex h-11 items-center justify-center rounded-xl border border-gray-200 bg-white px-5 text-sm font-medium text-gray-700 transition hover:bg-gray-50">
       Cancel
      </Link>

      <button
       type="submit"
       disabled={loading || storesLoading}
       className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-gray-900 px-5 text-sm font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50">
       <FaSave size={14} />

       {loading ? "Creating..." : "Create Brand"}
      </button>
     </div>
    </div>
   </form>
  </div>
 );
}

CreateBrandPage.Layout = "Admin";
