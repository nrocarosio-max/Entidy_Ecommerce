"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import {
 FaBox,
 FaPhone,
 FaEnvelope,
 FaMapMarkerAlt,
 FaTruck,
 FaShieldAlt,
 FaArrowRight,
 FaShoppingBag,
 FaCheckCircle,
 FaCalendarAlt,
 FaChevronDown,
 FaChevronUp,
 FaUser,
 FaClipboardList,
 FaCreditCard,
} from "react-icons/fa";

/* =========================================================
   TYPES
========================================================= */

interface OrderRow {
 orderId?: string;
 orderTime?: string;

 customerName?: string;
 phoneNumber?: string;
 email?: string;

 address?: string;
 zipcode?: string;

 province?: string;
 district?: string;

 productName?: string;
 productId?: string;
 brand?: string;

 quantity?: number;
 productPrice?: number;
 productTotal?: number;

 currency?: string;
 productImage?: string;

 websiteUrl?: string;
 customerIp?: string;

 campaign_name?: string;
 placement?: string;

 /* Tracking */
 utm_source?: string;
 utm_medium?: string;
 utm_campaign?: string;
 utm_content?: string;
 utm_term?: string;
 fbclid?: string;
 landing_page?: string;

 /* Fallback dữ liệu cũ */
 ngay_gio?: string;
 ten_khach?: string;
 so_dien_thoai?: string;
 dia_chi?: string;

 so_luong?: number;
 tong_gia?: number;
 ten_san_pham?: string;

 link_khach_hang_dat_hang?: string;
 ip_khach_hang?: string;

 payment_method?: string;
 order_total?: number;
 order_quantity?: number;
 order_id?: string;

 id?: string;
 name?: string;
 title?: string;
 slug?: string;
 price?: number;
 priceNew?: number;
 image?: string;

 images?: {
  main?: string;
 };
}

interface CustomerInfo {
 fullName?: string;
 phone?: string;
 email?: string;
 address?: string;
 province?: string;
 district?: string;
 zipcode?: string;
}

interface TrackingData {
 utm_source?: string;
 utm_medium?: string;
 utm_campaign?: string;
 utm_content?: string;
 utm_term?: string;
 fbclid?: string;

 campaign_name?: string;
 placement?: string;
 landing_page?: string;
}

interface OrderData {
 orderId: string;

 rows: OrderRow[];

 customer: CustomerInfo;

 totalQuantity: number;
 totalPrice: number;

 currency?: string;

 createdAt?: string;
 orderTime?: string;

 paymentMethod?: string;
 orderTotal?: number;

 tracking?: TrackingData;

 customerIp?: string;

 syncedToGoogleSheet?: boolean;
}

/* =========================================================
   ORDER STATUS
========================================================= */

const ORDER_STATUS_STEPS = [
 {
  step: 1,
  label: "Enter delivery information",
  shortLabel: "Delivery information",
  description: "Your order has been received and your delivery information is being processed.",
  icon: FaUser,
 },
 {
  step: 2,
  label: "Wait for confirmation",
  shortLabel: "Confirmation",
  description: "Our team is reviewing your order and will confirm your delivery information.",
  icon: FaClipboardList,
 },
 {
  step: 3,
  label: "Wait for delivery",
  shortLabel: "Delivery",
  description: "Your watch is being prepared and will be delivered to your address.",
  icon: FaTruck,
 },
 {
  step: 4,
  label: "Inspect & pay",
  shortLabel: "Inspect & pay",
  description: "Inspect your watch when it arrives and make your payment upon delivery.",
  icon: FaCreditCard,
 },
];

/* =========================================================
   ORDER STATUS TIMING

   STEP 1:
   0 -> 15 minutes

   STEP 2:
   15 minutes -> 15 hours 15 minutes

   STEP 3:
   15 hours 15 minutes -> 2 days + 15 hours 15 minutes

   STEP 4:
   After that
========================================================= */

const STEP_1_DURATION = 15 * 60 * 1000;

const STEP_2_DURATION = 15 * 60 * 60 * 1000;

const STEP_3_DURATION = 2 * 24 * 60 * 60 * 1000;

/* =========================================================
   GET ORDER STATUS STEP
========================================================= */
const parseOrderDate = (dateValue?: string): Date | null => {
 if (!dateValue) {
  return null;
 }

 const value = String(dateValue).trim();

 // ISO format:
 // 2026-09-29T04:10:30.000Z
 const isoDate = new Date(value);

 if (!Number.isNaN(isoDate.getTime())) {
  return isoDate;
 }

 // Legacy format:
 // 29/09/2026, 12:10:30
 // 29/09/2026 12:10:30
 const match = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:,\s*|\s+)(\d{1,2}):(\d{2})(?::(\d{2}))?$/);

 if (!match) {
  return null;
 }

 const [, day, month, year, hour, minute, second = "0"] = match;

 /*
  * Singapore / Malaysia = UTC+8.
  *
  * The old checkout value was already displayed in +8,
  * so convert it back to UTC before creating the Date.
  */
 const timestamp = Date.UTC(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute), Number(second)) - 8 * 60 * 60 * 1000;

 const parsedDate = new Date(timestamp);

 if (Number.isNaN(parsedDate.getTime())) {
  return null;
 }

 return parsedDate;
};
const getOrderStatusStep = (order: OrderData, currentTime: number): number => {
 const dateValue = order.createdAt || order.orderTime || order.rows?.[0]?.orderTime;

 if (!dateValue) {
  return 1;
 }

 const parsedDate = parseOrderDate(dateValue);

 if (!parsedDate) {
  return 1;
 }

 const orderTime = parsedDate.getTime();

 const elapsed = currentTime - orderTime;

 /* STEP 1 */
 if (elapsed < STEP_1_DURATION) {
  return 1;
 }

 /* STEP 2 */
 if (elapsed < STEP_1_DURATION + STEP_2_DURATION) {
  return 2;
 }

 /* STEP 3 */
 if (elapsed < STEP_1_DURATION + STEP_2_DURATION + STEP_3_DURATION) {
  return 3;
 }

 /* STEP 4 */
 return 4;
};

/* =========================================================
   COMPONENT
========================================================= */

const MyOrders = () => {
 const [orders, setOrders] = useState<OrderData[]>([]);

 const [isLoaded, setIsLoaded] = useState(false);

 const [openOrder, setOpenOrder] = useState<string | null>(null);

 const [activeTab, setActiveTab] = useState(1);

 const [currentTime, setCurrentTime] = useState(Date.now());

 /* =======================================================
     LOAD ORDERS
  ======================================================= */

 useEffect(() => {
  try {
   const savedOrders = localStorage.getItem("citychain_orders");
   const savedLastOrder = localStorage.getItem("citychain_last_order");

   let parsedOrders: any[] = [];

   /* =====================================================
     LOAD ALL ORDERS
  ===================================================== */

   if (savedOrders) {
    try {
     const parsed = JSON.parse(savedOrders);

     if (Array.isArray(parsed)) {
      parsedOrders = parsed;
     }
    } catch (error) {
     console.error("Cannot parse citychain_orders:", error);
    }
   }

   /* =====================================================
     MIGRATE LAST ORDER
     Add citychain_last_order if it does not exist
  ===================================================== */

   if (savedLastOrder) {
    try {
     const lastOrder = JSON.parse(savedLastOrder);

     if (lastOrder && typeof lastOrder === "object" && typeof lastOrder.orderId === "string" && Array.isArray(lastOrder.rows)) {
      const alreadyExists = parsedOrders.some((order) => order?.orderId === lastOrder.orderId);

      if (!alreadyExists) {
       parsedOrders.push(lastOrder);
      }
     }
    } catch (error) {
     console.error("Cannot parse citychain_last_order:", error);
    }
   }

   /* =====================================================
     NORMALIZE ORDERS
  ===================================================== */

   const normalizedOrders: OrderData[] = parsedOrders
    .filter((order) => order && typeof order === "object" && typeof order.orderId === "string" && Array.isArray(order.rows))
    .map((parsedOrder) => {
     const rows = Array.isArray(parsedOrder.rows) ? parsedOrder.rows : [];

     const totalQuantity =
      typeof parsedOrder.totalQuantity === "number"
       ? parsedOrder.totalQuantity
       : rows.reduce((total: number, row: OrderRow) => total + Number(row.quantity ?? row.so_luong ?? 0), 0);

     const totalPrice =
      typeof parsedOrder.totalPrice === "number"
       ? parsedOrder.totalPrice
       : rows.reduce((total: number, row: OrderRow) => {
          const quantity = Number(row.quantity ?? row.so_luong ?? 1);

          const price = Number(row.productPrice) || Number(row.priceNew) || Number(row.price) || 0;

          const productTotal = Number(row.productTotal) || Number(row.tong_gia) || price * quantity;

          return total + productTotal;
         }, 0);

     return {
      ...parsedOrder,
      rows,
      customer: parsedOrder.customer || {},
      totalQuantity,
      totalPrice,
     };
    });

   /* =====================================================
     SORT NEWEST ORDER FIRST
  ===================================================== */

   normalizedOrders.sort((a, b) => {
    const dateA = parseOrderDate(a.createdAt || a.orderTime || a.rows?.[0]?.orderTime);

    const dateB = parseOrderDate(b.createdAt || b.orderTime || b.rows?.[0]?.orderTime);

    return (dateB?.getTime() || 0) - (dateA?.getTime() || 0);
   });

   /* =====================================================
     SAVE NORMALIZED ORDER LIST
  ===================================================== */

   localStorage.setItem("citychain_orders", JSON.stringify(normalizedOrders));

   setOrders(normalizedOrders);

   /* =====================================================
     OPEN NEWEST ORDER
  ===================================================== */

   if (normalizedOrders.length > 0) {
    const newestOrder = normalizedOrders[0];

    const newestStatus = getOrderStatusStep(newestOrder, Date.now());

    setActiveTab(newestStatus);
    setOpenOrder(newestOrder.orderId);
   }
  } catch (error) {
   console.error("Cannot load orders:", error);
   setOrders([]);
  } finally {
   setIsLoaded(true);
  }
 }, []);

 /* =======================================================
     UPDATE CURRENT TIME
  ======================================================= */

 useEffect(() => {
  if (orders.length === 0) {
   return;
  }

  const interval = window.setInterval(() => {
   setCurrentTime(Date.now());
  }, 60 * 1000);

  return () => {
   window.clearInterval(interval);
  };
 }, [orders.length]);

 /* =======================================================
     ORDERS BY STATUS
  ======================================================= */

 const ordersByStatus = useMemo(() => {
  const result: Record<number, OrderData[]> = {
   1: [],
   2: [],
   3: [],
   4: [],
  };

  orders.forEach((order) => {
   const status = getOrderStatusStep(order, currentTime);

   result[status].push(order);
  });

  return result;
 }, [orders, currentTime]);

 const activeOrders = ordersByStatus[activeTab] || [];

 /* =======================================================
     PRICE FORMAT
  ======================================================= */

 const formatPrice = (price: number) => {
  return Number(price || 0).toLocaleString();
 };

 /* =======================================================
     GET ORDER CURRENCY
  ======================================================= */

 const getOrderCurrency = (order: OrderData) => {
  return order.currency || order.rows?.find((row) => row.currency)?.currency || "SGD";
 };

 /* =======================================================
     GET TOTAL QUANTITY
  ======================================================= */

 const getTotalQuantity = (order: OrderData) => {
  if (typeof order.totalQuantity === "number") {
   return order.totalQuantity;
  }

  return order.rows.reduce((total, row) => {
   return total + Number(row.so_luong ?? row.quantity ?? 0);
  }, 0);
 };

 /* =======================================================
     GET ORDER TOTAL
  ======================================================= */

 const getOrderTotal = (order: OrderData) => {
  if (typeof order.orderTotal === "number") {
   return order.orderTotal;
  }

  if (typeof order.totalPrice === "number") {
   return order.totalPrice;
  }

  return order.rows.reduce((total, row) => {
   if (typeof row.tong_gia === "number") {
    return total + row.tong_gia;
   }

   if (typeof row.productTotal === "number") {
    return total + row.productTotal;
   }

   const price = Number(row.productPrice) || Number(row.priceNew) || Number(row.price) || 0;

   const quantity = Number(row.quantity) || Number(row.so_luong) || 1;

   return total + price * quantity;
  }, 0);
 };

 /* =======================================================
     LOADING
  ======================================================= */

 if (!isLoaded) {
  return (
   <main className="flex min-h-screen items-center justify-center bg-[#f8f8f6]">
    <div className="text-center">
     <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-[#dededb] border-t-[#1b553e]" />

     <p className="mt-5 text-sm text-[#666]">Loading your orders...</p>
    </div>
   </main>
  );
 }

 /* =======================================================
     EMPTY STATE
  ======================================================= */

 if (orders.length === 0) {
  return (
   <main className="min-h-screen bg-[#f8f8f6] text-[#303234]">
    <section className="border-b border-[#dededb] bg-white">
     <div className="container py-14 text-center md:py-20">
      <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#1b553e]">My account</span>

      <h1 className="mt-4 text-4xl font-semibold md:text-5xl">My orders</h1>

      <p className="mx-auto mt-5 max-w-[560px] text-sm leading-relaxed text-[#666] md:text-base">View and manage all of your orders in one place.</p>
     </div>
    </section>

    <section className="container py-16 md:py-24">
     <div className="mx-auto max-w-[600px] border border-[#dededb] bg-white px-6 py-14 text-center md:px-12 md:py-20">
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#f3f5f2] text-[#1b553e]">
       <FaShoppingBag className="text-3xl" />
      </div>

      <h2 className="mt-7 text-2xl font-semibold">No orders yet</h2>

      <p className="mx-auto mt-4 max-w-[420px] text-sm leading-relaxed text-[#666]">
       You have not placed any orders yet. Discover our collection and find your next exceptional timepiece.
      </p>

      <Link
       href="/"
       className="mt-8 inline-flex items-center justify-center gap-3 rounded-full bg-[var(--primary-color)] px-8 py-4 text-sm font-semibold text-white transition hover:opacity-90">
       Continue shopping
       <FaArrowRight className="text-xs" />
      </Link>
     </div>
    </section>
   </main>
  );
 }

 /* =======================================================
     RENDER
  ======================================================= */

 return (
  <main className="min-h-screen bg-[#f8f8f6] text-[#303234]">
   {/* =====================================================
          HERO
      ===================================================== */}

   <section className="border-b border-[#dededb] bg-white">
    <div className="container py-12 md:py-20">
     <div className="max-w-[720px]">
      <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#1b553e]">My account</span>

      <h1 className="mt-4 text-4xl font-semibold md:text-5xl">My orders</h1>

      <p className="mt-5 max-w-[600px] text-sm leading-relaxed text-[#666] md:text-base">
       View all your orders and review your delivery information and purchased products.
      </p>

      <div className="mt-8 flex items-center gap-4">
       <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#f3f5f2] text-[#1b553e]">
        <FaBox />
       </div>

       <div>
        <p className="text-2xl font-semibold">{orders.length}</p>

        <p className="text-sm text-[#777]">Order{orders.length !== 1 ? "s" : ""} placed</p>
       </div>
      </div>
     </div>
    </div>
   </section>

   {/* =====================================================
          4 LARGE STATUS TABS
      ===================================================== */}

   <section className="container py-8 md:py-12">
    <div className="mx-auto max-w-[1100px]">
     <div className="grid grid-cols-2 border border-[#dededb] bg-white md:grid-cols-4">
      {ORDER_STATUS_STEPS.map((status) => {
       const StatusIcon = status.icon;

       const statusOrders = ordersByStatus[status.step] || [];

       const isActive = activeTab === status.step;

       return (
        <button
         key={status.step}
         type="button"
         onClick={() => setActiveTab(status.step)}
         className={`
          relative flex min-h-[170px]
          flex-col items-center justify-center
          border-b border-r border-[#dededb]
          px-4 py-6 text-center
          transition
          md:min-h-[190px]
          ${isActive ? "bg-[#1b553e] text-white" : "bg-white text-[#303234] hover:bg-[#fafaf8]"}
         `}>
         {/* STEP */}

         <span
          className={`
           text-[10px] font-bold
           uppercase tracking-[0.18em]
           ${isActive ? "text-white/70" : "text-[#999]"}
          `}>
          Step {String(status.step).padStart(2, "0")}
         </span>

         {/* ICON */}

         <div
          className={`
           mt-3 flex h-12 w-12
           items-center justify-center
           rounded-full border
           ${isActive ? "border-white/30 bg-white/10" : "border-[#dededb] bg-[#f5f6f4]"}
          `}>
          <StatusIcon
           className={`
            text-lg
            ${isActive ? "text-white" : "text-[#1b553e]"}
           `}
          />
         </div>

         {/* LABEL */}

         <h2
          className={`
           mt-4 text-sm
           font-semibold
           leading-tight md:text-base
           ${isActive ? "text-white" : "text-[#222]"}
          `}>
          {status.shortLabel}
         </h2>

         {/* COUNT */}

         <span
          className={`
           mt-2 text-xs
           ${isActive ? "text-white/70" : "text-[#777]"}
          `}>
          {statusOrders.length} order
          {statusOrders.length !== 1 ? "s" : ""}
         </span>

         {/* ACTIVE INDICATOR */}

         {isActive && <span className="absolute bottom-0 left-0 h-1 w-full bg-white" />}
        </button>
       );
      })}
     </div>
    </div>
   </section>

   {/* =====================================================
          ACTIVE TAB DESCRIPTION
      ===================================================== */}

   <section className="container pb-8 md:pb-10">
    <div className="mx-auto max-w-[1100px]">
     <div className="flex flex-col gap-4 border border-[#dededb] bg-white px-5 py-5 md:flex-row md:items-center md:justify-between md:px-8">
      <div className="flex items-start gap-4">
       <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#f3f5f2] text-[#1b553e]">
        {(() => {
         const Icon = ORDER_STATUS_STEPS[activeTab - 1].icon;

         return <Icon />;
        })()}
       </div>

       <div>
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#1b553e]">Step {String(activeTab).padStart(2, "0")}</p>

        <h2 className="mt-1 text-lg font-semibold">{ORDER_STATUS_STEPS[activeTab - 1].label}</h2>

        <p className="mt-1 text-sm leading-relaxed text-[#777]">{ORDER_STATUS_STEPS[activeTab - 1].description}</p>
       </div>
      </div>

      <div className="shrink-0 text-sm text-[#777]">
       <span className="font-semibold text-[#222]">{activeOrders.length}</span> order
       {activeOrders.length !== 1 ? "s" : ""}
      </div>
     </div>
    </div>
   </section>

   {/* =====================================================
          ORDERS IN ACTIVE TAB
      ===================================================== */}

   <section className="container pb-10 md:pb-16">
    <div className="mx-auto max-w-[1100px]">
     {activeOrders.length === 0 ? (
      <div className="border border-[#dededb] bg-white px-6 py-16 text-center md:px-10 md:py-20">
       <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#f3f5f2] text-[#1b553e]">
        {(() => {
         const Icon = ORDER_STATUS_STEPS[activeTab - 1].icon;

         return <Icon className="text-2xl" />;
        })()}
       </div>

       <h2 className="mt-6 text-xl font-semibold">No orders in this stage</h2>

       <p className="mx-auto mt-3 max-w-[500px] text-sm leading-relaxed text-[#777]">
        There are currently no orders in {ORDER_STATUS_STEPS[activeTab - 1].label}.
       </p>
      </div>
     ) : (
      <div className="space-y-6">
       {activeOrders.map((order) => {
        const customer = order.customer || {};

        const isOpen = openOrder === order.orderId;

        const totalQuantity = getTotalQuantity(order);

        const subtotal = getOrderTotal(order);

        const currency = getOrderCurrency(order);

        const fullAddress = [customer.address, customer.district, customer.province, customer.zipcode].filter(Boolean).join(", ");

        const dateValue = order.createdAt || order.orderTime || order.rows?.[0]?.orderTime;

        const orderDate = parseOrderDate(dateValue);

        const formattedDateTime = orderDate
         ? new Intl.DateTimeFormat("en-MY", {
            timeZone: "Asia/Kuala_Lumpur",
            day: "2-digit",
            month: "long",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
           }).format(orderDate)
         : "—";

        const formattedTime = orderDate
         ? new Intl.DateTimeFormat("en-MY", {
            timeZone: "Asia/Kuala_Lumpur",
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
           }).format(orderDate)
         : "—";

        return (
         <article key={order.orderId} className="overflow-hidden border border-[#dededb] bg-white">
          {/* =================================================
                    ORDER HEADER
                ================================================= */}

          <button
           type="button"
           onClick={() => setOpenOrder(isOpen ? null : order.orderId)}
           className="flex w-full flex-col gap-5 p-5 text-left transition hover:bg-[#fafaf8] md:flex-row md:items-center md:justify-between md:p-8">
           {/* LEFT */}

           <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#f3f5f2] text-[#1b553e]">
             <FaBox />
            </div>

            <div>
             <p className="text-xs uppercase tracking-[0.12em] text-[#777]">Order number</p>

             <h2 className="mt-2 text-lg font-semibold text-[#1b553e] md:text-xl">{order.orderId}</h2>

             <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-[#777]">
              <span className="flex items-center gap-2">
               <FaCalendarAlt />

               <span>Ordered: {formattedDateTime} MYT</span>
              </span>

              <span>{formattedTime} Singapore Time</span>

              <span>
               {totalQuantity} item
               {totalQuantity !== 1 ? "s" : ""}
              </span>
             </div>
            </div>
           </div>

           {/* RIGHT */}

           <div className="flex items-center justify-between gap-5 md:justify-end">
            <div className="text-left md:text-right">
             <p className="text-xs uppercase tracking-wide text-[#777]">Order total</p>

             <p className="mt-2 text-lg font-semibold">
              {currency} {formatPrice(subtotal)}
             </p>
            </div>

            <div className="flex h-10 w-10 items-center justify-center text-[#1b553e]">{isOpen ? <FaChevronUp /> : <FaChevronDown />}</div>
           </div>
          </button>

          {/* =================================================
                    CURRENT STATUS
                ================================================= */}

          <div className="border-t border-[#dededb] bg-[#fafbf9] px-5 py-4 md:px-8">
           <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
             <FaCheckCircle className="text-[#1b553e]" />

             <span className="text-sm font-medium text-[#1b553e]">{ORDER_STATUS_STEPS[activeTab - 1].label}</span>
            </div>

            <span className="text-sm text-[#666]">Payment: {order.paymentMethod || "Cash on Delivery"}</span>
           </div>
          </div>

          {/* =================================================
                    ORDER DETAILS
                ================================================= */}

          {isOpen && (
           <div className="border-t border-[#dededb]">
            <div className="grid lg:grid-cols-[minmax(0,1fr)_340px]">
             {/* PRODUCTS */}

             <div className="border-b border-[#dededb] lg:border-b-0 lg:border-r">
              <div className="border-b border-[#dededb] px-5 py-5 md:px-8">
               <h3 className="text-xl font-semibold">Ordered products</h3>

               <p className="mt-1 text-sm text-[#777]">
                {order.rows.length} product
                {order.rows.length !== 1 ? "s" : ""}
               </p>
              </div>

              <div>
               {order.rows.map((row, index) => {
                const itemName = row.productName || row.ten_san_pham || row.name || "Product";

                const itemQuantity = Number(row.quantity ?? row.so_luong ?? 0);

                let itemTotal = Number(row.productTotal ?? row.tong_gia ?? 0);

                if (!itemTotal) {
                 const itemPrice = Number(row.productPrice) || Number(row.priceNew) || Number(row.price) || 0;

                 itemTotal = itemPrice * (itemQuantity || 1);
                }

                const itemImage = row.productImage || row.image || row.images?.main || "";

                const itemCurrency = row.currency || currency;

                const itemProductId = row.productId || row.id || "";

                return (
                 <div key={`${itemProductId || itemName}-${index}`} className="flex gap-4 border-b border-[#eeeeec] p-5 last:border-b-0 md:gap-7 md:p-8">
                  {/* IMAGE */}

                  <div className="flex h-[110px] w-[90px] shrink-0 items-center justify-center bg-[#f4f4f4] md:h-[150px] md:w-[120px]">
                   {itemImage ? <img src={itemImage} alt={itemName} className="h-full w-full object-contain" /> : <FaBox className="text-2xl text-[#bbb]" />}
                  </div>

                  {/* INFO */}

                  <div className="flex min-w-0 flex-1 flex-col justify-between">
                   <div>
                    <p className="text-xs uppercase tracking-wide text-[#777]">{row.brand || "City Chain"}</p>

                    <h4 className="mt-1 text-base font-semibold md:text-lg">{itemName}</h4>

                    {itemProductId && <p className="mt-2 text-xs text-[#999]">Reference: {itemProductId}</p>}
                   </div>

                   <div className="mt-5 flex flex-wrap items-end justify-between gap-4">
                    {/* QUANTITY */}

                    <div>
                     <p className="text-xs uppercase tracking-wide text-[#777]">Quantity</p>

                     <p className="mt-1 font-semibold">{itemQuantity}</p>
                    </div>

                    {/* TOTAL */}

                    <div className="text-right">
                     <p className="text-xs uppercase tracking-wide text-[#777]">Total</p>

                     <p className="mt-1 font-semibold">
                      {itemCurrency} {formatPrice(itemTotal)}
                     </p>
                    </div>
                   </div>
                  </div>
                 </div>
                );
               })}
              </div>
             </div>

             {/* CUSTOMER INFORMATION */}

             <aside className="bg-[#fafaf8]">
              <div className="border-b border-[#dededb] px-5 py-5 md:px-7">
               <h3 className="text-xl font-semibold">Delivery information</h3>

               <p className="mt-1 text-sm text-[#777]">Customer details</p>
              </div>

              <div className="space-y-7 p-5 md:p-7">
               {/* NAME */}

               <div>
                <p className="text-xs uppercase tracking-wide text-[#777]">Full name</p>

                <p className="mt-2 font-semibold">{customer.fullName || "-"}</p>
               </div>

               {/* PHONE */}

               <div className="flex gap-3">
                <FaPhone className="mt-1 shrink-0 text-[#1b553e]" />

                <div>
                 <p className="text-xs uppercase tracking-wide text-[#777]">Phone number</p>

                 <p className="mt-2 font-semibold">{customer.phone || "-"}</p>
                </div>
               </div>

               {/* EMAIL */}

               <div className="flex gap-3">
                <FaEnvelope className="mt-1 shrink-0 text-[#1b553e]" />

                <div className="min-w-0">
                 <p className="text-xs uppercase tracking-wide text-[#777]">Email</p>

                 <p className="mt-2 break-all font-semibold">{customer.email || "-"}</p>
                </div>
               </div>

               {/* ADDRESS */}

               <div className="flex gap-3">
                <FaMapMarkerAlt className="mt-1 shrink-0 text-[#1b553e]" />

                <div>
                 <p className="text-xs uppercase tracking-wide text-[#777]">Delivery address</p>

                 <p className="mt-2 leading-relaxed font-semibold">{fullAddress || "-"}</p>
                </div>
               </div>

               {/* PAYMENT */}

               <div className="border-t border-[#dededb] pt-6">
                <p className="text-xs uppercase tracking-wide text-[#777]">Payment method</p>

                <p className="mt-2 flex items-center gap-3 font-semibold">
                 <FaTruck className="text-[#1b553e]" />

                 {order.paymentMethod || "Cash on Delivery"}
                </p>
               </div>
              </div>
             </aside>
            </div>

            {/* TOTAL */}

            <div className="border-t border-[#dededb] bg-white px-5 py-6 md:px-8">
             <div className="ml-auto max-w-[380px]">
              <div className="flex justify-between gap-5 text-sm">
               <span className="text-[#666]">Subtotal</span>

               <span className="font-medium">
                {currency} {formatPrice(subtotal)}
               </span>
              </div>

              <div className="mt-4 flex justify-between gap-5 text-sm">
               <span className="text-[#666]">Delivery</span>

               <span className="font-medium text-[#1b553e]">Complimentary</span>
              </div>

              <div className="mt-5 flex justify-between border-t border-[#dededb] pt-5">
               <span className="text-lg font-semibold">Total</span>

               <span className="text-xl font-semibold">
                {currency} {formatPrice(subtotal)}
               </span>
              </div>
             </div>
            </div>
           </div>
          )}
         </article>
        );
       })}
      </div>
     )}
    </div>

    {/* CONTINUE SHOPPING */}

    <div className="mt-10 text-center md:mt-14">
     <Link
      href="/"
      className="inline-flex items-center justify-center gap-3 rounded-full bg-[var(--primary-color)] px-9 py-4 text-sm font-semibold text-white transition hover:opacity-90">
      Continue shopping
      <FaArrowRight className="text-xs" />
     </Link>
    </div>
   </section>

   {/* =====================================================
          FOOTER BENEFITS
      ===================================================== */}

   <section className="border-t border-[#dededb] bg-white">
    <div className="container grid gap-8 py-10 md:grid-cols-3 md:py-14">
     <Benefit icon={<FaTruck />} title="Complimentary delivery" text="Secure delivery directly to your address." />

     <Benefit icon={<FaShieldAlt />} title="Secure order" text="Your order information is securely protected." />

     <Benefit icon={<FaCheckCircle />} title="Order confirmation" text="Your order history is always available here." />
    </div>
   </section>
  </main>
 );
};

/* =========================================================
   BENEFIT COMPONENT
========================================================= */

interface BenefitProps {
 icon: React.ReactNode;
 title: string;
 text: string;
}

const Benefit = ({ icon, title, text }: BenefitProps) => {
 return (
  <div className="flex items-start gap-4">
   <div className="mt-1 text-xl text-[#1b553e]">{icon}</div>

   <div>
    <h3 className="font-semibold">{title}</h3>

    <p className="mt-2 text-sm leading-relaxed text-[#666]">{text}</p>
   </div>
  </div>
 );
};

MyOrders.Layout = "Default";

export default MyOrders;
