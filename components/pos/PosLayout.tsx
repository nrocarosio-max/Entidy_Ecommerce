import { ReactNode, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { FaBars, FaSignOutAlt, FaTimes } from "react-icons/fa";

import PosSidebar from "~/components/pos/PosSidebar";

interface PosLayoutProps {
 children: ReactNode;
}

export default function PosLayout({ children }: PosLayoutProps) {
 const { data: session } = useSession();
 const [sidebarOpen, setSidebarOpen] = useState(false);

 const user = session?.user;
 const permissions = user?.permissions ?? [];

 return (
  <div className="flex min-h-screen bg-gray-50">
   <div className="hidden lg:flex">
    <PosSidebar permissions={permissions} />
   </div>

   {sidebarOpen && (
    <div className="fixed inset-0 z-[100] flex lg:hidden">
     <button type="button" aria-label="Close menu" onClick={() => setSidebarOpen(false)} className="absolute inset-0 bg-black/40" />

     <div className="relative z-10 flex h-full">
      <PosSidebar permissions={permissions} onClose={() => setSidebarOpen(false)} />

      <button
       type="button"
       onClick={() => setSidebarOpen(false)}
       aria-label="Close sidebar"
       className="absolute right-[-48px] top-4 flex h-10 w-10 items-center justify-center rounded-xl bg-white text-gray-600 shadow-lg hover:bg-gray-100">
       <FaTimes size={15} />
      </button>
     </div>
    </div>
   )}

   <div className="flex min-w-0 flex-1 flex-col">
    <header className="sticky top-0 z-30 flex h-[72px] items-center justify-between border-b border-gray-100 bg-white px-5">
     <div className="flex items-center gap-3">
      <button type="button" onClick={() => setSidebarOpen(true)} aria-label="Open menu" className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 lg:hidden">
       <FaBars size={16} />
      </button>

      <div>
       <p className="text-sm font-semibold text-gray-900">Store Management</p>
       <p className="text-[11px] text-gray-400">Manage your store operations</p>
      </div>
     </div>

     <div className="flex items-center gap-4">
      <div className="hidden text-right sm:block">
       <p className="text-sm font-semibold text-gray-800">{user?.name ?? "Store User"}</p>
       <p className="text-xs text-gray-400">{user?.email ?? ""}</p>
      </div>

      <button
       type="button"
       onClick={() => signOut({ callbackUrl: "/admin/login" })}
       className="flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-600 transition hover:bg-gray-50 hover:text-gray-900">
       <FaSignOutAlt size={14} />
       <span className="hidden sm:inline">Logout</span>
      </button>
     </div>
    </header>

    <main className="min-w-0 flex-1">{children}</main>
   </div>
  </div>
 );
}
