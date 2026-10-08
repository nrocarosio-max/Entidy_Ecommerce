import Link from "next/link";
import { FaArrowRight, FaBoxOpen, FaChevronRight } from "react-icons/fa";

interface RecentOrder {
 _id: string;
 orderNumber: string;
 customerSnapshot?: {
  name: string;
  phone: string;
  email?: string;
 };
 total: number;
 currency: string;
 status: string;
 paymentStatus: string;
 createdAt: string;
}

interface RecentOrdersProps {
 orders: RecentOrder[];
}

const statusConfig: Record<
 string,
 {
  label: string;
  className: string;
 }
> = {
 PENDING: {
  label: "Pending",
  className: "bg-yellow-50 text-yellow-700",
 },
 CONFIRMED: {
  label: "Confirmed",
  className: "bg-blue-50 text-blue-700",
 },
 PROCESSING: {
  label: "Processing",
  className: "bg-indigo-50 text-indigo-700",
 },
 SHIPPED: {
  label: "Shipped",
  className: "bg-purple-50 text-purple-700",
 },
 DELIVERED: {
  label: "Delivered",
  className: "bg-green-50 text-green-700",
 },
 CANCELLED: {
  label: "Cancelled",
  className: "bg-red-50 text-red-700",
 },
 RETURNED: {
  label: "Returned",
  className: "bg-orange-50 text-orange-700",
 },
};

const paymentStatusConfig: Record<string, string> = {
 PENDING: "Pending",
 PAID: "Paid",
 FAILED: "Failed",
 REFUNDED: "Refunded",
};

function formatMoney(value: number, currency: string) {
 try {
  return new Intl.NumberFormat("en-US", {
   style: "currency",
   currency,
   maximumFractionDigits: 0,
  }).format(value);
 } catch {
  return `${value.toLocaleString()} ${currency}`;
 }
}

function formatDate(value: string) {
 return new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
 }).format(new Date(value));
}

export default function RecentOrders({ orders }: RecentOrdersProps) {
 return (
  <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
   {/* Header */}
   <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
    <div>
     <h2 className="text-base font-semibold text-gray-900">Recent Orders</h2>

     <p className="mt-0.5 text-xs text-gray-400">Latest orders from your store.</p>
    </div>

    <Link href="/admin/orders" className="flex items-center gap-2 text-xs font-semibold text-gray-500 transition hover:text-gray-900">
     View all
     <FaArrowRight size={10} />
    </Link>
   </div>

   {orders.length === 0 ? (
    <div className="flex min-h-[300px] flex-col items-center justify-center px-5 text-center">
     <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-400">
      <FaBoxOpen size={18} />
     </div>

     <p className="mt-3 text-sm font-medium text-gray-700">No recent orders</p>

     <p className="mt-1 text-xs text-gray-400">Orders will appear here once they are created.</p>
    </div>
   ) : (
    <>
     {/* Desktop */}
     <div className="hidden overflow-x-auto md:block">
      <table className="w-full">
       <thead>
        <tr className="border-b border-gray-100 text-left">
         <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-gray-400">Order</th>

         <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-gray-400">Customer</th>

         <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-gray-400">Total</th>

         <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-gray-400">Status</th>

         <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-gray-400">Payment</th>

         <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-gray-400">Date</th>

         <th />
        </tr>
       </thead>

       <tbody>
        {orders.map((order) => {
         const status = statusConfig[order.status] ?? {
          label: order.status,
          className: "bg-gray-100 text-gray-600",
         };

         return (
          <tr key={order._id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/70">
           <td className="px-5 py-4">
            <Link href={`/admin/orders/${order._id}`} className="text-sm font-semibold text-gray-900 hover:underline">
             {order.orderNumber}
            </Link>
           </td>

           <td className="px-5 py-4">
            <p className="max-w-[150px] truncate text-sm font-medium text-gray-700">{order.customerSnapshot?.name ?? "Guest"}</p>

            <p className="mt-0.5 text-xs text-gray-400">{order.customerSnapshot?.phone ?? "-"}</p>
           </td>

           <td className="whitespace-nowrap px-5 py-4 text-sm font-semibold text-gray-900">{formatMoney(order.total, order.currency)}</td>

           <td className="px-5 py-4">
            <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold ${status.className}`}>{status.label}</span>
           </td>

           <td className="px-5 py-4">
            <span className="text-xs font-medium text-gray-500">{paymentStatusConfig[order.paymentStatus] ?? order.paymentStatus}</span>
           </td>

           <td className="whitespace-nowrap px-5 py-4 text-xs text-gray-400">{formatDate(order.createdAt)}</td>

           <td className="px-5 py-4">
            <Link
             href={`/admin/orders/${order._id}`}
             className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-100 hover:text-gray-900"
             aria-label={`View ${order.orderNumber}`}>
             <FaChevronRight size={10} />
            </Link>
           </td>
          </tr>
         );
        })}
       </tbody>
      </table>
     </div>

     {/* Mobile */}
     <div className="divide-y divide-gray-100 md:hidden">
      {orders.map((order) => {
       const status = statusConfig[order.status] ?? {
        label: order.status,
        className: "bg-gray-100 text-gray-600",
       };

       return (
        <Link key={order._id} href={`/admin/orders/${order._id}`} className="block px-5 py-4 transition hover:bg-gray-50">
         <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
           <p className="truncate text-sm font-semibold text-gray-900">{order.orderNumber}</p>

           <p className="mt-1 truncate text-xs text-gray-400">{order.customerSnapshot?.name ?? "Guest"}</p>
          </div>

          <FaChevronRight size={10} className="mt-1 shrink-0 text-gray-300" />
         </div>

         <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${status.className}`}>{status.label}</span>

          <span className="text-xs text-gray-400">{paymentStatusConfig[order.paymentStatus] ?? order.paymentStatus}</span>
         </div>

         <div className="mt-3 flex items-center justify-between">
          <span className="text-sm font-semibold text-gray-900">{formatMoney(order.total, order.currency)}</span>

          <span className="text-xs text-gray-400">{formatDate(order.createdAt)}</span>
         </div>
        </Link>
       );
      })}
     </div>
    </>
   )}
  </section>
 );
}
