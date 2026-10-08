"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { FaFacebookF, FaInstagram, FaPlus, FaMinus } from "react-icons/fa";

interface FooterSectionProps {
 title: string;
 links: {
  label: string;
  href: string;
 }[];
 isOpen: boolean;
 onToggle: () => void;
}

const FooterSection = ({ title, links, isOpen, onToggle }: FooterSectionProps) => {
 return (
  <div className="border-b border-[#eeeeee] md:border-none">
   {/* Mobile heading */}
   <button type="button" onClick={onToggle} className="flex w-full items-center justify-between py-[20px] md:hidden">
    <span className="text-[11px] font-semibold tracking-[0.02em]">{title}</span>

    {isOpen ? <FaMinus className="text-[10px]" /> : <FaPlus className="text-[10px]" />}
   </button>

   {/* Desktop heading */}
   <h3 className="hidden text-[18px] font-semibold md:block">{title}</h3>

   {/* Links */}
   <div
    className={`
          overflow-hidden transition-all duration-300
          md:mt-[20px] md:max-h-none md:opacity-100
          ${isOpen ? "max-h-[300px] pb-[20px] opacity-100" : "max-h-0 opacity-0"}
        `}>
    <div className="flex flex-col gap-[17px]">
     {links.map((link) => (
      <Link key={link.label} href={link.href} className="w-fit text-[14px] leading-[1.4] transition-opacity duration-200 hover:opacity-60 md:text-[16px]">
       {link.label}
      </Link>
     ))}
    </div>
   </div>
  </div>
 );
};

const Footer = () => {
 const [openSection, setOpenSection] = useState<string | null>(null);

 const toggleSection = (section: string) => {
  setOpenSection((current) => (current === section ? null : section));
 };

 const shopLinks = [
  {
   label: "New Arrivals",
   href: "/new-arrivals",
  },
  {
   label: "Best Sellers",
   href: "/best-sellers",
  },
  {
   label: "Men",
   href: "/men",
  },
  {
   label: "Women",
   href: "/women",
  },
  {
   label: "Sale",
   href: "/sale",
  },
  {
   label: "Gift Cards",
   href: "/gift-cards",
  },
 ];

 const serviceLinks = [
  {
   label: "Store Locations",
   href: "/store-locations",
  },
  {
   label: "Membership",
   href: "/membership",
  },
  {
   label: "Support",
   href: "/support",
  },
  {
   label: "FAQs",
   href: "/faqs",
  },
  {
   label: "Payments",
   href: "/payments",
  },
 ];

 const aboutLinks = [
  {
   label: "Our Story",
   href: "/our-story",
  },
  {
   label: "Terms of Use",
   href: "/terms-of-use",
  },
  {
   label: "Privacy Policy",
   href: "/privacy-policy",
  },
  {
   label: "Refund Policy",
   href: "/refund-policy",
  },
 ];

 return (
  <footer className="w-full max-w-full overflow-x-hidden bg-white text-black">
   {/* =====================================================
          MAIN FOOTER
      ====================================================== */}
   <div className="border-t border-[#eeeeee]">
    <div className="container py-12">
     <div className="grid grid-cols-1 md:grid-cols-[1.4fr_1fr_1fr_1fr] md:gap-[50px] lg:gap-[80px]">
      {/* =================================================
                BRAND
            ================================================== */}
      <div className="flex flex-col">
       {/* Logo */}
       <Link href="/" className="mb-[28px] mx-auto md:mx-0 block w-fit" aria-label="City Chain">
        <img
         src="https://www.citychain.com.sg/cdn/shop/files/City_chain_vertical_black_e42ca006-13c4-4b5c-8d30-edc84053830e.png?v=1786501822&width=400"
         alt="City Chain"
         width={190}
         height={170}
         className="h-auto w-[190px] object-contain"
        />
       </Link>

       {/* Description */}
       <p className="max-w-[420px] text-[14px] leading-[1.7] md:text-[17px] md:leading-[1.7]">
        City Chain is one of Asia&apos;s leading watch retailers, bringing together a curated selection of international watch brands for every style and
        occasion.
       </p>

       {/* Social */}
       <div className="mt-[27px] flex items-center gap-[25px]">
        <Link href="#" aria-label="Facebook" className="transition-opacity duration-200 hover:opacity-60">
         <FaFacebookF className="text-[20px]" />
        </Link>

        <Link href="#" aria-label="Instagram" className="transition-opacity duration-200 hover:opacity-60">
         <FaInstagram className="text-[21px]" />
        </Link>
       </div>
      </div>

      {/* =================================================
                SHOP
            ================================================== */}
      <FooterSection title="SHOP" links={shopLinks} isOpen={openSection === "shop"} onToggle={() => toggleSection("shop")} />

      {/* =================================================
                SERVICE
            ================================================== */}
      <FooterSection title="SERVICE" links={serviceLinks} isOpen={openSection === "service"} onToggle={() => toggleSection("service")} />

      {/* =================================================
                ABOUT
            ================================================== */}
      <FooterSection title="ABOUT" links={aboutLinks} isOpen={openSection === "about"} onToggle={() => toggleSection("about")} />
     </div>
    </div>
   </div>

   {/* =====================================================
          COPYRIGHT
      ====================================================== */}
   <div className="border-t border-[#eeeeee]">
    <div className="flex min-h-[110px] items-center justify-center px-[20px] md:min-h-[190px]">
     <p className="text-center text-[9px] md:text-[14px]">© 2026 City Chain</p>
    </div>
   </div>
  </footer>
 );
};

export default Footer;
