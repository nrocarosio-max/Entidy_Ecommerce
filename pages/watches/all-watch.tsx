"use client";

import Link from "next/link";
import { useState } from "react";
import { FaHeart } from "react-icons/fa";

import type { CityChainWatch } from "~/data/CityChainWatch";
import { useCountry } from "~/context/CountryContext";

export default function AllWatch() {
 const { watches, loading: countryLoading } = useCountry();
 const [visibleCount, setVisibleCount] = useState(9);

 const visibleWatches = watches.slice(0, visibleCount);

 const handleViewMore = () => {
  setVisibleCount((prev) => Math.min(prev + 9, watches.length));
 };

 const getStatusButton = (status: CityChainWatch["status"]) => {
  switch (status) {
   case "available":
    return {
     label: "Available",
     disabled: false,
    };

   case "sold_out":
    return {
     label: "Sold out",
     disabled: true,
    };

   case "coming_soon":
    return {
     label: "Coming soon",
     disabled: true,
    };

   case "discontinued":
    return {
     label: "Discontinued",
     disabled: true,
    };

   default:
    return {
     label: "Unavailable",
     disabled: true,
    };
  }
 };
 if (countryLoading) {
  return (
   <section className="bg-white py-16">
    <div className="container">
     <div className="flex justify-center py-20">
      <p className="text-sm text-[#666]">Loading watches...</p>
     </div>
    </div>
   </section>
  );
 }
 return (
  <section className="bg-white py-16">
   <div className="container">
    {/* HEADER */}

    <div className="mb-10 lg:w-1/3">
     <h2 className="mb-4 text-2xl font-bold md:text-4xl">All watches</h2>

     <p className="leading-relaxed text-[#525354]">Browse the complete Rolex watch collection and discover the model that suits you.</p>
    </div>

    {/* WATCHES */}

    <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
     {visibleWatches.map((item) => {
      const statusButton = getStatusButton(item.status);

      return (
       <Link
        href={item.sourceUrl}
        key={item.id}
        className="group relative min-h-[360px] overflow-hidden bg-[#f4f4f4] md:grid md:h-[310px] md:grid-cols-[55%_45%]">
        {/* FAVORITE */}

        <button
         type="button"
         onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
         }}
         className="absolute left-3 top-3 z-10 md:left-8 md:top-8">
         <FaHeart className="text-[10px] text-primary md:text-xl" />
        </button>

        {/* PRODUCT INFORMATION */}

        <div className="absolute bottom-4 left-3 right-3 z-10 md:static md:ml-8 md:flex md:items-center">
         <div>
          {/* NAME */}

          <h3 className="mb-1 text-[16px] font-bold text-[#303234] line-clamp-1 md:mb-2 md:text-2xl">{item.name}</h3>

          {/* DESCRIPTION */}

          <p className="text-[12px] leading-relaxed line-clamp-1 text-[#525354] md:max-w-[260px] md:text-base">{item.brand}</p>

          {/* REFERENCE */}

          <p className="mt-2 text-[10px] text-[#777] md:text-xs">Reference {item.collection}</p>

          {/* PRICE */}

          <div className="mt-2 flex items-center gap-2 md:mt-3">
           <span className="text-[12px] font-medium md:text-base">
            {item.currency} {(item.priceNew || item.price).toLocaleString()}
           </span>

           <span className="flex h-4 w-4 items-center justify-center rounded-full border border-[#777] text-[9px] text-[#555]">i</span>
          </div>
          <div className="flex items-center">
           <button className="mx-auto md:hidden block py-1 px-4 rounded-[6px] bg-gradient-to-r from-[#075c2d] to-[#008000] text-white font-bold mt-4">
            Buy Now
           </button>
          </div>
         </div>
        </div>

        {/* PRODUCT IMAGE */}

        <div
         className="absolute right-0 top-0 h-[220px] w-full bg-contain bg-center bg-no-repeat transition-transform duration-500 group-hover:scale-105 md:static md:col-start-2 md:h-full"
         style={{
          backgroundImage: `url(${item.images.main})`,
         }}
        />

        {/* STATUS */}

        {item.status === "available" && <span className="absolute bottom-8 left-8 hidden text-sm font-bold text-[#127749] md:block">Available</span>}
       </Link>
      );
     })}
    </div>

    {/* VIEW MORE */}

    {visibleCount < watches.length && (
     <div className="mt-10 flex justify-center">
      <button
       type="button"
       onClick={handleViewMore}
       className="rounded-full bg-[var(--primary-color)] px-8 py-3 font-bold text-white transition hover:opacity-90">
       View more
      </button>
     </div>
    )}
   </div>
  </section>
 );
}
AllWatch.Layout = "Default";
