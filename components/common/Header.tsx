"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { AiOutlineGlobal } from "react-icons/ai";
import Search from "~/components/Search";
import { HiSearch } from "react-icons/hi";
import { FaBars, FaUser } from "react-icons/fa";
import { useRouter } from "next/router";
import CartHeader from "~/components/common/CartHeader";
import Logo from "./Logo";

const Header = () => {
 const router = useRouter();

 // Handle logic
 const handleMenuChange = (menuItem: any) => {
  switch (menuItem.type) {
   case "language":
    // Handle change language
    break;
   default:
  }
 };
 // Handle logic

 const [isOpenMenu, setIsOpenMenu] = useState(false);
 const [isSearchOpen, setIsSearchOpen] = useState(false);

 useEffect(() => {
  setIsOpenMenu(false);
 }, [router.asPath]);
 return (
  <header className="fixed top-0 left-0 z-[99999] w-full text-[#303234] text-lg bg-white">
   <Search isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
   <div className="h-[68px] w-full bg-white container flex items-center justify-between sm:px-0 mx-0">
    {/* Menu */}
    <button onClick={() => setIsOpenMenu(true)} className="flex gap-1 justify-between items-center">
     <FaBars />
     <span className="hidden lg:block font-medium">Menu</span>
    </button>

    {/* Logo */}
    <Link href="/" className="absolute left-1/2 -translate-x-1/2">
     <Logo />
    </Link>

    {/* Search */}
    <div className="flex gap-4 text-sm font-medium">
     <button onClick={() => setIsSearchOpen(true)} className="flex items-center justify-center gap-1">
      <HiSearch size={22} />
      <span className="hidden lg:block">Search</span>
     </button>
     <CartHeader />
     <Link href="/order/my-orders" className="flex items-center gap-1">
      <FaUser size={18} />
      <span className="hidden lg:block">Me</span>
     </Link>
    </div>
   </div>

   {/* Menu hidden */}
   <div
    className={`fixed z-[999999] top-0 left-0 h-full bg-white
    transition-transform duration-500 ease-in-out
    ${isOpenMenu ? "translate-x-0" : "-translate-x-full"}
  `}>
    <ul className="p-6 md:p-24 flex flex-col gap-3">
     <li className="text-xl font-bold text-[#127749]">
      <Link href="/limited-deals">Limited Deals</Link>
     </li>

     <li>
      <Link href="" className="flex items-center gap-2 mt-8 hover:text-[#127749]">
       <AiOutlineGlobal />
       <span>English</span>
      </Link>
     </li>
     <li className="mt-2">
      <span className="hover:text-[#127749]">Store locator</span>
     </li>

     <Link href="/" className="flex justify-center py-4">
      <img className="h-[46px]" src="/logo/City-Chain-logo_69c45490-3cd8-4813-9505-4e175fb3c2f7_400x.avif" alt="" />
     </Link>
    </ul>

    {/* Button close */}

    <button
     onClick={() => setIsOpenMenu(false)}
     className={`absolute top-8 left-full ml-4
                w-12 h-12 rounded-full
                flex items-center justify-center bg-white inset-shadow-2xs ${isOpenMenu ? "block" : "hidden"}`}>
     X
    </button>
   </div>
  </header>
 );
};

export default Header;
