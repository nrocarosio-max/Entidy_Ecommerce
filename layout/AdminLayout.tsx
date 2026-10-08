import { ReactNode, useState } from "react";
import { useSession } from "next-auth/react";
import { FaTimes } from "react-icons/fa";

import AdminSidebar from "~/components/admin/AdminSidebar";
import AdminHeader from "~/components/admin/AdminHeader";

interface AdminLayoutProps {
 children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
 const { data: session } = useSession();

 const [sidebarOpen, setSidebarOpen] = useState(false);

 const user = session?.user;

 const permissions = user?.permissions ?? [];

 return (
  <div className="flex min-h-screen bg-gray-50">
   {/* Desktop Sidebar */}
   <div className="hidden lg:flex">
    <AdminSidebar permissions={permissions} />
   </div>

   {/* Mobile Sidebar */}
   {sidebarOpen && (
    <div className="fixed inset-0 z-[100] flex lg:hidden">
     {/* Overlay */}
     <button type="button" aria-label="Close menu" onClick={() => setSidebarOpen(false)} className="absolute inset-0 bg-black/40" />

     {/* Sidebar */}
     <div className="relative z-10 flex h-full">
      <AdminSidebar permissions={permissions} onClose={() => setSidebarOpen(false)} />

      <button
       type="button"
       onClick={() => setSidebarOpen(false)}
       className="absolute right-[-48px] top-4 flex h-10 w-10 items-center justify-center rounded-xl bg-white text-gray-600 shadow-lg transition hover:bg-gray-100 hover:text-gray-900"
       aria-label="Close menu">
       <FaTimes size={15} />
      </button>
     </div>
    </div>
   )}

   {/* Main */}
   <div className="flex min-w-0 flex-1 flex-col">
    <AdminHeader userName={user?.name ?? "Admin"} userEmail={user?.email ?? ""} userRole={user?.role ?? ""} onMenuClick={() => setSidebarOpen(true)} />

    <main className="min-w-0 flex-1">{children}</main>
   </div>
  </div>
 );
}
