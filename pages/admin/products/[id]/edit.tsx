import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { FaArrowLeft, FaSave, FaCloudUploadAlt, FaTrash } from "react-icons/fa";

interface Category {
 _id: string;
 name: string;
}

interface Brand {
 _id: string;
 name: string;
}

interface Product {
 _id: string;
 storeId: string;
 name: string;
 slug: string;
 sku: string;
 description: string;
 categoryId: string | null;
 brandId: string | null;
 price: number;
 compareAtPrice: number | null;
 costPrice: number | null;
 currency: string;
 images: string[];
 tryOnImage: string;
 videos: string[];
 quantity: number;
 lowStockThreshold: number;
 status: string;
 isFeatured: boolean;
 isActive: boolean;
}

export default function EditProductPage() {
 const router = useRouter();

 const { id } = router.query;

 const [product, setProduct] = useState<Product | null>(null);
 const [tryOnImage, setTryOnImage] = useState("");
 const [categories, setCategories] = useState<Category[]>([]);

 const [brands, setBrands] = useState<Brand[]>([]);

 const [loading, setLoading] = useState(true);
 const [saving, setSaving] = useState(false);

 const [uploadingImages, setUploadingImages] = useState(false);
 const [uploadingVideos, setUploadingVideos] = useState(false);
 const [uploadingTryOnImage, setUploadingTryOnImage] = useState(false);
 const [error, setError] = useState("");

 const [form, setForm] = useState({
  name: "",
  slug: "",
  sku: "",
  description: "",
  categoryId: "",
  brandId: "",
  price: "",
  compareAtPrice: "",
  costPrice: "",
  currency: "VND",
  images: [] as string[],
  videos: [] as string[],
  quantity: "",
  lowStockThreshold: "5",
  status: "DRAFT",
  isFeatured: false,
  isActive: true,
 });

 useEffect(() => {
  if (!router.isReady || !id) return;

  loadData();
 }, [router.isReady, id]);

 async function loadData() {
  try {
   setLoading(true);
   setError("");

   const productResponse = await fetch(`/api/admin/products/${id}`);

   const productData = await productResponse.json();

   if (!productResponse.ok) {
    throw new Error(productData?.message || "Failed to load product.");
   }

   const currentProduct = productData.product;

   setProduct(currentProduct);
   setTryOnImage(currentProduct.tryOnImage || "");
   setForm({
    name: currentProduct.name || "",
    slug: currentProduct.slug || "",
    sku: currentProduct.sku || "",
    description: currentProduct.description || "",

    categoryId: currentProduct.categoryId?._id || currentProduct.categoryId || "",

    brandId: currentProduct.brandId?._id || currentProduct.brandId || "",

    price: String(currentProduct.price ?? ""),

    compareAtPrice: currentProduct.compareAtPrice !== null && currentProduct.compareAtPrice !== undefined ? String(currentProduct.compareAtPrice) : "",

    costPrice: currentProduct.costPrice !== null && currentProduct.costPrice !== undefined ? String(currentProduct.costPrice) : "",

    currency: currentProduct.currency || "VND",

    images: Array.isArray(currentProduct.images) ? currentProduct.images : [],

    videos: Array.isArray(currentProduct.videos) ? currentProduct.videos : [],

    quantity: String(currentProduct.quantity ?? 0),

    lowStockThreshold: String(currentProduct.lowStockThreshold ?? 5),

    status: currentProduct.status || "DRAFT",

    isFeatured: currentProduct.isFeatured ?? false,

    isActive: currentProduct.isActive ?? true,
   });

   const storeId = currentProduct.storeId?._id || currentProduct.storeId;

   if (!storeId) {
    throw new Error("Product store was not found.");
   }

   const [categoriesResponse, brandsResponse] = await Promise.all([
    fetch(`/api/admin/categories?storeId=${encodeURIComponent(storeId)}&limit=100`),
    fetch(`/api/admin/brands?storeId=${encodeURIComponent(storeId)}&limit=100`),
   ]);

   const categoriesData = await categoriesResponse.json();

   const brandsData = await brandsResponse.json();

   if (!categoriesResponse.ok) {
    throw new Error(categoriesData?.message || "Failed to load categories.");
   }

   if (!brandsResponse.ok) {
    throw new Error(brandsData?.message || "Failed to load brands.");
   }

   setCategories(categoriesData.categories || []);

   setBrands(brandsData.brands || []);
  } catch (error) {
   setError(error instanceof Error ? error.message : "Failed to load product.");
  } finally {
   setLoading(false);
  }
 }

 function updateField(field: string, value: string | boolean | string[]) {
  setForm((current) => ({
   ...current,
   [field]: value,
  }));
 }

 async function uploadFiles(files: FileList | null, type: "image" | "video") {
  if (!files || files.length === 0) {
   return;
  }

  try {
   if (type === "image") {
    setUploadingImages(true);
   } else {
    setUploadingVideos(true);
   }

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

    if (!response.ok || !data?.url) {
     throw new Error(data?.message || `Failed to upload ${type}.`);
    }

    if (type === "image" && data.resourceType !== "image") {
     throw new Error("The uploaded file is not a valid image.");
    }

    if (type === "video" && data.resourceType !== "video") {
     throw new Error("The uploaded file is not a valid video.");
    }

    uploadedUrls.push(data.url);
   }

   if (type === "image") {
    setForm((current) => ({
     ...current,
     images: [...current.images, ...uploadedUrls],
    }));
   } else {
    setForm((current) => ({
     ...current,
     videos: [...current.videos, ...uploadedUrls],
    }));
   }
  } catch (error) {
   setError(error instanceof Error ? error.message : `Failed to upload ${type}.`);
  } finally {
   if (type === "image") {
    setUploadingImages(false);
   } else {
    setUploadingVideos(false);
   }
  }
 }
 async function uploadTryOnImage(file: File | null) {
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

   if (!response.ok || !data?.url) {
    throw new Error(data?.message || "Failed to upload Try-On image.");
   }

   if (data.resourceType !== "image") {
    throw new Error("The uploaded Try-On file is not a valid image.");
   }

   setTryOnImage(data.url);
  } catch (error) {
   setError(error instanceof Error ? error.message : "Failed to upload Try-On image.");
  } finally {
   setUploadingTryOnImage(false);
  }
 }
 function removeTryOnImage() {
  setTryOnImage("");
 }
 function removeImage(index: number) {
  setForm((current) => ({
   ...current,
   images: current.images.filter((_, imageIndex) => imageIndex !== index),
  }));
 }

 function removeVideo(index: number) {
  setForm((current) => ({
   ...current,
   videos: current.videos.filter((_, videoIndex) => videoIndex !== index),
  }));
 }

 async function handleSubmit(event: FormEvent<HTMLFormElement>) {
  event.preventDefault();

  if (!product) return;

  try {
   setSaving(true);
   setError("");

   const response = await fetch(`/api/admin/products/${product._id}`, {
    method: "PATCH",
    headers: {
     "Content-Type": "application/json",
    },
    body: JSON.stringify({
     storeId: product.storeId,

     name: form.name.trim(),

     slug: form.slug.trim(),

     sku: form.sku.trim(),

     description: form.description.trim(),

     categoryId: form.categoryId || null,

     brandId: form.brandId || null,

     price: Number(form.price),

     compareAtPrice: form.compareAtPrice === "" ? null : Number(form.compareAtPrice),

     costPrice: form.costPrice === "" ? null : Number(form.costPrice),

     currency: form.currency.trim().toUpperCase(),

     images: form.images,
     tryOnImage: tryOnImage,
     videos: form.videos,

     quantity: Number(form.quantity),

     lowStockThreshold: Number(form.lowStockThreshold),

     status: form.status,

     isFeatured: form.isFeatured,

     isActive: form.isActive,
    }),
   });

   const data = await response.json();

   if (!response.ok) {
    throw new Error(data?.message || "Failed to update product.");
   }

   router.push("/admin/products");
  } catch (error) {
   setError(error instanceof Error ? error.message : "Failed to update product.");
  } finally {
   setSaving(false);
  }
 }

 if (loading) {
  return <div className="flex min-h-[60vh] items-center justify-center text-sm text-gray-500">Loading product...</div>;
 }

 if (!product) {
  return <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-600">{error || "Product not found."}</div>;
 }

 return (
  <div>
   <div className="mb-6 flex items-center gap-4">
    <Link
     href="/admin/products"
     className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-600 transition hover:bg-gray-50">
     <FaArrowLeft size={14} />
    </Link>

    <div>
     <div className="text-sm text-gray-500">Admin / Products / Edit</div>

     <h1 className="mt-1 text-3xl font-bold text-gray-900">Edit Product</h1>
    </div>
   </div>

   {error && <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>}

   <form onSubmit={handleSubmit} className="space-y-6">
    {/* =====================================================
            BASIC INFORMATION
        ====================================================== */}

    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
     <h2 className="mb-5 text-lg font-semibold text-gray-900">Basic Information</h2>

     <div className="grid gap-5 md:grid-cols-2">
      <div className="md:col-span-2">
       <label className="mb-2 block text-sm font-medium text-gray-700">Product Name</label>

       <input
        value={form.name}
        onChange={(event) => updateField("name", event.target.value)}
        required
        className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-gray-400"
       />
      </div>

      <div>
       <label className="mb-2 block text-sm font-medium text-gray-700">Slug</label>

       <input
        value={form.slug}
        onChange={(event) => updateField("slug", event.target.value)}
        required
        className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-gray-400"
       />
      </div>

      <div>
       <label className="mb-2 block text-sm font-medium text-gray-700">SKU</label>

       <input
        value={form.sku}
        onChange={(event) => updateField("sku", event.target.value)}
        required
        className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm uppercase outline-none focus:border-gray-400"
       />
      </div>

      <div>
       <label className="mb-2 block text-sm font-medium text-gray-700">Collection</label>

       <select
        value={form.categoryId}
        onChange={(event) => updateField("categoryId", event.target.value)}
        className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-gray-400">
        <option value="">No collection</option>

        {categories.map((category) => (
         <option key={category._id} value={category._id}>
          {category.name}
         </option>
        ))}
       </select>
      </div>

      <div>
       <label className="mb-2 block text-sm font-medium text-gray-700">Brand</label>

       <select
        value={form.brandId}
        onChange={(event) => updateField("brandId", event.target.value)}
        className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-gray-400">
        <option value="">No brand</option>

        {brands.map((brand) => (
         <option key={brand._id} value={brand._id}>
          {brand.name}
         </option>
        ))}
       </select>
      </div>

      <div className="md:col-span-2">
       <label className="mb-2 block text-sm font-medium text-gray-700">Description</label>

       <textarea
        value={form.description}
        onChange={(event) => updateField("description", event.target.value)}
        rows={5}
        className="w-full resize-none rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-gray-400"
       />
      </div>
     </div>
    </div>

    {/* =====================================================
            PRICING
        ====================================================== */}

    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
     <h2 className="mb-5 text-lg font-semibold text-gray-900">Pricing</h2>

     <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
      <div>
       <label className="mb-2 block text-sm font-medium text-gray-700">Price</label>

       <input
        type="number"
        min="0"
        value={form.price}
        onChange={(event) => updateField("price", event.target.value)}
        required
        className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-gray-400"
       />
      </div>

      <div>
       <label className="mb-2 block text-sm font-medium text-gray-700">Compare At Price</label>

       <input
        type="number"
        min="0"
        value={form.compareAtPrice}
        onChange={(event) => updateField("compareAtPrice", event.target.value)}
        className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-gray-400"
       />
      </div>

      <div>
       <label className="mb-2 block text-sm font-medium text-gray-700">Cost Price</label>

       <input
        type="number"
        min="0"
        value={form.costPrice}
        onChange={(event) => updateField("costPrice", event.target.value)}
        className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-gray-400"
       />
      </div>

      <div>
       <label className="mb-2 block text-sm font-medium text-gray-700">Currency</label>

       <input
        value={form.currency}
        onChange={(event) => updateField("currency", event.target.value.toUpperCase())}
        required
        className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm uppercase outline-none focus:border-gray-400"
       />
      </div>
     </div>
    </div>

    {/* =====================================================
            INVENTORY
        ====================================================== */}

    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
     <h2 className="mb-5 text-lg font-semibold text-gray-900">Inventory</h2>

     <div className="grid gap-5 md:grid-cols-2">
      <div>
       <label className="mb-2 block text-sm font-medium text-gray-700">Quantity</label>

       <input
        type="number"
        min="0"
        value={form.quantity}
        onChange={(event) => updateField("quantity", event.target.value)}
        className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-gray-400"
       />
      </div>

      <div>
       <label className="mb-2 block text-sm font-medium text-gray-700">Low Stock Threshold</label>

       <input
        type="number"
        min="0"
        value={form.lowStockThreshold}
        onChange={(event) => updateField("lowStockThreshold", event.target.value)}
        className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-gray-400"
       />
      </div>
     </div>
    </div>

    {/* =====================================================
            IMAGES
        ====================================================== */}

    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
     <div className="mb-5 flex items-center justify-between gap-4">
      <div>
       <h2 className="text-lg font-semibold text-gray-900">Images</h2>

       <p className="mt-1 text-xs text-gray-400">Upload product images to Cloudinary.</p>
      </div>

      <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800">
       <FaCloudUploadAlt size={14} />

       {uploadingImages ? "Uploading..." : "Upload Images"}

       <input
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        disabled={uploadingImages}
        onChange={(event) => {
         uploadFiles(event.target.files, "image");

         event.target.value = "";
        }}
       />
      </label>
     </div>

     {form.images.length > 0 ? (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
       {form.images.map((image, index) => (
        <div key={`${image}-${index}`} className="group relative overflow-hidden rounded-xl border border-gray-200 bg-gray-50">
         <img src={image} alt={`Product image ${index + 1}`} className="h-44 w-full object-cover" />

         <button
          type="button"
          onClick={() => removeImage(index)}
          className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-lg bg-black/70 text-white opacity-0 transition group-hover:opacity-100 hover:bg-red-600">
          <FaTrash size={12} />
         </button>
        </div>
       ))}
      </div>
     ) : (
      <div className="rounded-xl border border-dashed border-gray-300 px-6 py-10 text-center text-sm text-gray-400">No product images.</div>
     )}
    </div>
    {/* =====================================================
        VIRTUAL TRY-ON
    ====================================================== */}

    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
     <div className="mb-5 flex items-center justify-between gap-4">
      <div>
       <h2 className="text-lg font-semibold text-gray-900">Virtual Try-On</h2>

       <p className="mt-1 text-xs text-gray-400">Upload a separate image for AI virtual try-on.</p>
      </div>

      <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800">
       <FaCloudUploadAlt size={14} />

       {uploadingTryOnImage ? "Uploading..." : "Upload Try-On Image"}

       <input
        type="file"
        accept="image/*"
        className="hidden"
        disabled={uploadingTryOnImage}
        onChange={(event) => {
         const file = event.target.files?.[0] || null;

         uploadTryOnImage(file);

         event.target.value = "";
        }}
       />
      </label>
     </div>

     <div className="mb-5 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3">
      <p className="text-sm font-medium text-blue-900">About Try-On Image</p>

      <p className="mt-1 text-xs leading-5 text-blue-700">
       This image is used by the AI virtual try-on feature. It should contain the product garment clearly and preferably without a person wearing it.
      </p>
     </div>

     {tryOnImage ? (
      <div className="max-w-sm">
       <div className="group relative overflow-hidden rounded-xl border border-gray-200 bg-gray-50">
        <img src={tryOnImage} alt="Virtual Try-On" className="h-80 w-full object-contain" />

        <button
         type="button"
         onClick={removeTryOnImage}
         className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-lg bg-black/70 text-white opacity-0 transition group-hover:opacity-100 hover:bg-red-600">
         <FaTrash size={12} />
        </button>
       </div>

       <p className="mt-2 text-xs text-gray-400">This image will be used for AI virtual try-on.</p>
      </div>
     ) : (
      <div className="rounded-xl border border-dashed border-gray-300 px-6 py-10 text-center text-sm text-gray-400">No Try-On image uploaded.</div>
     )}
    </div>
    {/* =====================================================
            VIDEOS
        ====================================================== */}

    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
     <div className="mb-5 flex items-center justify-between gap-4">
      <div>
       <h2 className="text-lg font-semibold text-gray-900">Videos</h2>

       <p className="mt-1 text-xs text-gray-400">Upload product videos to Cloudinary.</p>
      </div>

      <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800">
       <FaCloudUploadAlt size={14} />

       {uploadingVideos ? "Uploading..." : "Upload Videos"}

       <input
        type="file"
        accept="video/*"
        multiple
        className="hidden"
        disabled={uploadingVideos}
        onChange={(event) => {
         uploadFiles(event.target.files, "video");

         event.target.value = "";
        }}
       />
      </label>
     </div>

     {form.videos.length > 0 ? (
      <div className="grid gap-4 md:grid-cols-2">
       {form.videos.map((video, index) => (
        <div key={`${video}-${index}`} className="group relative overflow-hidden rounded-xl border border-gray-200 bg-black">
         <video src={video} controls className="h-64 w-full object-contain" />

         <button
          type="button"
          onClick={() => removeVideo(index)}
          className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-lg bg-black/70 text-white opacity-0 transition group-hover:opacity-100 hover:bg-red-600">
          <FaTrash size={12} />
         </button>
        </div>
       ))}
      </div>
     ) : (
      <div className="rounded-xl border border-dashed border-gray-300 px-6 py-10 text-center text-sm text-gray-400">No product videos.</div>
     )}
    </div>

    {/* =====================================================
            STATUS
        ====================================================== */}

    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
     <h2 className="mb-5 text-lg font-semibold text-gray-900">Status</h2>

     <div className="grid gap-5 md:grid-cols-3">
      <div>
       <label className="mb-2 block text-sm font-medium text-gray-700">Product Status</label>

       <select
        value={form.status}
        onChange={(event) => updateField("status", event.target.value)}
        className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-gray-400">
        <option value="DRAFT">Draft</option>

        <option value="ACTIVE">Active</option>

        <option value="INACTIVE">Inactive</option>

        <option value="OUT_OF_STOCK">Out of Stock</option>
       </select>
      </div>

      <label className="flex cursor-pointer items-center gap-3 pt-8">
       <input
        type="checkbox"
        checked={form.isFeatured}
        onChange={(event) => updateField("isFeatured", event.target.checked)}
        className="h-4 w-4 rounded border-gray-300"
       />

       <span className="text-sm text-gray-700">Featured product</span>
      </label>

      <label className="flex cursor-pointer items-center gap-3 pt-8">
       <input
        type="checkbox"
        checked={form.isActive}
        onChange={(event) => updateField("isActive", event.target.checked)}
        className="h-4 w-4 rounded border-gray-300"
       />

       <span className="text-sm text-gray-700">Active</span>
      </label>
     </div>
    </div>

    {/* =====================================================
            ACTIONS
        ====================================================== */}

    <div className="flex justify-end gap-3">
     <Link
      href="/admin/products"
      className="rounded-xl border border-gray-200 bg-white px-5 py-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50">
      Cancel
     </Link>

     <button
      type="submit"
      disabled={saving || uploadingImages || uploadingTryOnImage || uploadingVideos}
      className="inline-flex items-center gap-2 rounded-xl bg-gray-900 px-6 py-3 text-sm font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50">
      <FaSave size={13} />

      {saving ? "Saving..." : "Save Changes"}
     </button>
    </div>
   </form>
  </div>
 );
}

EditProductPage.Layout = "Admin";
