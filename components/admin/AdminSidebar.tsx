import Link from "next/link";
import { useRouter } from "next/router";
import { useState } from "react";
import {
 FaBox,
 FaBoxes,
 FaChartLine,
 FaChevronDown,
 FaClipboardList,
 FaCog,
 FaMoneyBillWave,
 FaPercentage,
 FaShieldAlt,
 FaStore,
 FaTags,
 FaTruck,
 FaUser,
 FaUsers,
 FaUserTie,
 FaWallet,
 FaWarehouse,
} from "react-icons/fa";

interface AdminSidebarProps {
 permissions: string[];
 onClose?: () => void;
}

interface MenuItem {
 label: string;
 href: string;
 icon: React.ElementType;
 permission?: string;
}

const menuItems: MenuItem[] = [
 {
  label: "Dashboard",
  href: "/admin",
  icon: FaChartLine,
 },
 {
  label: "Store",
  href: "/admin/stores",
  icon: FaStore,
  permission: "stores.read",
 },
 {
  label: "Categories",
  href: "/admin/categories",
  icon: FaBoxes,
  permission: "categories.read",
 },
 {
  label: "Brands",
  href: "/admin/brands",
  icon: FaTags,
  permission: "brands.read",
 },
 {
  label: "Products",
  href: "/admin/products",
  icon: FaBox,
  permission: "products.read",
 },
 {
  label: "Inventory",
  href: "/admin/inventory",
  icon: FaWarehouse,
  permission: "inventory.read",
 },
 {
  label: "Customers",
  href: "/admin/customers",
  icon: FaUsers,
  permission: "customers.read",
 },
 {
  label: "Orders",
  href: "/admin/orders",
  icon: FaClipboardList,
  permission: "orders.read",
 },
 {
  label: "Shipping",
  href: "/admin/shipping",
  icon: FaTruck,
  permission: "shipping.read",
 },
 {
  label: "Users",
  href: "/admin/users",
  icon: FaUser,
  permission: "users.read",
 },
 {
  label: "Settings",
  href: "/admin/settings",
  icon: FaCog,
 },
];

const affiliateMenuItems: MenuItem[] = [
 {
  label: "Affiliates",
  href: "/admin/affiliates",
  icon: FaUserTie,
  permission: "affiliates.read",
 },
 {
  label: "Affiliate Stores",
  href: "/admin/affiliate-stores",
  icon: FaStore,
  permission: "affiliateStores.read",
 },
 {
  label: "Affiliate Commissions",
  href: "/admin/affiliate-commissions",
  icon: FaPercentage,
  permission: "affiliateCommissions.read",
 },
 {
  label: "Affiliate Payments",
  href: "/admin/affiliate-payments",
  icon: FaWallet,
  permission: "affiliatePayments.read",
 },
];

const systemMenuItems: MenuItem[] = [
 {
  label: "Order Status",
  href: "/admin/order-statuses",
  icon: FaClipboardList,
  permission: "orderStatus.read",
 },
 {
  label: "Roles",
  href: "/admin/roles",
  icon: FaShieldAlt,
  permission: "roles.read",
 },
];

function hasPermission(permissions: string[], requiredPermission?: string) {
 if (!requiredPermission) return true;

 if (permissions.includes("*")) return true;

 if (permissions.includes(requiredPermission)) return true;

 const [resource] = requiredPermission.split(".");

 return permissions.includes(resource);
}

export default function AdminSidebar({ permissions, onClose }: AdminSidebarProps) {
 const router = useRouter();

 const [affiliateMenuOpen, setAffiliateMenuOpen] = useState(
  affiliateMenuItems.some((item) => router.pathname === item.href || router.pathname.startsWith(`${item.href}/`)),
 );

 const [systemMenuOpen, setSystemMenuOpen] = useState(
  systemMenuItems.some((item) => router.pathname === item.href || router.pathname.startsWith(`${item.href}/`)),
 );

 const visibleItems = menuItems.filter((item) => hasPermission(permissions, item.permission));

 const visibleAffiliateItems = affiliateMenuItems.filter((item) => hasPermission(permissions, item.permission));

 const visibleSystemItems = systemMenuItems.filter((item) => hasPermission(permissions, item.permission));

 const isActive = (href: string) => {
  if (href === "/admin") {
   return router.pathname === "/admin";
  }

  return router.pathname === href || router.pathname.startsWith(`${href}/`);
 };

 const isAffiliateActive = visibleAffiliateItems.some((item) => isActive(item.href));

 const isSystemActive = visibleSystemItems.some((item) => isActive(item.href));

 const renderMenuItem = (item: MenuItem, nested = false) => {
  const Icon = item.icon;
  const active = isActive(item.href);

  return (
   <Link
    key={item.href}
    href={item.href}
    onClick={onClose}
    className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${nested ? "ml-5" : ""} ${
     active ? "bg-gray-900 font-semibold text-white" : "font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900"
    }`}>
    <Icon size={15} className={active ? "shrink-0 text-white" : "shrink-0 text-gray-400 transition group-hover:text-gray-600"} />
    <span>{item.label}</span>
   </Link>
  );
 };

 return (
  <aside className="flex h-full w-[260px] shrink-0 flex-col border-r border-gray-200 bg-white">
   {/* Logo */}
   <div className="flex h-[72px] items-center border-b border-gray-100 px-5">
    <Link href="/admin" onClick={onClose} className="flex items-center gap-3">
     <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-900 text-sm font-bold text-white">A</div>

     <div>
      <p className="text-sm font-bold tracking-tight text-gray-900">Admin Panel</p>
      <p className="text-[11px] text-gray-400">Store Management</p>
     </div>
    </Link>
   </div>

   {/* Navigation */}
   <nav className="flex-1 overflow-y-auto p-3">
    <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-gray-400">Management</p>

    <div className="space-y-1">{visibleItems.map((item) => renderMenuItem(item))}</div>

    {/* Affiliate Management */}
    {visibleAffiliateItems.length > 0 && (
     <div className="mt-5">
      <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-gray-400">Affiliate Management</p>

      <button
       type="button"
       onClick={() => setAffiliateMenuOpen((prev) => !prev)}
       aria-expanded={affiliateMenuOpen}
       className={`group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
        isAffiliateActive ? "bg-gray-900 text-white" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
       }`}>
       <FaMoneyBillWave size={15} className={isAffiliateActive ? "text-white" : "text-gray-400 transition group-hover:text-gray-600"} />

       <span className="flex-1 text-left">Affiliate</span>

       <FaChevronDown size={11} className={`transition-transform duration-200 ${affiliateMenuOpen ? "rotate-180" : ""}`} />
      </button>

      {affiliateMenuOpen && (
       <div className="mt-1 space-y-1 border-l border-gray-200 pl-1">{visibleAffiliateItems.map((item) => renderMenuItem(item, true))}</div>
      )}
     </div>
    )}

    {/* System Management */}
    {visibleSystemItems.length > 0 && (
     <div className="mt-5">
      <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-gray-400">System</p>

      <button
       type="button"
       onClick={() => setSystemMenuOpen((prev) => !prev)}
       aria-expanded={systemMenuOpen}
       className={`group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
        isSystemActive ? "bg-gray-900 text-white" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
       }`}>
       <FaCog size={15} className={isSystemActive ? "text-white" : "text-gray-400 transition group-hover:text-gray-600"} />

       <span className="flex-1 text-left">System Management</span>

       <FaChevronDown size={11} className={`transition-transform duration-200 ${systemMenuOpen ? "rotate-180" : ""}`} />
      </button>

      {systemMenuOpen && <div className="ml-5 mt-1 space-y-1 border-l border-gray-200 pl-3">{visibleSystemItems.map((item) => renderMenuItem(item))}</div>}
     </div>
    )}
   </nav>

   {/* Bottom */}
   <div className="border-t border-gray-100 p-3">
    <div className="rounded-xl bg-gray-50 p-3">
     <p className="text-xs font-medium text-gray-700">Store Management</p>
     <p className="mt-1 text-[11px] leading-4 text-gray-400">Manage stores, products, orders and affiliate commissions.</p>
    </div>
   </div>
  </aside>
 );
}
