"use client";

import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { useState } from "react";
import { FiLogOut, FiArrowLeft, FiUser } from "react-icons/fi";

export default function PosHeader() {
 const { data: session, status } = useSession();
 const router = useRouter();
 const [isLoggingOut, setIsLoggingOut] = useState(false);

 const handleLogout = async () => {
  if (isLoggingOut) return;

  setIsLoggingOut(true);

  try {
   await signOut({
    redirect: false,
   });

   await router.replace("/admin/login");
  } catch (error) {
   console.error("POS logout error:", error);
   setIsLoggingOut(false);
  }
 };

 return (
  <header className="sticky top-0 z-50 border-b border-gray-200 bg-white shadow-sm">
   <div className="flex min-h-16 items-center justify-between gap-4 px-4 py-3 md:px-6">
    <div className="flex min-w-0 items-center gap-3">
     <button
      type="button"
      onClick={() => router.push("/admin")}
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-gray-200 text-gray-600 transition hover:bg-gray-100"
      title="Quay lại trang quản trị"
      aria-label="Quay lại trang quản trị">
      <FiArrowLeft size={20} />
     </button>

     <div className="min-w-0">
      <h1 className="text-lg font-bold text-gray-900 md:text-xl">POS</h1>
      <p className="text-xs text-gray-500">Hệ thống bán hàng tại cửa hàng</p>
     </div>
    </div>

    <div className="flex shrink-0 items-center gap-3">
     {status === "loading" ? (
      <span className="text-sm text-gray-500">Đang tải...</span>
     ) : session?.user ? (
      <div className="flex items-center gap-2">
       <div className="hidden text-right sm:block">
        <p className="max-w-40 truncate text-sm font-semibold text-gray-800">{session.user.name || session.user.email}</p>
        <p className="text-xs text-gray-500">{session.user.role}</p>
       </div>

       <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-600">
        <FiUser size={18} />
       </div>

       <button
        type="button"
        onClick={handleLogout}
        disabled={isLoggingOut}
        className="flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60">
        <FiLogOut size={17} />
        <span>{isLoggingOut ? "Đang đăng xuất..." : "Đăng xuất"}</span>
       </button>
      </div>
     ) : (
      <button
       type="button"
       onClick={() => router.push("/admin/login")}
       className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-700">
       Đăng nhập
      </button>
     )}
    </div>
   </div>
  </header>
 );
}
