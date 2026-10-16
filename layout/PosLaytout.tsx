import { ReactNode, useState } from "react";
import { useSession } from "next-auth/react";
import { FaBars, FaTimes } from "react-icons/fa";

import PosSidebar from "~/components/pos/PosSidebar";
import PosHeader from "~/components/pos/PosHeader";

interface PosLayoutProps {
 children: ReactNode;
}

export default function PosLayout({ children }: PosLayoutProps) {
 const { data: session } = useSession();
 const [sidebarOpen, setSidebarOpen] = useState(false);

 const user = session?.user;
 const permissions = user?.permissions ?? [];

 return (
  <div className="min-h-screen bg-gray-50">
   {/* Header */}
   <PosHeader />

   <div className="flex min-h-[calc(100vh-64px)]">
    {/* Desktop Sidebar */}
    <aside className="hidden w-64 shrink-0 border-r border-gray-200 bg-white lg:block">
     <PosSidebar permissions={permissions} />
    </aside>

    {/* Mobile Sidebar */}
    {sidebarOpen && (
     <div className="fixed inset-0 z-[100] flex lg:hidden">
      {/* Overlay */}
      <button type="button" aria-label="Đóng menu" onClick={() => setSidebarOpen(false)} className="absolute inset-0 bg-black/40" />

      {/* Sidebar */}
      <div className="relative z-10 flex h-full">
       <PosSidebar permissions={permissions} onClose={() => setSidebarOpen(false)} />

       <button
        type="button"
        onClick={() => setSidebarOpen(false)}
        className="absolute right-[-48px] top-4 flex h-10 w-10 items-center justify-center rounded-xl bg-white text-gray-600 shadow-lg transition hover:bg-gray-100 hover:text-gray-900"
        aria-label="Đóng menu">
        <FaTimes size={15} />
       </button>
      </div>
     </div>
    )}

    {/* Main Content */}
    <main className="min-w-0 flex-1">
     {/* Mobile menu button */}
     <div className="border-b border-gray-200 bg-white px-4 py-3 lg:hidden">
      <button
       type="button"
       onClick={() => setSidebarOpen(true)}
       className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100">
       <FaBars size={16} />
       Danh mục POS
      </button>
     </div>

     <div className="p-4 md:p-6">{children}</div>
    </main>
   </div>
  </div>
 );
}
