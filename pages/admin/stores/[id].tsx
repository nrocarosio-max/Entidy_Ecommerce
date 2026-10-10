import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";

import { FaArrowLeft, FaBuilding, FaCloudUploadAlt, FaEnvelope, FaGlobe, FaImage, FaMapMarkerAlt, FaPhone, FaSave, FaSpinner, FaTrash } from "react-icons/fa";

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
 createdAt?: string;
 updatedAt?: string;
}

interface StoreForm {
 name: string;
 slug: string;
 description: string;
 logo: string;
 email: string;
 phone: string;
 secondaryPhone: string;
 address: string;
 isActive: boolean;
}

export default function StoreDetailPage() {
 const router = useRouter();

 const { id } = router.query;

 const [store, setStore] = useState<Store | null>(null);

 const [form, setForm] = useState<StoreForm>({
  name: "",
  slug: "",
  description: "",
  logo: "",
  email: "",
  phone: "",
  secondaryPhone: "",
  address: "",
  isActive: true,
 });

 const [loading, setLoading] = useState(true);
 const [saving, setSaving] = useState(false);
 const [uploadingLogo, setUploadingLogo] = useState(false);
 const [deleting, setDeleting] = useState(false);

 const [error, setError] = useState("");
 const [success, setSuccess] = useState("");
 const [showDeleteModal, setShowDeleteModal] = useState(false);

 useEffect(() => {
  if (!router.isReady || !id) {
   return;
  }

  const fetchStore = async () => {
   try {
    setLoading(true);
    setError("");

    const response = await fetch(`/api/admin/stores/${id}`);

    const data = await response.json();

    if (!response.ok) {
     throw new Error(data.message || "Failed to load store.");
    }

    const storeData: Store = data.store;

    setStore(storeData);

    setForm({
     name: storeData.name || "",
     slug: storeData.slug || "",
     description: storeData.description || "",
     logo: storeData.logo || "",
     email: storeData.email || "",
     phone: storeData.phone || "",
     secondaryPhone: storeData.secondaryPhone || "",
     address: storeData.address || "",
     isActive: storeData.isActive ?? true,
    });
   } catch (fetchError) {
    console.error("FETCH STORE ERROR:", fetchError);

    setError(fetchError instanceof Error ? fetchError.message : "Failed to load store.");
   } finally {
    setLoading(false);
   }
  };

  fetchStore();
 }, [router.isReady, id]);

 const handleChange = <K extends keyof StoreForm>(field: K, value: StoreForm[K]) => {
  setForm((prev) => ({
   ...prev,
   [field]: value,
  }));
 };

 const handleLogoUpload = async (event: ChangeEvent<HTMLInputElement>) => {
  const file = event.target.files?.[0];

  if (!file) {
   return;
  }

  setError("");
  setSuccess("");

  if (!file.type.startsWith("image/")) {
   setError("Please select a valid image file.");
   event.target.value = "";
   return;
  }

  if (file.size > 10 * 1024 * 1024) {
   setError("Image size must be smaller than 10MB.");
   event.target.value = "";
   return;
  }

  try {
   setUploadingLogo(true);

   const formData = new FormData();
   formData.append("file", file);

   const response = await fetch("/api/admin/upload", {
    method: "POST",
    body: formData,
   });

   const data = await response.json();

   if (!response.ok) {
    throw new Error(data.message || "Failed to upload image.");
   }

   const imageUrl = data.url || data.secure_url || data.result?.secure_url || data.result?.url;

   if (!imageUrl) {
    throw new Error("Upload succeeded but no image URL was returned.");
   }

   handleChange("logo", imageUrl);
   setSuccess("Logo uploaded successfully.");
  } catch (uploadError) {
   console.error("STORE LOGO UPLOAD ERROR:", uploadError);

   setError(uploadError instanceof Error ? uploadError.message : "Failed to upload logo.");
  } finally {
   setUploadingLogo(false);
   event.target.value = "";
  }
 };

 const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
  event.preventDefault();

  if (!id || typeof id !== "string") {
   return;
  }

  setError("");
  setSuccess("");

  if (!form.name.trim()) {
   setError("Store name is required.");
   return;
  }

  if (!form.slug.trim()) {
   setError("Store slug is required.");
   return;
  }

  try {
   setSaving(true);

   const response = await fetch(`/api/admin/stores/${id}`, {
    method: "PATCH",
    headers: {
     "Content-Type": "application/json",
    },
    body: JSON.stringify({
     name: form.name.trim(),
     slug: form.slug.trim().toLowerCase(),
     description: form.description.trim(),
     logo: form.logo.trim(),
     email: form.email.trim(),
     phone: form.phone.trim(),
     secondaryPhone: form.secondaryPhone.trim(),
     address: form.address.trim(),
     isActive: form.isActive,
    }),
   });

   const data = await response.json();

   if (!response.ok) {
    throw new Error(data.message || "Failed to update store.");
   }

   setStore(data.store);

   setForm({
    name: data.store.name || "",
    slug: data.store.slug || "",
    description: data.store.description || "",
    logo: data.store.logo || "",
    email: data.store.email || "",
    phone: data.store.phone || "",
    secondaryPhone: data.store.secondaryPhone || "",
    address: data.store.address || "",
    isActive: data.store.isActive ?? true,
   });

   setSuccess("Store updated successfully.");
  } catch (updateError) {
   console.error("UPDATE STORE ERROR:", updateError);

   setError(updateError instanceof Error ? updateError.message : "Failed to update store.");
  } finally {
   setSaving(false);
  }
 };

 const handleDelete = async () => {
  if (!id || typeof id !== "string") {
   return;
  }

  try {
   setDeleting(true);
   setError("");

   const response = await fetch(`/api/admin/stores/${id}`, {
    method: "DELETE",
   });

   const data = await response.json();

   if (!response.ok) {
    throw new Error(data.message || "Failed to delete store.");
   }

   router.push("/admin/stores");
  } catch (deleteError) {
   console.error("DELETE STORE ERROR:", deleteError);

   setError(deleteError instanceof Error ? deleteError.message : "Failed to delete store.");

   setShowDeleteModal(false);
  } finally {
   setDeleting(false);
  }
 };

 if (loading) {
  return (
   <div className="flex min-h-[60vh] items-center justify-center">
    <div className="flex items-center gap-3 text-sm font-medium text-slate-500">
     <FaSpinner className="animate-spin text-lg" />
     Loading store...
    </div>
   </div>
  );
 }

 if (!store) {
  return (
   <div className="min-h-[60vh] px-4 py-10">
    <div className="mx-auto max-w-3xl rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
     <p className="font-semibold text-red-700">{error || "Store not found."}</p>

     <Link href="/admin/stores" className="mt-4 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white">
      <FaArrowLeft />
      Back to Stores
     </Link>
    </div>
   </div>
  );
 }

 return (
  <div className="min-h-screen bg-slate-50">
   <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
    {/* Header */}
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
     <div>
      <Link href="/admin/stores" className="mb-3 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-900">
       <FaArrowLeft />
       Back to Stores
      </Link>

      <div className="flex items-center gap-3">
       <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-900 text-white shadow-sm">
        <FaBuilding />
       </div>

       <div>
        <h1 className="text-2xl font-bold text-slate-900">Edit Store</h1>

        <p className="mt-1 text-sm text-slate-500">Update store information and settings.</p>
       </div>
      </div>
     </div>

     <button
      type="button"
      onClick={() => setShowDeleteModal(true)}
      className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50">
      <FaTrash />
      Delete Store
     </button>
    </div>

    {/* Alerts */}
    {error && <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</div>}

    {success && <div className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">{success}</div>}

    <form onSubmit={handleSubmit}>
     <div className="space-y-6">
      {/* Basic information */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
       <div className="mb-6">
        <h2 className="text-lg font-bold text-slate-900">Basic Information</h2>

        <p className="mt-1 text-sm text-slate-500">Update the basic information for this store.</p>
       </div>

       <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        {/* Name */}
        <div>
         <label className="mb-2 block text-sm font-semibold text-slate-700">
          Store Name
          <span className="ml-1 text-red-500">*</span>
         </label>

         <div className="relative">
          <FaBuilding className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />

          <input
           type="text"
           value={form.name}
           onChange={(event) => handleChange("name", event.target.value)}
           placeholder="Store Hanoi"
           className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
          />
         </div>
        </div>

        {/* Slug */}
        <div>
         <label className="mb-2 block text-sm font-semibold text-slate-700">
          Slug
          <span className="ml-1 text-red-500">*</span>
         </label>

         <div className="relative">
          <FaGlobe className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />

          <input
           type="text"
           value={form.slug}
           onChange={(event) => handleChange("slug", event.target.value.toLowerCase().replace(/\s+/g, "-"))}
           placeholder="store-hanoi"
           className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
          />
         </div>
        </div>

        {/* Description */}
        <div className="md:col-span-2">
         <label className="mb-2 block text-sm font-semibold text-slate-700">Description</label>

         <textarea
          value={form.description}
          onChange={(event) => handleChange("description", event.target.value)}
          rows={4}
          placeholder="Describe this store..."
          className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
         />
        </div>

        {/* Logo */}
        <div className="md:col-span-2">
         <label className="mb-2 block text-sm font-semibold text-slate-700">Store Logo</label>

         <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
           {/* Preview */}
           <div className="flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-white">
            {form.logo ? (
             <img src={form.logo} alt="Store logo preview" className="h-full w-full object-contain p-2" />
            ) : (
             <FaImage className="text-3xl text-slate-300" />
            )}
           </div>

           <div className="flex-1">
            <div className="mb-3">
             <p className="text-sm font-semibold text-slate-800">{form.logo ? "Change store logo" : "Upload store logo"}</p>

             <p className="mt-1 text-xs text-slate-500">JPG, PNG, WEBP or other image formats. Maximum 10MB.</p>
            </div>

            <label
             className={`inline-flex cursor-pointer items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition ${
              uploadingLogo ? "cursor-not-allowed bg-slate-400" : "bg-slate-900 hover:bg-slate-800"
             }`}>
             {uploadingLogo ? (
              <>
               <FaSpinner className="animate-spin" />
               Uploading...
              </>
             ) : (
              <>
               <FaCloudUploadAlt />
               {form.logo ? "Change Image" : "Choose Image"}
              </>
             )}

             <input type="file" accept="image/*" disabled={uploadingLogo} onChange={handleLogoUpload} className="hidden" />
            </label>
           </div>
          </div>

          <div className="mt-4">
           <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">Logo URL</label>

           <input
            type="text"
            value={form.logo}
            onChange={(event) => handleChange("logo", event.target.value)}
            placeholder="https://..."
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
           />
          </div>
         </div>
        </div>

        {/* Active */}
        <div className="md:col-span-2">
         <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <input
           type="checkbox"
           checked={form.isActive}
           onChange={(event) => handleChange("isActive", event.target.checked)}
           className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-400"
          />

          <div>
           <p className="text-sm font-semibold text-slate-800">Active Store</p>

           <p className="mt-1 text-xs text-slate-500">Allow this store to remain active in the system.</p>
          </div>
         </label>
        </div>
       </div>
      </div>

      {/* Contact information */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
       <div className="mb-6">
        <h2 className="text-lg font-bold text-slate-900">Contact Information</h2>

        <p className="mt-1 text-sm text-slate-500">Update contact details for this store.</p>
       </div>

       <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        {/* Email */}
        <div>
         <label className="mb-2 block text-sm font-semibold text-slate-700">Email</label>

         <div className="relative">
          <FaEnvelope className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />

          <input
           type="email"
           value={form.email}
           onChange={(event) => handleChange("email", event.target.value)}
           placeholder="store@example.com"
           className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
          />
         </div>
        </div>

        {/* Phone */}
        <div>
         <label className="mb-2 block text-sm font-semibold text-slate-700">Phone</label>

         <div className="relative">
          <FaPhone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />

          <input
           type="text"
           value={form.phone}
           onChange={(event) => handleChange("phone", event.target.value)}
           placeholder="0901234567"
           className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
          />
         </div>
        </div>

        {/* Secondary phone */}
        <div>
         <label className="mb-2 block text-sm font-semibold text-slate-700">Secondary Phone</label>

         <div className="relative">
          <FaPhone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />

          <input
           type="text"
           value={form.secondaryPhone}
           onChange={(event) => handleChange("secondaryPhone", event.target.value)}
           placeholder="0912345678"
           className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
          />
         </div>
        </div>

        {/* Address */}
        <div>
         <label className="mb-2 block text-sm font-semibold text-slate-700">Address</label>

         <div className="relative">
          <FaMapMarkerAlt className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />

          <input
           type="text"
           value={form.address}
           onChange={(event) => handleChange("address", event.target.value)}
           placeholder="Hanoi, Vietnam"
           className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
          />
         </div>
        </div>
       </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
       <Link
        href="/admin/stores"
        className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
        Cancel
       </Link>

       <button
        type="submit"
        disabled={saving || uploadingLogo}
        className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60">
        {saving ? (
         <>
          <FaSpinner className="animate-spin" />
          Saving...
         </>
        ) : (
         <>
          <FaSave />
          Save Changes
         </>
        )}
       </button>
      </div>
     </div>
    </form>
   </div>

   {/* Delete modal */}
   {showDeleteModal && (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 px-4">
     <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
      <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-red-100 text-red-600">
       <FaTrash />
      </div>

      <h2 className="text-xl font-bold text-slate-900">Delete Store?</h2>

      <p className="mt-2 text-sm leading-6 text-slate-500">
       Are you sure you want to delete <span className="font-semibold text-slate-800">{store.name}</span>? This action cannot be undone.
      </p>

      <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
       <button
        type="button"
        onClick={() => setShowDeleteModal(false)}
        disabled={deleting}
        className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50">
        Cancel
       </button>

       <button
        type="button"
        onClick={handleDelete}
        disabled={deleting}
        className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60">
        {deleting ? (
         <>
          <FaSpinner className="animate-spin" />
          Deleting...
         </>
        ) : (
         <>
          <FaTrash />
          Delete Store
         </>
        )}
       </button>
      </div>
     </div>
    </div>
   )}
  </div>
 );
}

StoreDetailPage.Layout = "Admin";
