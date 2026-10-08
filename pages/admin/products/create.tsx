import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";
import { FaArrowLeft, FaBoxOpen, FaSave, FaStore } from "react-icons/fa";

interface Store {
 _id: string;
 name: string;
 slug: string;
}

interface Collection {
 _id: string;
 name: string;
}

interface Brand {
 _id: string;
 name: string;
}

export default function CreateProductPage() {
 const router = useRouter();
 const { data: session, status: sessionStatus } = useSession();

 const [stores, setStores] = useState<Store[]>([]);
 const [collections, setCollections] = useState<Collection[]>([]);
 const [brands, setBrands] = useState<Brand[]>([]);

 const [selectedStore, setSelectedStore] = useState("");

 const [name, setName] = useState("");
 const [slug, setSlug] = useState("");
 const [sku, setSku] = useState("");
 const [description, setDescription] = useState("");

 const [categoryId, setCategoryId] = useState("");
 const [brandId, setBrandId] = useState("");

 const [price, setPrice] = useState("");
 const [compareAtPrice, setCompareAtPrice] = useState("");
 const [costPrice, setCostPrice] = useState("");
 const [currency, setCurrency] = useState("VND");

 const [images, setImages] = useState<string[]>([""]);

 const [quantity, setQuantity] = useState("0");
 const [lowStockThreshold, setLowStockThreshold] = useState("5");

 const [productStatus, setProductStatus] = useState<"DRAFT" | "ACTIVE" | "INACTIVE" | "OUT_OF_STOCK">("DRAFT");

 const [isFeatured, setIsFeatured] = useState(false);
 const [isActive, setIsActive] = useState(true);

 const [loading, setLoading] = useState(false);
 const [storesLoading, setStoresLoading] = useState(false);
 const [dependenciesLoading, setDependenciesLoading] = useState(false);

 const [error, setError] = useState("");

 const userRole = session?.user?.role;
 const isSuperAdmin = userRole === "SUPER_ADMIN";

 useEffect(() => {
  if (sessionStatus !== "authenticated") return;

  if (isSuperAdmin) {
   loadStores();
  } else if (session?.user?.storeId) {
   setSelectedStore(session.user.storeId);
  }
 }, [sessionStatus, isSuperAdmin, session?.user?.storeId]);

 useEffect(() => {
  if (!selectedStore) {
   setCollections([]);
   setBrands([]);
   return;
  }

  loadDependencies();
 }, [selectedStore]);

 async function loadStores() {
  try {
   setStoresLoading(true);
   setError("");

   const response = await fetch("/api/admin/stores");
   const data = await response.json();

   if (!response.ok) {
    throw new Error(data?.message || "Failed to load stores.");
   }

   const storeList = data.stores || [];

   setStores(storeList);

   if (storeList.length > 0) {
    setSelectedStore(storeList[0]._id);
   }
  } catch (err) {
   setError(err instanceof Error ? err.message : "Failed to load stores.");
  } finally {
   setStoresLoading(false);
  }
 }

 async function loadDependencies() {
  try {
   setDependenciesLoading(true);
   setError("");

   const [collectionsResponse, brandsResponse] = await Promise.all([
    fetch(`/api/admin/categories?storeId=${encodeURIComponent(selectedStore)}&limit=1000`),
    fetch(`/api/admin/brands?storeId=${encodeURIComponent(selectedStore)}&limit=1000&isActive=true`),
   ]);

   const collectionsData = await collectionsResponse.json();

   const brandsData = await brandsResponse.json();

   if (!collectionsResponse.ok) {
    throw new Error(collectionsData?.message || "Failed to load collections.");
   }

   if (!brandsResponse.ok) {
    throw new Error(brandsData?.message || "Failed to load brands.");
   }

   setCollections(collectionsData.categories || collectionsData.collections || []);

   setBrands(brandsData.brands || []);
  } catch (err) {
   setError(err instanceof Error ? err.message : "Failed to load product options.");
  } finally {
   setDependenciesLoading(false);
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

 function updateImage(index: number, value: string) {
  setImages((current) => current.map((image, imageIndex) => (imageIndex === index ? value : image)));
 }

 function addImage() {
  setImages((current) => [...current, ""]);
 }

 function removeImage(index: number) {
  setImages((current) => {
   const next = current.filter((_, imageIndex) => imageIndex !== index);

   return next.length > 0 ? next : [""];
  });
 }

 async function handleSubmit(event: FormEvent<HTMLFormElement>) {
  event.preventDefault();

  if (!selectedStore) {
   setError("Please select a store.");
   return;
  }

  if (!name.trim()) {
   setError("Product name is required.");
   return;
  }

  if (!slug.trim()) {
   setError("Product slug is required.");
   return;
  }

  if (!sku.trim()) {
   setError("SKU is required.");
   return;
  }

  if (!price || Number(price) < 0) {
   setError("Please enter a valid price.");
   return;
  }

  if (!currency.trim()) {
   setError("Currency is required.");
   return;
  }

  if (Number(quantity) < 0) {
   setError("Quantity cannot be negative.");
   return;
  }

  if (Number(lowStockThreshold) < 0) {
   setError("Low stock threshold cannot be negative.");
   return;
  }

  try {
   setLoading(true);
   setError("");

   const cleanImages = images.map((image) => image.trim()).filter(Boolean);

   const response = await fetch("/api/admin/products", {
    method: "POST",
    headers: {
     "Content-Type": "application/json",
    },
    body: JSON.stringify({
     storeId: selectedStore,
     name: name.trim(),
     slug: slug.trim(),
     sku: sku.trim().toUpperCase(),
     description: description.trim(),
     categoryId: categoryId || null,
     brandId: brandId || null,
     price: Number(price),
     compareAtPrice: compareAtPrice.trim() === "" ? null : Number(compareAtPrice),
     costPrice: costPrice.trim() === "" ? null : Number(costPrice),
     currency: currency.trim().toUpperCase(),
     images: cleanImages,
     quantity: Number(quantity),
     lowStockThreshold: Number(lowStockThreshold),
     status: productStatus,
     isFeatured,
     isActive,
    }),
   });

   const data = await response.json();

   if (!response.ok) {
    throw new Error(data?.message || "Failed to create product.");
   }

   router.push("/admin/products");
  } catch (err) {
   setError(err instanceof Error ? err.message : "Failed to create product.");
  } finally {
   setLoading(false);
  }
 }

 if (sessionStatus === "loading") {
  return (
   <div className="flex min-h-[60vh] items-center justify-center">
    <div className="text-sm text-gray-500">Loading...</div>
   </div>
  );
 }

 return (
  <div className="mx-auto max-w-5xl">
   {/* Header */}
   <div className="mb-6">
    <Link href="/admin/products" className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-gray-500 transition hover:text-gray-900">
     <FaArrowLeft size={13} />
     Back to Products
    </Link>

    <div className="flex items-center gap-3">
     <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gray-900 text-white">
      <FaBoxOpen />
     </div>

     <div>
      <h1 className="text-2xl font-bold tracking-tight text-gray-900 md:text-3xl">Create Product</h1>

      <p className="mt-1 text-sm text-gray-500">Add a new product to your store.</p>
     </div>
    </div>
   </div>

   {error && <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>}

   <form onSubmit={handleSubmit}>
    <div className="space-y-6">
     {/* Store */}
     {isSuperAdmin && (
      <section className="rounded-2xl border border-gray-200 bg-white shadow-sm">
       <div className="border-b border-gray-100 px-6 py-5">
        <h2 className="font-semibold text-gray-900">Store</h2>
       </div>

       <div className="p-6">
        <label className="mb-2 block text-sm font-medium text-gray-700">Store</label>

        <div className="relative max-w-md">
         <FaStore className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400" />

         <select
          value={selectedStore}
          onChange={(event) => setSelectedStore(event.target.value)}
          disabled={storesLoading}
          className="h-11 w-full rounded-xl border border-gray-200 bg-white pl-10 pr-4 text-sm text-gray-700 outline-none focus:border-gray-400 disabled:bg-gray-50">
          <option value="">{storesLoading ? "Loading stores..." : "Select store"}</option>

          {stores.map((store) => (
           <option key={store._id} value={store._id}>
            {store.name}
           </option>
          ))}
         </select>
        </div>
       </div>
      </section>
     )}

     {/* Basic information */}
     <section className="rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-100 px-6 py-5">
       <h2 className="font-semibold text-gray-900">Basic Information</h2>

       <p className="mt-1 text-sm text-gray-500">Enter the main information for this product.</p>
      </div>

      <div className="space-y-6 p-6">
       <div className="grid gap-6 md:grid-cols-2">
        <div>
         <label className="mb-2 block text-sm font-medium text-gray-700">Product Name</label>

         <input
          type="text"
          value={name}
          onChange={(event) => handleNameChange(event.target.value)}
          placeholder="e.g. Adidas Ultraboost"
          className="h-11 w-full rounded-xl border border-gray-200 px-4 text-sm outline-none focus:border-gray-400"
         />
        </div>

        <div>
         <label className="mb-2 block text-sm font-medium text-gray-700">SKU</label>

         <input
          type="text"
          value={sku}
          onChange={(event) => setSku(event.target.value)}
          placeholder="e.g. ADI-UB-001"
          className="h-11 w-full rounded-xl border border-gray-200 px-4 text-sm uppercase outline-none focus:border-gray-400"
         />
        </div>
       </div>

       <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">Slug</label>

        <input
         type="text"
         value={slug}
         onChange={(event) => setSlug(event.target.value)}
         placeholder="adidas-ultraboost"
         className="h-11 w-full rounded-xl border border-gray-200 px-4 text-sm outline-none focus:border-gray-400"
        />
       </div>

       <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">Description</label>

        <textarea
         value={description}
         onChange={(event) => setDescription(event.target.value)}
         rows={5}
         placeholder="Enter product description..."
         className="w-full resize-none rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-gray-400"
        />
       </div>

       <div className="grid gap-6 md:grid-cols-2">
        <div>
         <label className="mb-2 block text-sm font-medium text-gray-700">Collection</label>

         <select
          value={categoryId}
          onChange={(event) => setCategoryId(event.target.value)}
          disabled={dependenciesLoading || !selectedStore}
          className="h-11 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm text-gray-700 outline-none focus:border-gray-400 disabled:bg-gray-50">
          <option value="">{dependenciesLoading ? "Loading..." : "Select collection"}</option>

          {collections.map((collection) => (
           <option key={collection._id} value={collection._id}>
            {collection.name}
           </option>
          ))}
         </select>
        </div>

        <div>
         <label className="mb-2 block text-sm font-medium text-gray-700">Brand</label>

         <select
          value={brandId}
          onChange={(event) => setBrandId(event.target.value)}
          disabled={dependenciesLoading || !selectedStore}
          className="h-11 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm text-gray-700 outline-none focus:border-gray-400 disabled:bg-gray-50">
          <option value="">{dependenciesLoading ? "Loading..." : "Select brand"}</option>

          {brands.map((brand) => (
           <option key={brand._id} value={brand._id}>
            {brand.name}
           </option>
          ))}
         </select>
        </div>
       </div>
      </div>
     </section>

     {/* Pricing */}
     <section className="rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-100 px-6 py-5">
       <h2 className="font-semibold text-gray-900">Pricing</h2>

       <p className="mt-1 text-sm text-gray-500">Set the selling price and optional comparison prices.</p>
      </div>

      <div className="grid gap-6 p-6 md:grid-cols-2 lg:grid-cols-4">
       <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">Price</label>

        <input
         type="number"
         min="0"
         step="0.01"
         value={price}
         onChange={(event) => setPrice(event.target.value)}
         placeholder="0"
         className="h-11 w-full rounded-xl border border-gray-200 px-4 text-sm outline-none focus:border-gray-400"
        />
       </div>

       <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">Compare At Price</label>

        <input
         type="number"
         min="0"
         step="0.01"
         value={compareAtPrice}
         onChange={(event) => setCompareAtPrice(event.target.value)}
         placeholder="Optional"
         className="h-11 w-full rounded-xl border border-gray-200 px-4 text-sm outline-none focus:border-gray-400"
        />
       </div>

       <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">Cost Price</label>

        <input
         type="number"
         min="0"
         step="0.01"
         value={costPrice}
         onChange={(event) => setCostPrice(event.target.value)}
         placeholder="Optional"
         className="h-11 w-full rounded-xl border border-gray-200 px-4 text-sm outline-none focus:border-gray-400"
        />
       </div>

       <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">Currency</label>

        <input
         type="text"
         value={currency}
         onChange={(event) => setCurrency(event.target.value.toUpperCase())}
         maxLength={3}
         placeholder="VND"
         className="h-11 w-full rounded-xl border border-gray-200 px-4 text-sm uppercase outline-none focus:border-gray-400"
        />
       </div>
      </div>
     </section>

     {/* Inventory */}
     <section className="rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-100 px-6 py-5">
       <h2 className="font-semibold text-gray-900">Inventory</h2>

       <p className="mt-1 text-sm text-gray-500">Set the initial stock quantity and low stock threshold.</p>
      </div>

      <div className="grid gap-6 p-6 md:grid-cols-2">
       <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">Quantity</label>

        <input
         type="number"
         min="0"
         step="1"
         value={quantity}
         onChange={(event) => setQuantity(event.target.value)}
         className="h-11 w-full rounded-xl border border-gray-200 px-4 text-sm outline-none focus:border-gray-400"
        />
       </div>

       <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">Low Stock Threshold</label>

        <input
         type="number"
         min="0"
         step="1"
         value={lowStockThreshold}
         onChange={(event) => setLowStockThreshold(event.target.value)}
         className="h-11 w-full rounded-xl border border-gray-200 px-4 text-sm outline-none focus:border-gray-400"
        />
       </div>
      </div>
     </section>

     {/* Images */}
     <section className="rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-100 px-6 py-5">
       <div className="flex items-center justify-between gap-4">
        <div>
         <h2 className="font-semibold text-gray-900">Product Images</h2>

         <p className="mt-1 text-sm text-gray-500">Add image URLs for this product.</p>
        </div>

        <button
         type="button"
         onClick={addImage}
         className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50">
         Add Image
        </button>
       </div>
      </div>

      <div className="space-y-3 p-6">
       {images.map((image, index) => (
        <div key={index} className="flex gap-3">
         <input
          type="url"
          value={image}
          onChange={(event) => updateImage(index, event.target.value)}
          placeholder={`Image URL ${index + 1}`}
          className="h-11 min-w-0 flex-1 rounded-xl border border-gray-200 px-4 text-sm outline-none focus:border-gray-400"
         />

         {images.length > 1 && (
          <button
           type="button"
           onClick={() => removeImage(index)}
           className="h-11 rounded-xl border border-red-100 px-4 text-sm font-medium text-red-500 hover:bg-red-50">
           Remove
          </button>
         )}
        </div>
       ))}
      </div>
     </section>

     {/* Status */}
     <section className="rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-100 px-6 py-5">
       <h2 className="font-semibold text-gray-900">Product Status</h2>
      </div>

      <div className="space-y-5 p-6">
       <div className="max-w-md">
        <label className="mb-2 block text-sm font-medium text-gray-700">Status</label>

        <select
         value={productStatus}
         onChange={(event) => setProductStatus(event.target.value as "DRAFT" | "ACTIVE" | "INACTIVE" | "OUT_OF_STOCK")}
         className="h-11 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm text-gray-700 outline-none focus:border-gray-400">
         <option value="DRAFT">Draft</option>
         <option value="ACTIVE">Active</option>
         <option value="INACTIVE">Inactive</option>
         <option value="OUT_OF_STOCK">Out of stock</option>
        </select>
       </div>

       <div className="grid gap-3 md:grid-cols-2">
        <label className="flex cursor-pointer items-center justify-between rounded-xl border border-gray-200 bg-gray-50 p-4">
         <div>
          <div className="text-sm font-medium text-gray-900">Featured Product</div>

          <div className="mt-1 text-xs text-gray-500">Show this product as featured.</div>
         </div>

         <input
          type="checkbox"
          checked={isFeatured}
          onChange={(event) => setIsFeatured(event.target.checked)}
          className="h-5 w-5 rounded border-gray-300 text-gray-900 focus:ring-gray-400"
         />
        </label>

        <label className="flex cursor-pointer items-center justify-between rounded-xl border border-gray-200 bg-gray-50 p-4">
         <div>
          <div className="text-sm font-medium text-gray-900">Active Product</div>

          <div className="mt-1 text-xs text-gray-500">Allow this product to be used normally.</div>
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
     </section>

     {/* Actions */}
     <div className="flex items-center justify-end gap-3 pb-6">
      <Link
       href="/admin/products"
       className="inline-flex h-11 items-center justify-center rounded-xl border border-gray-200 bg-white px-5 text-sm font-medium text-gray-700 transition hover:bg-gray-50">
       Cancel
      </Link>

      <button
       type="submit"
       disabled={loading || storesLoading || dependenciesLoading}
       className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-gray-900 px-6 text-sm font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50">
       <FaSave size={14} />

       {loading ? "Creating..." : "Create Product"}
      </button>
     </div>
    </div>
   </form>
  </div>
 );
}

CreateProductPage.Layout = "Admin";
