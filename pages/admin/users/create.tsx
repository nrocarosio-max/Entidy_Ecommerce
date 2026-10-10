import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";

import { FaArrowLeft, FaEye, FaEyeSlash, FaSave, FaUser } from "react-icons/fa";

interface Role {
 _id: string;
 name: string;
 code: string;
 description?: string;
 isActive: boolean;
}

interface Store {
 _id: string;
 name: string;
 slug: string;
 isActive: boolean;
}

export default function CreateUserPage() {
 const router = useRouter();

 const [roles, setRoles] = useState<Role[]>([]);
 const [stores, setStores] = useState<Store[]>([]);

 const [loading, setLoading] = useState(true);
 const [submitting, setSubmitting] = useState(false);

 const [showPassword, setShowPassword] = useState(false);
 const [showConfirmPassword, setShowConfirmPassword] = useState(false);

 const [error, setError] = useState("");
 const [success, setSuccess] = useState("");

 const [form, setForm] = useState({
  name: "",
  email: "",
  phone: "",
  password: "",
  confirmPassword: "",
  roleId: "",
  storeId: "",
  isActive: true,
 });

 useEffect(() => {
  loadData();
 }, []);

 async function loadData() {
  try {
   setLoading(true);
   setError("");

   const [rolesResponse, storesResponse] = await Promise.all([fetch("/api/admin/roles"), fetch("/api/admin/stores")]);

   const rolesData = await rolesResponse.json();
   const storesData = await storesResponse.json();

   if (!rolesResponse.ok) {
    throw new Error(rolesData.message || "Failed to load roles.");
   }

   if (!storesResponse.ok) {
    throw new Error(storesData.message || "Failed to load stores.");
   }

   const availableRoles = (rolesData.roles || []).filter((role: Role) => role.code !== "SUPER_ADMIN" && role.isActive);

   const availableStores = (storesData.stores || []).filter((store: Store) => store.isActive);

   setRoles(availableRoles);
   setStores(availableStores);

   setForm((current) => ({
    ...current,
    roleId: current.roleId || availableRoles[0]?._id || "",
    storeId: current.storeId || availableStores[0]?._id || "",
   }));
  } catch (err: any) {
   console.error("Create user load error:", err);

   setError(err?.message || "Failed to load roles and stores.");
  } finally {
   setLoading(false);
  }
 }

 function updateField(field: keyof typeof form, value: string | boolean) {
  setForm((current) => ({
   ...current,
   [field]: value,
  }));
 }

 async function handleSubmit(event: FormEvent<HTMLFormElement>) {
  event.preventDefault();

  setError("");
  setSuccess("");

  if (!form.name.trim()) {
   setError("Name is required.");
   return;
  }

  if (!form.email.trim()) {
   setError("Email is required.");
   return;
  }

  if (!form.password) {
   setError("Password is required.");
   return;
  }

  if (form.password.length < 6) {
   setError("Password must be at least 6 characters.");
   return;
  }

  if (form.password !== form.confirmPassword) {
   setError("Passwords do not match.");
   return;
  }

  if (!form.roleId) {
   setError("Please select a role.");
   return;
  }

  if (!form.storeId) {
   setError("Please select a store.");
   return;
  }

  try {
   setSubmitting(true);

   const response = await fetch("/api/admin/users", {
    method: "POST",
    headers: {
     "Content-Type": "application/json",
    },
    body: JSON.stringify({
     name: form.name.trim(),
     email: form.email.trim().toLowerCase(),
     phone: form.phone.trim(),
     password: form.password,
     roleId: form.roleId,
     storeId: form.storeId,
     isActive: form.isActive,
    }),
   });

   const data = await response.json();

   if (!response.ok) {
    throw new Error(data.message || "Failed to create user.");
   }

   setSuccess("User created successfully.");

   setTimeout(() => {
    router.push("/admin/users");
   }, 700);
  } catch (err: any) {
   console.error("Create user error:", err);

   setError(err?.message || "Failed to create user.");
  } finally {
   setSubmitting(false);
  }
 }

 if (loading) {
  return (
   <div className="flex min-h-[400px] items-center justify-center">
    <div className="text-sm text-gray-500">Loading...</div>
   </div>
  );
 }

 return (
  <div className="space-y-6">
   {/* Header */}
   <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
    <div>
     <div className="mb-2 flex items-center gap-2">
      <FaUser className="text-gray-500" />

      <span className="text-sm text-gray-500">Users</span>

      <span className="text-sm text-gray-400">/</span>

      <span className="text-sm text-gray-700">Create</span>
     </div>

     <h1 className="text-2xl font-semibold text-gray-900">Create User</h1>

     <p className="mt-1 text-sm text-gray-500">Create a new user and assign their role and store.</p>
    </div>

    <Link
     href="/admin/users"
     className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50">
     <FaArrowLeft />
     Back to Users
    </Link>
   </div>

   {/* Alerts */}
   {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

   {success && <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">{success}</div>}

   {/* Form */}
   <form onSubmit={handleSubmit} className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
    {/* Account Information */}
    <div className="border-b border-gray-200 px-6 py-5">
     <h2 className="text-base font-semibold text-gray-900">Account Information</h2>

     <p className="mt-1 text-sm text-gray-500">Basic information used to identify and log in the user.</p>
    </div>

    <div className="grid gap-6 p-6 md:grid-cols-2">
     {/* Name */}
     <div>
      <label className="mb-2 block text-sm font-medium text-gray-700">
       Full Name
       <span className="ml-1 text-red-500">*</span>
      </label>

      <input
       type="text"
       value={form.name}
       onChange={(event) => updateField("name", event.target.value)}
       placeholder="Enter full name"
       className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none transition focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
      />
     </div>

     {/* Email */}
     <div>
      <label className="mb-2 block text-sm font-medium text-gray-700">
       Email
       <span className="ml-1 text-red-500">*</span>
      </label>

      <input
       type="email"
       value={form.email}
       onChange={(event) => updateField("email", event.target.value)}
       placeholder="user@example.com"
       className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none transition focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
      />
     </div>

     {/* Phone */}
     <div>
      <label className="mb-2 block text-sm font-medium text-gray-700">Phone</label>

      <input
       type="text"
       value={form.phone}
       onChange={(event) => updateField("phone", event.target.value)}
       placeholder="Enter phone number"
       className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none transition focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
      />
     </div>

     {/* Status */}
     <div>
      <label className="mb-2 block text-sm font-medium text-gray-700">Status</label>

      <label className="flex h-[42px] cursor-pointer items-center gap-3">
       <input
        type="checkbox"
        checked={form.isActive}
        onChange={(event) => updateField("isActive", event.target.checked)}
        className="h-4 w-4 rounded border-gray-300"
       />

       <span className="text-sm text-gray-700">Active user</span>
      </label>
     </div>
    </div>

    {/* Password */}
    <div className="border-t border-gray-200 px-6 py-5">
     <h2 className="text-base font-semibold text-gray-900">Password</h2>

     <p className="mt-1 text-sm text-gray-500">The user will use this password to sign in.</p>
    </div>

    <div className="grid gap-6 p-6 md:grid-cols-2">
     {/* Password */}
     <div>
      <label className="mb-2 block text-sm font-medium text-gray-700">
       Password
       <span className="ml-1 text-red-500">*</span>
      </label>

      <div className="relative">
       <input
        type={showPassword ? "text" : "password"}
        value={form.password}
        onChange={(event) => updateField("password", event.target.value)}
        placeholder="Minimum 6 characters"
        className="w-full rounded-lg border border-gray-300 px-4 py-2.5 pr-11 text-sm outline-none transition focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
       />

       <button
        type="button"
        onClick={() => setShowPassword((current) => !current)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700">
        {showPassword ? <FaEyeSlash /> : <FaEye />}
       </button>
      </div>
     </div>

     {/* Confirm Password */}
     <div>
      <label className="mb-2 block text-sm font-medium text-gray-700">
       Confirm Password
       <span className="ml-1 text-red-500">*</span>
      </label>

      <div className="relative">
       <input
        type={showConfirmPassword ? "text" : "password"}
        value={form.confirmPassword}
        onChange={(event) => updateField("confirmPassword", event.target.value)}
        placeholder="Confirm password"
        className="w-full rounded-lg border border-gray-300 px-4 py-2.5 pr-11 text-sm outline-none transition focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
       />

       <button
        type="button"
        onClick={() => setShowConfirmPassword((current) => !current)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700">
        {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
       </button>
      </div>
     </div>
    </div>

    {/* Access */}
    <div className="border-t border-gray-200 px-6 py-5">
     <h2 className="text-base font-semibold text-gray-900">Access</h2>

     <p className="mt-1 text-sm text-gray-500">Assign the user to a role and store.</p>
    </div>

    <div className="grid gap-6 p-6 md:grid-cols-2">
     {/* Role */}
     <div>
      <label className="mb-2 block text-sm font-medium text-gray-700">
       Role
       <span className="ml-1 text-red-500">*</span>
      </label>

      <select
       value={form.roleId}
       onChange={(event) => updateField("roleId", event.target.value)}
       className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-gray-900 focus:ring-1 focus:ring-gray-900">
       <option value="">Select role</option>

       {roles.map((role) => (
        <option key={role._id} value={role._id}>
         {role.name} ({role.code})
        </option>
       ))}
      </select>

      {form.roleId && <p className="mt-2 text-xs text-gray-500">{roles.find((role) => role._id === form.roleId)?.description}</p>}
     </div>

     {/* Store */}
     <div>
      <label className="mb-2 block text-sm font-medium text-gray-700">
       Store
       <span className="ml-1 text-red-500">*</span>
      </label>

      <select
       value={form.storeId}
       onChange={(event) => updateField("storeId", event.target.value)}
       className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-gray-900 focus:ring-1 focus:ring-gray-900">
       <option value="">Select store</option>

       {stores.map((store) => (
        <option key={store._id} value={store._id}>
         {store.name}
        </option>
       ))}
      </select>
     </div>
    </div>

    {/* Actions */}
    <div className="flex flex-col-reverse gap-3 border-t border-gray-200 bg-gray-50 px-6 py-4 sm:flex-row sm:justify-end">
     <Link
      href="/admin/users"
      className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-100">
      Cancel
     </Link>

     <button
      type="submit"
      disabled={submitting}
      className="inline-flex items-center justify-center gap-2 rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60">
      <FaSave />

      {submitting ? "Creating..." : "Create User"}
     </button>
    </div>
   </form>
  </div>
 );
}

CreateUserPage.Layout = "Admin";
