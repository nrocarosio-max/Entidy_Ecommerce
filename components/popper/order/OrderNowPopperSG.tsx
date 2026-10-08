"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/router";

import { IoClose } from "react-icons/io5";
import { FaTruck, FaLock, FaCrown } from "react-icons/fa";

import type { CityChainWatch } from "~/data/CityChainWatch";
import { useCountry } from "~/context/CountryContext";
import DailyOfferCountdown from "~/components/checkout/LimitedTimeOffer";
import Logo from "~/components/common/Logo";

type Watch = CityChainWatch;
const GOOGLE_SCRIPT_DRAFT_URL_OTHER = "https://script.google.com/macros/s/AKfycby1XgjVlPGjYiyjrR6ePZhdia9Lh-TY62VrsNMEvlEueMRwgnuVtwd_sb1K_AShOFc/exec";

const getGoogleScriptUrl = () => {
 return GOOGLE_SCRIPT_DRAFT_URL_OTHER;
};
interface OrderNowPopperPropsSG {
 watch: Watch;
 isOpen: boolean;
 onClose: () => void;
 onSubmit?: (data: { watch: Watch; quantity: number; name: string; phone: string; address: string; postalCode: string; email: string }) => void;
}

export default function OrderNowPopperSG({ watch, isOpen, onClose, onSubmit }: OrderNowPopperPropsSG) {
 const router = useRouter();

 const [quantity, setQuantity] = useState<1 | 2>(1);

 const [name, setName] = useState("");
 const [phone, setPhone] = useState("");
 const [address, setAddress] = useState("");
 const [postalCode, setPostalCode] = useState("");
 const [email, setEmail] = useState("");
 const { country, loading: countryLoading } = useCountry();
 const [isSubmitting, setIsSubmitting] = useState(false);

 const unitPrice = watch.priceNew || watch.price || 0;

 const totalPrice = unitPrice * quantity;

 const currency = watch.currency || (country === "MY" ? "MYR" : "SGD");

 const productName = watch.name;

 /* =========================================================
     LOCK BODY SCROLL
  ========================================================= */

 useEffect(() => {
  if (!isOpen) return;

  const originalOverflow = document.body.style.overflow;

  document.body.style.overflow = "hidden";

  return () => {
   document.body.style.overflow = originalOverflow;
  };
 }, [isOpen]);

 /* =========================================================
     ESC TO CLOSE
  ========================================================= */

 useEffect(() => {
  if (!isOpen) return;

  const handleEscape = (event: KeyboardEvent) => {
   if (event.key === "Escape") {
    onClose();
   }
  };

  window.addEventListener("keydown", handleEscape);

  return () => {
   window.removeEventListener("keydown", handleEscape);
  };
 }, [isOpen, onClose]);

 /* =========================================================
     SUBMIT
  ========================================================= */

 const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
  event.preventDefault();

  if (isSubmitting) return;

  const fullName = name.trim();
  const customerPhone = phone.trim();
  const customerAddress = address.trim();
  const customerPostalCode = postalCode.trim();
  const customerEmail = email.trim();

  if (!fullName || !customerPhone || !customerAddress || !customerPostalCode || !customerEmail) {
   alert("Please complete all your information.");
   return;
  }

  setIsSubmitting(true);

  try {
   /* =========================================================
     GOOGLE SCRIPT
  ========================================================= */

   const googleScriptUrl = getGoogleScriptUrl();

   /* =========================================================
     ORDER ID
  ========================================================= */

   const orderId = `RLX-${Date.now()}`;

   /* =========================================================
     SINGAPORE TIME
  ========================================================= */

   /* =========================================================
  ORDER TIME
  IMPORTANT:
  Always store ISO time in localStorage / order data.
  Display timezone should be handled by MyOrders.
========================================================= */

   const orderTime = new Date().toISOString();

   /* =========================================================
     CUSTOMER IP
  ========================================================= */

   let customerIp = "";

   try {
    const ipResponse = await fetch("https://api.ipify.org?format=json", {
     method: "GET",
     cache: "no-store",
    });

    if (ipResponse.ok) {
     const ipData = await ipResponse.json();
     customerIp = ipData?.ip || "";
    }
   } catch (error) {
    console.warn("Cannot get customer IP:", error);
    customerIp = "";
   }

   /* =========================================================
     WEBSITE URL
  ========================================================= */

   const websiteUrl = typeof window !== "undefined" ? window.location.hostname : "";

   /* =========================================================
     TRACKING DATA
  ========================================================= */

   let trackingData = {
    utm_source: "",
    utm_medium: "",
    utm_campaign: "",
    utm_content: "",
    utm_term: "",
    fbclid: "",
    landing_page: "",
    campaign_name: "",
    placement: "",
   };

   if (typeof window !== "undefined") {
    const params = new URLSearchParams(window.location.search);

    const currentTracking = {
     utm_source: params.get("utm_source") || "",
     utm_medium: params.get("utm_medium") || "",
     utm_campaign: params.get("utm_campaign") || "",
     utm_content: params.get("utm_content") || "",
     utm_term: params.get("utm_term") || "",
     fbclid: params.get("fbclid") || "",
     landing_page: window.location.href,
     campaign_name: params.get("campaign.name") || params.get("campaign_name") || "",
     placement: params.get("placement") || "",
    };

    const hasTracking =
     currentTracking.utm_source ||
     currentTracking.utm_medium ||
     currentTracking.utm_campaign ||
     currentTracking.utm_content ||
     currentTracking.utm_term ||
     currentTracking.fbclid ||
     currentTracking.campaign_name ||
     currentTracking.placement;

    if (hasTracking) {
     trackingData = currentTracking;

     localStorage.setItem("trackingData", JSON.stringify(currentTracking));
    } else {
     const savedTracking = localStorage.getItem("trackingData");

     if (savedTracking) {
      try {
       const parsedTracking = JSON.parse(savedTracking);

       trackingData = {
        ...trackingData,
        ...parsedTracking,
       };
      } catch (error) {
       console.warn("Cannot parse tracking data:", error);
      }
     }
    }
   }

   /* =========================================================
     PRODUCT
  ========================================================= */

   const productPrice = Number(watch.priceNew || watch.price || 0);

   const productTotal = productPrice * quantity;

   /* =========================================================
     ONE PRODUCT ROW
  ========================================================= */

   const orderRows = [
    {
     orderId,
     orderTime,

     customerName: fullName,
     phoneNumber: customerPhone,
     email: customerEmail,
     address: customerAddress,
     zipcode: customerPostalCode,

     productName: watch.name || "",
     productId: watch.id || "",

     quantity,
     productPrice,
     productTotal,

     currency,

     productImage: watch.images?.main || "",

     websiteUrl,
     customerIp,

     utm_source: trackingData.utm_source || "",
     utm_medium: trackingData.utm_medium || "",
     utm_campaign: trackingData.utm_campaign || "",
     utm_content: trackingData.utm_content || "",
     utm_term: trackingData.utm_term || "",
     fbclid: trackingData.fbclid || "",

     campaign_name: trackingData.campaign_name || "",

     placement: trackingData.placement || "",

     landing_page: trackingData.landing_page || "",

     paymentMethod: "Cash on Delivery",

     totalQuantity: quantity,
     totalPrice: productTotal,

     createdAt: orderTime,
    },
   ];

   /* =========================================================
     ORDER DATA
  ========================================================= */

   const orderData = {
    orderId,
    orderTime,
    createdAt: orderTime,

    paymentMethod: "Cash on Delivery",

    websiteUrl,
    customerIp,

    customer: {
     fullName,
     phone: customerPhone,
     email: customerEmail,
     address: customerAddress,
     zipcode: customerPostalCode,
    },

    rows: orderRows,

    totalQuantity: quantity,
    totalPrice: productTotal,

    currency: watch.currency || "SGD",

    tracking: {
     utm_source: trackingData.utm_source || "",
     utm_medium: trackingData.utm_medium || "",
     utm_campaign: trackingData.utm_campaign || "",
     utm_content: trackingData.utm_content || "",
     utm_term: trackingData.utm_term || "",
     fbclid: trackingData.fbclid || "",
     campaign_name: trackingData.campaign_name || "",
     placement: trackingData.placement || "",
     landing_page: trackingData.landing_page || "",
    },
   };

   console.log("Rolex Order Now data:", orderData);

   /* =========================================================
     SEND TO GOOGLE SHEET
  ========================================================= */

   const response = await fetch(googleScriptUrl, {
    method: "POST",
    headers: {
     "Content-Type": "text/plain;charset=utf-8",
    },
    body: JSON.stringify(orderData),
   });

   const responseText = await response.text();

   console.log("Google Apps Script HTTP status:", response.status);

   console.log("Google Apps Script response:", responseText);

   if (!response.ok) {
    throw new Error(`Google Apps Script returned HTTP ${response.status}`);
   }

   let googleResult: any = null;

   if (responseText) {
    try {
     googleResult = JSON.parse(responseText);
    } catch {
     console.warn("Google Apps Script response is not JSON.", responseText);
    }
   }

   if (googleResult && googleResult.success === false) {
    throw new Error(googleResult.message || "Google Apps Script rejected the order.");
   }

   /* =========================================================
     SAVE LAST ORDER
  ========================================================= */

   localStorage.setItem("rolex_last_order", JSON.stringify(orderData));

   /* =========================================================
     SAVE ORDER HISTORY
  ========================================================= */

   try {
    const savedOrders = localStorage.getItem("rolex_orders");

    let orders: any[] = [];

    if (savedOrders) {
     try {
      const parsedOrders = JSON.parse(savedOrders);

      if (Array.isArray(parsedOrders)) {
       orders = parsedOrders;
      }
     } catch (error) {
      console.warn("Cannot parse existing rolex_orders:", error);

      orders = [];
     }
    }

    const existingIndex = orders.findIndex((order) => order?.orderId === orderId);

    if (existingIndex === -1) {
     orders.unshift(orderData);
    } else {
     orders[existingIndex] = {
      ...orders[existingIndex],
      ...orderData,
     };
    }

    localStorage.setItem("rolex_orders", JSON.stringify(orders));
   } catch (error) {
    console.warn("Cannot save rolex_orders:", error);
   }

   /* =========================================================
     CALLBACK
  ========================================================= */

   onSubmit?.({
    watch,
    quantity,
    name: fullName,
    phone: customerPhone,
    address: customerAddress,
    postalCode: customerPostalCode,
    email: customerEmail,
   });

   /* =========================================================
     CLOSE POPPER
  ========================================================= */

   onClose();

   /* =========================================================
     SUCCESS PAGE
  ========================================================= */

   await router.push("/order/success");
  } catch (error) {
   console.error("Rolex Order Now submission error:", error);

   alert("Unable to submit your order. Please check your connection and try again.");
  } finally {
   setIsSubmitting(false);
  }
 };

 if (!isOpen) return null;

 return (
  <div className="fixed inset-0 z-[999999] overflow-y-auto bg-black/75 p-0 backdrop-blur-sm md:flex md:items-center md:justify-center md:p-6">
   {/* BACKDROP */}
   <button
    type="button"
    aria-label="Close"
    onClick={onClose}
    className="absolute right-2 top-2 ml-4
                w-12 h-12 rounded-full border
                flex items-center justify-center bg-white inset-shadow-2xs"
   />

   {/* =====================================================
          MAIN POPPER
      ===================================================== */}

   <div className="relative z-10 mx-auto min-h-screen w-full overflow-hidden bg-[#111] shadow-2xl md:flex md:min-h-0 md:h-[680px] md:max-h-[calc(100vh-48px)] md:max-w-[1180px] md:rounded-sm">
    {/* ===================================================
            CLOSE BUTTON
        =================================================== */}

    <button
     type="button"
     onClick={onClose}
     aria-label="Close order popup"
     className="absolute right-2 top-2 ml-4
                w-12 h-12 rounded-full border
                flex items-center justify-center bg-white inset-shadow-2xs">
     <IoClose className="text-[28px]" />
    </button>

    {/* ===================================================
            DESKTOP LEFT
        =================================================== */}

    <div className="relative hidden w-[53%] overflow-hidden bg-gradient-to-br from-[#292929] via-[#171717] to-[#050505] md:block">
     {/* Decorative circles */}
     <div className="absolute -left-[180px] top-[90px] h-[550px] w-[550px] rounded-full border-[65px] border-white/[0.025]" />

     <div className="absolute -bottom-[250px] right-[40px] h-[600px] w-[600px] rounded-full border-[80px] border-white/[0.02]" />

     {/* Rolex-style crown */}
     <div className="absolute left-8 top-7 z-20">
      <Logo />
     </div>

     {/* Deal heading */}
     <div className="absolute left-1/2 top-[70px] z-20 -translate-x-1/2 text-center">
      <div className="mx-auto mt-3 h-[2px] w-16 bg-[#c9a75d]" />
     </div>

     {/* Watch */}
     <div className="absolute bottom-[100px] left-[20px] top-[45px] w-[43%]">
      <div className="absolute inset-0  h-[480px] w-[330px]">
       <div
        className="absolute inset-0 bg-contain bg-center bg-no-repeat transition-transform duration-500 hover:scale-105"
        style={{
         backgroundImage: `url(${watch.images.main})`,
        }}
       />
      </div>
     </div>

     {/* Product information */}
     <div className="absolute right-[34px] top-[185px] w-[48%] bg-[#087747] px-7 py-7">
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/70">Rolex Collection</p>

      <h2 className="mt-2  text-[30px] font-bold uppercase leading-[1.05] text-white">{productName}</h2>

      <p className="mt-5 line-clamp-3 text-[12px] font-medium uppercase leading-5 tracking-[0.08em] text-white">{watch.brand}</p>

      <div className="mt-6">
       <p className="text-[11px] uppercase tracking-[0.18em] text-white/70">Starting from</p>

       <p className="mt-1  text-[34px] font-bold leading-none text-white">
        {currency} {unitPrice.toLocaleString()}
       </p>
      </div>
     </div>

     {/* Slogan */}
    </div>

    {/* ===================================================
            DESKTOP RIGHT / MOBILE WHOLE PAGE
        =================================================== */}

    <div className="w-full bg-[#f7f7f5] text-[#222] md:w-[47%]">
     <div className="flex min-h-screen flex-col md:min-h-0 md:h-full">
      {/* ===============================================
                MOBILE PRODUCT HEADER
            =============================================== */}

      <div className="relative flex shrink-0 border-b border-[#e3e3e3] bg-white px-4 pb-4 pt-8 md:hidden">
       {/* Mobile close button */}
       <button
        type="button"
        onClick={onClose}
        aria-label="Close order popup"
        className="absolute right-2 top-2 ml-4
                w-12 h-12 rounded-full border
                flex items-center justify-center bg-white inset-shadow-2xs">
        <IoClose className="text-[24px]" />
       </button>

       {/* Product image */}
       <div className="relative h-[145px] w-[40%] shrink-0">
        <div
         className="absolute inset-0 bg-contain bg-center bg-no-repeat"
         style={{
          backgroundImage: `url(${watch.images.main})`,
         }}
        />
       </div>

       {/* Product info */}
       <div className="min-w-0 flex-1 pr-8 pt-2">
        <h2 className="mt-2 line-clamp-2  text-[16px] font-bold uppercase leading-tight text-[#222]">{productName}</h2>

        <p className="mt-2 line-clamp-3 text-[9px] uppercase leading-4 text-gray-500">{watch.brand}</p>

        {watch.brand && <p className="mt-1 text-[8px] uppercase text-gray-400">Reference {watch.brand}</p>}

        <p className="mt-2 text-[22px] font-bold text-[#d71920]">
         {currency} {unitPrice.toLocaleString()}
        </p>
       </div>
      </div>

      {/* ===============================================
                FORM AREA
            =============================================== */}

      <div className="flex-1 overflow-y-auto">
       <div className="p-5 md:px-10 md:py-12">
        {/* Desktop heading */}
        <DailyOfferCountdown />

        <div className="mb-7 hidden md:block">
         <p className="mt-2 text-[13px] leading-5 text-gray-500">Complete your details and our team will contact you shortly.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 mt-4">
         {/* NAME */}
         <input
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name"
          className="h-[52px] w-full border border-[#d7d7d7] bg-white px-4 text-[13px] text-[#222] outline-none transition placeholder:text-gray-400 focus:border-[#087747]"
         />

         {/* PHONE */}
         <input
          type="tel"
          required
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="Phone Number"
          className="h-[52px] w-full border border-[#d7d7d7] bg-white px-4 text-[13px] text-[#222] outline-none transition placeholder:text-gray-400 focus:border-[#087747]"
         />

         {/* ADDRESS */}
         <input
          type="text"
          required
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="Address"
          className="h-[52px] w-full border border-[#d7d7d7] bg-white px-4 text-[13px] text-[#222] outline-none transition placeholder:text-gray-400 focus:border-[#087747]"
         />

         {/* POSTAL CODE */}
         <input
          type="text"
          required
          value={postalCode}
          onChange={(e) => setPostalCode(e.target.value)}
          placeholder="Postal Code"
          className="h-[52px] w-full border border-[#d7d7d7] bg-white px-4 text-[13px] text-[#222] outline-none transition placeholder:text-gray-400 focus:border-[#087747]"
         />

         {/* QUANTITY */}
         <div className="border border-[#d7d7d7] bg-white px-4 py-3">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-gray-400">Quantity</p>

          {/* 1 PRODUCT */}
          <label className="flex cursor-pointer items-start gap-3">
           <input type="radio" name="quantity" checked={quantity === 1} onChange={() => setQuantity(1)} className="mt-1 h-4 w-4 accent-[#087747]" />

           <span className="text-[12px] leading-5 text-[#333]">
            Buy 1 {productName} {watch.brand} ={" "}
            <span className="text-gray-500">
             {currency} {unitPrice.toLocaleString()} — Free Shipping
            </span>
           </span>
          </label>

          {/* 2 PRODUCTS */}
          <label className="mt-3 flex cursor-pointer items-start gap-3">
           <input type="radio" name="quantity" checked={quantity === 2} onChange={() => setQuantity(2)} className="mt-1 h-4 w-4 accent-[#087747]" />

           <span className="text-[12px] leading-5 text-[#333]">
            Buy 2 {productName}
            {watch.brand} ={" "}
            <span className="text-gray-500">
             {currency} {(unitPrice * 2).toLocaleString()} — Free Shipping
            </span>
           </span>
          </label>
         </div>

         {/* EMAIL */}
         <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          className="h-[52px] w-full border border-[#d7d7d7] bg-white px-4 text-[13px] text-[#222] outline-none transition placeholder:text-gray-400 focus:border-[#087747]"
         />

         {/* TOTAL */}
         <div className="flex items-center justify-between border border-[#e0e0e0] bg-[#202020] px-4 py-3">
          <span className="text-[11px] uppercase tracking-wider text-white/60">Total</span>

          <span className=" text-[18px] font-bold text-white">
           {currency} {totalPrice.toLocaleString()}
          </span>
         </div>

         {/* BUY NOW */}
         <button
          type="submit"
          disabled={isSubmitting}
          className="h-[56px] w-full bg-[#087747]  text-[18px] font-bold uppercase tracking-wide text-white transition hover:bg-[#075f39] disabled:cursor-not-allowed disabled:opacity-60">
          {isSubmitting ? "PROCESSING..." : "BUY NOW"}
         </button>
        </form>

        {/* TRUST */}
        <div className="mt-6 grid grid-cols-3 border-t border-[#dedede] pt-5">
         <div className="flex flex-col items-center gap-2 text-center">
          <FaTruck className="text-[15px] text-[#087747]" />

          <span className="text-[9px] uppercase tracking-wide text-gray-500">Free Shipping</span>
         </div>

         <div className="flex flex-col items-center gap-2 border-x border-[#dedede] text-center">
          <FaLock className="text-[15px] text-[#087747]" />

          <span className="text-[9px] uppercase tracking-wide text-gray-500">Secure Order</span>
         </div>

         <div className="flex flex-col items-center gap-2 text-center">
          <FaCrown className="text-[15px] text-[#087747]" />

          <span className="text-[9px] uppercase tracking-wide text-gray-500">Rolex Service</span>
         </div>
        </div>
       </div>
      </div>
     </div>
    </div>
   </div>
  </div>
 );
}

OrderNowPopperSG.Layout = "Default";
