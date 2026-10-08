import { useMemo } from "react";
import { FaChartLine, FaShoppingCart } from "react-icons/fa";

interface SalesOverviewItem {
 date: string;
 currency: string;
 total: number;
 orders: number;
}

interface SalesOverviewProps {
 data?: SalesOverviewItem[];
}

function formatMoney(amount: number, currency: string) {
 return new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: currency || "USD",
  maximumFractionDigits: 0,
 }).format(amount);
}

function formatDate(date: string) {
 const parsedDate = new Date(`${date}T00:00:00+07:00`);

 return parsedDate.toLocaleDateString("en-US", {
  month: "short",
  day: "numeric",
 });
}

export default function SalesOverview({ data = [] }: SalesOverviewProps) {
 const chartData = useMemo(() => {
  if (!data.length) {
   return [];
  }

  const grouped = new Map<
   string,
   {
    date: string;
    total: number;
    orders: number;
    currency: string;
   }
  >();

  for (const item of data) {
   const existing = grouped.get(item.date);

   if (existing) {
    existing.total += item.total;
    existing.orders += item.orders;
   } else {
    grouped.set(item.date, {
     date: item.date,
     total: item.total,
     orders: item.orders,
     currency: item.currency,
    });
   }
  }

  return Array.from(grouped.values());
 }, [data]);

 const maxValue = useMemo(() => {
  return Math.max(...chartData.map((item) => item.total), 1);
 }, [chartData]);

 const totalRevenue = useMemo(() => {
  return chartData.reduce((sum, item) => sum + item.total, 0);
 }, [chartData]);

 const totalOrders = useMemo(() => {
  return chartData.reduce((sum, item) => sum + item.orders, 0);
 }, [chartData]);

 const currency = data[0]?.currency || "USD";

 return (
  <div className="rounded-2xl border border-gray-100 bg-white shadow-sm">
   {/* Header */}
   <div className="flex flex-col gap-4 border-b border-gray-100 p-5 sm:flex-row sm:items-center sm:justify-between">
    <div>
     <div className="flex items-center gap-2">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
       <FaChartLine size={15} />
      </div>

      <div>
       <h2 className="text-base font-semibold text-gray-900">Sales Overview</h2>

       <p className="text-xs text-gray-500">Revenue from delivered orders</p>
      </div>
     </div>
    </div>

    <div className="flex items-center gap-5">
     <div>
      <p className="text-xs text-gray-400">Revenue</p>

      <p className="mt-0.5 text-sm font-semibold text-gray-900">{formatMoney(totalRevenue, currency)}</p>
     </div>

     <div className="h-8 w-px bg-gray-100" />

     <div>
      <p className="text-xs text-gray-400">Orders</p>

      <p className="mt-0.5 flex items-center gap-1.5 text-sm font-semibold text-gray-900">
       <FaShoppingCart size={11} className="text-gray-400" />
       {totalOrders.toLocaleString()}
      </p>
     </div>
    </div>
   </div>

   {/* Chart */}
   <div className="p-5">
    {!chartData.length ? (
     <div className="flex h-[300px] items-center justify-center">
      <div className="text-center">
       <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-50 text-gray-300">
        <FaChartLine size={18} />
       </div>

       <p className="mt-3 text-sm font-medium text-gray-500">No sales data</p>

       <p className="mt-1 text-xs text-gray-400">There are no delivered orders in this period.</p>
      </div>
     </div>
    ) : (
     <div className="overflow-x-auto">
      <div className="relative min-w-[650px]" style={{ height: 320 }}>
       {/* Horizontal grid */}
       <div className="absolute inset-0 flex flex-col justify-between">
        {[0, 1, 2, 3, 4].map((line) => (
         <div key={line} className="flex items-center">
          <div className="w-20 pr-3 text-right text-[10px] text-gray-400">{formatMoney((maxValue / 4) * (4 - line), currency)}</div>

          <div className="h-px flex-1 border-t border-dashed border-gray-100" />
         </div>
        ))}
       </div>

       {/* Bars */}
       <div className="absolute bottom-0 left-20 right-0 top-0 flex items-end gap-3 pb-7 pt-2">
        {chartData.map((item) => {
         const height = Math.max((item.total / maxValue) * 100, 3);

         return (
          <div key={item.date} className="group relative flex h-full min-w-[42px] flex-1 items-end">
           {/* Tooltip */}
           <div className="pointer-events-none absolute bottom-[calc(100%-20px)] left-1/2 z-10 hidden -translate-x-1/2 whitespace-nowrap rounded-lg bg-gray-900 px-3 py-2 text-xs text-white shadow-lg group-hover:block">
            <p className="font-medium">{formatDate(item.date)}</p>

            <p className="mt-1 text-gray-300">{formatMoney(item.total, item.currency)}</p>

            <p className="mt-0.5 text-gray-400">
             {item.orders} {item.orders === 1 ? "order" : "orders"}
            </p>
           </div>

           {/* Bar */}
           <div
            className="w-full rounded-t-lg bg-gray-900 transition-all duration-200 group-hover:bg-gray-700"
            style={{
             height: `${height}%`,
            }}
           />

           {/* Date */}
           <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] text-gray-400">{formatDate(item.date)}</span>
          </div>
         );
        })}
       </div>
      </div>
     </div>
    )}
   </div>
  </div>
 );
}
