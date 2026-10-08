import { FaBoxOpen, FaCheckCircle, FaClock, FaShippingFast, FaTimesCircle, FaUndo, FaCog } from "react-icons/fa";

interface OrderStatus {
 PENDING: number;
 CONFIRMED: number;
 PROCESSING: number;
 SHIPPED: number;
 DELIVERED: number;
 CANCELLED: number;
 RETURNED: number;
}

interface OrderStatusOverviewProps {
 data: OrderStatus;
 totalOrders: number;
}

const statusConfig = [
 {
  key: "PENDING",
  label: "Pending",
  icon: FaClock,
  iconClass: "bg-amber-50 text-amber-600",
  barClass: "bg-amber-400",
 },
 {
  key: "CONFIRMED",
  label: "Confirmed",
  icon: FaCheckCircle,
  iconClass: "bg-blue-50 text-blue-600",
  barClass: "bg-blue-500",
 },
 {
  key: "PROCESSING",
  label: "Processing",
  icon: FaCog,
  iconClass: "bg-violet-50 text-violet-600",
  barClass: "bg-violet-500",
 },
 {
  key: "SHIPPED",
  label: "Shipped",
  icon: FaShippingFast,
  iconClass: "bg-indigo-50 text-indigo-600",
  barClass: "bg-indigo-500",
 },
 {
  key: "DELIVERED",
  label: "Delivered",
  icon: FaBoxOpen,
  iconClass: "bg-emerald-50 text-emerald-600",
  barClass: "bg-emerald-500",
 },
 {
  key: "CANCELLED",
  label: "Cancelled",
  icon: FaTimesCircle,
  iconClass: "bg-red-50 text-red-600",
  barClass: "bg-red-500",
 },
 {
  key: "RETURNED",
  label: "Returned",
  icon: FaUndo,
  iconClass: "bg-gray-100 text-gray-600",
  barClass: "bg-gray-500",
 },
] as const;

export default function OrderStatusOverview({ data, totalOrders }: OrderStatusOverviewProps) {
 return (
  <div className="rounded-2xl border border-gray-100 bg-white shadow-sm">
   {/* Header */}
   <div className="border-b border-gray-100 p-5">
    <div className="flex items-center justify-between">
     <div>
      <h2 className="text-base font-semibold text-gray-900">Order Overview</h2>

      <p className="mt-1 text-xs text-gray-500">Order status distribution</p>
     </div>

     <div className="rounded-lg bg-gray-50 px-3 py-2 text-right">
      <p className="text-[10px] uppercase tracking-wide text-gray-400">Total</p>

      <p className="text-sm font-semibold text-gray-900">{totalOrders.toLocaleString()}</p>
     </div>
    </div>
   </div>

   {/* Status List */}
   <div className="divide-y divide-gray-50">
    {statusConfig.map((status) => {
     const Icon = status.icon;

     const count = data[status.key] || 0;

     const percentage = totalOrders > 0 ? (count / totalOrders) * 100 : 0;

     return (
      <div key={status.key} className="px-5 py-4 transition hover:bg-gray-50/70">
       <div className="flex items-center gap-3">
        {/* Icon */}
        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${status.iconClass}`}>
         <Icon size={14} />
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
         <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-medium text-gray-700">{status.label}</p>

          <div className="flex shrink-0 items-center gap-2">
           <span className="text-sm font-semibold text-gray-900">{count.toLocaleString()}</span>

           <span className="w-10 text-right text-xs text-gray-400">{percentage.toFixed(0)}%</span>
          </div>
         </div>

         {/* Progress */}
         <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-gray-100">
          <div
           className={`h-full rounded-full transition-all duration-500 ${status.barClass}`}
           style={{
            width: `${percentage}%`,
           }}
          />
         </div>
        </div>
       </div>
      </div>
     );
    })}
   </div>
  </div>
 );
}
