"use client";

import Link from "next/link";
import CartPopper from "~/components/popper/cart/CartPopper";
import type { CityChainWatch } from "~/data/CityChainWatch";
import OrderNowPopperSG from "~/components/popper/order/OrderNowPopperSG";
import OrderNowPopperMY from "~/components/popper/order/OrderNowPopperMY";
import { useCountry } from "~/context/CountryContext";
import { useState } from "react";

const brandBanners: Record<string, string> = {
 Seiko: "https://www.swingwatch.co.id/wp-content/uploads/2022/10/seiko-5-1360x600-1.jpg",

 Tissot:
  "https://www.tissotwatches.com/on/demandware.static/-/Library-Sites-Tissot-SharedLibrary/default/dwf65bb85b/1-HOMEPAGE/2-IMAGE-TILE/DESKTOP/WEB-HP-Banner-DESIR-Desktop.jpg",

 Casio:
  "https://www.casio.com/content/casio/locales/vn/vi/products/_jcr_content/root/responsivegrid/item_1658891874009_c.casiocoreimg.jpeg/1755844280840/homepage-full-metal-pc.jpeg",

 Swatch: "https://w.ladicdn.com/60a1f7e18b7784001369fedb/large_omegaswatch_banner_13ecd4762e-20260921040855-exkoa.webp",

 "Swatch x Omega":
  "https://www.swatch.com/dw/image/v2/BDNV_PRD/on/demandware.static/-/Library-Sites-swarp-global/default/dw0a104584/images/Swatch/collections/2022/moonswatch/lp-banner/MoonSwatch_d_v8.jpg",

 "Swatch x Audemars Piguet":
  "https://hodinkee.imgix.net/uploads/images/01ee70a0-2118-4062-a1d8-4aaf20b4bf77/Hero_sc01_26_Bioceramic_Royal_Pop_NH_06_HD1.jpg?ixlib=rails-1.1.0&fm=jpg&q=55&auto=format&usm=12",

 Omega: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ_ZHx290krJVNthprGfCNqPfoLzzlETbgXluWFsbDukQ&s=10",
};

/* =========================================================
   BRAND NAVIGATION
========================================================= */

const brandNavigation = [
 {
  name: "Casio",
  label: "CASIO",
 },
 {
  name: "Swatch",
  label: "SWATCH",
 },
 {
  name: "Tissot",
  label: "TISSOT",
 },
 {
  name: "Seiko",
  label: "SEIKO",
 },
 {
  name: "Omega",
  label: "OMEGA",
 },
];

/* =========================================================
   BRAND ID
========================================================= */

const getBrandId = (brand: string) => {
 return `brand-${brand.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
};

export default function LimitedDeals() {
 const [selectedWatch, setSelectedWatch] = useState<CityChainWatch | null>(null);

 const [isOrderNowOpen, setIsOrderNowOpen] = useState(false);
 const { watches, country, loading: countryLoading } = useCountry();
 /* =======================================================
    GROUP PRODUCTS BY BRAND
 ======================================================= */
 const handleOrderNow = (watch: CityChainWatch) => {
  setSelectedWatch(watch);
  setIsOrderNowOpen(true);
 };
 const watchesByBrand = watches.reduce(
  (groups, watch) => {
   let brand = watch.brand || "Other";

   // Gom toàn bộ Swatch về 1 nhóm
   if (brand === "Swatch" || brand === "Swatch x Omega" || brand === "Swatch x Audemars Piguet") {
    brand = "Swatch";
   }

   if (!groups[brand]) {
    groups[brand] = [];
   }

   groups[brand].push(watch);

   return groups;
  },
  {} as Record<string, CityChainWatch[]>,
 );

 /* =======================================================
    SCROLL TO BRAND
 ======================================================= */

 const handleBrandClick = (brand: string) => {
  const element = document.getElementById(getBrandId(brand));

  if (!element) return;

  const headerOffset = 90;

  const elementPosition = element.getBoundingClientRect().top + window.scrollY;

  const offsetPosition = elementPosition - headerOffset;

  window.scrollTo({
   top: offsetPosition,
   behavior: "smooth",
  });
 };

 /* =======================================================
    ADD TO CART
 ======================================================= */
 /* =======================================================
   FLY PRODUCT TO CART
======================================================= */

 const animateProductToCart = (watch: CityChainWatch, buttonElement: HTMLButtonElement) => {
  if (typeof window === "undefined") return;

  const cartElement = document.querySelector("[data-cart-icon]") as HTMLElement | null;

  if (!cartElement) {
   console.error("Cart animation target was not found.");
   return;
  }

  const buttonRect = buttonElement.getBoundingClientRect();
  const cartRect = cartElement.getBoundingClientRect();

  const startX = buttonRect.left + buttonRect.width / 2 - 30;
  const startY = buttonRect.top + buttonRect.height / 2 - 30;

  const endX = cartRect.left + cartRect.width / 2 - 30;
  const endY = cartRect.top + cartRect.height / 2 - 30;

  const flyingProduct = document.createElement("div");

  flyingProduct.style.position = "fixed";
  flyingProduct.style.left = `${startX}px`;
  flyingProduct.style.top = `${startY}px`;
  flyingProduct.style.width = "60px";
  flyingProduct.style.height = "60px";
  flyingProduct.style.borderRadius = "50%";

  flyingProduct.style.backgroundImage = `url("${watch.images.main}")`;
  flyingProduct.style.backgroundSize = "cover";
  flyingProduct.style.backgroundPosition = "center";
  flyingProduct.style.backgroundRepeat = "no-repeat";

  flyingProduct.style.border = "2px solid white";
  flyingProduct.style.boxShadow = "0 4px 15px rgba(0, 0, 0, 0.35)";

  flyingProduct.style.zIndex = "2147483647";
  flyingProduct.style.pointerEvents = "none";

  document.body.appendChild(flyingProduct);

  const deltaX = endX - startX;
  const deltaY = endY - startY;

  const animation = flyingProduct.animate(
   [
    {
     transform: "translate3d(0, 0, 0) scale(1)",
     opacity: 1,
    },
    {
     transform: `translate3d(
     ${deltaX * 0.25}px,
     ${deltaY * 0.25 - 100}px,
     0
    ) scale(1.15)`,
     opacity: 1,
    },
    {
     transform: `translate3d(
     ${deltaX * 0.65}px,
     ${deltaY * 0.65}px,
     0
    ) scale(0.7)`,
     opacity: 0.9,
    },
    {
     transform: `translate3d(
     ${deltaX}px,
     ${deltaY}px,
     0
    ) scale(0.15)`,
     opacity: 0,
    },
   ],
   {
    duration: 5000,
    easing: "cubic-bezier(0.22, 1, 0.36, 1)",
    fill: "forwards",
   },
  );

  animation.onfinish = () => {
   flyingProduct.remove();

   cartElement.animate(
    [{ transform: "scale(1)" }, { transform: "scale(1.25)" }, { transform: "scale(0.9)" }, { transform: "scale(1.1)" }, { transform: "scale(1)" }],
    {
     duration: 350,
     easing: "ease-out",
    },
   );
  };
 };
 const handleAddToCart = (watch: CityChainWatch, buttonElement: HTMLButtonElement) => {
  if (typeof window === "undefined") return;
  // SOLD OUT → không cho thêm vào giỏ
  if (watch.status === "sold_out") {
   return;
  }
  const cartKey = "watches_cart";

  try {
   const storedCart = localStorage.getItem(cartKey);

   const cart: (CityChainWatch & {
    quantity: number;
   })[] = storedCart ? JSON.parse(storedCart) : [];

   const existingItem = cart.find((item) => item.id === watch.id);

   /* =====================================================
      PRODUCT ALREADY EXISTS
   ===================================================== */

   if (existingItem) {
    if (existingItem.quantity >= 2) {
     window.dispatchEvent(new Event("cartMaxReached"));
     return;
    }

    existingItem.quantity += 1;
   } else {
    /* =====================================================
      NEW PRODUCT
   ===================================================== */
    cart.push({
     ...watch,
     quantity: 1,
    });
   }

   /* =====================================================
      SAVE CART
   ===================================================== */

   localStorage.setItem(cartKey, JSON.stringify(cart));

   /* =====================================================
      UPDATE CART HEADER
   ===================================================== */

   window.dispatchEvent(new Event("cartUpdated"));

   /* =====================================================
   FLY PRODUCT TO CART
===================================================== */

   animateProductToCart(watch, buttonElement);
  } catch (error) {
   console.error("Failed to add product to cart:", error);
  }
 };
 if (countryLoading) {
  return (
   <section className="bg-white py-16">
    <CartPopper />

    <div className="container">
     <div className="flex min-h-[300px] items-center justify-center">
      <p className="text-sm text-[#666]">Loading watches...</p>
     </div>
    </div>
   </section>
  );
 }
 return (
  <section className="bg-white py-16">
   <CartPopper />
   <div className="container">
    {/* ==================================================
        HEADER
    ================================================== */}

    <div className="mb-10 lg:w-1/3">
     <h2 className="mb-4 text-2xl font-bold md:text-4xl">All watches</h2>

     <p className="leading-relaxed text-[#525354]">Browse the complete watch collection and discover the model that suits you.</p>
    </div>

    {/* ==================================================
        BRAND NAVIGATION
    ================================================== */}

    <div className="mb-4 overflow-x-auto pb-2">
     <div className="flex min-w-max items-center justify-center gap-2 md:gap-3">
      {brandNavigation.map((brand) => {
       const exists = watchesByBrand[brand.name];

       if (!exists) return null;

       return (
        <button
         key={brand.name}
         type="button"
         onClick={() => handleBrandClick(brand.name)}
         className="flex h-[42px] min-w-[82px] cursor-pointer items-center justify-center rounded-full border border-[#222] bg-white px-4 text-[11px] font-semibold tracking-wide text-[#222] transition hover:bg-[#222] hover:text-white md:h-[48px] md:min-w-[105px] md:px-6 md:text-[13px]">
         {brand.label}
        </button>
       );
      })}
     </div>
    </div>

    {/* ==================================================
        WATCHES
    ================================================== */}

    <div>
     {Object.entries(watchesByBrand).map(([brand, brandWatches]) => (
      <section key={brand} id={getBrandId(brand)} className="mb-16 scroll-mt-24 md:mb-20">
       {/* ==================================================
            BRAND BANNER
        ================================================== */}

       {brandBanners[brand] && (
        <div className="mb-8 overflow-hidden border border-[#222]">
         <img src={brandBanners[brand]} alt={`${brand} limited deals`} className="h-auto w-full object-cover" />
        </div>
       )}

       {/* ==================================================
            BRAND TITLE
        ================================================== */}

       <div className="mb-6 text-center">
        <h2 className="text-2xl font-semibold md:text-3xl">{brand}</h2>
       </div>

       {/* ==================================================
            PRODUCTS
        ================================================== */}

       <div className="grid grid-cols-2 gap-x-3 gap-y-10 lg:grid-cols-5">
        {brandWatches.map((item) => {
         const oldPrice = item.price;

         const newPrice = item.priceNew || item.price;

         const discount = oldPrice > newPrice ? Math.round(((oldPrice - newPrice) / oldPrice) * 100) : 0;

         return (
          <div key={item.id} className="group relative bg-white text-center">
           {/* ==================================================
                SALE
            ================================================== */}

           {discount > 0 && (
            <div className="absolute left-2 top-0 z-10 rounded-[2px] bg-[#ff3340] px-2 py-1 text-[10px] font-semibold leading-none text-white md:left-3 md:px-2.5 md:py-1.5 md:text-[12px]">
             Sale
            </div>
           )}

           {/* ==================================================
                IMAGE
            ================================================== */}

           <Link href={item.sourceUrl} className="relative flex h-[220px] w-full items-center justify-center overflow-hidden md:h-[270px]">
            <div
             className="h-full w-full bg-contain bg-center bg-no-repeat transition-transform duration-500 group-hover:scale-105"
             style={{
              backgroundImage: `url(${item.images.main})`,
             }}
            />
           </Link>

           {/* ==================================================
                INFORMATION
            ================================================== */}

           <div className="mt-4 flex flex-col px-1 md:mt-5">
            {/* BRAND */}

            <div className="mb-2 h-[18px] text-[11px] uppercase tracking-wide text-[#777] md:h-[20px] md:text-[13px]">{item.brand}</div>

            {/* NAME */}

            <Link
             href={item.sourceUrl}
             className="mx-auto block lin-clamp-2 h-[42px] max-w-[280px] overflow-hidden line-clamp-2 text-[14px] font-normal leading-[21px] text-[#242424] md:h-[46px] md:text-[16px] md:leading-[23px]">
             {item.name}
            </Link>

            {/* PRICE */}

            <div className="mt-2 flex h-[24px] items-center justify-center gap-2 md:mt-3 md:h-[26px]">
             <span className="text-[15px] font-medium text-[#ff3340] md:text-[17px]">
              {item.currency} {newPrice.toLocaleString("en-US")}
             </span>

             {oldPrice > newPrice && (
              <span className="text-[13px] font-medium text-[#303030] line-through md:text-[15px]">
               {item.currency} {oldPrice.toLocaleString("en-US")}
              </span>
             )}
            </div>

            {/* ADD TO CART */}
            <div className="flex flex-col md:flex-row gap-2 md:h-8 h-12 text-xs">
             {item.status === "sold_out" ? (
              <button type="button" disabled className="py-1 rounded-full h-full w-full cursor-not-allowed bg-[#d5d5d5] text-[#666]">
               SOLD OUT
              </button>
             ) : (
              <button
               type="button"
               onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();

                handleAddToCart(item, e.currentTarget);
               }}
               className="py-1 rounded-full h-full w-full bg-[#ffff] border border-[#2222] text-black transition">
               ADD TO CART
              </button>
             )}
             {item.status === "sold_out" ? (
              <button type="button" disabled className="py-1 rounded-full h-full w-full cursor-not-allowed bg-[#d5d5d5] text-[#666]">
               SOLD OUT
              </button>
             ) : (
              <button
               type="button"
               onClick={() => handleOrderNow(item)}
               className="py-1 h-full w-full bg-[#113766] rounded-full text-white transition hover:bg-[#222]">
               ORDER NOW
              </button>
             )}
            </div>
           </div>
          </div>
         );
        })}
       </div>
      </section>
     ))}
    </div>
   </div>
   {selectedWatch && country === "SG" && (
    <OrderNowPopperSG
     watch={selectedWatch}
     isOpen={isOrderNowOpen}
     onClose={() => {
      setIsOrderNowOpen(false);
      setSelectedWatch(null);
     }}
    />
   )}{" "}
   {selectedWatch && country === "MY" && (
    <OrderNowPopperMY
     watch={selectedWatch}
     isOpen={isOrderNowOpen}
     onClose={() => {
      setIsOrderNowOpen(false);
      setSelectedWatch(null);
     }}
    />
   )}
  </section>
 );
}

LimitedDeals.Layout = "Default";
