import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";
import { FaArrowLeft, FaBox, FaCheckCircle, FaClock, FaMapMarkerAlt, FaSave, FaShoppingBag, FaTruck, FaUser } from "react-icons/fa";

interface Store {
 _id: string;
 name: string;
 slug?: string;
}

interface Customer {
 _id: string;
 name: string;
 phone: string;
 isActive?: boolean;
}

interface OrderItem {
 _id: string;
 orderId: string;
 productId:
  | string
  | {
     _id: string;
     name: string;
     sku: string;
    };
 productSnapshot: {
  name: string;
  sku: string;
  slug: string;
  image: string;
 };
 quantity: number;
 price: number;
 subtotal: number;
 currency: string;
 createdAt: string;
}

interface OrderStatusOption {
 _id: string;
 name: string;
 code: string;
 description?: string;
 color?: string;
 icon?: string;
 sortOrder?: number;
 isActive: boolean;
 isInitial?: boolean;
 isFinal?: boolean;
 nextStatusIds?: Array<string | OrderStatusOption>;
}

interface HistoryStatus {
 _id: string;
 name: string;
 code: string;
 color?: string;
}

interface StatusHistory {
 _id: string;
 orderId: string;
 previousStatusId: string | HistoryStatus | null;
 newStatusId: string | HistoryStatus | null;
 changedBy: {
  _id: string;
  name: string;
  email: string;
 } | null;
 note: string;
 createdAt: string;
}

interface Order {
 _id: string;
 storeId: string | Store;
 customerId: string | Customer;
 orderNumber: string;
 customerSnapshot: {
  name: string;
  phone: string;
  email: string;
 };
 shippingAddress: {
  province: string;
  district: string;
  ward: string;
  address: string;
  postalCode: string;
 };
 subtotal: number;
 shippingFee: number;
 discount: number;
 total: number;
 currency: string;
 paymentMethod: string;
 paymentStatus: string;
 statusId: string | OrderStatusOption;
 note: string;
 shippingMethod: string;
 trackingNumber: string;
 createdBy:
  | string
  | {
     _id: string;
     name: string;
     email: string;
    }
  | null;
 createdAt: string;
 updatedAt: string;
}

interface OrderResponse {
 success: boolean;
 message?: string;
 order: Order;
 items: OrderItem[];
 history: StatusHistory[];
 paymentHistory?: unknown[];
}

function getStatusObject(value: Order["statusId"]): OrderStatusOption | null {
 return value && typeof value === "object" ? value : null;
}

function getStatusId(value: Order["statusId"]): string {
 if (value && typeof value === "object") {
  return value._id;
 }

 return typeof value === "string" ? value : "";
}

function getStatusCode(value: Order["statusId"]): string {
 return getStatusObject(value)?.code || "UNKNOWN";
}

function getHistoryStatusLabel(value: StatusHistory["previousStatusId"] | StatusHistory["newStatusId"]): string {
 if (!value) return "Unknown";

 if (typeof value === "string") return value;

 return value.name || value.code || "Unknown";
}

function getStatusClass(status: string) {
 switch (status.toUpperCase()) {
  case "NEW":
  case "PENDING":
   return "bg-yellow-100 text-yellow-700";

  case "CONFIRMED":
   return "bg-blue-100 text-blue-700";

  case "PROCESSING":
   return "bg-purple-100 text-purple-700";

  case "SHIPPED":
   return "bg-indigo-100 text-indigo-700";

  case "DELIVERED":
   return "bg-green-100 text-green-700";

  case "CANCELLED":
   return "bg-red-100 text-red-700";

  case "RETURNED":
   return "bg-orange-100 text-orange-700";

  default:
   return "bg-gray-100 text-gray-600";
 }
}

function formatStatus(status: string) {
 return status.replace(/_/g, " ");
}

function formatMoney(value: number, currency: string) {
 return new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: currency || "VND",
  maximumFractionDigits: 0,
 }).format(value);
}

export default function OrderDetailPage() {
 const router = useRouter();
 const { data: session, status } = useSession();

 const orderId = typeof router.query.id === "string" ? router.query.id : "";

 const [order, setOrder] = useState<Order | null>(null);
 const [items, setItems] = useState<OrderItem[]>([]);
 const [statusHistory, setStatusHistory] = useState<StatusHistory[]>([]);

 const [selectedStatus, setSelectedStatus] = useState("");
 const [shippingMethod, setShippingMethod] = useState("");
 const [trackingNumber, setTrackingNumber] = useState("");
 const [note, setNote] = useState("");

 const [loading, setLoading] = useState(true);
 const [saving, setSaving] = useState(false);
 const [error, setError] = useState("");
 const [success, setSuccess] = useState("");

 const loadOrder = async () => {
  if (!orderId) return;

  const response = await fetch(`/api/admin/orders/${orderId}`);
  const data = await response.json().catch(() => null);

  if (!response.ok) {
   throw new Error(data?.message || "Failed to load order.");
  }

  const result = data as OrderResponse;

  setOrder(result.order);
  setItems(result.items || []);
  setStatusHistory(result.history || []);

  setSelectedStatus(getStatusId(result.order.statusId));
  setShippingMethod(result.order.shippingMethod || "");
  setTrackingNumber(result.order.trackingNumber || "");
  setNote(result.order.note || "");
 };

 useEffect(() => {
  if (status !== "authenticated" || !orderId) return;

  let cancelled = false;

  const initialLoad = async () => {
   try {
    setLoading(true);
    setError("");

    const response = await fetch(`/api/admin/orders/${orderId}`);
    const data = await response.json().catch(() => null);

    if (!response.ok) {
     throw new Error(data?.message || "Failed to load order.");
    }

    if (cancelled) return;

    const result = data as OrderResponse;

    setOrder(result.order);
    setItems(result.items || []);
    setStatusHistory(result.history || []);

    setSelectedStatus(getStatusId(result.order.statusId));
    setShippingMethod(result.order.shippingMethod || "");
    setTrackingNumber(result.order.trackingNumber || "");
    setNote(result.order.note || "");
   } catch (err) {
    if (!cancelled) {
     setError(err instanceof Error ? err.message : "Failed to load order.");
    }
   } finally {
    if (!cancelled) setLoading(false);
   }
  };

  void initialLoad();

  return () => {
   cancelled = true;
  };
 }, [status, orderId]);

 const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
  event.preventDefault();

  if (!order) return;

  try {
   setSaving(true);
   setError("");
   setSuccess("");

   const currentStatusId = getStatusId(order.statusId);

   const response = await fetch(`/api/admin/orders/${order._id}`, {
    method: "PATCH",
    headers: {
     "Content-Type": "application/json",
    },
    body: JSON.stringify({
     statusId: selectedStatus,
     note: note.trim(),
    }),
   });

   const data = await response.json().catch(() => null);

   if (!response.ok) {
    throw new Error(data?.message || "Failed to update order.");
   }

   // Reload the full order and populated status history.
   await loadOrder();

   setSuccess(selectedStatus === currentStatusId ? "Order information refreshed successfully." : "Order status updated successfully.");
  } catch (err) {
   setError(err instanceof Error ? err.message : "Failed to update order.");
  } finally {
   setSaving(false);
  }
 };

 if (status === "loading" || loading) {
  return <div className="flex min-h-[60vh] items-center justify-center text-sm text-gray-500">Loading...</div>;
 }

 if (!session) {
  return <div className="flex min-h-[60vh] items-center justify-center text-sm text-gray-500">Please sign in.</div>;
 }

 if (!order) {
  return (
   <div className="min-h-screen bg-gray-100 p-4 md:p-6">
    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error || "Order not found."}</div>
   </div>
  );
 }

 const customer = typeof order.customerId === "object" ? order.customerId : null;

 const store = typeof order.storeId === "object" ? order.storeId : null;

 const currentStatus = getStatusObject(order.statusId);
 const currentStatusCode = getStatusCode(order.statusId);
 const currentStatusId = getStatusId(order.statusId);

 const nextStatuses = (currentStatus?.nextStatusIds || [])
  .map((statusOption) => (typeof statusOption === "string" ? null : statusOption))
  .filter((statusOption): statusOption is OrderStatusOption => Boolean(statusOption && statusOption.isActive))
  .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

 return (
  <div className="min-h-screen bg-gray-100 p-4 md:p-6">
   {/* Header */}
   <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
    <div className="flex items-center gap-3">
     <Link
      href="/admin/orders"
      className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50">
      <FaArrowLeft />
     </Link>

     <div>
      <div className="flex flex-wrap items-center gap-3">
       <h1 className="text-2xl font-bold text-gray-900">{order.orderNumber}</h1>

       <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${getStatusClass(currentStatusCode)}`}>
        {formatStatus(currentStatus?.name || currentStatusCode)}
       </span>
      </div>

      <p className="text-sm text-gray-500">Created {new Date(order.createdAt).toLocaleString("vi-VN")}</p>
     </div>
    </div>

    <div className="text-left lg:text-right">
     <p className="text-sm text-gray-500">Order Total</p>
     <p className="text-2xl font-bold text-gray-900">{formatMoney(order.total, order.currency)}</p>
    </div>
   </div>

   {/* Messages */}
   {error && <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

   {success && <div className="mb-6 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">{success}</div>}

   <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
    {/* LEFT */}
    <div className="space-y-6">
     {/* Products */}
     <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="flex items-center gap-3 border-b border-gray-200 px-5 py-4">
       <FaShoppingBag className="text-gray-700" />
       <h2 className="font-semibold text-gray-900">Order Items</h2>
      </div>

      <div className="divide-y divide-gray-100">
       {items.map((item) => (
        <div key={item._id} className="flex gap-4 p-5">
         <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gray-100">
          {item.productSnapshot?.image ? (
           <img src={item.productSnapshot.image} alt={item.productSnapshot.name} className="h-full w-full object-cover" />
          ) : (
           <FaBox className="text-gray-400" />
          )}
         </div>

         <div className="min-w-0 flex-1">
          <h3 className="font-medium text-gray-900">{item.productSnapshot?.name || "Product"}</h3>

          <p className="mt-1 text-xs text-gray-500">SKU: {item.productSnapshot?.sku || "-"}</p>

          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600">
           <span>Quantity: {item.quantity}</span>
           <span>Price: {formatMoney(item.price, item.currency)}</span>
          </div>
         </div>

         <div className="text-right">
          <p className="font-semibold text-gray-900">{formatMoney(item.subtotal, item.currency)}</p>
         </div>
        </div>
       ))}
      </div>

      {/* Totals */}
      <div className="border-t border-gray-200 bg-gray-50 p-5">
       <div className="ml-auto max-w-sm space-y-2 text-sm">
        <div className="flex justify-between">
         <span className="text-gray-500">Subtotal</span>
         <span className="font-medium text-gray-900">{formatMoney(order.subtotal, order.currency)}</span>
        </div>

        <div className="flex justify-between">
         <span className="text-gray-500">Shipping</span>
         <span className="font-medium text-gray-900">{formatMoney(order.shippingFee, order.currency)}</span>
        </div>

        <div className="flex justify-between">
         <span className="text-gray-500">Discount</span>
         <span className="font-medium text-gray-900">-{formatMoney(order.discount, order.currency)}</span>
        </div>

        <div className="flex justify-between border-t border-gray-200 pt-3 text-base">
         <span className="font-semibold text-gray-900">Total</span>
         <span className="font-bold text-gray-900">{formatMoney(order.total, order.currency)}</span>
        </div>
       </div>
      </div>
     </div>

     {/* Customer */}
     <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="flex items-center gap-3 border-b border-gray-200 px-5 py-4">
       <FaUser className="text-gray-700" />
       <h2 className="font-semibold text-gray-900">Customer</h2>
      </div>

      <div className="grid gap-5 p-5 md:grid-cols-2">
       <div>
        <p className="text-xs uppercase tracking-wide text-gray-400">Name</p>
        <p className="mt-1 font-medium text-gray-900">{order.customerSnapshot?.name || customer?.name || "-"}</p>
       </div>

       <div>
        <p className="text-xs uppercase tracking-wide text-gray-400">Phone</p>
        <p className="mt-1 font-medium text-gray-900">{order.customerSnapshot?.phone || customer?.phone || "-"}</p>
       </div>

       <div>
        <p className="text-xs uppercase tracking-wide text-gray-400">Email</p>
        <p className="mt-1 font-medium text-gray-900">{order.customerSnapshot?.email || "-"}</p>
       </div>

       {store && (
        <div>
         <p className="text-xs uppercase tracking-wide text-gray-400">Store</p>
         <p className="mt-1 font-medium text-gray-900">{store.name}</p>
        </div>
       )}
      </div>
     </div>

     {/* Shipping address */}
     <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="flex items-center gap-3 border-b border-gray-200 px-5 py-4">
       <FaMapMarkerAlt className="text-gray-700" />
       <h2 className="font-semibold text-gray-900">Shipping Address</h2>
      </div>

      <div className="p-5">
       <p className="font-medium text-gray-900">{order.shippingAddress.address}</p>

       <p className="mt-1 text-sm text-gray-600">
        {[order.shippingAddress.ward, order.shippingAddress.district, order.shippingAddress.province].filter(Boolean).join(", ")}
       </p>

       {order.shippingAddress.postalCode && <p className="mt-1 text-sm text-gray-600">Postal code: {order.shippingAddress.postalCode}</p>}
      </div>
     </div>
    </div>

    {/* RIGHT */}
    <div className="space-y-6">
     {/* Update order */}
     <form onSubmit={handleSubmit} className="rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="flex items-center gap-3 border-b border-gray-200 px-5 py-4">
       <FaTruck className="text-gray-700" />
       <h2 className="font-semibold text-gray-900">Order Management</h2>
      </div>

      <div className="space-y-5 p-5">
       {/* Status */}
       <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Order Status</label>

        <select
         value={selectedStatus}
         onChange={(event) => setSelectedStatus(event.target.value)}
         disabled={nextStatuses.length === 0 || saving}
         className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-gray-900 disabled:bg-gray-100">
         <option value={currentStatusId}>{formatStatus(currentStatus?.name || currentStatusCode)}</option>

         {nextStatuses.map((nextStatus) => (
          <option key={nextStatus._id} value={nextStatus._id}>
           {formatStatus(nextStatus.name)}
          </option>
         ))}
        </select>

        {nextStatuses.length === 0 && <p className="mt-1 text-xs text-gray-400">No active next statuses are configured for this status.</p>}
       </div>

       {/* Shipping method */}
       <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Shipping Method</label>
        <input
         type="text"
         value={shippingMethod}
         onChange={(event) => setShippingMethod(event.target.value)}
         placeholder="Shipping method"
         className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-gray-900"
        />
       </div>

       {/* Tracking */}
       <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Tracking Number</label>
        <input
         type="text"
         value={trackingNumber}
         onChange={(event) => setTrackingNumber(event.target.value)}
         placeholder="Tracking number"
         className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-gray-900"
        />
       </div>

       {/* Note */}
       <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Note</label>
        <textarea
         value={note}
         onChange={(event) => setNote(event.target.value)}
         rows={4}
         placeholder="Order note..."
         className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-gray-900"
        />
       </div>

       <button
        type="submit"
        disabled={saving || selectedStatus === ""}
        className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-gray-900 px-5 py-3 text-sm font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50">
        <FaSave />
        {saving ? "Saving..." : "Save Changes"}
       </button>
      </div>
     </form>

     {/* Payment */}
     <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-200 px-5 py-4">
       <h2 className="font-semibold text-gray-900">Payment</h2>
      </div>

      <div className="space-y-4 p-5">
       <div className="flex items-center justify-between">
        <span className="text-sm text-gray-500">Method</span>
        <span className="font-medium text-gray-900">{formatStatus(order.paymentMethod)}</span>
       </div>

       <div className="flex items-center justify-between">
        <span className="text-sm text-gray-500">Status</span>
        <span
         className={`rounded-full px-2.5 py-1 text-xs font-medium ${
          order.paymentStatus === "PAID"
           ? "bg-green-100 text-green-700"
           : order.paymentStatus === "FAILED"
             ? "bg-red-100 text-red-700"
             : "bg-yellow-100 text-yellow-700"
         }`}>
         {formatStatus(order.paymentStatus)}
        </span>
       </div>
      </div>
     </div>

     {/* Status history */}
     <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="flex items-center gap-3 border-b border-gray-200 px-5 py-4">
       <FaClock className="text-gray-700" />
       <h2 className="font-semibold text-gray-900">Status History</h2>
      </div>

      <div className="p-5">
       {statusHistory.length === 0 ? (
        <p className="text-sm text-gray-500">No status history.</p>
       ) : (
        <div className="space-y-5">
         {statusHistory.map((history) => {
          const previousLabel = getHistoryStatusLabel(history.previousStatusId);
          const newLabel = getHistoryStatusLabel(history.newStatusId);

          return (
           <div key={history._id} className="relative border-l-2 border-gray-200 pl-5">
            <div className="absolute -left-[7px] top-1 h-3 w-3 rounded-full bg-gray-900" />

            <div className="flex flex-wrap items-center gap-2">
             <span className={`rounded-full px-2 py-1 text-xs font-medium ${getStatusClass(previousLabel)}`}>{formatStatus(previousLabel)}</span>

             <span className="text-gray-400">→</span>

             <span className={`rounded-full px-2 py-1 text-xs font-medium ${getStatusClass(newLabel)}`}>{formatStatus(newLabel)}</span>
            </div>

            <p className="mt-2 text-xs text-gray-500">{new Date(history.createdAt).toLocaleString("vi-VN")}</p>

            {history.changedBy && (
             <p className="mt-1 text-sm text-gray-700">
              By: <span className="font-medium">{history.changedBy.name}</span>
             </p>
            )}

            {history.note && <p className="mt-1 text-sm text-gray-500">{history.note}</p>}
           </div>
          );
         })}
        </div>
       )}
      </div>
     </div>

     {/* Created information */}
     <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-3">
       <FaCheckCircle className="text-gray-700" />

       <div>
        <p className="text-xs uppercase tracking-wide text-gray-400">Created</p>
        <p className="mt-1 text-sm font-medium text-gray-900">{new Date(order.createdAt).toLocaleString("vi-VN")}</p>
       </div>
      </div>

      {order.updatedAt && (
       <div className="mt-4 border-t border-gray-100 pt-4">
        <p className="text-xs uppercase tracking-wide text-gray-400">Last Updated</p>
        <p className="mt-1 text-sm font-medium text-gray-900">{new Date(order.updatedAt).toLocaleString("vi-VN")}</p>
       </div>
      )}
     </div>
    </div>
   </div>
  </div>
 );
}

OrderDetailPage.Layout = "Admin";
