"use client";

import Link from "next/link";
import React, { useEffect, useState } from "react";

const brands = [
 {
  name: "SEIKO",
  image: "https://www.citychain.com.sg/cdn/shop/files/SEIKO_LOGO.png?v=1763439653&width=600",
 },
 {
  name: "ALBA",
  image: "https://www.citychain.com.sg/cdn/shop/files/ALBA_LOGO.png?v=1763439646&width=600",
 },
 {
  name: "SOLVIL ET TITUS",
  image: "https://www.citychain.com.sg/cdn/shop/files/TITUS_LOGO.png?v=1763439653&width=600",
 },
 {
  name: "ellesse",
  image: "https://www.citychain.com.sg/cdn/shop/files/ellesse_logo_1.png?v=1775443532&width=600",
 },
 {
  name: "CITIZEN",
  image: "https://www.citychain.com.sg/cdn/shop/files/CITIZEN_LOGO.png?v=1763439653&width=600",
 },
 {
  name: "CASIO",
  image: "https://www.citychain.com.sg/cdn/shop/files/CASIO_LOGO.png?v=1763439652&width=600",
 },
];
const collections = [
 {
  title: "FOR HER",
  description: "Elegant timepieces crafted for the modern woman",
  href: "search?q=women",
  image: "https://www.citychain.com.sg/cdn/shop/files/Screenshot2021-10-21at15.40.24_288e74c0-e903-4b30-a621-34966b05c216.png?v=1786468725&width=1200",
 },
 {
  title: "FOR HIM",
  description: "Precision and style for the discerning gentleman",
  href: "search?q=men",
  image: "https://www.citychain.com.sg/cdn/shop/files/Image_20260723131823.jpg?v=1786468725&width=1200",
 },
];
const brandsWatch = ["TITUS", "ELLESSE", "SEIKO", "ALBA", "CITIZEN", "G-SHOCK", "BABY-G", "CASIO", "SOLVIL ET TITUS", "ELLESSE"];
const benefits = ["100% Authentic", "Free Delivery", "Watch Servicing", "Membership"];
const HomePage = () => {
 return (
  <div className="">
   <section className="w-full">
    <Link href="/search?q=G-Shock">
     <img className="w-full" src="https://www.citychain.com.sg/cdn/shop/files/Homepage_GG-B100XMH-5A_PC.jpg?v=1788841134&width=1920" alt="" />
    </Link>
   </section>
   <section className="w-full">
    <Link href="/search?q=seiko">
     {" "}
     <img className="w-full" src="https://www.citychain.com.sg/cdn/shop/files/Main_Visual_Thumbnail-scaled-1.jpg?v=1788232114&width=1920" alt="" />
    </Link>
   </section>
   <section className="w-full overflow-hidden bg-[#1c1c1c]">
    <div className="relative flex h-[54px] w-full items-center overflow-hidden border-y border-white">
     <div className="animate-marquee flex w-max shrink-0 items-center whitespace-nowrap">
      {[...brandsWatch, ...brandsWatch].map((brand, index) => (
       <React.Fragment key={`${brand}-${index}`}>
        <span className="font-serif text-[18px] font-semibold tracking-[0.08em] text-[#bdbdbd] md:text-[22px]">{brand}</span>

        <span className="mx-[24px] text-[12px] text-black md:mx-[28px] md:text-[14px]">•</span>
       </React.Fragment>
      ))}
     </div>
    </div>
   </section>
   {/* FOR */}
   <section className="mt-8 w-full max-w-full overflow-hidden bg-white">
    <div className="grid w-full grid-cols-1 md:grid-cols-2">
     {collections.map((item) => (
      <Link
       key={item.title}
       href={item.href}
       className="
              group
              relative
              block
              h-[420px]
              w-full
              overflow-hidden
              md:h-[570px]
            ">
       {/* IMAGE */}
       <img
        src={item.image}
        alt={item.title}
        className="
                h-full w-full object-cover
                transition-transform
                duration-700
                ease-out
                group-hover:scale-[1.02]
              "
       />

       {/* GRADIENT */}
       <div
        className="
                pointer-events-none
                absolute
                inset-0
                bg-gradient-to-t
                from-black/65
                via-black/10
                to-transparent
              "
       />

       {/* CONTENT */}
       <div
        className="
                absolute
                bottom-[40px]
                left-[30px]
                right-[30px]
                z-10
                text-white
                md:bottom-[65px]
                md:left-[60px]
                md:right-[60px]
              ">
        <h2
         className="
                  font-serif
                  text-[42px]
                  font-normal
                  leading-none
                  tracking-[-0.02em]
                  md:text-[56px]
                ">
         {item.title}
        </h2>

        <p
         className="
                  mt-[18px]
                  max-w-[470px]
                  text-[15px]
                  font-medium
                  leading-[1.45]
                  md:mt-[20px]
                  md:text-[18px]
                ">
         {item.description}
        </p>
       </div>
      </Link>
     ))}
    </div>
   </section>
   <section className="w-full bg-white">
    {/* =====================================================
          TITLE
      ====================================================== */}
    <div className="px-[16px] pt-[30px] text-center md:px-[30px] md:pt-[55px]">
     <h2 className="font-serif text-[26px] font-bold uppercase leading-none md:text-[48px]">OUR BRANDS</h2>

     <p className="mt-[10px] text-[11px] leading-[1.5] md:mt-[18px] md:text-[20px]">Discover our curated collection of premium watch brands</p>
    </div>

    {/* =====================================================
          BRANDS
      ====================================================== */}
    <div className="px-[16px] py-[28px] md:px-[23px] md:py-[55px]">
     <div className="grid grid-cols-2 gap-[10px] md:grid-cols-6 md:gap-[25px]">
      {brands.map((brand) => (
       <div
        key={brand.name}
        className="
                flex
                aspect-square
                w-full
                items-center
                justify-center
                overflow-hidden
                rounded-[9px]
                border
                border-[#e5e3df]
                bg-white
                p-[25px]
                md:p-[35px]
              ">
        <img src={brand.image} alt={brand.name} width={300} height={200} className="h-auto max-h-[55%] w-auto max-w-[90%] object-contain" />
       </div>
      ))}
     </div>
    </div>

    {/* =====================================================
          BENEFITS
      ====================================================== */}
    <div className="px-[16px] pb-[30px] md:px-[12%] md:pb-[20px]">
     <div className="grid grid-cols-2 gap-[10px] md:grid-cols-4 md:gap-[19px]">
      {benefits.map((benefit) => (
       <div
        key={benefit}
        className="
                flex
                min-h-[42px]
                items-center
                justify-center
                border
                border-[#dca900]
                px-[10px]
                py-[10px]
                text-center
                text-[9px]
                md:min-h-[64px]
                md:text-[16px]
              ">
        {benefit}
       </div>
      ))}
     </div>
    </div>
   </section>
  </div>
 );
};
export default HomePage;
HomePage.Layout = "Default";
// HomePage.Layout = "OtherLayout"; -> error Type '"OtherLayout"' is not assignable to type '"Main" | "Admin" | undefined'.
