import { FaArrowUp, FaBox, FaExclamationTriangle, FaMoneyBillWave, FaShoppingCart, FaUsers } from "react-icons/fa";

interface DashboardStatsData {
 totalOrders: number;
 totalCustomers: number;
 totalProducts: number;
 revenue: {
  currency: string;
  total: number;
 }[];
 pendingOrders: number;
 lowStockProducts: number;
}

interface DashboardStatsProps {
 stats: DashboardStatsData;
}

function formatMoney(amount: number, currency: string) {
 return new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: currency || "USD",
  maximumFractionDigits: 0,
 }).format(amount);
}

export default function DashboardStats({ stats }: DashboardStatsProps) {
 const totalRevenue = stats.revenue.reduce((sum, item) => sum + item.total, 0);

 const primaryCurrency = stats.revenue[0]?.currency || "USD";

 const cards = [
  {
   title: "Revenue",
   value: formatMoney(totalRevenue, primaryCurrency),
   description: "Delivered orders",
   icon: FaMoneyBillWave,
   iconClass: "bg-emerald-50 text-emerald-600",
   bottomIcon: FaArrowUp,
   bottomIconClass: "text-emerald-500",
  },
  {
   title: "Total Orders",
   value: stats.totalOrders.toLocaleString(),
   description: `${stats.pendingOrders} pending orders`,
   icon: FaShoppingCart,
   iconClass: "bg-blue-50 text-blue-600",
  },
  {
   title: "Customers",
   value: stats.totalCustomers.toLocaleString(),
   description: "Active customers",
   icon: FaUsers,
   iconClass: "bg-violet-50 text-violet-600",
  },
  {
   title: "Products",
   value: stats.totalProducts.toLocaleString(),
   description: `${stats.lowStockProducts} low stock`,
   icon: FaBox,
   iconClass: "bg-orange-50 text-orange-600",
   bottomIcon: stats.lowStockProducts > 0 ? FaExclamationTriangle : undefined,
   bottomIconClass: "text-amber-500",
  },
 ];

 return (
  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
   {cards.map((card) => {
    const Icon = card.icon;
    const BottomIcon = card.bottomIcon;

    return (
     <div key={card.title} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between">
       <div className="min-w-0">
        <p className="text-sm font-medium text-gray-500">{card.title}</p>

        <h2 className="mt-2 truncate text-2xl font-bold tracking-tight text-gray-900">{card.value}</h2>
       </div>

       <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${card.iconClass}`}>
        <Icon size={17} />
       </div>
      </div>

      <div className="mt-4 flex items-center gap-1.5 text-xs text-gray-500">
       {BottomIcon && <BottomIcon className={card.bottomIconClass} />}

       <span>{card.description}</span>
      </div>
     </div>
    );
   })}
  </div>
 );
}
