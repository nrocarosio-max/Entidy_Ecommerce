"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { IoClose } from "react-icons/io5";
import { FaTruck, FaLock, FaCrown, FaMinus, FaPlus } from "react-icons/fa";

import type { CityChainWatch } from "~/data/CityChainWatch";
import { malaysiaLocations } from "~/data/malaysiaLocations";
import DailyOfferCountdown from "~/components/checkout/LimitedTimeOffer";
import Logo from "~/components/common/Logo";

interface OrderNowPopperMYProps {
 watch: CityChainWatch;
 isOpen: boolean;
 onClose: () => void;
 onSubmit?: (data: {
  watch: CityChainWatch;
  quantity: number;
  name: string;
  phone: string;
  address: string;
  postalCode: string;
  email: string;
  province: string;
  district: string;
 }) => void;
}

interface FormData {
 fullName: string;
 phone: string;
 email: string;
 address: string;
 province: string;
 district: string;
 zipcode: string;
}

interface TrackingData {
 utm_source: string;
 utm_medium: string;
 utm_campaign: string;
 utm_content: string;
 utm_term: string;
 fbclid: string;
 landing_page: string;
 campaign_name: string;
 placement: string;
}

const MAX_QUANTITY = 2;

const GOOGLE_SCRIPT_DRAFT_MY = "https://script.google.com/macros/s/AKfycbzm2bdf4rpK2_2Re4cBmp1bNaNr74hZUOgEOy9PwDJ1k8nJ96ItaYWnm4BtIeqdyR-LRQ/exec";

export default function OrderNowPopperMY({ watch, isOpen, onClose, onSubmit }: OrderNowPopperMYProps) {
 const router = useRouter();

 const [formData, setFormData] = useState<FormData>({
  fullName: "",
  phone: "",
  email: "",
  address: "",
  province: "",
  district: "",
  zipcode: "",
 });

 const [quantity, setQuantity] = useState(1);
 const [isSubmitting, setIsSubmitting] = useState(false);
 const [quantityMessage, setQuantityMessage] = useState("");

 const [trackingData, setTrackingData] = useState<TrackingData>({
  utm_source: "",
  utm_medium: "",
  utm_campaign: "",
  utm_content: "",
  utm_term: "",
  fbclid: "",
  landing_page: "",
  campaign_name: "",
  placement: "",
 });

 const unitPrice = Number(watch.priceNew || watch.price || 0);

 const currency = watch.currency || "MYR";

 const totalPrice = unitPrice * quantity;

 const formatPrice = (price: number) => {
  return price.toLocaleString("en-MY", {
   minimumFractionDigits: 0,
   maximumFractionDigits: 2,
  });
 };

 const shippingMethod = "J&T Express Malaysia";

 const provinces = useMemo(() => {
  return malaysiaLocations.states || [];
 }, []);

 const selectedProvince = useMemo(() => {
  return provinces.find((province: any) => province.name === formData.province);
 }, [formData.province, provinces]);

 const districts = useMemo(() => {
  return selectedProvince?.cities || [];
 }, [selectedProvince]);

 const selectedDistrict = useMemo(() => {
  return districts.find((district: any) => district.name === formData.district);
 }, [districts, formData.district]);

 const zipcodes = useMemo(() => {
  return selectedDistrict?.towns || [];
 }, [selectedDistrict]);

 useEffect(() => {
  if (!isOpen) return;

  document.body.style.overflow = "hidden";

  const handleKeyDown = (event: KeyboardEvent) => {
   if (event.key === "Escape") {
    onClose();
   }
  };

  document.addEventListener("keydown", handleKeyDown);

  return () => {
   document.body.style.overflow = "";
   document.removeEventListener("keydown", handleKeyDown);
  };
 }, [isOpen, onClose]);

 useEffect(() => {
  if (!isOpen) return;

  setFormData({
   fullName: "",
   phone: "",
   email: "",
   address: "",
   province: "",
   district: "",
   zipcode: "",
  });

  setQuantity(1);
  setQuantityMessage("");
  setIsSubmitting(false);
 }, [isOpen, watch.id]);

 useEffect(() => {
  if (!isOpen || typeof window === "undefined") {
   return;
  }

  const params = new URLSearchParams(window.location.search);

  const tracking: TrackingData = {
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
   tracking.utm_source ||
   tracking.utm_medium ||
   tracking.utm_campaign ||
   tracking.utm_content ||
   tracking.utm_term ||
   tracking.fbclid ||
   tracking.campaign_name ||
   tracking.placement;

  if (hasTracking) {
   localStorage.setItem("trackingData", JSON.stringify(tracking));

   setTrackingData(tracking);
   return;
  }

  const savedTracking = localStorage.getItem("trackingData");

  if (!savedTracking) return;

  try {
   const parsedTracking = JSON.parse(savedTracking);

   setTrackingData({
    utm_source: parsedTracking.utm_source || "",
    utm_medium: parsedTracking.utm_medium || "",
    utm_campaign: parsedTracking.utm_campaign || "",
    utm_content: parsedTracking.utm_content || "",
    utm_term: parsedTracking.utm_term || "",
    fbclid: parsedTracking.fbclid || "",
    landing_page: parsedTracking.landing_page || "",
    campaign_name: parsedTracking.campaign_name || "",
    placement: parsedTracking.placement || "",
   });
  } catch (error) {
   console.error("Cannot parse tracking data:", error);
  }
 }, [isOpen]);

 if (!isOpen) {
  return null;
 }

 const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
  const { name, value } = e.target;

  setFormData((prev) => {
   const newData = {
    ...prev,
    [name]: value,
   };

   if (name === "province") {
    newData.district = "";
    newData.zipcode = "";
   }

   if (name === "district") {
    newData.zipcode = "";
   }

   return newData;
  });
 };

 const handleQuantityChange = (newQuantity: number) => {
  if (newQuantity < 1) return;

  if (newQuantity > MAX_QUANTITY) {
   setQuantityMessage(`A maximum of ${MAX_QUANTITY} watches of the same model can be purchased.`);

   return;
  }

  setQuantityMessage("");
  setQuantity(newQuantity);
 };

 const getZipcodeName = (zipcode: any) => {
  if (typeof zipcode === "string") {
   return zipcode;
  }

  return zipcode?.name || "";
 };

 const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
  e.preventDefault();

  if (isSubmitting) return;

  if (
   !formData.fullName.trim() ||
   !formData.phone.trim() ||
   !formData.email.trim() ||
   !formData.address.trim() ||
   !formData.province ||
   !formData.district ||
   !formData.zipcode
  ) {
   alert("Please complete all required fields.");
   return;
  }

  setIsSubmitting(true);

  try {
   const orderTime = new Date().toISOString();

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
   }

   let productUrl = "";

   try {
    if (watch.sourceUrl) {
     productUrl = new URL(watch.sourceUrl, window.location.origin).href;
    }
   } catch (error) {
    console.warn("Invalid product sourceUrl:", watch.sourceUrl);
   }

   const zipcode = getZipcodeName(formData.zipcode);

   const productTotal = unitPrice * quantity;

   const orderId = `CC-${Date.now()}`;

   const orderRow = {
    orderTime,

    customerName: formData.fullName,

    phoneNumber: formData.phone,

    address: formData.address,

    email: formData.email,

    province: formData.province,

    district: formData.district,

    zipcode,

    quantity,

    productPrice: unitPrice,

    productTotal,

    productName: watch.name || "",

    productImage: watch.images?.main || "",

    productId: watch.id || "",

    brand: watch.brand || "",

    collection: watch.collection || "",

    currency,

    shippingMethod,

    customerOrderLink: productUrl,

    websiteUrl: typeof window !== "undefined" ? window.location.origin : "",

    utm_source: trackingData.utm_source || "",

    utm_medium: trackingData.utm_medium || "",

    utm_campaign: trackingData.utm_campaign || "",

    utm_content: trackingData.utm_content || "",

    utm_term: trackingData.utm_term || "",

    fbclid: trackingData.fbclid || "",

    campaignName: trackingData.campaign_name || "",

    placement: trackingData.placement || "",

    landing_page: trackingData.landing_page || "",

    paymentMethod: "COD",

    totalQuantity: quantity,

    totalPrice,

    customerIp,

    orderId,

    createdAt: orderTime,
   };

   const orderData = {
    orderId,

    rows: [orderRow],

    customer: {
     fullName: formData.fullName,

     phone: formData.phone,

     email: formData.email,

     address: formData.address,

     province: formData.province,

     district: formData.district,

     zipcode,
    },

    totalQuantity: quantity,

    totalPrice,

    currency,

    shippingMethod,

    paymentMethod: "COD",

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

    customerIp,

    createdAt: orderTime,
   };

   const response = await fetch(GOOGLE_SCRIPT_DRAFT_MY, {
    method: "POST",
    headers: {
     "Content-Type": "text/plain;charset=utf-8",
    },
    body: JSON.stringify(orderData),
   });

   if (!response.ok) {
    throw new Error(`Google Apps Script returned HTTP ${response.status}`);
   }

   await response.text();

   localStorage.setItem("citychain_last_order", JSON.stringify(orderData));

   const existingOrders = JSON.parse(localStorage.getItem("citychain_orders") || "[]");

   localStorage.setItem("citychain_orders", JSON.stringify([...existingOrders, orderData]));

   localStorage.removeItem("watches_cart");

   window.dispatchEvent(new Event("cartUpdated"));

   onSubmit?.({
    watch,
    quantity,
    name: formData.fullName,
    phone: formData.phone,
    address: formData.address,
    postalCode: zipcode,
    email: formData.email,
    province: formData.province,
    district: formData.district,
   });

   onClose();

   await router.push("/order/success");
  } catch (error) {
   console.error("Failed to submit order:", error);

   alert("Unable to submit your order. Please check your connection and try again.");
  } finally {
   setIsSubmitting(false);
  }
 };

 return (
  <div
   className="fixed inset-0 z-[9999] overflow-y-auto bg-black/70 p-0 md:p-6"
   onMouseDown={(e) => {
    if (e.target === e.currentTarget) {
     onClose();
    }
   }}>
   <div className="flex min-h-screen items-center justify-center">
    <div className="relative flex min-h-screen w-full overflow-hidden bg-white shadow-2xl md:min-h-0 md:max-w-5xl md:rounded-2xl">
     {/* Close */}
     <button
      type="button"
      onClick={onClose}
      className="absolute right-4 top-4 z-30 flex h-10 w-10 items-center justify-center rounded-full bg-black/80 text-white transition hover:bg-black md:right-5 md:top-5"
      aria-label="Close">
      <IoClose size={24} />
     </button>

     {/* Product panel */}
     <div className="hidden w-[42%] flex-col bg-[#111] text-white md:flex">
      <div className="relative flex flex-1 items-center justify-center overflow-hidden">
       <img src={watch.images?.main} alt={watch.name} className="h-full max-h-[560px] w-full object-contain p-10" />

       <div className="absolute left-6 top-6">
        <Logo />
       </div>
      </div>

      <div className="border-t border-white/10 p-7">
       <p className="mb-2 text-xs uppercase tracking-[0.2em] text-white/50">{watch.brand}</p>

       <h2 className="text-xl font-medium">{watch.name}</h2>

       <div className="mt-5 flex items-end justify-between">
        <div>
         <p className="text-xs text-white/40">Price</p>

         <p className="mt-1 text-2xl font-semibold">
          {currency} {formatPrice(unitPrice)}
         </p>
        </div>

        <div className="text-right">
         <p className="text-xs text-white/40">Shipping</p>

         <p className="mt-1 text-sm">J&T Express Malaysia</p>
        </div>
       </div>
      </div>
     </div>

     {/* Form */}
     <div className="w-full bg-white md:w-[58%]">
      <div className="border-b border-gray-100 px-5 py-5 md:px-8">
       <div className="pr-12">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#999]">Order now</p>

        <h1 className="mt-1 text-xl font-semibold text-[#111] md:text-2xl">Complete Your Order</h1>

        <p className="mt-1 text-sm text-[#777]">Fast delivery across Malaysia</p>
       </div>
      </div>

      {/* Mobile product */}
      <div className="border-b border-gray-100 bg-[#fafafa] p-5 md:hidden">
       <div className="flex gap-4">
        <div className="flex h-24 w-24 shrink-0 items-center justify-center bg-white">
         <img src={watch.images?.main} alt={watch.name} className="h-full w-full object-contain" />
        </div>

        <div className="min-w-0">
         <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#999]">{watch.brand}</p>

         <h2 className="mt-1 line-clamp-2 text-sm font-semibold text-[#111]">{watch.name}</h2>

         <p className="mt-2 text-base font-bold text-[#111]">
          {currency} {formatPrice(unitPrice)}
         </p>
        </div>
       </div>
      </div>

      <form onSubmit={handleSubmit} className="px-5 py-6 md:px-8 md:py-7">
       <DailyOfferCountdown />

       {/* Customer information */}
       <div className="mt-6">
        <div className="mb-4 flex items-center gap-3">
         <div className="h-px flex-1 bg-gray-200" />

         <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-400">Customer information</span>

         <div className="h-px flex-1 bg-gray-200" />
        </div>

        <div className="grid gap-4">
         <input
          type="text"
          name="fullName"
          value={formData.fullName}
          onChange={handleChange}
          placeholder="Full Name"
          required
          className="h-12 w-full rounded-lg border border-gray-200 px-4 text-sm outline-none transition focus:border-black"
         />

         <div className="grid gap-4 sm:grid-cols-2">
          <input
           type="tel"
           name="phone"
           value={formData.phone}
           onChange={handleChange}
           placeholder="Phone Number"
           required
           className="h-12 w-full rounded-lg border border-gray-200 px-4 text-sm outline-none transition focus:border-black"
          />

          <input
           type="email"
           name="email"
           value={formData.email}
           onChange={handleChange}
           placeholder="Email Address"
           required
           className="h-12 w-full rounded-lg border border-gray-200 px-4 text-sm outline-none transition focus:border-black"
          />
         </div>

         <textarea
          name="address"
          value={formData.address}
          onChange={handleChange}
          placeholder="Address"
          required
          rows={3}
          className="w-full resize-none rounded-lg border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-black"
         />
        </div>
       </div>

       {/* Malaysia address */}
       <div className="mt-7">
        <div className="mb-4 flex items-center gap-3">
         <div className="h-px flex-1 bg-gray-200" />

         <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-400">Delivery address</span>

         <div className="h-px flex-1 bg-gray-200" />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
         <select
          name="province"
          value={formData.province}
          onChange={handleChange}
          required
          className="h-12 w-full rounded-lg border border-gray-200 bg-white px-4 text-sm outline-none transition focus:border-black">
          <option value="">Select State</option>

          {provinces.map((province: any) => (
           <option key={province.name} value={province.name}>
            {province.name}
           </option>
          ))}
         </select>

         <select
          name="district"
          value={formData.district}
          onChange={handleChange}
          required
          disabled={!formData.province}
          className="h-12 w-full rounded-lg border border-gray-200 bg-white px-4 text-sm outline-none transition focus:border-black disabled:bg-gray-100 disabled:text-gray-400">
          <option value="">Select City / District</option>

          {districts.map((district: any) => (
           <option key={district.name} value={district.name}>
            {district.name}
           </option>
          ))}
         </select>
        </div>

        <select
         name="zipcode"
         value={formData.zipcode}
         onChange={handleChange}
         required
         disabled={!formData.district}
         className="mt-4 h-12 w-full rounded-lg border border-gray-200 bg-white px-4 text-sm outline-none transition focus:border-black disabled:bg-gray-100 disabled:text-gray-400">
         <option value="">Select Postal Code</option>

         {zipcodes.map((zipcode: any, index: number) => {
          const value = getZipcodeName(zipcode);

          return (
           <option key={`${value}-${index}`} value={value}>
            {value}
           </option>
          );
         })}
        </select>
       </div>

       {/* Quantity */}
       <div className="mt-7">
        <div className="mb-4 flex items-center justify-between">
         <span className="text-sm font-semibold text-[#111]">Quantity</span>

         <span className="text-xs text-gray-400">Maximum 2 units</span>
        </div>

        <div className="flex items-center justify-between rounded-xl border border-gray-200 p-3">
         <div className="flex items-center gap-3">
          <button
           type="button"
           onClick={() => handleQuantityChange(quantity - 1)}
           disabled={quantity <= 1}
           className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 transition hover:border-black disabled:cursor-not-allowed disabled:opacity-30">
           <FaMinus size={11} />
          </button>

          <span className="w-6 text-center text-sm font-semibold">{quantity}</span>

          <button
           type="button"
           onClick={() => handleQuantityChange(quantity + 1)}
           disabled={quantity >= MAX_QUANTITY}
           className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 transition hover:border-black disabled:cursor-not-allowed disabled:opacity-30">
           <FaPlus size={11} />
          </button>
         </div>

         <span className="text-sm font-medium text-[#555]">
          {currency} {formatPrice(totalPrice)}
         </span>
        </div>

        {quantityMessage && <p className="mt-2 text-xs text-red-600">{quantityMessage}</p>}
       </div>

       {/* Shipping */}
       <div className="mt-7 rounded-xl bg-[#f8f8f8] p-4">
        <div className="flex items-center justify-between">
         <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white">
           <FaTruck size={14} className="text-[#222]" />
          </div>

          <div>
           <p className="text-sm font-semibold text-[#111]">J&T Express Malaysia</p>

           <p className="mt-0.5 text-xs text-gray-500">Fast & secure delivery</p>
          </div>
         </div>

         <span className="text-xs font-semibold text-green-600">FREE</span>
        </div>
       </div>

       {/* Total */}
       <div className="mt-7 border-t border-gray-200 pt-5">
        <div className="flex items-end justify-between">
         <div>
          <p className="text-xs text-gray-400">Total amount</p>

          <p className="mt-1 text-2xl font-bold tracking-tight text-[#111]">
           {currency} {formatPrice(totalPrice)}
          </p>
         </div>

         <div className="text-right">
          <p className="text-xs text-gray-400">
           {quantity} {quantity === 1 ? "item" : "items"}
          </p>
         </div>
        </div>
       </div>

       {/* Submit */}
       <button
        type="submit"
        disabled={isSubmitting}
        className="mt-6 flex h-14 w-full items-center justify-center rounded-xl bg-black px-6 text-sm font-bold uppercase tracking-[0.12em] text-white transition hover:bg-[#222] disabled:cursor-not-allowed disabled:opacity-60">
        {isSubmitting ? "Processing..." : "Confirm Order"}
       </button>

       {/* Trust */}
       <div className="mt-5 grid grid-cols-3 gap-3 border-t border-gray-100 pt-5">
        <div className="flex flex-col items-center text-center">
         <FaLock size={13} className="text-gray-500" />

         <span className="mt-2 text-[9px] uppercase tracking-wider text-gray-400">Secure</span>
        </div>

        <div className="flex flex-col items-center text-center">
         <FaTruck size={14} className="text-gray-500" />

         <span className="mt-2 text-[9px] uppercase tracking-wider text-gray-400">Fast Delivery</span>
        </div>

        <div className="flex flex-col items-center text-center">
         <FaCrown size={14} className="text-gray-500" />

         <span className="mt-2 text-[9px] uppercase tracking-wider text-gray-400">Premium</span>
        </div>
       </div>
      </form>
     </div>
    </div>
   </div>
  </div>
 );
}

OrderNowPopperMY.Layout = "Default";
