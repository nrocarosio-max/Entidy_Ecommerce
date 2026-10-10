import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";

import { FaChevronLeft, FaChevronRight, FaSearch, FaSortAmountDown } from "react-icons/fa";

type Brand = {
 _id: string;
 name: string;
 slug: string;
 logo?: string;
};

type Category = {
 _id: string;
 name: string;
 slug: string;
 image?: string;
 parentId?: string | null;
};

type Product = {
 _id: string;
 name: string;
 slug: string;
 sku: string;
 description?: string;
 price: number;
 compareAtPrice?: number | null;
 currency: string;
 images?: string[];
 quantity: number;
 status: string;
 brandId?: Brand | null;
 categoryId?: Category | null;
};

type Store = {
 _id: string;
 name: string;
 slug: string;
 description?: string;
 logo?: string;
 email?: string;
 phone?: string;
 address?: string;
};

type ProductApiResponse = {
 success: boolean;
 message?: string;
 store?: Store;
 products?: Product[];
 pagination?: {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
 };
};

type FilterApiResponse = {
 success: boolean;
 message?: string;
 brands?: Brand[];
 categories?: Category[];
};

const formatPrice = (price: number, currency: string) => {
 return new Intl.NumberFormat("en-US", {
  style: "currency",
  currency,
  maximumFractionDigits: 0,
 }).format(price);
};

const getDiscountPercent = (price: number, compareAtPrice?: number | null) => {
 if (!compareAtPrice || compareAtPrice <= price) {
  return 0;
 }

 return Math.round(((compareAtPrice - price) / compareAtPrice) * 100);
};

export default function StoreProductListPage() {
 const router = useRouter();

 const storeSlug = typeof router.query.storeSlug === "string" ? router.query.storeSlug : "";

 const [products, setProducts] = useState<Product[]>([]);
 const [store, setStore] = useState<Store | null>(null);

 const [brands, setBrands] = useState<Brand[]>([]);
 const [categories, setCategories] = useState<Category[]>([]);

 const [searchInput, setSearchInput] = useState("");
 const [search, setSearch] = useState("");

 const [selectedBrand, setSelectedBrand] = useState("");
 const [selectedCategory, setSelectedCategory] = useState("");

 const [sort, setSort] = useState("newest");

 const [page, setPage] = useState(1);
 const [limit] = useState(20);

 const [total, setTotal] = useState(0);
 const [totalPages, setTotalPages] = useState(0);

 const [loading, setLoading] = useState(true);
 const [error, setError] = useState("");

 /*
  * Build URL query from current state.
  */
 const buildQuery = useCallback(
  (overrides: Record<string, string | number | null> = {}) => {
   const query: Record<string, string> = {};

   const finalSearch = overrides.search !== undefined ? overrides.search : search;

   const finalBrand = overrides.brand !== undefined ? overrides.brand : selectedBrand;

   const finalCategory = overrides.category !== undefined ? overrides.category : selectedCategory;

   const finalSort = overrides.sort !== undefined ? overrides.sort : sort;

   const finalPage = overrides.page !== undefined ? overrides.page : page;

   if (finalSearch !== null && finalSearch !== undefined && String(finalSearch).trim()) {
    query.search = String(finalSearch).trim();
   }

   if (finalBrand !== null && finalBrand !== undefined && String(finalBrand).trim()) {
    query.brand = String(finalBrand).trim();
   }

   if (finalCategory !== null && finalCategory !== undefined && String(finalCategory).trim()) {
    query.category = String(finalCategory).trim();
   }

   if (finalSort && String(finalSort) !== "newest") {
    query.sort = String(finalSort);
   }

   if (Number(finalPage) > 1) {
    query.page = String(finalPage);
   }

   return query;
  },
  [search, selectedBrand, selectedCategory, sort, page],
 );

 /*
  * Update browser URL without a full page reload.
  */
 const updateQuery = useCallback(
  (overrides: Record<string, string | number | null> = {}) => {
   if (!storeSlug) {
    return;
   }

   const query = buildQuery(overrides);

   router.push(
    {
     pathname: `/store/${storeSlug}`,
     query,
    },
    undefined,
    {
     shallow: true,
    },
   );
  },
  [router, storeSlug, buildQuery],
 );

 /*
  * Load brands and categories.
  */
 const fetchFilters = useCallback(async () => {
  if (!storeSlug) {
   return;
  }

  try {
   const response = await fetch(`/api/products/${encodeURIComponent(storeSlug)}/filters`);

   const data: FilterApiResponse = await response.json();

   if (!response.ok || !data.success) {
    throw new Error(data.message || "Failed to load filters.");
   }

   setBrands(data.brands || []);
   setCategories(data.categories || []);
  } catch (error) {
   console.error("PRODUCT FILTER ERROR:", error);

   setBrands([]);
   setCategories([]);
  }
 }, [storeSlug]);

 /*
  * Load products.
  */
 const fetchProducts = useCallback(async () => {
  if (!storeSlug) {
   return;
  }

  try {
   setLoading(true);
   setError("");

   const params = new URLSearchParams();

   params.set("page", String(page));
   params.set("limit", String(limit));
   params.set("sort", sort);

   if (search) {
    params.set("search", search);
   }

   if (selectedBrand) {
    params.set("brand", selectedBrand);
   }

   if (selectedCategory) {
    params.set("category", selectedCategory);
   }

   const response = await fetch(`/api/products/${encodeURIComponent(storeSlug)}?${params.toString()}`);

   const data: ProductApiResponse = await response.json();

   if (!response.ok || !data.success) {
    throw new Error(data.message || "Failed to load products.");
   }

   setProducts(data.products || []);
   setStore(data.store || null);

   setTotal(data.pagination?.total || 0);
   setTotalPages(data.pagination?.totalPages || 0);
  } catch (error) {
   console.error("PRODUCT LIST ERROR:", error);

   setProducts([]);
   setStore(null);
   setTotal(0);
   setTotalPages(0);

   setError(error instanceof Error ? error.message : "Failed to load products.");
  } finally {
   setLoading(false);
  }
 }, [storeSlug, page, limit, sort, search, selectedBrand, selectedCategory]);

 /*
  * Read filters from URL when page opens.
  */
 useEffect(() => {
  if (!router.isReady) {
   return;
  }

  const querySearch = typeof router.query.search === "string" ? router.query.search : "";

  const queryBrand = typeof router.query.brand === "string" ? router.query.brand : "";

  const queryCategory = typeof router.query.category === "string" ? router.query.category : "";

  const querySort = typeof router.query.sort === "string" ? router.query.sort : "newest";

  const queryPage = typeof router.query.page === "string" ? Number(router.query.page) : 1;

  setSearchInput(querySearch);
  setSearch(querySearch);

  setSelectedBrand(queryBrand);
  setSelectedCategory(queryCategory);

  setSort(querySort);

  setPage(Number.isFinite(queryPage) && queryPage > 0 ? queryPage : 1);
 }, [router.isReady, router.query]);

 /*
  * Load filters.
  */
 useEffect(() => {
  if (!router.isReady) {
   return;
  }

  fetchFilters();
 }, [router.isReady, fetchFilters]);

 /*
  * Load products.
  */
 useEffect(() => {
  if (!router.isReady) {
   return;
  }

  fetchProducts();
 }, [router.isReady, fetchProducts]);

 const handleSearch = (event: React.FormEvent) => {
  event.preventDefault();

  const value = searchInput.trim();

  setPage(1);
  setSearch(value);

  updateQuery({
   search: value || null,
   page: null,
  });
 };

 const handleSortChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
  const value = event.target.value;

  setPage(1);
  setSort(value);

  updateQuery({
   sort: value === "newest" ? null : value,
   page: null,
  });
 };

 const handleBrandChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
  const value = event.target.value;

  setPage(1);
  setSelectedBrand(value);

  updateQuery({
   brand: value || null,
   page: null,
  });
 };

 const handleCategoryChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
  const value = event.target.value;

  setPage(1);
  setSelectedCategory(value);

  updateQuery({
   category: value || null,
   page: null,
  });
 };

 const clearSearch = () => {
  setSearchInput("");
  setSearch("");
  setPage(1);

  updateQuery({
   search: null,
   page: null,
  });
 };

 const clearFilters = () => {
  setSelectedBrand("");
  setSelectedCategory("");
  setPage(1);

  updateQuery({
   brand: null,
   category: null,
   page: null,
  });
 };

 const clearAllFilters = () => {
  setSearchInput("");
  setSearch("");

  setSelectedBrand("");
  setSelectedCategory("");

  setSort("newest");
  setPage(1);

  router.push(
   {
    pathname: `/store/${storeSlug}`,
   },
   undefined,
   {
    shallow: true,
   },
  );
 };

 const handlePreviousPage = () => {
  const nextPage = Math.max(page - 1, 1);

  setPage(nextPage);

  updateQuery({
   page: nextPage === 1 ? null : nextPage,
  });
 };

 const handlePageChange = (nextPage: number) => {
  setPage(nextPage);

  updateQuery({
   page: nextPage === 1 ? null : nextPage,
  });
 };

 const handleNextPage = () => {
  const nextPage = Math.min(page + 1, totalPages);

  setPage(nextPage);

  updateQuery({
   page: nextPage,
  });
 };

 const pageNumbers = useMemo(() => {
  if (totalPages <= 1) {
   return [];
  }

  const pages: number[] = [];

  const start = Math.max(1, page - 2);

  const end = Math.min(totalPages, page + 2);

  for (let number = start; number <= end; number += 1) {
   pages.push(number);
  }

  return pages;
 }, [page, totalPages]);

 const getProductImage = (product: Product) => {
  return product.images?.[0] || "";
 };

 const hasActiveFilters = Boolean(search) || Boolean(selectedBrand) || Boolean(selectedCategory) || sort !== "newest";

 if (!router.isReady || loading) {
  return (
   <main className="min-h-screen bg-white">
    <div className="container py-12">
     <div className="mb-10">
      <div className="h-8 w-48 animate-pulse rounded bg-gray-200" />

      <div className="mt-3 h-4 w-72 animate-pulse rounded bg-gray-200" />
     </div>

     <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {Array.from({
       length: 10,
      }).map((_, index) => (
       <div key={index} className="overflow-hidden bg-gray-100">
        <div className="aspect-square animate-pulse bg-gray-200" />

        <div className="space-y-3 p-4">
         <div className="h-3 w-20 animate-pulse rounded bg-gray-200" />

         <div className="h-5 w-full animate-pulse rounded bg-gray-200" />

         <div className="h-4 w-24 animate-pulse rounded bg-gray-200" />
        </div>
       </div>
      ))}
     </div>
    </div>
   </main>
  );
 }

 if (error) {
  return (
   <main className="min-h-screen bg-white">
    <div className="container flex min-h-[500px] items-center justify-center">
     <div className="max-w-md text-center">
      <h1 className="text-2xl font-semibold text-gray-900">Unable to load products</h1>

      <p className="mt-3 text-sm text-gray-500">{error}</p>

      <button type="button" onClick={fetchProducts} className="mt-6 rounded-md bg-black px-6 py-3 text-sm font-medium text-white transition hover:bg-gray-800">
       Try again
      </button>
     </div>
    </div>
   </main>
  );
 }

 if (!store) {
  return (
   <main className="min-h-screen bg-white">
    <div className="container flex min-h-[500px] items-center justify-center">
     <div className="text-center">
      <h1 className="text-3xl font-semibold text-gray-900">Store not found</h1>

      <p className="mt-3 text-gray-500">The store you are looking for does not exist.</p>
     </div>
    </div>
   </main>
  );
 }

 return (
  <main className="min-h-screen bg-white">
   {/* Store Header */}
   <section className="border-b border-gray-200">
    <div className="container py-10 md:py-14">
     <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
      <div>
       <div className="flex items-center gap-4">
        {store.logo ? (
         <div className="relative h-14 w-14 overflow-hidden rounded-full border border-gray-200 bg-white">
          <Image src={store.logo} alt={store.name} fill className="object-contain p-2" sizes="56px" />
         </div>
        ) : null}

        <div>
         <p className="text-xs font-medium uppercase tracking-[0.2em] text-gray-500">Store</p>

         <h1 className="mt-1 text-3xl font-semibold tracking-tight text-gray-900 md:text-4xl">{store.name}</h1>
        </div>
       </div>

       {store.description ? <p className="mt-4 max-w-2xl text-sm leading-6 text-gray-500">{store.description}</p> : null}
      </div>

      <div className="text-left md:text-right">
       <p className="text-2xl font-semibold text-gray-900">{total}</p>

       <p className="text-sm text-gray-500">{total === 1 ? "product" : "products"}</p>
      </div>
     </div>
    </div>
   </section>

   {/* Toolbar */}
   <section className="border-b border-gray-200 bg-white">
    <div className="container py-5">
     <div className="flex flex-col gap-4">
      {/* Search + Sort */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
       <form onSubmit={handleSearch} className="flex w-full max-w-xl">
        <div className="relative flex-1">
         <FaSearch className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm text-gray-400" />

         <input
          type="text"
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
          placeholder="Search products..."
          className="h-12 w-full rounded-l-md border border-r-0 border-gray-300 bg-white pl-11 pr-4 text-sm text-gray-900 outline-none transition focus:border-black"
         />
        </div>

        <button type="submit" className="h-12 rounded-r-md bg-black px-6 text-sm font-medium text-white transition hover:bg-gray-800">
         Search
        </button>
       </form>

       <div className="flex items-center gap-3">
        <FaSortAmountDown className="text-sm text-gray-400" />

        <select
         value={sort}
         onChange={handleSortChange}
         className="h-11 min-w-[190px] rounded-md border border-gray-300 bg-white px-4 text-sm text-gray-700 outline-none focus:border-black">
         <option value="newest">Newest</option>

         <option value="price_asc">Price: Low to High</option>

         <option value="price_desc">Price: High to Low</option>

         <option value="name_asc">Name: A to Z</option>

         <option value="name_desc">Name: Z to A</option>
        </select>
       </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
       <div className="grid grid-cols-2 gap-3 sm:flex">
        <select
         value={selectedCategory}
         onChange={handleCategoryChange}
         className="h-11 rounded-md border border-gray-300 bg-white px-4 text-sm text-gray-700 outline-none focus:border-black">
         <option value="">All Categories</option>

         {categories.map((category) => (
          <option key={category._id} value={category.slug}>
           {category.name}
          </option>
         ))}
        </select>

        <select
         value={selectedBrand}
         onChange={handleBrandChange}
         className="h-11 rounded-md border border-gray-300 bg-white px-4 text-sm text-gray-700 outline-none focus:border-black">
         <option value="">All Brands</option>

         {brands.map((brand) => (
          <option key={brand._id} value={brand.slug}>
           {brand.name}
          </option>
         ))}
        </select>
       </div>

       {hasActiveFilters ? (
        <button
         type="button"
         onClick={clearAllFilters}
         className="text-left text-sm font-medium text-gray-500 underline underline-offset-4 transition hover:text-black sm:text-right">
         Clear all filters
        </button>
       ) : null}
      </div>

      {/* Active search */}
      {search ? (
       <div className="flex flex-wrap items-center gap-3 text-sm">
        <span className="text-gray-500">Search results for:</span>

        <span className="font-medium text-gray-900">"{search}"</span>

        <button type="button" onClick={clearSearch} className="text-gray-500 underline underline-offset-2 transition hover:text-black">
         Clear
        </button>
       </div>
      ) : null}
     </div>
    </div>
   </section>

   {/* Products */}
   <section className="container py-8 md:py-12">
    {products.length === 0 ? (
     <div className="flex min-h-[400px] items-center justify-center">
      <div className="text-center">
       <h2 className="text-2xl font-semibold text-gray-900">No products found</h2>

       <p className="mt-3 text-sm text-gray-500">Try changing your search or filter options.</p>

       {hasActiveFilters ? (
        <button
         type="button"
         onClick={clearAllFilters}
         className="mt-6 rounded-md bg-black px-6 py-3 text-sm font-medium text-white transition hover:bg-gray-800">
         Clear filters
        </button>
       ) : null}
      </div>
     </div>
    ) : (
     <>
      <div className="mb-6 flex items-center justify-between">
       <p className="text-sm text-gray-500">
        Showing <span className="font-medium text-gray-900">{products.length}</span> of <span className="font-medium text-gray-900">{total}</span> products
       </p>
      </div>

      <div className="grid grid-cols-2 gap-x-3 gap-y-8 md:grid-cols-3 md:gap-x-5 lg:grid-cols-4 xl:grid-cols-5">
       {products.map((product) => {
        const discount = getDiscountPercent(product.price, product.compareAtPrice);

        const image = getProductImage(product);

        return (
         <Link key={product._id} href={`/store/${encodeURIComponent(store.slug)}/product/${encodeURIComponent(product.slug)}`} className="group block">
          <article>
           <div className="relative aspect-square overflow-hidden bg-gray-100">
            {image ? (
             <Image
              src={image}
              alt={product.name}
              fill
              className="object-cover transition duration-500 group-hover:scale-105"
              sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 20vw"
             />
            ) : (
             <div className="flex h-full items-center justify-center text-xs text-gray-400">No image</div>
            )}

            {discount > 0 ? (
             <span className="absolute left-3 top-3 bg-black px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-white">-{discount}%</span>
            ) : null}

            {product.quantity <= 0 ? (
             <div className="absolute inset-x-0 bottom-0 bg-black/80 py-2 text-center text-[10px] font-semibold uppercase tracking-wider text-white">
              Out of stock
             </div>
            ) : product.quantity <= 5 ? (
             <div className="absolute bottom-0 left-0 bg-white/95 px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-gray-700">Low stock</div>
            ) : null}
           </div>

           <div className="pt-4">
            {product.brandId?.name ? <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-gray-400">{product.brandId.name}</p> : null}

            <h2 className="mt-1 line-clamp-2 min-h-[40px] text-sm font-medium leading-5 text-gray-900 transition group-hover:text-gray-600 md:text-[15px]">
             {product.name}
            </h2>

            <div className="mt-2 flex flex-wrap items-center gap-2">
             <span className="text-sm font-semibold text-gray-900">{formatPrice(product.price, product.currency)}</span>

             {product.compareAtPrice && product.compareAtPrice > product.price ? (
              <span className="text-xs text-gray-400 line-through">{formatPrice(product.compareAtPrice, product.currency)}</span>
             ) : null}
            </div>

            {product.categoryId?.name ? <p className="mt-2 text-xs text-gray-400">{product.categoryId.name}</p> : null}
           </div>
          </article>
         </Link>
        );
       })}
      </div>

      {/* Pagination */}
      {totalPages > 1 ? (
       <div className="mt-12 flex items-center justify-center gap-2">
        <button
         type="button"
         disabled={page <= 1}
         onClick={handlePreviousPage}
         className="flex h-10 w-10 items-center justify-center rounded-md border border-gray-300 text-gray-600 transition hover:border-black hover:text-black disabled:cursor-not-allowed disabled:opacity-30"
         aria-label="Previous page">
         <FaChevronLeft className="text-xs" />
        </button>

        {pageNumbers.map((number) => (
         <button
          key={number}
          type="button"
          onClick={() => handlePageChange(number)}
          className={`h-10 min-w-10 rounded-md px-3 text-sm font-medium transition ${
           page === number ? "bg-black text-white" : "border border-gray-300 text-gray-700 hover:border-black hover:text-black"
          }`}>
          {number}
         </button>
        ))}

        <button
         type="button"
         disabled={page >= totalPages}
         onClick={handleNextPage}
         className="flex h-10 w-10 items-center justify-center rounded-md border border-gray-300 text-gray-600 transition hover:border-black hover:text-black disabled:cursor-not-allowed disabled:opacity-30"
         aria-label="Next page">
         <FaChevronRight className="text-xs" />
        </button>
       </div>
      ) : null}
     </>
    )}
   </section>
  </main>
 );
}

StoreProductListPage.Layout = "Default";
