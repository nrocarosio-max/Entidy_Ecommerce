import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";
import { FaArrowLeft, FaSave, FaUser } from "react-icons/fa";

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
}

interface Store {
 _id: string;
 name: string;
}

export default function EditCustomerPage() {
 const router = useRouter();
 const { data: session, status } = useSession();

 const customerId = typeof router.query.id === "string" ? router.query.id : "";

 const [customer, setCustomer] = useState<Customer | null>(null);

 const [stores, setStores] = useState<Store[]>([]);

 const [selectedStore, setSelectedStore] = useState("");

 const [name, setName] = useState("");
 const [phone, setPhone] = useState("");
 const [isActive, setIsActive] = useState(true);

 const [loading, setLoading] = useState(true);
 const [loadingStores, setLoadingStores] = useState(false);
 const [saving, setSaving] = useState(false);

 const [error, setError] = useState("");

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

    const response = await fetch("/api/admin/stores");

    if (!response.ok) {
     throw new Error("Failed to load stores.");
    }

    const data = await response.json();

    setStores(data.stores || []);
   } catch (err) {
    setError(err instanceof Error ? err.message : "Failed to load stores.");
   } finally {
    setLoadingStores(false);
   }
  };

  loadStores();
 }, [status, isSuperAdmin]);

 /*
  * Load customer
  */
 useEffect(() => {
  if (status !== "authenticated") return;
  if (!customerId) return;

  const loadCustomer = async () => {
   try {
    setLoading(true);
    setError("");

    const response = await fetch(`/api/admin/customers/${customerId}`);

    const data = await response.json().catch(() => null);

    if (!response.ok) {
     throw new Error(data?.message || "Failed to load customer.");
    }

    const result: Customer = data.customer || data;

    setCustomer(result);

    setSelectedStore(typeof result.storeId === "object" ? result.storeId._id : result.storeId);
    setName(result.name || "");
    setPhone(result.phone || "");
    setIsActive(result.isActive !== false);
   } catch (err) {
    setError(err instanceof Error ? err.message : "Failed to load customer.");
   } finally {
    setLoading(false);
   }
  };

  loadCustomer();
 }, [status, customerId]);

 const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
  event.preventDefault();

  if (!customerId) {
   setError("Customer ID is missing.");
   return;
  }

  if (!name.trim()) {
   setError("Customer name is required.");
   return;
  }

  if (!phone.trim()) {
   setError("Phone number is required.");
   return;
  }

  try {
   setSaving(true);
   setError("");

   const body: {
    name: string;
    phone: string;
    isActive: boolean;
    storeId?: string;
   } = {
    name: name.trim(),
    phone: phone.trim(),
    isActive,
   };

   /*
    * SUPER_ADMIN may change store.
    * Other roles stay inside their own store.
    */
   if (isSuperAdmin && selectedStore) {
    body.storeId = selectedStore;
   }

   const response = await fetch(`/api/admin/customers/${customerId}`, {
    method: "PATCH",
    headers: {
     "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
   });

   const data = await response.json().catch(() => null);

   if (!response.ok) {
    throw new Error(data?.message || "Failed to update customer.");
   }

   await router.push("/admin/customers");
  } catch (err) {
   setError(err instanceof Error ? err.message : "Failed to update customer.");
  } finally {
   setSaving(false);
  }
 };

 if (status === "loading" || loading) {
  return <div className="flex min-h-[60vh] items-center justify-center text-sm text-gray-500">Loading...</div>;
 }

 if (!session) {
  return <div className="flex min-h-[60vh] items-center justify-center text-sm text-gray-500">Please sign in.</div>;
 }

 if (!customer) {
  return (
   <div className="min-h-screen bg-gray-100 p-4 md:p-6">
    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error || "Customer not found."}</div>
   </div>
  );
 }

 return (
  <div className="min-h-screen bg-gray-100 p-4 md:p-6">
   {/* Header */}
   <div className="mb-6 flex items-center gap-3">
    <Link
     href="/admin/customers"
     className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50">
     <FaArrowLeft />
    </Link>

    <div>
     <h1 className="text-2xl font-bold text-gray-900">Edit Customer</h1>

     <p className="text-sm text-gray-500">Update customer information.</p>
    </div>
   </div>

   {error && <div className="mb-6 max-w-3xl rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

   <form onSubmit={handleSubmit} className="max-w-3xl rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
    <div className="mb-6 flex items-center gap-3 border-b border-gray-200 pb-5">
     <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-900 text-white">
      <FaUser />
     </div>

     <div>
      <h2 className="font-semibold text-gray-900">Customer Information</h2>

      <p className="text-sm text-gray-500">Customer ID: {customer._id}</p>
     </div>
    </div>

    <div className="grid gap-5 md:grid-cols-2">
     {isSuperAdmin && (
      <div className="md:col-span-2">
       <label className="mb-1 block text-sm font-medium text-gray-700">Store</label>

       <select
        value={selectedStore}
        onChange={(event) => setSelectedStore(event.target.value)}
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

     <div>
      <label className="mb-1 block text-sm font-medium text-gray-700">Name</label>

      <input
       type="text"
       value={name}
       onChange={(event) => setName(event.target.value)}
       placeholder="Customer name"
       className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-gray-900"
      />
     </div>

     <div>
      <label className="mb-1 block text-sm font-medium text-gray-700">Phone</label>

      <input
       type="text"
       value={phone}
       onChange={(event) => setPhone(event.target.value)}
       placeholder="Phone number"
       className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-gray-900"
      />
     </div>

     <div className="md:col-span-2">
      <label className="flex cursor-pointer items-center gap-3">
       <input type="checkbox" checked={isActive} onChange={(event) => setIsActive(event.target.checked)} className="h-4 w-4 rounded border-gray-300" />

       <span className="text-sm font-medium text-gray-700">Active customer</span>
      </label>
     </div>
    </div>

    <div className="mt-6 flex justify-end gap-3 border-t border-gray-200 pt-5">
     <Link href="/admin/customers" className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50">
      Cancel
     </Link>

     <button
      type="submit"
      disabled={saving}
      className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50">
      <FaSave />

      {saving ? "Saving..." : "Save Changes"}
     </button>
    </div>
   </form>
  </div>
 );
}

EditCustomerPage.Layout = "Admin";
