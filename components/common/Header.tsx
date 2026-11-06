"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AiOutlineGlobal } from "react-icons/ai";
import { HiSearch } from "react-icons/hi";
import { FaBars, FaUser } from "react-icons/fa";
import { useRouter } from "next/router";

import Search from "~/components/Search";
import CartHeader from "~/components/common/CartHeader";
import Logo from "./Logo";

const Header = () => {
 const router = useRouter();

 const [isOpenMenu, setIsOpenMenu] = useState(false);
 const [isSearchOpen, setIsSearchOpen] = useState(false);

 useEffect(() => {
  setIsOpenMenu(false);
 }, [router.asPath]);

 const navigationItems = [
  { name: "Trang chủ", href: "/" },
  { name: "Chăm sóc da", href: "/categories/skincare" },
  { name: "Trang điểm", href: "/categories/makeup" },
  { name: "Chăm sóc cơ thể", href: "/categories/body-care" },
  { name: "Liên hệ", href: "/contact" },
 ];

 return (
  <header className="fixed top-0 left-0 z-[99999] w-full bg-white text-[#303234] text-lg">
   <Search isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />

   <div className="relative container mx-0 flex h-[68px] w-full items-center justify-between bg-white sm:px-0">
    {/* Mobile: Menu button */}
    <button onClick={() => setIsOpenMenu(true)} className="flex items-center justify-center gap-2 md:hidden" aria-label="Mở menu">
     <FaBars size={20} />
    </button>

    {/* Logo */}
    <Link href="/" className="absolute left-1/2 -translate-x-1/2 md:static md:left-auto md:translate-x-0">
     <Logo />
    </Link>

    {/* Desktop Navigation */}
    <nav className="hidden md:absolute md:left-1/2 md:flex md:-translate-x-1/2 items-center gap-6 lg:gap-9 text-[13px] whitespace-nowrap">
     {navigationItems.map((item) => (
      <Link key={item.href} href={item.href} className="transition-colors hover:text-[#cf607d]">
       {item.name}
      </Link>
     ))}
    </nav>

    {/* Right Actions */}
    <div className="ml-auto flex items-center gap-3 text-sm font-medium md:gap-4">
     {/* Search */}
     <button onClick={() => setIsSearchOpen(true)} className="flex items-center justify-center gap-1" aria-label="Tìm kiếm">
      <HiSearch size={22} />
      <span className="hidden lg:block">Search</span>
     </button>

     {/* Cart */}
     <CartHeader />

     {/* My Account */}
     <Link href="/order/my-orders" className="flex items-center gap-1">
      <FaUser size={18} />
      <span className="hidden lg:block">Me</span>
     </Link>
    </div>
   </div>

   {/* Mobile Menu Overlay */}
   <div
    onClick={() => setIsOpenMenu(false)}
    className={`fixed inset-0 z-[999998] bg-black/40 transition-opacity duration-300 md:hidden ${isOpenMenu ? "visible opacity-100" : "invisible opacity-0"}`}
   />

   {/* Mobile Menu Drawer */}
   <div
    className={`fixed left-0 top-0 z-[999999] h-full w-[300px] max-w-[85vw] bg-white shadow-xl transition-transform duration-500 ease-in-out md:hidden ${
     isOpenMenu ? "translate-x-0" : "-translate-x-full"
    }`}>
    {/* Menu Header */}
    <div className="flex h-[68px] items-center justify-between border-b px-6">
     <span className="text-lg font-semibold">Menu</span>

     <button onClick={() => setIsOpenMenu(false)} className="flex h-9 w-9 items-center justify-center text-2xl" aria-label="Đóng menu">
      &times;
     </button>
    </div>

    {/* Navigation */}
    <nav className="px-6 py-8">
     <ul className="flex flex-col gap-6">
      {navigationItems.map((item) => (
       <li key={item.href}>
        <Link href={item.href} onClick={() => setIsOpenMenu(false)} className="block text-[15px] font-medium transition-colors hover:text-[#cf607d]">
         {item.name}
        </Link>
       </li>
      ))}
     </ul>

     <div className="my-8 border-t" />

     {/* Other Menu Items */}
     <ul className="flex flex-col gap-5">
      <li>
       <Link href="/limited-deals" onClick={() => setIsOpenMenu(false)} className="font-semibold text-[#127749]">
        Limited Deals
       </Link>
      </li>

      <li>
       <Link href="" className="flex items-center gap-2 text-sm hover:text-[#cf607d]">
        <AiOutlineGlobal size={18} />
        <span>English</span>
       </Link>
      </li>

      <li className="text-sm">
       <span>Store locator</span>
      </li>
     </ul>

     {/* Menu Logo */}
     <Link href="/" className="mt-12 flex justify-center">
      <img className="h-[46px]" src="/logo/City-Chain-logo_69c45490-3cd8-4813-9505-4e175fb3c2f7_400x.avif" alt="City Chain" />
     </Link>
    </nav>
   </div>
  </header>
 );
};

export default Header;
