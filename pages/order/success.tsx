"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { FaCheck, FaBox, FaPhone, FaEnvelope, FaMapMarkerAlt, FaArrowRight, FaShieldAlt } from "react-icons/fa";

/* =========================================================
   ORDER TYPES
========================================================= */

interface OrderRow {
 orderId?: string;

 customerName?: string;
 phoneNumber?: string;
 email?: string;
 address?: string;
 zipcode?: string;

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
}

/* =========================================================
   CUSTOMER
========================================================= */

interface CustomerInfo {
 fullName?: string;
 phone?: string;
 email?: string;
 address?: string;
 province?: string;
 district?: string;
 zipcode?: string;
}

/* =========================================================
   TRACKING
========================================================= */

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

/* =========================================================
   ORDER
========================================================= */

interface OrderData {
 orderId: string;

 orderTime?: string;
 createdAt?: string;

 paymentMethod?: string;

 websiteUrl?: string;

 customer: CustomerInfo;

 rows: OrderRow[];

 totalQuantity: number;
 totalPrice: number;

 currency?: string;

 tracking?: TrackingData;

 customerIp?: string;

 syncedToGoogleSheet?: boolean;
}

/* =========================================================
   COMPONENT
========================================================= */

const OrderSuccess = () => {
 const [order, setOrder] = useState<OrderData | null>(null);
 const [isLoaded, setIsLoaded] = useState(false);

 /* =======================================================
     LOAD LAST ORDER
  ======================================================= */

 useEffect(() => {
  try {
   const savedOrder = localStorage.getItem("citychain_last_order");

   if (!savedOrder) {
    setOrder(null);
    return;
   }

   const parsedOrder = JSON.parse(savedOrder);

   console.log("CITYCHAIN LAST ORDER:", parsedOrder);

   if (!parsedOrder || !Array.isArray(parsedOrder.rows) || !parsedOrder.customer) {
    console.error("Invalid order data:", parsedOrder);
    setOrder(null);
    return;
   }

   setOrder(parsedOrder);
  } catch (error) {
   console.error("Cannot load order:", error);
   setOrder(null);
  } finally {
   setIsLoaded(true);
  }
 }, []);

 /* =======================================================
     TOTAL QUANTITY
  ======================================================= */

 const totalQuantity = useMemo(() => {
  if (!order) return 0;

  if (typeof order.totalQuantity === "number") {
   return order.totalQuantity;
  }

  return order.rows.reduce((total, row) => total + Number(row.quantity || 0), 0);
 }, [order]);

 /* =======================================================
     TOTAL PRICE
  ======================================================= */

 const totalPrice = useMemo(() => {
  if (!order) return 0;

  if (typeof order.totalPrice === "number") {
   return order.totalPrice;
  }

  return order.rows.reduce((total, row) => total + Number(row.productTotal || 0), 0);
 }, [order]);

 /* =======================================================
     CURRENCY
  ======================================================= */

 const currency = useMemo(() => {
  if (!order) return "SGD";

  if (order.currency) {
   return order.currency;
  }

  return order.rows?.[0]?.currency || "SGD";
 }, [order]);

 /* =======================================================
     PRICE FORMAT
  ======================================================= */

 const formatPrice = (price: number) => {
  return Number(price || 0).toLocaleString("en-SG");
 };

 /* =======================================================
     LOADING
  ======================================================= */

 if (!isLoaded) {
  return (
   <main className="flex min-h-screen items-center justify-center bg-[#f8f8f6]">
    <p className="text-sm text-[#666]">Loading your order...</p>
   </main>
  );
 }

 /* =======================================================
     ORDER NOT FOUND
  ======================================================= */

 if (!order) {
  return (
   <main className="flex min-h-screen items-center justify-center bg-[#f8f8f6]">
    <div className="text-center">
     <h1 className="text-2xl font-semibold">Order not found</h1>

     <p className="mt-3 text-sm text-[#666]">We could not find your order information.</p>

     <Link
      href="/"
      className="mt-6 inline-flex items-center justify-center rounded-full bg-[var(--primary-color)] px-8 py-3 text-sm font-semibold text-white hover:opacity-90">
      Return to homepage
     </Link>
    </div>
   </main>
  );
 }

 /* =======================================================
     CUSTOMER
  ======================================================= */

 const customer = order.customer;

 const fullAddress = [customer.address, customer.district, customer.province, customer.zipcode].filter(Boolean).join(", ");

 /* =======================================================
     RENDER
  ======================================================= */

 return (
  <main className="min-h-screen bg-[#f8f8f6] text-[#303234]">
   {/* =====================================================
          SUCCESS HERO
      ===================================================== */}

   <section className="border-b border-[#dededb] bg-white">
    <div className="container py-12 md:py-20">
     <div className="mx-auto max-w-[700px] text-center">
      {/* ICON */}

      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#1b553e] text-white md:h-20 md:w-20">
       <FaCheck className="text-2xl md:text-3xl" />
      </div>

      <p className="mt-8 text-xs font-bold uppercase tracking-[0.2em] text-[#1b553e]">Order confirmed</p>

      <h1 className="mt-4 text-3xl font-semibold md:text-5xl">Thank you for your order</h1>

      <p className="mx-auto mt-5 max-w-[560px] text-sm leading-relaxed text-[#666] md:text-base">
       Your order has been successfully received. Our team will contact you shortly to confirm the details of your order.
      </p>

      {/* ORDER NUMBER */}

      <div className="mt-8 inline-flex flex-col items-center border border-[#dededb] bg-[#f8f8f6] px-8 py-5">
       <span className="text-xs uppercase tracking-wide text-[#777]">Order number</span>

       <strong className="mt-2 text-lg tracking-wide text-[#1b553e]">{order.orderId}</strong>
      </div>

      {/* ORDER DATE */}

      {(order.orderTime || order.createdAt) && <p className="mt-4 text-xs text-[#888]">{order.orderTime || order.createdAt}</p>}
     </div>
    </div>
   </section>

   {/* =====================================================
          MAIN CONTENT
      ===================================================== */}

   <section className="container py-10 md:py-16">
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
     {/* =================================================
              LEFT
          ================================================= */}

     <div className="space-y-8">
      {/* =============================================
                CUSTOMER INFORMATION
            ============================================= */}

      <section className="border border-[#dededb] bg-white">
       <div className="border-b border-[#dededb] px-6 py-5 md:px-8">
        <div className="flex items-center gap-3">
         <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#f3f5f2] text-[#1b553e]">
          <FaBox />
         </div>

         <div>
          <h2 className="text-lg font-semibold">Delivery information</h2>

          <p className="mt-1 text-sm text-[#777]">Customer and delivery details</p>
         </div>
        </div>
       </div>

       <div className="grid gap-7 p-6 md:grid-cols-2 md:p-8">
        {/* FULL NAME */}

        <div>
         <p className="text-xs uppercase tracking-wide text-[#777]">Full name</p>

         <p className="mt-2 font-medium">{customer.fullName || "-"}</p>
        </div>

        {/* PHONE */}

        <div className="flex gap-3">
         <FaPhone className="mt-1 text-[#1b553e]" />

         <div>
          <p className="text-xs uppercase tracking-wide text-[#777]">Phone number</p>

          <p className="mt-2 font-medium">{customer.phone || "-"}</p>
         </div>
        </div>

        {/* EMAIL */}

        <div className="flex gap-3">
         <FaEnvelope className="mt-1 text-[#1b553e]" />

         <div>
          <p className="text-xs uppercase tracking-wide text-[#777]">Email</p>

          <p className="mt-2 break-all font-medium">{customer.email || "-"}</p>
         </div>
        </div>

        {/* ADDRESS */}

        <div className="flex gap-3">
         <FaMapMarkerAlt className="mt-1 shrink-0 text-[#1b553e]" />

         <div>
          <p className="text-xs uppercase tracking-wide text-[#777]">Delivery address</p>

          <p className="mt-2 leading-relaxed font-medium">{fullAddress || "-"}</p>
         </div>
        </div>
       </div>
      </section>

      {/* =============================================
                ORDER ITEMS
            ============================================= */}

      <section className="border border-[#dededb] bg-white">
       {/* HEADER */}

       <div className="flex items-center justify-between border-b border-[#dededb] px-6 py-5 md:px-8">
        <div>
         <h2 className="text-lg font-semibold">Your order</h2>

         <p className="mt-1 text-sm text-[#777]">
          {totalQuantity} item
          {totalQuantity !== 1 ? "s" : ""}
         </p>
        </div>

        <span className="text-sm text-[#777]">
         {order.rows.length} product
         {order.rows.length !== 1 ? "s" : ""}
        </span>
       </div>

       {/* PRODUCTS */}

       <div>
        {order.rows.map((row, index) => {
         const itemQuantity = Number(row.quantity || 0);

         const itemPrice = Number(row.productPrice || 0);

         const itemTotal = Number(row.productTotal || 0);

         const itemImage = row.productImage || "";

         const itemName = row.productName || "Product";

         const itemCurrency = row.currency || currency;

         return (
          <div key={`${row.productId || itemName}-${index}`} className="flex gap-5 border-b border-[#eeeeec] p-5 last:border-b-0 md:gap-8 md:p-8">
           {/* IMAGE */}

           <div className="flex h-[110px] w-[90px] shrink-0 items-center justify-center bg-[#f4f4f4] md:h-[150px] md:w-[120px]">
            {itemImage ? <img src={itemImage} alt={itemName} className="h-full w-full object-contain" /> : <FaBox className="text-2xl text-[#aaa]" />}
           </div>

           {/* PRODUCT INFO */}

           <div className="flex min-w-0 flex-1 flex-col justify-between">
            <div>
             <h3 className="text-base font-semibold md:text-lg">{itemName}</h3>

             {row.brand && <p className="mt-1 text-sm text-[#666]">{row.brand}</p>}
            </div>

            <div className="mt-5 flex flex-wrap items-end justify-between gap-4">
             {/* QUANTITY */}

             <div>
              <p className="text-xs uppercase tracking-wide text-[#777]">Quantity</p>

              <p className="mt-1 font-semibold">{itemQuantity}</p>
             </div>

             {/* UNIT PRICE */}

             <div>
              <p className="text-xs uppercase tracking-wide text-[#777]">Unit price</p>

              <p className="mt-1 font-medium">
               {itemCurrency} {formatPrice(itemPrice)}
              </p>
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
      </section>
     </div>

     {/* =================================================
              RIGHT
          ================================================= */}

     <aside className="space-y-5">
      {/* ORDER SUMMARY */}

      <div className="border border-[#dededb] bg-white p-6 md:p-8">
       <h2 className="text-lg font-semibold">Order summary</h2>

       <div className="mt-7 space-y-5 border-b border-[#dededb] pb-6">
        <div className="flex justify-between gap-5 text-sm">
         <span className="text-[#666]">Items</span>

         <span className="font-medium">{totalQuantity}</span>
        </div>

        <div className="flex justify-between gap-5 text-sm">
         <span className="text-[#666]">Subtotal</span>

         <span className="font-medium">
          {currency} {formatPrice(totalPrice)}
         </span>
        </div>

        <div className="flex justify-between gap-5 text-sm">
         <span className="text-[#666]">Delivery</span>

         <span className="font-medium text-[#1b553e]">Complimentary</span>
        </div>
       </div>

       <div className="mt-6 flex items-end justify-between">
        <span className="text-base font-semibold">Total</span>

        <span className="text-xl font-semibold">
         {currency} {formatPrice(totalPrice)}
        </span>
       </div>
      </div>

      {/* PAYMENT METHOD */}

      <div className="border border-[#dededb] bg-white p-6">
       <div className="flex gap-4">
        <FaCheck className="mt-1 shrink-0 text-xl text-[#1b553e]" />

        <div>
         <h3 className="font-semibold">Payment method</h3>

         <p className="mt-2 text-sm leading-relaxed text-[#666]">{order.paymentMethod || "Cash on Delivery"}</p>
        </div>
       </div>
      </div>

      {/* SECURITY */}

      <div className="border border-[#dededb] bg-white p-6">
       <div className="flex gap-4">
        <FaShieldAlt className="mt-1 shrink-0 text-xl text-[#1b553e]" />

        <div>
         <h3 className="font-semibold">Your order is secure</h3>

         <p className="mt-2 text-sm leading-relaxed text-[#666]">Your order information has been successfully received and will be handled securely.</p>
        </div>
       </div>
      </div>

      {/* ACTIONS */}

      <div className="space-y-3">
       <Link
        href="/"
        className="flex w-full items-center justify-center gap-3 rounded-full bg-[var(--primary-color)] py-4 text-sm font-semibold text-white transition-opacity hover:opacity-90">
        Continue shopping
        <FaArrowRight className="text-xs" />
       </Link>

       <Link
        href="/order/my-orders"
        className="flex w-full items-center justify-center rounded-full border border-[#303234] py-4 text-sm font-semibold transition-colors hover:bg-[#303234] hover:text-white">
        My Orders
       </Link>
      </div>
     </aside>
    </div>
   </section>

   {/* =====================================================
          FOOTER MESSAGE
      ===================================================== */}

   <section className="border-t border-[#dededb] bg-white">
    <div className="container py-10 text-center md:py-14">
     <h2 className="text-xl font-semibold">Thank you for choosing us</h2>

     <p className="mx-auto mt-4 max-w-[600px] text-sm leading-relaxed text-[#666]">
      We appreciate your trust. Our team will review your order and contact you shortly regarding the next steps.
     </p>
    </div>
   </section>
  </main>
 );
};

OrderSuccess.Layout = "Default";

export default OrderSuccess;
