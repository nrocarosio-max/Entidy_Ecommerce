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
 FaTags,
 FaTruck,
 FaUser,
 FaUsers,
 FaUserTie,
 FaWarehouse,
} from "react-icons/fa";

interface PosSidebarProps {
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
  href: "/pos",
  icon: FaChartLine,
 },
 {
  label: "Products",
  href: "/pos/products",
  icon: FaBox,
  permission: "products.read",
 },
 {
  label: "Categories",
  href: "/pos/categories",
  icon: FaBoxes,
  permission: "categories.read",
 },
 {
  label: "Inventory",
  href: "/pos/inventory",
  icon: FaWarehouse,
  permission: "inventory.read",
 },
 {
  label: "Orders",
  href: "/pos/orders",
  icon: FaClipboardList,
  permission: "orders.read",
 },
 {
  label: "Shipping",
  href: "/pos/shipping",
  icon: FaTruck,
  permission: "shipping.read",
 },
 {
  label: "Customers",
  href: "/pos/customers",
  icon: FaUsers,
  permission: "customers.read",
 },
 {
  label: "Brands",
  href: "/pos/brands",
  icon: FaTags,
  permission: "brands.read",
 },
 {
  label: "Reports",
  href: "/pos/reports",
  icon: FaChartLine,
  permission: "reports.read",
 },
];

const marketingMenuItems: MenuItem[] = [
 {
  label: "Promotions",
  href: "/pos/promotions",
  icon: FaMoneyBillWave,
  permission: "promotions.read",
 },
 {
  label: "Discount Codes",
  href: "/pos/coupons",
  icon: FaPercentage,
  permission: "coupons.read",
 },
];

const staffMenuItems: MenuItem[] = [
 {
  label: "Store Staff",
  href: "/pos/staff",
  icon: FaUserTie,
  permission: "users.read",
 },
];

const settingsMenuItems: MenuItem[] = [
 {
  label: "Store Settings",
  href: "/pos/settings",
  icon: FaCog,
 },
];

function hasPermission(permissions: string[], requiredPermission?: string) {
 if (!requiredPermission) return true;

 if (permissions.includes("*")) return true;

 if (permissions.includes(requiredPermission)) return true;

 const [resource] = requiredPermission.split(".");

 return permissions.includes(`${resource}.*`) || permissions.includes(resource);
}

export default function PosSidebar({ permissions, onClose }: PosSidebarProps) {
 const router = useRouter();

 const [marketingMenuOpen, setMarketingMenuOpen] = useState(
  marketingMenuItems.some((item) => router.pathname === item.href || router.pathname.startsWith(`${item.href}/`)),
 );

 const [staffMenuOpen, setStaffMenuOpen] = useState(
  staffMenuItems.some((item) => router.pathname === item.href || router.pathname.startsWith(`${item.href}/`)),
 );

 const visibleItems = menuItems.filter((item) => hasPermission(permissions, item.permission));

 const visibleMarketingItems = marketingMenuItems.filter((item) => hasPermission(permissions, item.permission));

 const visibleStaffItems = staffMenuItems.filter((item) => hasPermission(permissions, item.permission));

 const visibleSettingsItems = settingsMenuItems.filter((item) => hasPermission(permissions, item.permission));

 const isActive = (href: string) => {
  if (href === "/pos") return router.pathname === "/pos";

  return router.pathname === href || router.pathname.startsWith(`${href}/`);
 };

 const isGroupActive = (items: MenuItem[]) => items.some((item) => isActive(item.href));

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

 const renderGroup = (title: string, label: string, icon: React.ElementType, items: MenuItem[], open: boolean, toggle: () => void) => {
  if (items.length === 0) return null;

  const Icon = icon;
  const active = isGroupActive(items);

  return (
   <div className="mt-5">
    <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-gray-400">{title}</p>

    <button
     type="button"
     onClick={toggle}
     aria-expanded={open}
     className={`group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
      active ? "bg-gray-900 text-white" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
     }`}>
     <Icon size={15} className={active ? "text-white" : "text-gray-400 transition group-hover:text-gray-600"} />

     <span className="flex-1 text-left">{label}</span>

     <FaChevronDown size={11} className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
    </button>

    {open && <div className="mt-1 space-y-1 border-l border-gray-200 pl-1">{items.map((item) => renderMenuItem(item, true))}</div>}
   </div>
  );
 };

 return (
  <aside className="flex h-full w-[260px] shrink-0 flex-col border-r border-gray-200 bg-white">
   <div className="flex h-[72px] items-center border-b border-gray-100 px-5">
    <Link href="/pos" onClick={onClose} className="flex items-center gap-3">
     <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-900 text-sm font-bold text-white">P</div>

     <div>
      <p className="text-sm font-bold tracking-tight text-gray-900">Store Panel</p>
      <p className="text-[11px] text-gray-400">Store Management</p>
     </div>
    </Link>
   </div>

   <nav className="flex-1 overflow-y-auto p-3">
    <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-gray-400">Management</p>

    <div className="space-y-1">{visibleItems.map((item) => renderMenuItem(item))}</div>

    {renderGroup("MARKETING", "Marketing", FaMoneyBillWave, visibleMarketingItems, marketingMenuOpen, () => setMarketingMenuOpen((prev) => !prev))}

    {renderGroup("STAFF", "Staff Management", FaUser, visibleStaffItems, staffMenuOpen, () => setStaffMenuOpen((prev) => !prev))}

    {visibleSettingsItems.length > 0 && (
     <div className="mt-5">
      <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-gray-400">SETTINGS</p>

      <div className="space-y-1">{visibleSettingsItems.map((item) => renderMenuItem(item))}</div>
     </div>
    )}
   </nav>

   <div className="border-t border-gray-100 p-3">
    <div className="rounded-xl bg-gray-50 p-3">
     <p className="text-xs font-medium text-gray-700">Store Management</p>
     <p className="mt-1 text-[11px] leading-4 text-gray-400">Manage products, orders, inventory and sales.</p>
    </div>
   </div>
  </aside>
 );
}
