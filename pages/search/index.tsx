import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";

import { useCountry } from "~/context/CountryContext";
import type { CityChainWatch } from "~/data/CityChainWatch";
/* =========================================================
   TYPES
========================================================= */

interface Article {
 id: number;
 category: string;
 title: string;
 image: string;
 href: string;
 keywords: string[];
}

/* =========================================================
   ARTICLES
========================================================= */

const articles: Article[] = [
 {
  id: 1,
  category: "Watch guide",
  title: "Discover our watch collection",
  image: "https://media.rolex.com/q_auto/f_auto/rolexcom/094398bf1f99/watches/search/new-watches-2026-datejust-41_m126334-0033-search?imwidth=640",
  href: "/",
  keywords: ["watches", "collection", "watch", "new"],
 },
 {
  id: 2,
  category: "Watches",
  title: "Find the right watch for you",
  image: "https://media.rolex.com/q_auto/f_auto/rolexcom/094398bf1f99/watches/search/new-watches-2026-oyster-perpetual-41_m134303-0001-search?imwidth=640",
  href: "/",
  keywords: ["watches", "men", "women", "unisex", "collection"],
 },
];

/* =========================================================
   COMBINE MY + SG DATA
========================================================= */

/* =========================================================
   NORMALIZE SEARCH
========================================================= */

const normalizeSearchText = (value: unknown) => {
 return String(value ?? "")
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .toLowerCase()
  .trim();
};

const normalizeForSearch = (value: unknown) => {
 return normalizeSearchText(value).replace(/[^a-z0-9]/g, "");
};

/* =========================================================
   SEARCH WATCH
   Search ALL fields in the watch object
========================================================= */

const watchMatchesSearch = (watch: CityChainWatch, query: string) => {
 const normalizedQuery = normalizeSearchText(query);

 if (!normalizedQuery) {
  return true;
 }

 const searchWords = normalizedQuery.split(/\s+/).filter(Boolean);

 /* =========================================================
    GENDER
    Avoid "men" matching "women"
 ========================================================= */

 const genderKeywords = ["men", "women", "unisex"];

 const genderWords = searchWords.filter((word) => genderKeywords.includes(word));

 const normalWords = searchWords.filter((word) => !genderKeywords.includes(word));

 if (genderWords.length > 0) {
  const gender = normalizeForSearch(watch.gender);

  const genderMatches = genderWords.every((word) => gender === normalizeForSearch(word));

  if (!genderMatches) {
   return false;
  }
 }

 /* =========================================================
    SEARCH ALL OBJECT FIELDS

    Example:
    gshock
    G-Shock
    G Shock
    CASIO-GA2100-1ADR
    2100
    men
    etc.
 ========================================================= */

 if (normalWords.length === 0) {
  return true;
 }

 const searchableContent = normalizeForSearch(JSON.stringify(watch));

 return normalWords.every((word) => {
  const normalizedWord = normalizeForSearch(word);

  return searchableContent.includes(normalizedWord);
 });
};

/* =========================================================
   COMPONENT
========================================================= */

export default function Search() {
 const router = useRouter();

 const { watches, loading: countryLoading } = useCountry();

 const [activeTab, setActiveTab] = useState("all");
 const [searchQuery, setSearchQuery] = useState("");
 const [isReady, setIsReady] = useState(false);

 /* =====================================================
     GET SEARCH QUERY FROM URL
  ===================================================== */

 useEffect(() => {
  if (!router.isReady) return;

  const query = router.query.q;

  if (typeof query === "string") {
   setSearchQuery(query.trim());
  } else {
   setSearchQuery("");
  }

  setIsReady(true);
 }, [router.isReady, router.query.q]);

 /* =====================================================
     FILTER WATCHES
  ===================================================== */

 const filteredWatches = useMemo(() => {
  if (!searchQuery) {
   return watches;
  }

  return watches.filter((watch) => watchMatchesSearch(watch, searchQuery));
 }, [watches, searchQuery]);

 /* =====================================================
     FILTER ARTICLES
  ===================================================== */

 const filteredArticles = useMemo(() => {
  if (!searchQuery) {
   return articles;
  }

  const normalizedQuery = normalizeSearchText(searchQuery);

  const searchWords = normalizedQuery.split(/\s+/).filter(Boolean);

  return articles.filter((article) => {
   const searchableContent = normalizeSearchText(JSON.stringify(article));

   return searchWords.every((word) => searchableContent.includes(word));
  });
 }, [searchQuery]);

 /* =====================================================
     PRODUCT STATUS
  ===================================================== */

 const getStatusLabel = (status: "available" | "sold_out" | "coming_soon" | "discontinued") => {
  switch (status) {
   case "available":
    return "Available";

   case "sold_out":
    return "Sold out";

   case "coming_soon":
    return "Coming soon";

   case "discontinued":
    return "Discontinued";

   default:
    return "";
  }
 };

 /* =====================================================
     LOADING
  ===================================================== */

 if (!isReady || countryLoading) {
  return (
   <main className="min-h-screen bg-white">
    <div className="container py-16">
     <p className="text-sm text-[#777]">Searching...</p>
    </div>
   </main>
  );
 }

 const totalResults = filteredWatches.length + filteredArticles.length;

 /* =====================================================
     RENDER
  ===================================================== */
 const handleAddToCart = (watch: CityChainWatch) => {
  if (typeof window === "undefined") return;

  // SOLD OUT → không cho thêm vào giỏ
  if (watch.status === "sold_out") {
   return;
  }

  const cartKey = "watches_cart";

  try {
   const storedCart = localStorage.getItem(cartKey);

   const cart: (CityChainWatch & { quantity: number })[] = storedCart ? JSON.parse(storedCart) : [];

   const existingItem = cart.find((item) => item.id === watch.id);

   // =====================================================
   // PRODUCT ALREADY EXISTS
   // =====================================================

   if (existingItem) {
    // Maximum 2 products
    if (existingItem.quantity >= 2) {
     window.dispatchEvent(new Event("cartMaxReached"));
     return;
    }

    existingItem.quantity += 1;
   }

   // =====================================================
   // NEW PRODUCT
   // =====================================================
   else {
    cart.push({
     ...watch,
     quantity: 1,
    });
   }

   // =====================================================
   // SAVE CART
   // =====================================================

   localStorage.setItem(cartKey, JSON.stringify(cart));

   // =====================================================
   // UPDATE CART HEADER
   // =====================================================

   window.dispatchEvent(new Event("cartUpdated"));

   // =====================================================
   // SHOW SUCCESS POPPER
   // =====================================================

   window.dispatchEvent(
    new CustomEvent("cartAdded", {
     detail: {
      product: watch,
     },
    }),
   );
  } catch (error) {
   console.error("Failed to add product to cart:", error);
  }
 };
 return (
  <main className="min-h-screen bg-white">
   {/* =====================================================
          SEARCH HEADER
      ===================================================== */}

   <section className="bg-[#f7f7f6] py-10 md:py-16">
    <div className="container">
     <p className="text-xs font-medium uppercase tracking-[0.15em] text-[#127749]">Search</p>

     <h1 className="mt-3 text-4xl font-semibold text-[#303234] md:text-7xl">
      {searchQuery ? (
       <>
        Search results for <span className="text-[#127749]">&quot;{searchQuery}&quot;</span>
       </>
      ) : (
       "Search"
      )}
     </h1>

     <p className="mt-5 text-sm text-[#666] md:text-lg">
      {totalResults} {totalResults === 1 ? "result" : "results"} found
     </p>
    </div>
   </section>

   {/* =====================================================
          TABS
      ===================================================== */}

   <section className="border-b border-[#e5e5e3] bg-white">
    <div className="container">
     <div className="flex gap-8 overflow-x-auto py-5 text-base font-medium md:justify-center md:text-lg">
      <button
       type="button"
       onClick={() => setActiveTab("all")}
       className={`shrink-0 transition-colors ${activeTab === "all" ? "font-semibold text-[#127749]" : "text-[#303234] hover:text-[#127749]"}`}>
       All
       <span className="ml-2 text-sm text-[#777]">({totalResults})</span>
      </button>

      <button
       type="button"
       onClick={() => setActiveTab("collection")}
       className={`shrink-0 transition-colors ${activeTab === "collection" ? "font-semibold text-[#127749]" : "text-[#303234] hover:text-[#127749]"}`}>
       Collection
       <span className="ml-2 text-sm text-[#777]">({filteredWatches.length})</span>
      </button>

      <button
       type="button"
       onClick={() => setActiveTab("article")}
       className={`shrink-0 transition-colors ${activeTab === "article" ? "font-semibold text-[#127749]" : "text-[#303234] hover:text-[#127749]"}`}>
       Article
       <span className="ml-2 text-sm text-[#777]">({filteredArticles.length})</span>
      </button>
     </div>
    </div>
   </section>

   {/* =====================================================
          COLLECTION
      ===================================================== */}

   {(activeTab === "all" || activeTab === "collection") && (
    <section className="bg-white py-12 md:py-20">
     <div className="container">
      {/* HEADER */}

      <div className="mb-8 md:mb-12">
       <h2 className="text-3xl font-semibold text-[#303234] md:text-5xl">Collection</h2>

       <p className="mt-3 max-w-[600px] text-sm leading-relaxed text-[#666] md:text-lg">Browse watches based on your search.</p>
      </div>

      {/* NO WATCH RESULTS */}

      {filteredWatches.length === 0 ? (
       <div className="border border-[#dededb] bg-[#f8f8f6] py-16 text-center">
        <h3 className="text-xl font-semibold">No watches found</h3>

        <p className="mt-3 text-sm text-[#777]">We could not find any watches matching &quot;{searchQuery}&quot;.</p>
       </div>
      ) : (
       <div className="grid grid-cols-2 gap-x-3 gap-y-10 lg:grid-cols-5">
        {filteredWatches.map((item) => {
         const oldPrice = item.price;
         const newPrice = item.priceNew || item.price;

         return (
          <div key={item.id} className="group relative bg-white text-center">
           {/* SALE */}

           <div className="absolute left-2 top-0 z-10 rounded-[2px] bg-[#ff3340] px-2 py-1 text-[10px] font-semibold leading-none text-white md:left-3 md:px-2.5 md:py-1.5 md:text-[12px]">
            Sale
           </div>

           {/* IMAGE */}

           <Link href={item.sourceUrl} className="relative block h-[220px] w-full overflow-hidden md:h-[270px]">
            <div
             className="absolute inset-0 bg-contain bg-center bg-no-repeat transition-transform duration-500 group-hover:scale-105"
             style={{
              backgroundImage: `url(${item.images.main})`,
             }}
            />
           </Link>

           {/* INFORMATION */}

           <div className="mt-4 px-1 md:mt-5">
            {/* BRAND */}

            <div className="mb-2 text-[11px] uppercase tracking-wide text-[#777] md:text-[13px]">{item.brand}</div>

            {/* NAME */}

            <Link
             href={item.sourceUrl}
             className="mx-auto block min-h-[42px] max-w-[280px] text-[14px] font-normal leading-[21px] text-[#242424] md:text-[16px] md:leading-[23px] line-clamp-2">
             {item.name}
            </Link>

            {/* PRICE */}

            <div className="mt-2 flex items-center justify-center gap-2 md:mt-3">
             <span className="text-[15px] font-medium text-[#ff3340] md:text-[17px]">
              {item.currency} {newPrice.toLocaleString("en-US")}
             </span>

             {oldPrice > newPrice && (
              <span className="text-[13px] font-medium text-[#303030] line-through md:text-[15px]">
               {item.currency} {oldPrice.toLocaleString("en-US")}
              </span>
             )}
            </div>

            {/* ORDER NOW */}

            {item.status === "sold_out" ? (
             <button type="button" disabled className="mt-5 w-full cursor-not-allowed bg-[#d5d5d5] py-3 text-sm font-bold text-[#666]">
              SOLD OUT
             </button>
            ) : (
             <button
              type="button"
              onClick={() => handleAddToCart(item)}
              className="mt-5 w-full bg-black py-3 text-sm font-bold text-white transition hover:bg-[#222]">
              ADD TO CART
             </button>
            )}
           </div>
          </div>
         );
        })}
       </div>
      )}
     </div>
    </section>
   )}

   {/* =====================================================
          ARTICLES
      ===================================================== */}

   {(activeTab === "all" || activeTab === "article") && (
    <section className="border-t border-[#eeeeec] bg-white py-12 md:py-20">
     <div className="container">
      {/* HEADER */}

      <div className="mb-8 md:mb-12">
       <h2 className="text-3xl font-semibold text-[#303234] md:text-5xl">Articles</h2>

       <p className="mt-3 text-sm text-[#666] md:text-lg">Explore articles related to your search.</p>
      </div>

      {/* NO ARTICLES */}

      {filteredArticles.length === 0 ? (
       <div className="border border-[#dededb] bg-[#f8f8f6] py-16 text-center">
        <h3 className="text-xl font-semibold">No articles found</h3>

        <p className="mt-3 text-sm text-[#777]">We could not find any articles matching &quot;{searchQuery}&quot;.</p>
       </div>
      ) : (
       <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
        {filteredArticles.map((article) => (
         <Link href={article.href} key={article.id} className="group">
          <figure className="aspect-[530/355] overflow-hidden bg-[#f4f4f4]">
           <img src={article.image} alt={article.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]" />
          </figure>

          <div className="mt-3">
           <span className="text-[9px] uppercase tracking-[0.12em] text-[#777] md:text-xs">{article.category}</span>

           <h3 className="mt-1 text-xs font-semibold leading-relaxed text-[#303234] md:text-lg">{article.title}</h3>
          </div>
         </Link>
        ))}
       </div>
      )}
     </div>
    </section>
   )}

   {/* =====================================================
          NO RESULTS AT ALL
      ===================================================== */}

   {totalResults === 0 && (
    <section className="container pb-20 text-center">
     <p className="text-sm text-[#777]">Try searching for another watch name, brand, collection, gender, reference or model.</p>
    </section>
   )}
  </main>
 );
}

Search.Layout = "Default";
