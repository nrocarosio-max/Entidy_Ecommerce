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

 const [uploadingImages, setUploadingImages] = useState(false);
 const [uploadingVideos, setUploadingVideos] = useState(false);
 const [uploadingTryOnImage, setUploadingTryOnImage] = useState(false);
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

 const [images, setImages] = useState<string[]>([]);
 const [tryOnImage, setTryOnImage] = useState("");
 const [videos, setVideos] = useState<string[]>([]);

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

 async function handleImageUpload(event: React.ChangeEvent<HTMLInputElement>) {
  const files = event.target.files;

  if (!files || files.length === 0) {
   return;
  }

  try {
   setUploadingImages(true);
   setError("");

   const uploadedUrls: string[] = [];

   for (const file of Array.from(files)) {
    const formData = new FormData();

    formData.append("file", file);

    const response = await fetch("/api/admin/upload", {
     method: "POST",
     body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
     throw new Error(data?.message || "Failed to upload image.");
    }

    if (data.url) {
     uploadedUrls.push(data.url);
    }
   }

   setImages((current) => [...current, ...uploadedUrls]);
  } catch (err) {
   setError(err instanceof Error ? err.message : "Failed to upload images.");
  } finally {
   setUploadingImages(false);
   event.target.value = "";
  }
 }
 async function handleTryOnImageUpload(event: React.ChangeEvent<HTMLInputElement>) {
  const file = event.target.files?.[0];

  if (!file) {
   return;
  }

  try {
   setUploadingTryOnImage(true);
   setError("");

   const formData = new FormData();

   formData.append("file", file);

   const response = await fetch("/api/admin/upload", {
    method: "POST",
    body: formData,
   });

   const data = await response.json();

   if (!response.ok) {
    throw new Error(data?.message || "Failed to upload try-on image.");
   }

   if (data.resourceType !== "image") {
    throw new Error("Try-on media must be an image.");
   }

   setTryOnImage(data.url || "");
  } catch (err) {
   setError(err instanceof Error ? err.message : "Failed to upload try-on image.");
  } finally {
   setUploadingTryOnImage(false);
   event.target.value = "";
  }
 }

 function removeTryOnImage() {
  setTryOnImage("");
 }
 async function handleVideoUpload(event: React.ChangeEvent<HTMLInputElement>) {
  const files = event.target.files;

  if (!files || files.length === 0) {
   return;
  }

  try {
   setUploadingVideos(true);
   setError("");

   const uploadedUrls: string[] = [];

   for (const file of Array.from(files)) {
    const formData = new FormData();

    formData.append("file", file);

    const response = await fetch("/api/admin/upload", {
     method: "POST",
     body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
     throw new Error(data?.message || "Failed to upload video.");
    }

    if (data.url) {
     uploadedUrls.push(data.url);
    }
   }

   setVideos((current) => [...current, ...uploadedUrls]);
  } catch (err) {
   setError(err instanceof Error ? err.message : "Failed to upload videos.");
  } finally {
   setUploadingVideos(false);
   event.target.value = "";
  }
 }

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

 function removeImage(index: number) {
  setImages((current) => current.filter((_, imageIndex) => imageIndex !== index));
 }

 function removeVideo(index: number) {
  setVideos((current) => current.filter((_, videoIndex) => videoIndex !== index));
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

  if (uploadingImages || uploadingVideos || uploadingTryOnImage) {
   setError("Please wait until all files finish uploading.");
   return;
  }

  try {
   setLoading(true);
   setError("");

   const cleanImages = images.map((image) => image.trim()).filter(Boolean);

   const cleanVideos = videos.map((video) => video.trim()).filter(Boolean);

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
     tryOnImage: tryOnImage.trim(),
     videos: cleanVideos,

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

     {/* Product Images */}
     <section className="rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-100 px-6 py-5">
       <div className="flex items-center justify-between gap-4">
        <div>
         <h2 className="font-semibold text-gray-900">Product Images</h2>

         <p className="mt-1 text-sm text-gray-500">Upload product images to Cloudinary.</p>
        </div>

        <label
         className={`inline-flex h-10 items-center justify-center rounded-xl bg-gray-900 px-4 text-sm font-medium text-white transition ${
          uploadingImages ? "cursor-not-allowed opacity-50" : "cursor-pointer hover:bg-gray-800"
         }`}>
         {uploadingImages ? "Uploading..." : "Upload Images"}

         <input
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
          multiple
          onChange={handleImageUpload}
          disabled={uploadingImages}
          className="hidden"
         />
        </label>
       </div>
      </div>

      <div className="p-6">
       {images.length === 0 ? (
        <div className="flex min-h-40 items-center justify-center rounded-xl border border-dashed border-gray-300 bg-gray-50">
         <div className="text-center">
          <p className="text-sm font-medium text-gray-700">No images uploaded</p>

          <p className="mt-1 text-xs text-gray-500">Upload one or more product images.</p>
         </div>
        </div>
       ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
         {images.map((image, index) => (
          <div key={`${image}-${index}`} className="group relative overflow-hidden rounded-xl border border-gray-200 bg-gray-50">
           <div className="aspect-square">
            <img src={image} alt={`Product image ${index + 1}`} className="h-full w-full object-cover" />
           </div>

           <button
            type="button"
            onClick={() => removeImage(index)}
            className="absolute right-2 top-2 rounded-lg bg-white/90 px-2.5 py-1.5 text-xs font-medium text-red-500 shadow-sm transition hover:bg-white">
            Remove
           </button>

           <div className="border-t border-gray-200 bg-white px-3 py-2">
            <p className="truncate text-xs text-gray-500">Image {index + 1}</p>
           </div>
          </div>
         ))}
        </div>
       )}
      </div>
     </section>
     {/* Virtual Try-On */}
     <section className="rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-100 px-6 py-5">
       <div className="flex items-center justify-between gap-4">
        <div>
         <h2 className="font-semibold text-gray-900">Virtual Try-On</h2>

         <p className="mt-1 text-sm text-gray-500">Upload the image used for virtual try-on.</p>
        </div>

        <label
         className={`inline-flex h-10 items-center justify-center rounded-xl bg-gray-900 px-4 text-sm font-medium text-white transition ${
          uploadingTryOnImage ? "cursor-not-allowed opacity-50" : "cursor-pointer hover:bg-gray-800"
         }`}>
         {uploadingTryOnImage ? "Uploading..." : "Upload Image"}

         <input
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
          onChange={handleTryOnImageUpload}
          disabled={uploadingTryOnImage}
          className="hidden"
         />
        </label>
       </div>
      </div>

      <div className="p-6">
       {!tryOnImage ? (
        <div className="flex min-h-40 items-center justify-center rounded-xl border border-dashed border-gray-300 bg-gray-50">
         <div className="text-center">
          <p className="text-sm font-medium text-gray-700">No try-on image uploaded</p>

          <p className="mt-1 text-xs text-gray-500">Upload one image for virtual try-on.</p>
         </div>
        </div>
       ) : (
        <div className="max-w-sm overflow-hidden rounded-xl border border-gray-200 bg-gray-50">
         <div className="aspect-square">
          <img src={tryOnImage} alt="Virtual try-on" className="h-full w-full object-cover" />
         </div>

         <div className="flex items-center justify-between border-t border-gray-200 bg-white px-3 py-3">
          <p className="truncate text-xs text-gray-500">Try-on image</p>

          <button type="button" onClick={removeTryOnImage} className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-red-500 transition hover:bg-red-50">
           Remove
          </button>
         </div>
        </div>
       )}
      </div>
     </section>
     {/* Product Videos */}
     <section className="rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-100 px-6 py-5">
       <div className="flex items-center justify-between gap-4">
        <div>
         <h2 className="font-semibold text-gray-900">Product Videos</h2>

         <p className="mt-1 text-sm text-gray-500">Upload product videos to Cloudinary.</p>
        </div>

        <label
         className={`inline-flex h-10 items-center justify-center rounded-xl bg-gray-900 px-4 text-sm font-medium text-white transition ${
          uploadingVideos ? "cursor-not-allowed opacity-50" : "cursor-pointer hover:bg-gray-800"
         }`}>
         {uploadingVideos ? "Uploading..." : "Upload Videos"}

         <input
          type="file"
          accept="video/mp4,video/webm,video/quicktime,video/x-msvideo"
          multiple
          onChange={handleVideoUpload}
          disabled={uploadingVideos}
          className="hidden"
         />
        </label>
       </div>
      </div>

      <div className="p-6">
       {videos.length === 0 ? (
        <div className="flex min-h-40 items-center justify-center rounded-xl border border-dashed border-gray-300 bg-gray-50">
         <div className="text-center">
          <p className="text-sm font-medium text-gray-700">No videos uploaded</p>

          <p className="mt-1 text-xs text-gray-500">Upload one or more product videos.</p>
         </div>
        </div>
       ) : (
        <div className="grid gap-4 md:grid-cols-2">
         {videos.map((video, index) => (
          <div key={`${video}-${index}`} className="group relative overflow-hidden rounded-xl border border-gray-200 bg-gray-50">
           <div className="aspect-video bg-black">
            <video src={video} controls preload="metadata" className="h-full w-full object-contain" />
           </div>

           <button
            type="button"
            onClick={() => removeVideo(index)}
            className="absolute right-2 top-2 rounded-lg bg-white/90 px-2.5 py-1.5 text-xs font-medium text-red-500 shadow-sm transition hover:bg-white">
            Remove
           </button>

           <div className="border-t border-gray-200 bg-white px-3 py-2">
            <p className="truncate text-xs text-gray-500">Video {index + 1}</p>
           </div>
          </div>
         ))}
        </div>
       )}
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
       disabled={loading || storesLoading || dependenciesLoading || uploadingImages || uploadingVideos || uploadingTryOnImage}
       className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-gray-900 px-6 text-sm font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50">
       <FaSave size={14} />

       {loading ? "Creating..." : uploadingImages || uploadingVideos || uploadingTryOnImage ? "Uploading..." : "Create Product"}
      </button>
     </div>
    </div>
   </form>
  </div>
 );
}

CreateProductPage.Layout = "Admin";
