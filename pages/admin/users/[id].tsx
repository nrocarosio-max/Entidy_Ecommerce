import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";

import { FaArrowLeft, FaEye, FaEyeSlash, FaSave, FaTrash, FaUser } from "react-icons/fa";

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

interface UserData {
 _id: string;
 name: string;
 email: string;
 phone?: string;
 roleId: Role | string;
 storeId: Store | string | null;
 isActive: boolean;
}

export default function EditUserPage() {
 const router = useRouter();

 const userId = typeof router.query.id === "string" ? router.query.id : "";

 const [user, setUser] = useState<UserData | null>(null);
 const [roles, setRoles] = useState<Role[]>([]);
 const [stores, setStores] = useState<Store[]>([]);

 const [loading, setLoading] = useState(true);
 const [submitting, setSubmitting] = useState(false);
 const [deleting, setDeleting] = useState(false);

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
  if (!router.isReady || !userId) {
   return;
  }

  loadData();
 }, [router.isReady, userId]);

 async function loadData() {
  try {
   setLoading(true);
   setError("");

   const [userResponse, rolesResponse, storesResponse] = await Promise.all([
    fetch(`/api/admin/users/${userId}`),
    fetch("/api/admin/roles"),
    fetch("/api/admin/stores"),
   ]);

   const userData = await userResponse.json();
   const rolesData = await rolesResponse.json();
   const storesData = await storesResponse.json();

   if (!userResponse.ok) {
    throw new Error(userData.message || "Failed to load user.");
   }

   if (!rolesResponse.ok) {
    throw new Error(rolesData.message || "Failed to load roles.");
   }

   if (!storesResponse.ok) {
    throw new Error(storesData.message || "Failed to load stores.");
   }

   const currentUser = userData.user as UserData;

   const availableRoles = (rolesData.roles || []).filter((role: Role) => role.code !== "SUPER_ADMIN" && role.isActive);

   const availableStores = (storesData.stores || []).filter((store: Store) => store.isActive);

   setUser(currentUser);
   setRoles(availableRoles);
   setStores(availableStores);

   const currentRoleId = typeof currentUser.roleId === "object" ? currentUser.roleId?._id : currentUser.roleId;

   const currentStoreId = typeof currentUser.storeId === "object" ? currentUser.storeId?._id : currentUser.storeId || "";

   setForm({
    name: currentUser.name || "",
    email: currentUser.email || "",
    phone: currentUser.phone || "",
    password: "",
    confirmPassword: "",
    roleId: currentRoleId || "",
    storeId: currentStoreId || "",
    isActive: currentUser.isActive,
   });
  } catch (err: any) {
   console.error("Edit user load error:", err);

   setError(err?.message || "Failed to load user.");
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

  if (!form.roleId) {
   setError("Please select a role.");
   return;
  }

  if (!form.storeId) {
   setError("Please select a store.");
   return;
  }

  if (form.password && form.password.length < 6) {
   setError("Password must be at least 6 characters.");
   return;
  }

  if (form.password && form.password !== form.confirmPassword) {
   setError("Passwords do not match.");
   return;
  }

  try {
   setSubmitting(true);

   const body: Record<string, any> = {
    name: form.name.trim(),
    email: form.email.trim().toLowerCase(),
    phone: form.phone.trim(),
    roleId: form.roleId,
    storeId: form.storeId,
    isActive: form.isActive,
   };

   if (form.password) {
    body.password = form.password;
   }

   const response = await fetch(`/api/admin/users/${userId}`, {
    method: "PATCH",
    headers: {
     "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
   });

   const data = await response.json();

   if (!response.ok) {
    throw new Error(data.message || "Failed to update user.");
   }

   setSuccess("User updated successfully.");

   setForm((current) => ({
    ...current,
    password: "",
    confirmPassword: "",
   }));

   setTimeout(() => {
    router.push("/admin/users");
   }, 700);
  } catch (err: any) {
   console.error("Update user error:", err);

   setError(err?.message || "Failed to update user.");
  } finally {
   setSubmitting(false);
  }
 }

 async function handleDelete() {
  if (!user) {
   return;
  }

  const confirmed = window.confirm(`Are you sure you want to delete "${user.name}"?`);

  if (!confirmed) {
   return;
  }

  try {
   setDeleting(true);
   setError("");

   const response = await fetch(`/api/admin/users/${userId}`, {
    method: "DELETE",
   });

   const data = await response.json();

   if (!response.ok) {
    throw new Error(data.message || "Failed to delete user.");
   }

   router.push("/admin/users");
  } catch (err: any) {
   console.error("Delete user error:", err);

   setError(err?.message || "Failed to delete user.");
  } finally {
   setDeleting(false);
  }
 }

 if (loading) {
  return (
   <div className="flex min-h-[400px] items-center justify-center">
    <div className="text-sm text-gray-500">Loading...</div>
   </div>
  );
 }

 if (!user) {
  return (
   <div className="space-y-4">
    <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error || "User not found."}</div>

    <Link
     href="/admin/users"
     className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50">
     <FaArrowLeft />
     Back to Users
    </Link>
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

      <span className="text-sm text-gray-700">Edit</span>
     </div>

     <h1 className="text-2xl font-semibold text-gray-900">Edit User</h1>

     <p className="mt-1 text-sm text-gray-500">Update user information, access and password.</p>
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
    {/* Account */}
    <div className="border-b border-gray-200 px-6 py-5">
     <h2 className="text-base font-semibold text-gray-900">Account Information</h2>

     <p className="mt-1 text-sm text-gray-500">Update the user's basic account information.</p>
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
     <h2 className="text-base font-semibold text-gray-900">Change Password</h2>

     <p className="mt-1 text-sm text-gray-500">Leave these fields empty if you do not want to change the password.</p>
    </div>

    <div className="grid gap-6 p-6 md:grid-cols-2">
     {/* Password */}
     <div>
      <label className="mb-2 block text-sm font-medium text-gray-700">New Password</label>

      <div className="relative">
       <input
        type={showPassword ? "text" : "password"}
        value={form.password}
        onChange={(event) => updateField("password", event.target.value)}
        placeholder="Leave empty to keep current password"
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
      <label className="mb-2 block text-sm font-medium text-gray-700">Confirm New Password</label>

      <div className="relative">
       <input
        type={showConfirmPassword ? "text" : "password"}
        value={form.confirmPassword}
        onChange={(event) => updateField("confirmPassword", event.target.value)}
        placeholder="Confirm new password"
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

     <p className="mt-1 text-sm text-gray-500">Change the user's role and store.</p>
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
    <div className="flex flex-col-reverse gap-3 border-t border-gray-200 bg-gray-50 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
     <button
      type="button"
      onClick={handleDelete}
      disabled={deleting}
      className="inline-flex items-center justify-center gap-2 rounded-lg border border-red-200 bg-white px-5 py-2.5 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60">
      <FaTrash />

      {deleting ? "Deleting..." : "Delete User"}
     </button>

     <div className="flex flex-col gap-3 sm:flex-row">
      <Link
       href="/admin/users"
       className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-100">
       Cancel
      </Link>

      <button
       type="submit"
       disabled={submitting || deleting}
       className="inline-flex items-center justify-center gap-2 rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60">
       <FaSave />

       {submitting ? "Saving..." : "Save Changes"}
      </button>
     </div>
    </div>
   </form>
  </div>
 );
}

EditUserPage.Layout = "Admin";
