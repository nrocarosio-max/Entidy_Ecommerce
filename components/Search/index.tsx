"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { FaSearch, FaTimes } from "react-icons/fa";

interface SearchProps {
 isOpen: boolean;
 onClose: () => void;
}

export default function Search({ isOpen, onClose }: SearchProps) {
 const router = useRouter();

 const [keyword, setKeyword] = useState("");

 if (!isOpen) return null;

 /* =========================================================
     SEARCH
  ========================================================= */

 const handleSearch = (value: string) => {
  const searchKeyword = value.trim();

  if (!searchKeyword) return;

  setKeyword("");
  onClose();

  router.push(`/search?q=${encodeURIComponent(searchKeyword)}`);
 };

 /* =========================================================
     FORM SUBMIT
  ========================================================= */

 const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault();

  handleSearch(keyword);
 };

 /* =========================================================
     SHORTCUT
  ========================================================= */

 const handleShortcut = (value: string) => {
  setKeyword(value);
  handleSearch(value);
 };

 /* =========================================================
     CLICK OUTSIDE
  ========================================================= */

 const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
  if (e.target === e.currentTarget) {
   onClose();
  }
 };

 return (
  <div className="fixed inset-0 z-[9999] flex items-start justify-center" onMouseDown={handleOverlayClick}>
   {/* SEARCH BOX */}

   <div className="relative top-[72px] w-[calc(100%-24px)] max-w-[470px] rounded-2xl bg-white p-5 shadow-xl" onMouseDown={(e) => e.stopPropagation()}>
    {/* CLOSE */}

    <button type="button" onClick={onClose} className="absolute right-4 top-4 cursor-pointer text-xl" aria-label="Close search">
     <FaTimes />
    </button>

    {/* SEARCH */}

    <form onSubmit={handleSubmit} className="flex h-[44px] items-center rounded-full bg-[#f5f5f5] px-4 md:h-[38px]">
     <FaSearch className="mr-2 shrink-0 text-sm text-[#666]" />

     <input
      name="search"
      type="text"
      value={keyword}
      onChange={(e) => setKeyword(e.target.value)}
      placeholder="Search"
      autoFocus
      className="w-full appearance-none border-0 bg-transparent text-[16px] leading-none outline-none focus:border-0 focus:outline-none focus:ring-0 md:text-sm"
     />
    </form>

    {/* =====================================================
          SHORTCUTS
      ===================================================== */}

    <div className="mt-5">
     <h3 className="mb-5 text-sm font-bold text-primary">Shortcuts</h3>

     <div className="flex flex-col gap-3 text-sm text-[#525354]">
      <button type="button" onClick={() => handleShortcut("Casio")} className="cursor-pointer text-left hover:text-primary">
       Casio
      </button>

      <button type="button" onClick={() => handleShortcut("G-Shock")} className="cursor-pointer text-left hover:text-primary">
       G-Shock
      </button>

      <button type="button" onClick={() => handleShortcut("Seiko")} className="cursor-pointer text-left hover:text-primary">
       Seiko
      </button>

      <button type="button" onClick={() => handleShortcut("Swatch")} className="cursor-pointer text-left hover:text-primary">
       Swatch
      </button>

      <button type="button" onClick={() => handleShortcut("Tissot")} className="cursor-pointer text-left hover:text-primary">
       Tissot
      </button>

      <button type="button" onClick={() => handleShortcut("MEN")} className="cursor-pointer text-left hover:text-primary">
       Men&apos;s watch
      </button>

      <button type="button" onClick={() => handleShortcut("WOMEN")} className="cursor-pointer text-left hover:text-primary">
       Women&apos;s watch
      </button>

      <button type="button" onClick={() => handleShortcut("UNISEX")} className="cursor-pointer text-left hover:text-primary">
       Unisex watch
      </button>
     </div>
    </div>
   </div>
  </div>
 );
}
