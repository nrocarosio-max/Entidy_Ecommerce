import { useState } from "react";
import { signOut } from "next-auth/react";
import { FaBars, FaBell, FaChevronDown, FaSignOutAlt, FaUserCircle } from "react-icons/fa";

interface AdminHeaderProps {
 userName?: string;
 userEmail?: string;
 userRole?: string;
 onMenuClick?: () => void;
}

export default function AdminHeader({ userName = "Admin", userEmail = "", userRole = "", onMenuClick }: AdminHeaderProps) {
 const [open, setOpen] = useState(false);

 const handleSignOut = async () => {
  await signOut({
   callbackUrl: "/admin/login",
  });
 };

 return (
  <header className="relative z-30 flex h-[72px] shrink-0 items-center justify-between border-b border-gray-200 bg-white px-4 md:px-6">
   {/* Left */}
   <div className="flex items-center gap-3">
    <button
     type="button"
     onClick={onMenuClick}
     className="flex h-10 w-10 items-center justify-center rounded-xl text-gray-600 transition hover:bg-gray-100 hover:text-gray-900 lg:hidden"
     aria-label="Open menu">
     <FaBars size={17} />
    </button>

    <div className="hidden lg:block">
     <p className="text-sm font-semibold text-gray-900">Welcome back</p>

     <p className="text-xs text-gray-400">Manage your store from here.</p>
    </div>
   </div>

   {/* Right */}
   <div className="flex items-center gap-2">
    {/* Notifications */}
    <button
     type="button"
     className="relative flex h-10 w-10 items-center justify-center rounded-xl text-gray-500 transition hover:bg-gray-100 hover:text-gray-900"
     aria-label="Notifications">
     <FaBell size={15} />

     <span className="absolute right-[9px] top-[8px] h-1.5 w-1.5 rounded-full bg-red-500" />
    </button>

    {/* User */}
    <div className="relative ml-1">
     <button type="button" onClick={() => setOpen((value) => !value)} className="flex items-center gap-2 rounded-xl px-2 py-1.5 transition hover:bg-gray-50">
      <FaUserCircle size={31} className="text-gray-300" />

      <div className="hidden text-left sm:block">
       <p className="max-w-[150px] truncate text-sm font-semibold text-gray-800">{userName}</p>

       <p className="text-[11px] font-medium uppercase tracking-wide text-gray-400">{userRole}</p>
      </div>

      <FaChevronDown size={10} className={`hidden text-gray-400 transition sm:block ${open ? "rotate-180" : ""}`} />
     </button>

     {open && (
      <>
       {/* Click outside */}
       <button type="button" aria-label="Close user menu" className="fixed inset-0 z-40 h-full w-full cursor-default" onClick={() => setOpen(false)} />

       {/* Dropdown */}
       <div className="absolute right-0 top-full z-50 mt-2 w-[250px] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl">
        <div className="border-b border-gray-100 px-4 py-4">
         <div className="flex items-center gap-3">
          <FaUserCircle size={38} className="shrink-0 text-gray-300" />

          <div className="min-w-0">
           <p className="truncate text-sm font-semibold text-gray-900">{userName}</p>

           {userEmail && <p className="mt-0.5 truncate text-xs text-gray-400">{userEmail}</p>}

           {userRole && (
            <span className="mt-2 inline-flex rounded-full bg-gray-100 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-gray-500">
             {userRole}
            </span>
           )}
          </div>
         </div>
        </div>

        <div className="p-2">
         <button
          type="button"
          onClick={handleSignOut}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-red-600 transition hover:bg-red-50">
          <FaSignOutAlt size={14} />

          <span>Sign out</span>
         </button>
        </div>
       </div>
      </>
     )}
    </div>
   </div>
  </header>
 );
}
