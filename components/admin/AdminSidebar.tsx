import Link from "next/link";
import { useRouter } from "next/router";
import { FaBox, FaBoxes, FaChartLine, FaClipboardList, FaCog, FaTags, FaTruck, FaUsers, FaWarehouse } from "react-icons/fa";

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
  label: "Collections",
  href: "/admin/collections",
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
  label: "Settings",
  href: "/admin/settings",
  icon: FaCog,
 },
];

function hasPermission(permissions: string[], requiredPermission?: string) {
 if (!requiredPermission) {
  return true;
 }

 if (permissions.includes("*")) {
  return true;
 }

 if (permissions.includes(requiredPermission)) {
  return true;
 }

 const [resource] = requiredPermission.split(".");

 return permissions.includes(`${resource}.*`);
}

export default function AdminSidebar({ permissions, onClose }: AdminSidebarProps) {
 const router = useRouter();

 const visibleItems = menuItems.filter((item) => hasPermission(permissions, item.permission));

 const isActive = (href: string) => {
  if (href === "/admin") {
   return router.pathname === "/admin";
  }

  return router.pathname === href || router.pathname.startsWith(`${href}/`);
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

    <div className="space-y-1">
     {visibleItems.map((item) => {
      const Icon = item.icon;
      const active = isActive(item.href);

      return (
       <Link
        key={item.href}
        href={item.href}
        onClick={onClose}
        className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
         active ? "bg-gray-900 text-white" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
        }`}>
        <Icon size={15} className={active ? "text-white" : "text-gray-400 transition group-hover:text-gray-600"} />

        <span>{item.label}</span>
       </Link>
      );
     })}
    </div>
   </nav>

   {/* Bottom */}
   <div className="border-t border-gray-100 p-3">
    <div className="rounded-xl bg-gray-50 p-3">
     <p className="text-xs font-medium text-gray-700">Store Management</p>

     <p className="mt-1 text-[11px] leading-4 text-gray-400">Manage your products, customers and orders.</p>
    </div>
   </div>
  </aside>
 );
}
