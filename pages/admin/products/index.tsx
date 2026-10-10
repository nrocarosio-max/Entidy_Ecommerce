import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { FaBoxOpen, FaChevronDown, FaEdit, FaPlus, FaSearch, FaStore, FaTrash } from "react-icons/fa";

interface Store {
 _id: string;
 name: string;
 slug: string;
}

interface Product {
 _id: string;
 storeId: string | { _id: string; name?: string };
 name: string;
 slug: string;
 sku: string;
 description: string;
 categoryId:
  | string
  | {
     _id: string;
     name: string;
    }
  | null;
 brandId:
  | string
  | {
     _id: string;
     name: string;
    }
  | null;
 price: number;
 compareAtPrice: number | null;
 costPrice: number | null;
 currency: string;
 images: string[];
 quantity: number;
 lowStockThreshold: number;
 status: "DRAFT" | "ACTIVE" | "INACTIVE" | "OUT_OF_STOCK";
 isFeatured: boolean;
 isActive: boolean;
 createdAt: string;
}

interface ProductsResponse {
 products: Product[];
 pagination?: {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
 };
}

const statusConfig = {
 DRAFT: {
  label: "Draft",
  className: "bg-gray-100 text-gray-600",
 },
 ACTIVE: {
  label: "Active",
  className: "bg-green-50 text-green-700",
 },
 INACTIVE: {
  label: "Inactive",
  className: "bg-yellow-50 text-yellow-700",
 },
 OUT_OF_STOCK: {
  label: "Out of stock",
  className: "bg-red-50 text-red-700",
 },
};

export default function ProductsPage() {
 const { data: session, status: sessionStatus } = useSession();

 const [stores, setStores] = useState<Store[]>([]);
 const [selectedStore, setSelectedStore] = useState("");

 const [products, setProducts] = useState<Product[]>([]);
 const [loading, setLoading] = useState(true);
 const [storesLoading, setStoresLoading] = useState(false);

 const [search, setSearch] = useState("");
 const [searchInput, setSearchInput] = useState("");

 const [statusFilter, setStatusFilter] = useState("");
 const [isActiveFilter, setIsActiveFilter] = useState("");

 const [page, setPage] = useState(1);
 const [pagination, setPagination] = useState({
  page: 1,
  limit: 20,
  total: 0,
  totalPages: 1,
 });

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
  if (!selectedStore) return;

  loadProducts();
 }, [selectedStore, page, search, statusFilter, isActiveFilter]);

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

 async function loadProducts() {
  try {
   setLoading(true);
   setError("");

   const params = new URLSearchParams();

   params.set("storeId", selectedStore);
   params.set("page", String(page));
   params.set("limit", "20");

   if (search.trim()) {
    params.set("search", search.trim());
   }

   if (statusFilter) {
    params.set("status", statusFilter);
   }

   if (isActiveFilter) {
    params.set("isActive", isActiveFilter);
   }

   const response = await fetch(`/api/admin/products?${params.toString()}`);

   const data: ProductsResponse & { message?: string } = await response.json();

   if (!response.ok) {
    throw new Error(data?.message || "Failed to load products.");
   }

   setProducts(data.products || []);

   if (data.pagination) {
    setPagination(data.pagination);
   }
  } catch (err) {
   setProducts([]);

   setError(err instanceof Error ? err.message : "Failed to load products.");
  } finally {
   setLoading(false);
  }
 }

 function handleSearch() {
  setPage(1);
  setSearch(searchInput);
 }

 function handleClearFilters() {
  setSearchInput("");
  setSearch("");
  setStatusFilter("");
  setIsActiveFilter("");
  setPage(1);
 }

 async function handleDelete(product: Product) {
  const confirmed = window.confirm(`Delete product "${product.name}"?`);

  if (!confirmed) return;

  try {
   setError("");

   const response = await fetch(`/api/admin/products/${product._id}?storeId=${encodeURIComponent(selectedStore)}`, {
    method: "DELETE",
   });

   const data = await response.json();

   if (!response.ok) {
    throw new Error(data?.message || "Failed to delete product.");
   }

   await loadProducts();
  } catch (err) {
   setError(err instanceof Error ? err.message : "Failed to delete product.");
  }
 }

 function getCategoryName(product: Product) {
  if (!product.categoryId) return "—";

  if (typeof product.categoryId === "string") {
   return product.categoryId;
  }

  return product.categoryId.name || "—";
 }

 function getBrandName(product: Product) {
  if (!product.brandId) return "—";

  if (typeof product.brandId === "string") {
   return product.brandId;
  }

  return product.brandId.name || "—";
 }

 function formatPrice(price: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
   style: "currency",
   currency: currency || "VNĐ",
   maximumFractionDigits: 2,
  }).format(price);
 }

 const showingText = useMemo(() => {
  if (!pagination.total) {
   return "0 products";
  }

  const start = (pagination.page - 1) * pagination.limit + 1;

  const end = Math.min(pagination.page * pagination.limit, pagination.total);

  return `${start}-${end} of ${pagination.total}`;
 }, [pagination]);

 if (sessionStatus === "loading") {
  return (
   <div className="flex min-h-[60vh] items-center justify-center">
    <div className="text-sm text-gray-500">Loading...</div>
   </div>
  );
 }

 return (
  <div>
   {/* Header */}
   <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
    <div>
     <div className="mb-1 flex items-center gap-2 text-sm text-gray-500">
      <FaBoxOpen size={13} />
      <span>Admin</span>
      <span>/</span>
      <span>Products</span>
     </div>

     <h1 className="text-2xl font-bold tracking-tight text-gray-900 md:text-3xl">Products</h1>

     <p className="mt-1 text-sm text-gray-500">Manage products, pricing, stock and product status.</p>
    </div>

    <Link
     href="/admin/products/create"
     className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-gray-900 px-5 text-sm font-medium text-white transition hover:bg-gray-800">
     <FaPlus size={13} />
     Add Product
    </Link>
   </div>

   {/* Store selector */}
   {isSuperAdmin && (
    <div className="mb-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
     <div className="max-w-sm">
      <label className="mb-2 block text-sm font-medium text-gray-700">Store</label>

      <div className="relative">
       <FaStore className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400" />

       <select
        value={selectedStore}
        onChange={(event) => {
         setSelectedStore(event.target.value);
         setPage(1);
        }}
        disabled={storesLoading}
        className="h-11 w-full appearance-none rounded-xl border border-gray-200 bg-white pl-10 pr-10 text-sm text-gray-700 outline-none transition focus:border-gray-400 disabled:cursor-not-allowed disabled:bg-gray-50">
        <option value="">{storesLoading ? "Loading stores..." : "Select store"}</option>

        {stores.map((store) => (
         <option key={store._id} value={store._id}>
          {store.name}
         </option>
        ))}
       </select>

       <FaChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400" />
      </div>
     </div>
    </div>
   )}

   {/* Error */}
   {error && <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>}

   {/* Filters */}
   <div className="mb-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
    <div className="flex flex-col gap-3 lg:flex-row">
     <div className="relative flex-1">
      <FaSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400" />

      <input
       type="text"
       value={searchInput}
       onChange={(event) => setSearchInput(event.target.value)}
       onKeyDown={(event) => {
        if (event.key === "Enter") {
         handleSearch();
        }
       }}
       placeholder="Search by product name or SKU..."
       className="h-11 w-full rounded-xl border border-gray-200 bg-white pl-10 pr-4 text-sm text-gray-700 outline-none transition placeholder:text-gray-400 focus:border-gray-400"
      />
     </div>

     <select
      value={statusFilter}
      onChange={(event) => {
       setStatusFilter(event.target.value);
       setPage(1);
      }}
      className="h-11 rounded-xl border border-gray-200 bg-white px-4 text-sm text-gray-700 outline-none focus:border-gray-400">
      <option value="">All Status</option>
      <option value="DRAFT">Draft</option>
      <option value="ACTIVE">Active</option>
      <option value="INACTIVE">Inactive</option>
      <option value="OUT_OF_STOCK">Out of stock</option>
     </select>

     <select
      value={isActiveFilter}
      onChange={(event) => {
       setIsActiveFilter(event.target.value);
       setPage(1);
      }}
      className="h-11 rounded-xl border border-gray-200 bg-white px-4 text-sm text-gray-700 outline-none focus:border-gray-400">
      <option value="">All Visibility</option>
      <option value="true">Active</option>
      <option value="false">Inactive</option>
     </select>

     <button type="button" onClick={handleSearch} className="h-11 rounded-xl bg-gray-900 px-5 text-sm font-medium text-white transition hover:bg-gray-800">
      Search
     </button>

     <button
      type="button"
      onClick={handleClearFilters}
      className="h-11 rounded-xl border border-gray-200 bg-white px-5 text-sm font-medium text-gray-600 transition hover:bg-gray-50">
      Clear
     </button>
    </div>
   </div>

   {/* Products */}
   <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
    {/* Desktop */}
    <div className="hidden overflow-x-auto md:block">
     <table className="w-full min-w-[1000px]">
      <thead className="border-b border-gray-100 bg-gray-50">
       <tr className="text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
        <th className="px-5 py-4">Product</th>
        <th className="px-5 py-4">SKU</th>
        <th className="px-5 py-4">Category</th>
        <th className="px-5 py-4">Brand</th>
        <th className="px-5 py-4">Price</th>
        <th className="px-5 py-4">Stock</th>
        <th className="px-5 py-4">Status</th>
        <th className="px-5 py-4 text-right">Actions</th>
       </tr>
      </thead>

      <tbody className="divide-y divide-gray-100">
       {loading ? (
        <tr>
         <td colSpan={8} className="px-5 py-16 text-center text-sm text-gray-500">
          Loading products...
         </td>
        </tr>
       ) : products.length === 0 ? (
        <tr>
         <td colSpan={8} className="px-5 py-16 text-center">
          <FaBoxOpen className="mx-auto mb-3 text-3xl text-gray-300" />

          <p className="text-sm font-medium text-gray-700">No products found</p>

          <p className="mt-1 text-xs text-gray-400">Try changing your search or filters.</p>
         </td>
        </tr>
       ) : (
        products.map((product) => {
         const statusInfo = statusConfig[product.status];

         return (
          <tr key={product._id} className="transition hover:bg-gray-50">
           <td className="px-5 py-4">
            <div className="flex items-center gap-3">
             <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-gray-100 bg-gray-50">
              {product.images?.[0] ? (
               <img src={product.images[0]} alt={product.name} className="h-full w-full object-cover" />
              ) : (
               <FaBoxOpen className="text-gray-300" />
              )}
             </div>

             <div className="min-w-0">
              <div className="max-w-[240px] truncate text-sm font-semibold text-gray-900">{product.name}</div>

              {product.isFeatured && (
               <span className="mt-1 inline-flex rounded-full bg-purple-50 px-2 py-0.5 text-[10px] font-medium text-purple-600">Featured</span>
              )}
             </div>
            </div>
           </td>

           <td className="px-5 py-4 text-sm font-medium text-gray-600">{product.sku}</td>

           <td className="px-5 py-4 text-sm text-gray-600">{getCategoryName(product)}</td>

           <td className="px-5 py-4 text-sm text-gray-600">{getBrandName(product)}</td>

           <td className="px-5 py-4 text-sm font-semibold text-gray-900">{formatPrice(product.price, product.currency)}</td>

           <td className="px-5 py-4">
            <div className={`text-sm font-semibold ${product.quantity <= product.lowStockThreshold ? "text-red-600" : "text-gray-900"}`}>
             {product.quantity}
            </div>

            <div className="text-xs text-gray-400">Low: {product.lowStockThreshold}</div>
           </td>

           <td className="px-5 py-4">
            <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${statusInfo.className}`}>{statusInfo.label}</span>
           </td>

           <td className="px-5 py-4">
            <div className="flex items-center justify-end gap-2">
             <Link
              href={`/admin/products/${product._id}/edit`}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition hover:border-gray-300 hover:bg-gray-50 hover:text-gray-900"
              title="Edit">
              <FaEdit size={13} />
             </Link>

             <button
              type="button"
              onClick={() => handleDelete(product)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-red-100 text-red-500 transition hover:bg-red-50"
              title="Delete">
              <FaTrash size={13} />
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

    {/* Mobile */}
    <div className="divide-y divide-gray-100 md:hidden">
     {loading ? (
      <div className="px-5 py-16 text-center text-sm text-gray-500">Loading products...</div>
     ) : products.length === 0 ? (
      <div className="px-5 py-16 text-center">
       <FaBoxOpen className="mx-auto mb-3 text-3xl text-gray-300" />

       <p className="text-sm font-medium text-gray-700">No products found</p>

       <p className="mt-1 text-xs text-gray-400">Try changing your search or filters.</p>
      </div>
     ) : (
      products.map((product) => {
       const statusInfo = statusConfig[product.status];

       return (
        <div key={product._id} className="p-4">
         <div className="flex gap-3">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-gray-100 bg-gray-50">
           {product.images?.[0] ? (
            <img src={product.images[0]} alt={product.name} className="h-full w-full object-cover" />
           ) : (
            <FaBoxOpen className="text-gray-300" />
           )}
          </div>

          <div className="min-w-0 flex-1">
           <div className="truncate text-sm font-semibold text-gray-900">{product.name}</div>

           <div className="mt-1 text-xs text-gray-400">SKU: {product.sku}</div>

           <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${statusInfo.className}`}>{statusInfo.label}</span>

            {product.isFeatured && <span className="inline-flex rounded-full bg-purple-50 px-2.5 py-1 text-xs font-medium text-purple-600">Featured</span>}
           </div>
          </div>
         </div>

         <div className="mt-4 grid grid-cols-2 gap-3 rounded-xl bg-gray-50 p-3">
          <div>
           <div className="text-xs text-gray-400">Price</div>

           <div className="mt-1 text-sm font-semibold text-gray-900">{formatPrice(product.price, product.currency)}</div>
          </div>

          <div>
           <div className="text-xs text-gray-400">Stock</div>

           <div className={`mt-1 text-sm font-semibold ${product.quantity <= product.lowStockThreshold ? "text-red-600" : "text-gray-900"}`}>
            {product.quantity}
           </div>
          </div>

          <div>
           <div className="text-xs text-gray-400">Category</div>

           <div className="mt-1 truncate text-sm text-gray-700">{getCategoryName(product)}</div>
          </div>

          <div>
           <div className="text-xs text-gray-400">Brand</div>

           <div className="mt-1 truncate text-sm text-gray-700">{getBrandName(product)}</div>
          </div>
         </div>

         <div className="mt-3 flex gap-2">
          <Link
           href={`/admin/products/${product._id}/edit`}
           className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-700">
           <FaEdit size={13} />
           Edit
          </Link>

          <button
           type="button"
           onClick={() => handleDelete(product)}
           className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-red-100 text-red-500">
           <FaTrash size={13} />
          </button>
         </div>
        </div>
       );
      })
     )}
    </div>

    {/* Pagination */}
    {!loading && pagination.total > 0 && (
     <div className="flex flex-col gap-3 border-t border-gray-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="text-xs text-gray-500">Showing {showingText}</div>

      <div className="flex items-center gap-2">
       <button
        type="button"
        disabled={page <= 1}
        onClick={() => setPage((current) => Math.max(1, current - 1))}
        className="h-9 rounded-lg border border-gray-200 px-3 text-sm font-medium text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40">
        Previous
       </button>

       <div className="flex h-9 min-w-9 items-center justify-center rounded-lg bg-gray-900 px-3 text-sm font-medium text-white">{pagination.page}</div>

       <button
        type="button"
        disabled={page >= pagination.totalPages}
        onClick={() => setPage((current) => Math.min(pagination.totalPages, current + 1))}
        className="h-9 rounded-lg border border-gray-200 px-3 text-sm font-medium text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40">
        Next
       </button>
      </div>
     </div>
    )}
   </div>
  </div>
 );
}

ProductsPage.Layout = "Admin";
