"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { FaBox, FaPlus, FaSearch, FaTimes, FaWarehouse } from "react-icons/fa";

type Store = {
 _id: string;
 name: string;
 slug: string;
 isActive: boolean;
};

type Product = {
 _id: string;
 name: string;
 sku: string;
 images?: string[];
 price: number;
 currency: string;
 quantity: number;
 status: string;
};

type Inventory = {
 _id: string;
 type: "IN" | "OUT" | "ADJUSTMENT";
 quantity: number;
 quantityBefore: number;
 quantityAfter: number;
 note: string;
 reference: string;
 createdAt: string;
 productId?: Product | null;
 createdBy?: {
  _id: string;
  name: string;
  email: string;
 } | null;
 storeId?: {
  _id: string;
  name: string;
  slug: string;
 } | null;
};

type InventoryForm = {
 productId: string;
 type: "IN" | "OUT" | "ADJUSTMENT";
 quantity: string;
 note: string;
 reference: string;
};

const emptyForm: InventoryForm = {
 productId: "",
 type: "IN",
 quantity: "",
 note: "",
 reference: "",
};

export default function InventoryPage() {
 const { data: session, status: sessionStatus } = useSession();

 const isSuperAdmin = session?.user?.role === "SUPER_ADMIN";

 const [stores, setStores] = useState<Store[]>([]);
 const [selectedStoreId, setSelectedStoreId] = useState("");

 const [inventories, setInventories] = useState<Inventory[]>([]);
 const [products, setProducts] = useState<Product[]>([]);

 const [loadingStores, setLoadingStores] = useState(false);
 const [loadingInventory, setLoadingInventory] = useState(false);
 const [loadingProducts, setLoadingProducts] = useState(false);

 const [search, setSearch] = useState("");
 const [searchInput, setSearchInput] = useState("");
 const [typeFilter, setTypeFilter] = useState("");

 const [page, setPage] = useState(1);
 const [totalPages, setTotalPages] = useState(1);
 const [total, setTotal] = useState(0);

 const [isModalOpen, setIsModalOpen] = useState(false);
 const [submitting, setSubmitting] = useState(false);

 const [form, setForm] = useState<InventoryForm>(emptyForm);

 const [error, setError] = useState("");
 const [success, setSuccess] = useState("");

 /*
  * Load stores for SUPER_ADMIN.
  */
 useEffect(() => {
  if (sessionStatus !== "authenticated") {
   return;
  }

  if (!isSuperAdmin) {
   return;
  }

  const loadStores = async () => {
   try {
    setLoadingStores(true);
    setError("");

    const response = await fetch("/api/admin/stores");

    const data = await response.json();

    if (!response.ok) {
     throw new Error(data.message || "Failed to load stores.");
    }

    const activeStores = (data.stores || []).filter((store: Store) => store.isActive);

    setStores(activeStores);

    if (activeStores.length > 0) {
     setSelectedStoreId((current) => {
      if (current && activeStores.some((store: Store) => store._id === current)) {
       return current;
      }

      return activeStores[0]._id;
     });
    } else {
     setSelectedStoreId("");
    }
   } catch (err) {
    console.error(err);

    setError(err instanceof Error ? err.message : "Failed to load stores.");
   } finally {
    setLoadingStores(false);
   }
  };

  loadStores();
 }, [sessionStatus, isSuperAdmin]);

 /*
  * Load inventory.
  */
 const loadInventory = async () => {
  if (sessionStatus !== "authenticated") {
   return;
  }

  if (isSuperAdmin && !selectedStoreId) {
   setInventories([]);
   setTotal(0);
   setTotalPages(1);
   return;
  }

  try {
   setLoadingInventory(true);
   setError("");

   const params = new URLSearchParams();

   params.set("page", String(page));
   params.set("limit", "20");

   if (search.trim()) {
    params.set("search", search.trim());
   }

   if (typeFilter) {
    params.set("type", typeFilter);
   }

   if (isSuperAdmin && selectedStoreId) {
    params.set("storeId", selectedStoreId);
   }

   const response = await fetch(`/api/admin/inventory?${params.toString()}`);

   const data = await response.json();

   if (!response.ok) {
    throw new Error(data.message || "Failed to load inventory.");
   }

   setInventories(data.inventories || []);

   setTotal(data.pagination?.total || 0);
   setTotalPages(data.pagination?.totalPages || 1);
  } catch (err) {
   console.error(err);

   setError(err instanceof Error ? err.message : "Failed to load inventory.");
  } finally {
   setLoadingInventory(false);
  }
 };

 /*
  * Load products.
  *
  * SUPER_ADMIN:
  * /api/admin/products?storeId=...
  *
  * Other users:
  * /api/admin/products
  * because backend automatically uses user's storeId.
  */
 const loadProducts = async () => {
  if (sessionStatus !== "authenticated") {
   return;
  }

  if (isSuperAdmin && !selectedStoreId) {
   setProducts([]);
   return;
  }

  try {
   setLoadingProducts(true);
   setError("");

   const params = new URLSearchParams();

   params.set("limit", "100");
   params.set("includeInactive", "true");

   if (isSuperAdmin && selectedStoreId) {
    params.set("storeId", selectedStoreId);
   }

   const response = await fetch(`/api/admin/products?${params.toString()}`);

   const data = await response.json();

   if (!response.ok) {
    throw new Error(data.message || "Failed to load products.");
   }

   setProducts(data.products || []);
  } catch (err) {
   console.error(err);

   setError(err instanceof Error ? err.message : "Failed to load products.");
  } finally {
   setLoadingProducts(false);
  }
 };

 /*
  * Reload when store/filter/page changes.
  */
 useEffect(() => {
  if (sessionStatus !== "authenticated") {
   return;
  }

  if (isSuperAdmin && !selectedStoreId) {
   return;
  }

  loadInventory();
 }, [sessionStatus, isSuperAdmin, selectedStoreId, page, search, typeFilter]);

 /*
  * Reload products when store changes.
  */
 useEffect(() => {
  if (sessionStatus !== "authenticated") {
   return;
  }

  if (isSuperAdmin && !selectedStoreId) {
   return;
  }

  loadProducts();

  setForm((current) => ({
   ...current,
   productId: "",
  }));
 }, [sessionStatus, isSuperAdmin, selectedStoreId]);

 const selectedProduct = useMemo(() => {
  return products.find((product) => product._id === form.productId) || null;
 }, [products, form.productId]);

 const handleStoreChange = (storeId: string) => {
  setSelectedStoreId(storeId);
  setPage(1);
  setSearch("");
  setSearchInput("");
  setTypeFilter("");
  setForm(emptyForm);
  setError("");
  setSuccess("");
 };

 const handleSearch = (event: FormEvent) => {
  event.preventDefault();

  setPage(1);
  setSearch(searchInput.trim());
 };

 const openModal = () => {
  setForm(emptyForm);
  setError("");
  setSuccess("");
  setIsModalOpen(true);
 };

 const closeModal = () => {
  if (submitting) {
   return;
  }

  setIsModalOpen(false);
  setForm(emptyForm);
 };

 const handleSubmit = async (event: FormEvent) => {
  event.preventDefault();

  if (!form.productId) {
   setError("Please select a product.");
   return;
  }

  const quantity = Number(form.quantity);

  if (!Number.isFinite(quantity)) {
   setError("Quantity must be a valid number.");
   return;
  }

  if (form.type !== "ADJUSTMENT" && quantity <= 0) {
   setError("Quantity must be greater than 0.");
   return;
  }

  if (form.type === "ADJUSTMENT" && quantity < 0) {
   setError("Adjustment quantity cannot be negative.");
   return;
  }

  try {
   setSubmitting(true);
   setError("");
   setSuccess("");

   /*
    * Do NOT send storeId.
    *
    * Backend gets storeId from Product.
    */
   const response = await fetch("/api/admin/inventory", {
    method: "POST",
    headers: {
     "Content-Type": "application/json",
    },
    body: JSON.stringify({
     productId: form.productId,
     type: form.type,
     quantity,
     note: form.note.trim(),
     reference: form.reference.trim(),
    }),
   });

   const data = await response.json();

   if (!response.ok) {
    throw new Error(data.message || "Failed to update inventory.");
   }

   setSuccess("Inventory updated successfully.");

   setForm(emptyForm);

   await loadInventory();
   await loadProducts();

   setTimeout(() => {
    setIsModalOpen(false);
    setSuccess("");
   }, 800);
  } catch (err) {
   console.error(err);

   setError(err instanceof Error ? err.message : "Failed to update inventory.");
  } finally {
   setSubmitting(false);
  }
 };

 const getTypeLabel = (type: Inventory["type"]) => {
  if (type === "IN") {
   return "Stock In";
  }

  if (type === "OUT") {
   return "Stock Out";
  }

  return "Adjustment";
 };

 const getTypeClass = (type: Inventory["type"]) => {
  if (type === "IN") {
   return "bg-green-100 text-green-700";
  }

  if (type === "OUT") {
   return "bg-red-100 text-red-700";
  }

  return "bg-yellow-100 text-yellow-700";
 };

 const formatDate = (value: string) => {
  return new Date(value).toLocaleString("en-US", {
   year: "numeric",
   month: "short",
   day: "2-digit",
   hour: "2-digit",
   minute: "2-digit",
  });
 };

 if (sessionStatus === "loading") {
  return (
   <div className="p-6">
    <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-gray-500">Loading...</div>
   </div>
  );
 }

 return (
  <div className="space-y-6 p-6">
   {/* Header */}
   <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
    <div>
     <div className="flex items-center gap-3">
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-black text-white">
       <FaWarehouse />
      </div>

      <div>
       <h1 className="text-2xl font-semibold text-gray-900">Inventory</h1>

       <p className="mt-1 text-sm text-gray-500">Manage stock movements and inventory history.</p>
      </div>
     </div>
    </div>

    <button
     type="button"
     onClick={openModal}
     disabled={loadingProducts || (isSuperAdmin && !selectedStoreId) || products.length === 0}
     className="inline-flex items-center justify-center gap-2 rounded-lg bg-black px-5 py-3 text-sm font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50">
     <FaPlus />
     Add Inventory
    </button>
   </div>

   {/* Store selector for SUPER_ADMIN */}
   {isSuperAdmin && (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
     <div className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700">
      <FaWarehouse />
      Store
     </div>

     {loadingStores ? (
      <div className="text-sm text-gray-500">Loading stores...</div>
     ) : stores.length === 0 ? (
      <div className="text-sm text-red-500">No active stores available.</div>
     ) : (
      <select
       value={selectedStoreId}
       onChange={(event) => handleStoreChange(event.target.value)}
       className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm outline-none focus:border-black focus:ring-1 focus:ring-black">
       {stores.map((store) => (
        <option key={store._id} value={store._id}>
         {store.name}
        </option>
       ))}
      </select>
     )}
    </div>
   )}

   {/* Error */}
   {error && (
    <div className="flex items-start justify-between gap-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
     <span>{error}</span>

     <button type="button" onClick={() => setError("")} className="shrink-0 text-red-500 hover:text-red-700">
      <FaTimes />
     </button>
    </div>
   )}

   {/* Success */}
   {success && <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">{success}</div>}

   {/* Filters */}
   <div className="rounded-xl border border-gray-200 bg-white p-5">
    <form onSubmit={handleSearch} className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_220px_auto]">
     <div className="relative">
      <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />

      <input
       type="text"
       value={searchInput}
       onChange={(event) => setSearchInput(event.target.value)}
       placeholder="Search product name or SKU..."
       className="w-full rounded-lg border border-gray-300 py-3 pl-11 pr-4 text-sm outline-none focus:border-black focus:ring-1 focus:ring-black"
      />
     </div>

     <select
      value={typeFilter}
      onChange={(event) => {
       setTypeFilter(event.target.value);
       setPage(1);
      }}
      className="rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm outline-none focus:border-black focus:ring-1 focus:ring-black">
      <option value="">All types</option>
      <option value="IN">Stock In</option>
      <option value="OUT">Stock Out</option>
      <option value="ADJUSTMENT">Adjustment</option>
     </select>

     <button type="submit" className="rounded-lg bg-gray-900 px-5 py-3 text-sm font-medium text-white hover:bg-black">
      Search
     </button>
    </form>
   </div>

   {/* Inventory table */}
   <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
    <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
     <div>
      <h2 className="font-semibold text-gray-900">Inventory History</h2>

      <p className="mt-1 text-xs text-gray-500">
       {total} record{total !== 1 ? "s" : ""}
      </p>
     </div>

     {isSuperAdmin && selectedStoreId && <div className="text-sm text-gray-500">{stores.find((store) => store._id === selectedStoreId)?.name}</div>}
    </div>

    <div className="overflow-x-auto">
     <table className="min-w-[1100px] w-full text-left text-sm">
      <thead className="bg-gray-50 text-xs uppercase text-gray-500">
       <tr>
        <th className="px-5 py-4">Product</th>
        <th className="px-5 py-4">Type</th>
        <th className="px-5 py-4">Quantity</th>
        <th className="px-5 py-4">Before</th>
        <th className="px-5 py-4">After</th>
        <th className="px-5 py-4">Reference</th>
        <th className="px-5 py-4">Created By</th>
        <th className="px-5 py-4">Date</th>
       </tr>
      </thead>

      <tbody className="divide-y divide-gray-100">
       {loadingInventory ? (
        <tr>
         <td colSpan={8} className="px-5 py-12 text-center text-gray-500">
          Loading inventory...
         </td>
        </tr>
       ) : inventories.length === 0 ? (
        <tr>
         <td colSpan={8} className="px-5 py-12 text-center text-gray-500">
          <div className="flex flex-col items-center justify-center">
           <FaBox className="mb-3 text-3xl text-gray-300" />

           <p>No inventory records found.</p>
          </div>
         </td>
        </tr>
       ) : (
        inventories.map((item) => (
         <tr key={item._id} className="transition hover:bg-gray-50">
          <td className="px-5 py-4">
           <div className="flex items-center gap-3">
            <div className="h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-gray-100">
             {item.productId?.images?.[0] ? (
              <img src={item.productId.images[0]} alt={item.productId.name} className="h-full w-full object-cover" />
             ) : (
              <div className="flex h-full w-full items-center justify-center text-gray-400">
               <FaBox />
              </div>
             )}
            </div>

            <div>
             <p className="font-medium text-gray-900">{item.productId?.name || "Unknown product"}</p>

             <p className="mt-1 text-xs text-gray-500">SKU: {item.productId?.sku || "-"}</p>
            </div>
           </div>
          </td>

          <td className="px-5 py-4">
           <span className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${getTypeClass(item.type)}`}>{getTypeLabel(item.type)}</span>
          </td>

          <td className="px-5 py-4 font-semibold text-gray-900">{item.quantity}</td>

          <td className="px-5 py-4 text-gray-600">{item.quantityBefore}</td>

          <td className="px-5 py-4 font-semibold text-gray-900">{item.quantityAfter}</td>

          <td className="px-5 py-4">
           <div>
            <p className="text-gray-700">{item.reference || "-"}</p>

            {item.note && <p className="mt-1 max-w-[220px] truncate text-xs text-gray-400">{item.note}</p>}
           </div>
          </td>

          <td className="px-5 py-4">
           <p className="text-gray-700">{item.createdBy?.name || "-"}</p>

           {item.createdBy?.email && <p className="mt-1 text-xs text-gray-400">{item.createdBy.email}</p>}
          </td>

          <td className="whitespace-nowrap px-5 py-4 text-gray-500">{formatDate(item.createdAt)}</td>
         </tr>
        ))
       )}
      </tbody>
     </table>
    </div>

    {/* Pagination */}
    {totalPages > 1 && (
     <div className="flex items-center justify-between border-t border-gray-200 px-5 py-4">
      <p className="text-sm text-gray-500">
       Page {page} of {totalPages}
      </p>

      <div className="flex items-center gap-2">
       <button
        type="button"
        disabled={page <= 1 || loadingInventory}
        onClick={() => setPage((current) => current - 1)}
        className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40">
        Previous
       </button>

       <button
        type="button"
        disabled={page >= totalPages || loadingInventory}
        onClick={() => setPage((current) => current + 1)}
        className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40">
        Next
       </button>
      </div>
     </div>
    )}
   </div>

   {/* Add Inventory Modal */}
   {isModalOpen && (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4">
     <div className="w-full max-w-xl rounded-2xl bg-white shadow-2xl">
      <div className="flex items-center justify-between border-b border-gray-200 px-6 py-5">
       <div>
        <h2 className="text-lg font-semibold text-gray-900">Add Inventory</h2>

        <p className="mt-1 text-sm text-gray-500">Update product stock and create an inventory record.</p>
       </div>

       <button
        type="button"
        onClick={closeModal}
        disabled={submitting}
        className="flex h-9 w-9 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-900 disabled:opacity-50">
        <FaTimes />
       </button>
      </div>

      <form onSubmit={handleSubmit}>
       <div className="space-y-5 px-6 py-6">
        {/* Product */}
        <div>
         <label className="mb-2 block text-sm font-medium text-gray-700">Product</label>

         <select
          value={form.productId}
          onChange={(event) =>
           setForm((current) => ({
            ...current,
            productId: event.target.value,
           }))
          }
          disabled={loadingProducts || submitting}
          className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm outline-none focus:border-black focus:ring-1 focus:ring-black disabled:bg-gray-100">
          <option value="">{loadingProducts ? "Loading products..." : "Select a product"}</option>

          {products.map((product) => (
           <option key={product._id} value={product._id}>
            {product.name} — {product.sku} — Stock: {product.quantity}
           </option>
          ))}
         </select>

         {selectedProduct && (
          <div className="mt-2 rounded-lg bg-gray-50 px-4 py-3 text-xs text-gray-500">
           Current stock: <span className="font-semibold text-gray-900">{selectedProduct.quantity}</span>
          </div>
         )}
        </div>

        {/* Type */}
        <div>
         <label className="mb-2 block text-sm font-medium text-gray-700">Inventory Type</label>

         <select
          value={form.type}
          onChange={(event) =>
           setForm((current) => ({
            ...current,
            type: event.target.value as InventoryForm["type"],
           }))
          }
          disabled={submitting}
          className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm outline-none focus:border-black focus:ring-1 focus:ring-black">
          <option value="IN">Stock In</option>
          <option value="OUT">Stock Out</option>
          <option value="ADJUSTMENT">Adjustment</option>
         </select>

         <p className="mt-2 text-xs text-gray-400">
          {form.type === "IN" && "Adds the entered quantity to current stock."}

          {form.type === "OUT" && "Removes the entered quantity from current stock."}

          {form.type === "ADJUSTMENT" && "Sets the current stock to the entered quantity."}
         </p>
        </div>

        {/* Quantity */}
        <div>
         <label className="mb-2 block text-sm font-medium text-gray-700">Quantity</label>

         <input
          type="number"
          min="0"
          step="1"
          value={form.quantity}
          onChange={(event) =>
           setForm((current) => ({
            ...current,
            quantity: event.target.value,
           }))
          }
          disabled={submitting}
          placeholder="Enter quantity"
          className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-black focus:ring-1 focus:ring-black"
         />
        </div>

        {/* Reference */}
        <div>
         <label className="mb-2 block text-sm font-medium text-gray-700">Reference</label>

         <input
          type="text"
          value={form.reference}
          onChange={(event) =>
           setForm((current) => ({
            ...current,
            reference: event.target.value,
           }))
          }
          disabled={submitting}
          placeholder="e.g. PO-1001"
          className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-black focus:ring-1 focus:ring-black"
         />
        </div>

        {/* Note */}
        <div>
         <label className="mb-2 block text-sm font-medium text-gray-700">Note</label>

         <textarea
          rows={3}
          value={form.note}
          onChange={(event) =>
           setForm((current) => ({
            ...current,
            note: event.target.value,
           }))
          }
          disabled={submitting}
          placeholder="Optional note..."
          className="w-full resize-none rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-black focus:ring-1 focus:ring-black"
         />
        </div>
       </div>

       <div className="flex items-center justify-end gap-3 border-t border-gray-200 px-6 py-5">
        <button
         type="button"
         onClick={closeModal}
         disabled={submitting}
         className="rounded-lg border border-gray-300 px-5 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50">
         Cancel
        </button>

        <button
         type="submit"
         disabled={submitting || loadingProducts}
         className="rounded-lg bg-black px-5 py-3 text-sm font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50">
         {submitting ? "Updating..." : "Update Inventory"}
        </button>
       </div>
      </form>
     </div>
    </div>
   )}
  </div>
 );
}

InventoryPage.Layout = "Admin";
