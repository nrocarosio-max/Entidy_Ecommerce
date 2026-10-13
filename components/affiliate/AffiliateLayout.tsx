"use client";

import Link from "next/link";
import { useRouter } from "next/router";
import { createContext, useContext, useState, type ReactNode } from "react";
import { signOut, useSession } from "next-auth/react";
import { FaArrowLeft, FaChartLine, FaChevronDown, FaUserCircle } from "react-icons/fa";

interface AffiliateUser {
 id?: string;
 name?: string | null;
 email?: string | null;
 role?: string;
}

interface AffiliateAuthContextType {
 user: AffiliateUser | null;
 loading: boolean;
 logout: () => Promise<void>;
}

const AffiliateAuthContext = createContext<AffiliateAuthContextType | null>(null);

export function useAffiliateAuth() {
 const context = useContext(AffiliateAuthContext);

 if (!context) {
  throw new Error("useAffiliateAuth must be used inside AffiliateLayout");
 }

 return context;
}

interface AffiliateLayoutProps {
 children: ReactNode;
}

const CLIENT_URL = process.env.NEXT_PUBLIC_CLIENT_URL || "/";
const LOGIN_URL = "/admin/login";

export default function AffiliateLayout({ children }: AffiliateLayoutProps) {
 const router = useRouter();

 const { data: session, status } = useSession();

 const [loggingOut, setLoggingOut] = useState(false);
 const [menuOpen, setMenuOpen] = useState(false);

 const loading = status === "loading";

 const user: AffiliateUser | null = session?.user
  ? {
     id: session.user.id,
     name: session.user.name,
     email: session.user.email,
     role: session.user.role as string | undefined,
    }
  : null;

 const displayName = user?.name?.trim() || user?.email || "Affiliate";

 const logout = async () => {
  if (loggingOut) return;

  try {
   setLoggingOut(true);
   setMenuOpen(false);

   await signOut({
    callbackUrl: LOGIN_URL,
   });
  } catch (error) {
   console.error("Logout failed:", error);
   window.alert("Đăng xuất thất bại. Vui lòng thử lại.");
  } finally {
   setLoggingOut(false);
  }
 };

 const authValue: AffiliateAuthContextType = {
  user,
  loading,
  logout,
 };

 return (
  <AffiliateAuthContext.Provider value={authValue}>
   <div className="min-h-screen bg-slate-50 text-slate-800">
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white shadow-sm">
     <div className="mx-auto flex min-h-[72px] max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
      {/* Brand */}
      <Link href="/affiliate" className="flex shrink-0 items-center gap-3">
       <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white">
        <FaChartLine size={19} />
       </div>

       <div>
        <h1 className="text-lg font-bold tracking-tight text-slate-900">Affiliate Center</h1>
        <p className="hidden text-xs text-slate-500 sm:block">Trung tâm cộng tác viên</p>
       </div>
      </Link>

      {/* Header actions */}
      <div className="flex items-center gap-3">
       {/* Back to client website */}
       <a
        href={CLIENT_URL}
        className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium transition hover:border-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 sm:px-4">
        <FaArrowLeft size={12} />
        <span className="hidden sm:inline">Quay lại website</span>
        <span className="sm:hidden">Website</span>
       </a>

       {loading ? (
        <div className="h-10 w-28 animate-pulse rounded-lg bg-slate-100" />
       ) : user ? (
        <div className="relative">
         <button
          type="button"
          onClick={() => setMenuOpen((prev) => !prev)}
          className="flex items-center gap-2 rounded-lg px-2 py-2 transition hover:bg-slate-100 sm:px-3"
          aria-expanded={menuOpen}
          aria-haspopup="menu">
          <FaUserCircle size={24} className="shrink-0 text-emerald-600" />

          <span className="hidden max-w-36 truncate text-sm font-semibold sm:block">{displayName}</span>

          <FaChevronDown size={11} className={`transition-transform ${menuOpen ? "rotate-180" : ""}`} />
         </button>

         {menuOpen && (
          <>
           <button type="button" aria-label="Đóng menu tài khoản" className="fixed inset-0 z-40 cursor-default" onClick={() => setMenuOpen(false)} />

           <div role="menu" className="absolute right-0 top-full z-50 mt-2 w-64 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
            <div className="border-b border-slate-100 px-4 py-3">
             <p className="truncate text-sm font-semibold text-slate-900">{displayName}</p>

             {user.email && <p className="mt-1 truncate text-xs text-slate-500">{user.email}</p>}

             <span className="mt-2 inline-block rounded-full bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700">Affiliate</span>
            </div>

            <button
             type="button"
             role="menuitem"
             disabled={loggingOut}
             onClick={() => void logout()}
             className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-50">
             <FaArrowLeft size={15} />
             {loggingOut ? "Đang đăng xuất..." : "Đăng xuất"}
            </button>
           </div>
          </>
         )}
        </div>
       ) : (
        <Link
         href={{
          pathname: LOGIN_URL,
          query: { next: router.asPath },
         }}
         className="rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700">
         Đăng nhập
        </Link>
       )}
      </div>
     </div>
    </header>

    <main className="mx-auto min-h-[calc(100vh-72px)] max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">{children}</main>

    <footer className="border-t border-slate-200 bg-white">
     <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 py-5 text-center text-xs text-slate-500 sm:flex-row sm:px-6 lg:px-8">
      <p>© {new Date().getFullYear()} Affiliate Center. All rights reserved.</p>

      <a href={CLIENT_URL} className="font-medium transition hover:text-emerald-700">
       Trở về website mua hàng
      </a>
     </div>
    </footer>
   </div>
  </AffiliateAuthContext.Provider>
 );
}
