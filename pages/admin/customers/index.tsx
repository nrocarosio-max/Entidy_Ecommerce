import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { FaEdit, FaPlus, FaSearch, FaTrash, FaUser } from "react-icons/fa";

interface Store {
 _id: string;
 name: string;
}

interface CustomerStore {
 _id: string;
 name: string;
 slug?: string;
}

interface Customer {
 _id: string;
 storeId: string | CustomerStore;
 name: string;
 phone: string;
 isActive: boolean;
 createdAt: string;
 updatedAt: string;
}

interface Pagination {
 page: number;
 limit: number;
 total: number;
 totalPages: number;
}

interface CustomersResponse {
 customers: Customer[];
 pagination: Pagination;
}

export default function CustomersPage() {
 const { data: session, status } = useSession();

 const [stores, setStores] = useState<Store[]>([]);
 const [selectedStore, setSelectedStore] = useState("");

 const [customers, setCustomers] = useState<Customer[]>([]);
 const [pagination, setPagination] = useState<Pagination>({
  page: 1,
  limit: 20,
  total: 0,
  totalPages: 1,
 });

 const [search, setSearch] = useState("");
 const [searchInput, setSearchInput] = useState("");
 const [activeFilter, setActiveFilter] = useState("");

 const [loadingStores, setLoadingStores] = useState(false);
 const [loadingCustomers, setLoadingCustomers] = useState(false);
 const [deletingId, setDeletingId] = useState("");

 const [error, setError] = useState("");
 const [success, setSuccess] = useState("");

 const isSuperAdmin = session?.user?.role === "SUPER_ADMIN";

 /*
  * Load stores for SUPER_ADMIN
  */
 useEffect(() => {
  if (status !== "authenticated") return;
  if (!isSuperAdmin) return;

  const loadStores = async () => {
   try {
    setLoadingStores(true);
    setError("");

    const response = await fetch("/api/admin/stores");

    if (!response.ok) {
     throw new Error("Failed to load stores.");
    }

    const data = await response.json();

    const storeList: Store[] = data.stores || [];

    setStores(storeList);

    if (storeList.length > 0) {
     setSelectedStore((current) => current || storeList[0]._id);
    }
   } catch (err) {
    setError(err instanceof Error ? err.message : "Failed to load stores.");
   } finally {
    setLoadingStores(false);
   }
  };

  loadStores();
 }, [status, isSuperAdmin]);

 /*
  * Set store for non-SUPER_ADMIN
  */
 useEffect(() => {
  if (status !== "authenticated") return;

  if (!isSuperAdmin && session?.user?.storeId) {
   setSelectedStore(session.user.storeId);
  }
 }, [status, isSuperAdmin, session?.user?.storeId]);

 /*
  * Load customers
  */
 useEffect(() => {
  if (status !== "authenticated") return;
  if (!selectedStore) return;

  const loadCustomers = async () => {
   try {
    setLoadingCustomers(true);
    setError("");

    const params = new URLSearchParams({
     storeId: selectedStore,
     page: String(pagination.page),
     limit: "20",
    });

    if (search.trim()) {
     params.set("search", search.trim());
    }

    if (activeFilter) {
     params.set("isActive", activeFilter);
    }

    const response = await fetch(`/api/admin/customers?${params.toString()}`);

    const data = await response.json().catch(() => null);

    if (!response.ok) {
     throw new Error(data?.message || "Failed to load customers.");
    }

    const result: CustomersResponse = data;

    setCustomers(result.customers || []);

    setPagination(
     result.pagination || {
      page: pagination.page,
      limit: 20,
      total: 0,
      totalPages: 1,
     },
    );
   } catch (err) {
    setError(err instanceof Error ? err.message : "Failed to load customers.");
   } finally {
    setLoadingCustomers(false);
   }
  };

  loadCustomers();
 }, [status, selectedStore, search, activeFilter, pagination.page]);

 const handleSearch = () => {
  setPagination((current) => ({
   ...current,
   page: 1,
  }));

  setSearch(searchInput.trim());
 };

 const handleDelete = async (customer: Customer) => {
  const confirmed = window.confirm(`Delete customer "${customer.name}"?`);

  if (!confirmed) return;

  try {
   setDeletingId(customer._id);
   setError("");
   setSuccess("");

   const response = await fetch(`/api/admin/customers/${customer._id}`, {
    method: "DELETE",
   });

   const data = await response.json().catch(() => null);

   if (!response.ok) {
    throw new Error(data?.message || "Failed to delete customer.");
   }

   setSuccess("Customer deleted successfully.");

   /*
    * Reload current page
    */
   const params = new URLSearchParams({
    storeId: selectedStore,
    page: String(pagination.page),
    limit: "20",
   });

   if (search.trim()) {
    params.set("search", search.trim());
   }

   if (activeFilter) {
    params.set("isActive", activeFilter);
   }

   const reloadResponse = await fetch(`/api/admin/customers?${params.toString()}`);

   if (reloadResponse.ok) {
    const reloadData: CustomersResponse = await reloadResponse.json();

    setCustomers(reloadData.customers || []);

    setPagination(
     reloadData.pagination || {
      page: 1,
      limit: 20,
      total: 0,
      totalPages: 1,
     },
    );
   }
  } catch (err) {
   setError(err instanceof Error ? err.message : "Failed to delete customer.");
  } finally {
   setDeletingId("");
  }
 };

 if (status === "loading") {
  return <div className="flex min-h-[60vh] items-center justify-center text-sm text-gray-500">Loading...</div>;
 }

 if (!session) {
  return <div className="flex min-h-[60vh] items-center justify-center text-sm text-gray-500">Please sign in.</div>;
 }

 return (
  <div className="min-h-screen bg-gray-100 p-4 md:p-6">
   {/* Header */}
   <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
    <div className="flex items-center gap-3">
     <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gray-900 text-white">
      <FaUser />
     </div>

     <div>
      <h1 className="text-2xl font-bold text-gray-900">Customers</h1>

      <p className="text-sm text-gray-500">Manage customers for your store.</p>
     </div>
    </div>

    <div className="flex flex-col gap-3 sm:flex-row">
     {isSuperAdmin && (
      <div className="w-full sm:w-64">
       <label className="mb-1 block text-sm font-medium text-gray-700">Store</label>

       <select
        value={selectedStore}
        onChange={(event) => {
         setSelectedStore(event.target.value);

         setPagination((current) => ({
          ...current,
          page: 1,
         }));
        }}
        disabled={loadingStores}
        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-gray-900">
        <option value="">{loadingStores ? "Loading stores..." : "Select store"}</option>

        {stores.map((store) => (
         <option key={store._id} value={store._id}>
          {store.name}
         </option>
        ))}
       </select>
      </div>
     )}

     <Link
      href="/admin/customers/create"
      className="inline-flex items-center justify-center gap-2 rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-800">
      <FaPlus />
      Add Customer
     </Link>
    </div>
   </div>

   {/* Messages */}
   {error && <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

   {success && <div className="mb-6 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">{success}</div>}

   {/* Filters */}
   <div className="mb-6 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
    <div className="grid gap-4 lg:grid-cols-[1fr_220px_auto]">
     <div>
      <label className="mb-1 block text-sm font-medium text-gray-700">Search</label>

      <div className="flex">
       <input
        type="text"
        value={searchInput}
        onChange={(event) => setSearchInput(event.target.value)}
        onKeyDown={(event) => {
         if (event.key === "Enter") {
          handleSearch();
         }
        }}
        placeholder="Search name or phone..."
        className="w-full rounded-l-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-gray-900"
       />

       <button
        type="button"
        onClick={handleSearch}
        className="inline-flex items-center justify-center gap-2 rounded-r-lg bg-gray-900 px-5 text-sm font-medium text-white hover:bg-gray-800">
        <FaSearch />
        Search
       </button>
      </div>
     </div>

     <div>
      <label className="mb-1 block text-sm font-medium text-gray-700">Status</label>

      <select
       value={activeFilter}
       onChange={(event) => {
        setActiveFilter(event.target.value);

        setPagination((current) => ({
         ...current,
         page: 1,
        }));
       }}
       className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-gray-900">
       <option value="">All customers</option>
       <option value="true">Active</option>
       <option value="false">Inactive</option>
      </select>
     </div>

     <div className="flex items-end">
      <button
       type="button"
       onClick={() => {
        setSearchInput("");
        setSearch("");
        setActiveFilter("");

        setPagination((current) => ({
         ...current,
         page: 1,
        }));
       }}
       className="w-full rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 lg:w-auto">
       Reset
      </button>
     </div>
    </div>
   </div>

   {/* Table */}
   <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
    <div className="overflow-x-auto">
     <table className="min-w-full text-sm">
      <thead className="border-b border-gray-200 bg-gray-50">
       <tr>
        <th className="px-4 py-3 text-left font-semibold text-gray-700">Customer</th>

        <th className="px-4 py-3 text-left font-semibold text-gray-700">Phone</th>

        {isSuperAdmin && <th className="px-4 py-3 text-left font-semibold text-gray-700">Store</th>}

        <th className="px-4 py-3 text-left font-semibold text-gray-700">Status</th>

        <th className="px-4 py-3 text-left font-semibold text-gray-700">Created</th>

        <th className="px-4 py-3 text-right font-semibold text-gray-700">Actions</th>
       </tr>
      </thead>

      <tbody className="divide-y divide-gray-100">
       {loadingCustomers ? (
        <tr>
         <td colSpan={isSuperAdmin ? 6 : 5} className="px-4 py-12 text-center text-gray-500">
          Loading customers...
         </td>
        </tr>
       ) : customers.length === 0 ? (
        <tr>
         <td colSpan={isSuperAdmin ? 6 : 5} className="px-4 py-12 text-center text-gray-500">
          No customers found.
         </td>
        </tr>
       ) : (
        customers.map((customer) => (
         <tr key={customer._id} className="transition hover:bg-gray-50">
          <td className="px-4 py-4">
           <div className="font-medium text-gray-900">{customer.name}</div>
          </td>

          <td className="px-4 py-4 text-gray-600">{customer.phone}</td>

          {isSuperAdmin && (
           <td className="px-4 py-4 text-gray-600">
            {typeof customer.storeId === "object" ? customer.storeId.name : stores.find((store) => store._id === customer.storeId)?.name || customer.storeId}
           </td>
          )}
          <td className="px-4 py-4">
           {customer.isActive ? (
            <span className="inline-flex rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-700">Active</span>
           ) : (
            <span className="inline-flex rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">Inactive</span>
           )}
          </td>

          <td className="whitespace-nowrap px-4 py-4 text-gray-600">{new Date(customer.createdAt).toLocaleString("vi-VN")}</td>

          <td className="px-4 py-4">
           <div className="flex justify-end gap-2">
            <Link
             href={`/admin/customers/${customer._id}/edit`}
             className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
             title="Edit">
             <FaEdit />
            </Link>

            <button
             type="button"
             onClick={() => handleDelete(customer)}
             disabled={deletingId === customer._id}
             className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-red-200 text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
             title="Delete">
             <FaTrash />
            </button>
           </div>
          </td>
         </tr>
        ))
       )}
      </tbody>
     </table>
    </div>

    {/* Pagination */}
    {pagination.totalPages > 1 && (
     <div className="flex flex-col gap-3 border-t border-gray-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="text-sm text-gray-500">
       Page {pagination.page} of {pagination.totalPages}
       {" · "}
       {pagination.total} customers
      </div>

      <div className="flex gap-2">
       <button
        type="button"
        disabled={pagination.page <= 1 || loadingCustomers}
        onClick={() =>
         setPagination((current) => ({
          ...current,
          page: current.page - 1,
         }))
        }
        className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40">
        Previous
       </button>

       <button
        type="button"
        disabled={pagination.page >= pagination.totalPages || loadingCustomers}
        onClick={() =>
         setPagination((current) => ({
          ...current,
          page: current.page + 1,
         }))
        }
        className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40">
        Next
       </button>
      </div>
     </div>
    )}
   </div>
  </div>
 );
}

CustomersPage.Layout = "Admin";
