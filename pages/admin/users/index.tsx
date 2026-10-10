"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";

interface Role {
 _id: string;
 name: string;
 code: string;
 description: string;
 isActive: boolean;
}

interface Store {
 _id: string;
 name: string;
 slug: string;
 isActive: boolean;
}

interface User {
 _id: string;
 name: string;
 email: string;
 phone: string;
 roleId: Role | string;
 storeId: Store | string | null;
 isActive: boolean;
 lastLoginAt: string | null;
 createdAt: string;
 updatedAt: string;
}

interface UsersResponse {
 success: boolean;
 users: User[];
 pagination: {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
 };
}

export default function UsersPage() {
 const { data: session, status } = useSession();

 const [users, setUsers] = useState<User[]>([]);
 const [roles, setRoles] = useState<Role[]>([]);
 const [stores, setStores] = useState<Store[]>([]);

 const [loading, setLoading] = useState(true);

 const [search, setSearch] = useState("");
 const [roleId, setRoleId] = useState("");
 const [storeId, setStoreId] = useState("");
 const [isActive, setIsActive] = useState("");

 const [page, setPage] = useState(1);

 const [pagination, setPagination] = useState({
  page: 1,
  limit: 20,
  total: 0,
  totalPages: 1,
 });

 const [deleteUser, setDeleteUser] = useState<User | null>(null);

 const [actionLoading, setActionLoading] = useState(false);

 const loadRoles = async () => {
  const response = await fetch("/api/admin/roles");

  const data = await response.json();

  if (!response.ok) {
   throw new Error(data.message || "Failed to load roles.");
  }

  setRoles(data.roles || []);
 };

 const loadStores = async () => {
  const response = await fetch("/api/admin/stores");

  const data = await response.json();

  if (!response.ok) {
   throw new Error(data.message || "Failed to load stores.");
  }

  setStores(data.stores || []);
 };

 const loadUsers = async () => {
  try {
   setLoading(true);

   const params = new URLSearchParams({
    page: String(page),
    limit: "20",
   });

   if (search.trim()) {
    params.set("search", search.trim());
   }

   if (roleId) {
    params.set("roleId", roleId);
   }

   if (storeId) {
    params.set("storeId", storeId);
   }

   if (isActive) {
    params.set("isActive", isActive);
   }

   const response = await fetch(`/api/admin/users?${params.toString()}`);

   const data = (await response.json()) as UsersResponse & {
    message?: string;
   };

   if (!response.ok) {
    throw new Error(data.message || "Failed to load users.");
   }

   setUsers(data.users || []);

   setPagination(
    data.pagination || {
     page: 1,
     limit: 20,
     total: 0,
     totalPages: 1,
    },
   );
  } catch (error) {
   console.error("Failed to load users:", error);
   setUsers([]);
  } finally {
   setLoading(false);
  }
 };

 useEffect(() => {
  if (status !== "authenticated") return;

  if (session.user.role !== "SUPER_ADMIN") {
   setLoading(false);
   return;
  }

  Promise.all([loadRoles(), loadStores()]).catch((error) => {
   console.error("Failed to load filters:", error);
  });
 }, [status]);

 useEffect(() => {
  if (status !== "authenticated") return;
  if (session.user.role !== "SUPER_ADMIN") return;

  loadUsers();
 }, [status, session?.user?.role, page, search, roleId, storeId, isActive]);

 const getRole = (user: User) => {
  if (typeof user.roleId === "object" && user.roleId) {
   return user.roleId;
  }

  return null;
 };

 const getStore = (user: User) => {
  if (typeof user.storeId === "object" && user.storeId) {
   return user.storeId;
  }

  return null;
 };

 const formatDate = (value: string | null) => {
  if (!value) return "Never";

  return new Intl.DateTimeFormat("en-US", {
   dateStyle: "medium",
   timeStyle: "short",
  }).format(new Date(value));
 };

 const handleToggleStatus = async (user: User) => {
  if (user._id === session?.user?.id) {
   alert("You cannot change your own status.");
   return;
  }

  try {
   setActionLoading(true);

   const response = await fetch(`/api/admin/users/${user._id}`, {
    method: "PATCH",
    headers: {
     "Content-Type": "application/json",
    },
    body: JSON.stringify({
     isActive: !user.isActive,
    }),
   });

   const data = await response.json();

   if (!response.ok) {
    throw new Error(data.message || "Failed to update user.");
   }

   await loadUsers();
  } catch (error: any) {
   alert(error.message || "Failed to update user.");
  } finally {
   setActionLoading(false);
  }
 };

 const handleDelete = async () => {
  if (!deleteUser) return;

  try {
   setActionLoading(true);

   const response = await fetch(`/api/admin/users/${deleteUser._id}`, {
    method: "DELETE",
   });

   const data = await response.json();

   if (!response.ok) {
    throw new Error(data.message || "Failed to delete user.");
   }

   setDeleteUser(null);

   await loadUsers();
  } catch (error: any) {
   alert(error.message || "Failed to delete user.");
  } finally {
   setActionLoading(false);
  }
 };

 if (status === "loading") {
  return <div className="flex min-h-[60vh] items-center justify-center">Loading...</div>;
 }

 if (session?.user?.role !== "SUPER_ADMIN") {
  return (
   <div className="p-6">
    <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
     <h1 className="text-lg font-semibold text-red-700">Access denied</h1>

     <p className="mt-2 text-sm text-red-600">Only SUPER_ADMIN can manage users.</p>
    </div>
   </div>
  );
 }

 return (
  <div className="space-y-6 p-6">
   {/* Header */}
   <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
    <div>
     <h1 className="text-2xl font-semibold text-gray-900">User Management</h1>

     <p className="mt-1 text-sm text-gray-500">Manage users, roles and store access.</p>
    </div>

    <Link
     href="/admin/users/create"
     className="inline-flex items-center justify-center rounded-lg bg-black px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-800">
     + Create User
    </Link>
   </div>

   {/* Filters */}
   <div className="rounded-xl border border-gray-200 bg-white p-4">
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
     <input
      type="text"
      value={search}
      onChange={(event) => {
       setSearch(event.target.value);
       setPage(1);
      }}
      placeholder="Search name, email or phone..."
      className="rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-black"
     />

     <select
      value={roleId}
      onChange={(event) => {
       setRoleId(event.target.value);
       setPage(1);
      }}
      className="rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-black">
      <option value="">All roles</option>

      {roles.map((role) => (
       <option key={role._id} value={role._id}>
        {role.name}
       </option>
      ))}
     </select>

     <select
      value={storeId}
      onChange={(event) => {
       setStoreId(event.target.value);
       setPage(1);
      }}
      className="rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-black">
      <option value="">All stores</option>

      {stores.map((store) => (
       <option key={store._id} value={store._id}>
        {store.name}
       </option>
      ))}
     </select>

     <select
      value={isActive}
      onChange={(event) => {
       setIsActive(event.target.value);
       setPage(1);
      }}
      className="rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-black">
      <option value="">All status</option>
      <option value="true">Active</option>
      <option value="false">Inactive</option>
     </select>
    </div>
   </div>

   {/* Table */}
   <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
    <div className="overflow-x-auto">
     <table className="min-w-full">
      <thead className="border-b border-gray-200 bg-gray-50">
       <tr>
        <th className="px-5 py-3 text-left text-xs font-semibold uppercase text-gray-500">User</th>

        <th className="px-5 py-3 text-left text-xs font-semibold uppercase text-gray-500">Role</th>

        <th className="px-5 py-3 text-left text-xs font-semibold uppercase text-gray-500">Store</th>

        <th className="px-5 py-3 text-left text-xs font-semibold uppercase text-gray-500">Status</th>

        <th className="px-5 py-3 text-left text-xs font-semibold uppercase text-gray-500">Last Login</th>

        <th className="px-5 py-3 text-right text-xs font-semibold uppercase text-gray-500">Actions</th>
       </tr>
      </thead>

      <tbody className="divide-y divide-gray-100">
       {loading ? (
        <tr>
         <td colSpan={6} className="px-5 py-12 text-center text-sm text-gray-500">
          Loading users...
         </td>
        </tr>
       ) : users.length === 0 ? (
        <tr>
         <td colSpan={6} className="px-5 py-12 text-center text-sm text-gray-500">
          No users found.
         </td>
        </tr>
       ) : (
        users.map((user) => {
         const role = getRole(user);
         const store = getStore(user);

         return (
          <tr key={user._id} className="hover:bg-gray-50">
           <td className="px-5 py-4">
            <div className="font-medium text-gray-900">{user.name}</div>

            <div className="text-sm text-gray-500">{user.email}</div>

            {user.phone && <div className="text-xs text-gray-400">{user.phone}</div>}
           </td>

           <td className="px-5 py-4">
            <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700">{role?.name || "Unknown"}</span>
           </td>

           <td className="px-5 py-4 text-sm text-gray-700">{store?.name || "System"}</td>

           <td className="px-5 py-4">
            <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${user.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
             {user.isActive ? "Active" : "Inactive"}
            </span>
           </td>

           <td className="px-5 py-4 text-sm text-gray-500">{formatDate(user.lastLoginAt)}</td>

           <td className="px-5 py-4">
            <div className="flex justify-end gap-2">
             <Link href={`/admin/users/${user._id}`} className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium hover:border-black">
              Edit
             </Link>

             <button
              type="button"
              disabled={actionLoading || user._id === session.user.id}
              onClick={() => handleToggleStatus(user)}
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium disabled:opacity-40">
              {user.isActive ? "Disable" : "Enable"}
             </button>

             <button
              type="button"
              disabled={actionLoading || user._id === session.user.id}
              onClick={() => setDeleteUser(user)}
              className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 disabled:opacity-40">
              Delete
             </button>
            </div>
           </td>
          </tr>
         );
        })
       )}
      </tbody>
     </table>
    </div>

    {/* Pagination */}
    {pagination && (
     <div className="flex items-center justify-between border-t border-gray-200 px-5 py-4">
      <button
       type="button"
       disabled={pagination.page <= 1}
       onClick={() => setPage((value) => value - 1)}
       className="rounded-lg border border-gray-300 px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-40">
       Previous
      </button>

      <span className="text-sm text-gray-500">
       Page {pagination.page} of {pagination.totalPages}
      </span>

      <button
       type="button"
       disabled={pagination.page >= pagination.totalPages}
       onClick={() => setPage((value) => value + 1)}
       className="rounded-lg border border-gray-300 px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-40">
       Next
      </button>
     </div>
    )}
   </div>

   {/* Delete modal */}
   {deleteUser && (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4">
     <div className="w-full max-w-md rounded-2xl bg-white p-6">
      <h2 className="text-lg font-semibold">Delete User</h2>

      <p className="mt-2 text-sm text-gray-500">
       Are you sure you want to delete <strong>{deleteUser.name}</strong>?
      </p>

      <div className="mt-6 flex justify-end gap-3">
       <button type="button" onClick={() => setDeleteUser(null)} className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm">
        Cancel
       </button>

       <button
        type="button"
        disabled={actionLoading}
        onClick={handleDelete}
        className="rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50">
        {actionLoading ? "Deleting..." : "Delete User"}
       </button>
      </div>
     </div>
    </div>
   )}
  </div>
 );
}

UsersPage.Layout = "Admin";
