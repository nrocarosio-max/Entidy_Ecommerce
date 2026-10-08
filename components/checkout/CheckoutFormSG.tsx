"use client";

import { useEffect, useMemo, useState } from "react";
import { FaHeart, FaMinus, FaPlus, FaTruck } from "react-icons/fa";
import { useRouter } from "next/router";

import type { CityChainWatch } from "~/data/CityChainWatch";

/* =========================================================
   FORM DATA
========================================================= */

interface FormData {
 fullName: string;
 phone: string;
 email: string;
 address: string;
 zipcode: string;
}

/* =========================================================
   TRACKING DATA
========================================================= */

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

/* =========================================================
   CART
========================================================= */

interface CartItem extends CityChainWatch {
 quantity: number;
}

const MAX_QUANTITY = 2;

interface CheckoutFormProps {
 watchData?: CartItem[];
}

/* =========================================================
   GOOGLE APPS SCRIPT
========================================================= */

/*
 * IMPORTANT:
 * Đây phải là URL Google Apps Script của CITY CHAIN SG.
 *
 * Không dùng URL Google Apps Script của Rolex ở đây.
 */
const GOOGLE_SCRIPT_DRAFT_SG = "https://script.google.com/macros/s/AKfycbw6xTP6Rty-o3voTdtr3ygP-PJq4nH2KWXcmBguH7ab36SNUEYrZAa56HZipnAl2B-FQA/exec";

const getGoogleScriptUrl = () => {
 return GOOGLE_SCRIPT_DRAFT_SG;
};

/* =========================================================
   ESTIMATED DELIVERY
========================================================= */

export function getEstimatedDeliveryDate() {
 const today = new Date();

 const minDate = new Date(today);
 minDate.setDate(today.getDate() + 2);

 const maxDate = new Date(today);
 maxDate.setDate(today.getDate() + 7);

 const formatDate = (date: Date) =>
  date.toLocaleDateString("en-GB", {
   day: "numeric",
   month: "long",
   year: "numeric",
   timeZone: "Asia/Singapore",
  });

 return `${formatDate(minDate)} - ${formatDate(maxDate)}`;
}

/* =========================================================
   COMPONENT
========================================================= */

export default function CheckoutFormSG({ watchData = [] }: CheckoutFormProps) {
 const router = useRouter();

 /* =========================================================
    CUSTOMER FORM
 ========================================================= */

 const [formData, setFormData] = useState<FormData>({
  fullName: "",
  phone: "",
  email: "",
  address: "",
  zipcode: "",
 });

 /* =========================================================
    PRODUCTS
 ========================================================= */

 const [cartItems, setCartItems] = useState<CartItem[]>([]);
 const [isCartChecked, setIsCartChecked] = useState(false);

 useEffect(() => {
  if (typeof window === "undefined") return;

  try {
   const savedCart = localStorage.getItem("watches_cart");

   if (savedCart) {
    const parsedCart = JSON.parse(savedCart);

    if (Array.isArray(parsedCart)) {
     setCartItems(parsedCart);
    } else {
     setCartItems([]);
    }
   } else {
    setCartItems([]);
   }
  } catch (error) {
   console.error("Cannot load City Chain cart:", error);
   setCartItems([]);
  } finally {
   setIsCartChecked(true);
  }
 }, []);

 /* =========================================================
    UPDATE CART
 ========================================================= */

 useEffect(() => {
  if (typeof window === "undefined") return;
  if (!isCartChecked) return;

  localStorage.setItem("watches_cart", JSON.stringify(cartItems));

  window.dispatchEvent(new Event("cartUpdated"));
 }, [cartItems, isCartChecked]);

 /* =========================================================
    TRACKING DATA
 ========================================================= */

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

 /* =========================================================
    SUBMITTING
 ========================================================= */

 const [isSubmitting, setIsSubmitting] = useState(false);

 const [validationMessage, setValidationMessage] = useState("");

 const [isValidationOpen, setIsValidationOpen] = useState(false);

 /* =========================================================
    QUANTITY MESSAGE
 ========================================================= */

 const [quantityMessage, setQuantityMessage] = useState("");

 /* =========================================================
    GET UTM + FBCLID
 ========================================================= */

 useEffect(() => {
  if (typeof window === "undefined") return;

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

  if (savedTracking) {
   try {
    const parsedTracking = JSON.parse(savedTracking);

    setTrackingData(parsedTracking);
   } catch (error) {
    console.error("Cannot parse tracking data:", error);
   }
  }
 }, []);

 /* =========================================================
    TOTAL QUANTITY
 ========================================================= */

 const totalQuantity = useMemo(() => {
  return cartItems.reduce((total, item) => total + item.quantity, 0);
 }, [cartItems]);

 /* =========================================================
    TOTAL PRICE
 ========================================================= */

 const totalPrice = useMemo(() => {
  return cartItems.reduce((total, item) => total + Number(item.priceNew || item.price || 0) * item.quantity, 0);
 }, [cartItems]);

 /* =========================================================
    FORMAT PRICE
 ========================================================= */

 const formatPrice = (price: number) => {
  return price.toLocaleString("en-SG", {
   minimumFractionDigits: 0,
   maximumFractionDigits: 2,
  });
 };

 /* =========================================================
    HANDLE FORM CHANGE
 ========================================================= */

 const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
  const { name, value } = e.target;

  setFormData((prev) => ({
   ...prev,
   [name]: value,
  }));
 };

 /* =========================================================
    SUBMIT GOOGLE SHEET
 ========================================================= */

 const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault();

  if (isSubmitting) return;

  /* =======================================================
     VALIDATE CUSTOMER INFORMATION
  ======================================================= */

  const fullName = formData.fullName.trim();
  const phone = formData.phone.trim();
  const email = formData.email.trim();
  const address = formData.address.trim();
  const zipcode = formData.zipcode.trim();

  const showValidation = (message: string) => {
   setValidationMessage(message);
   setIsValidationOpen(true);
  };

  if (!fullName) {
   showValidation("Please enter your full name.");
   return;
  }

  if (!phone) {
   showValidation("Please enter your phone number.");
   return;
  }

  if (!email) {
   showValidation("Please enter your email address.");
   return;
  }

  if (!address) {
   showValidation("Please enter your delivery address.");
   return;
  }

  if (!zipcode) {
   showValidation("Please enter your postal code.");
   return;
  }

  /* =======================================================
     CHECK EMAIL
  ======================================================= */

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(email)) {
   showValidation("Please enter a valid email address.");
   return;
  }

  /* =======================================================
     CHECK CART
  ======================================================= */

  if (cartItems.length === 0) {
   showValidation("Your shopping cart is empty.");
   return;
  }

  /* =======================================================
     CHECK GOOGLE SCRIPT URL
  ======================================================= */

  const googleScriptUrl = getGoogleScriptUrl();

  if (!googleScriptUrl) {
   showValidation("Google Apps Script URL has not been configured yet.");
   return;
  }

  /* =======================================================
     START SUBMIT
  ======================================================= */

  setIsSubmitting(true);

  try {
   /* ======================================================
      GENERATE ORDER ID
   ====================================================== */

   const orderId = `CCSG-${Date.now()}`;

   /* ======================================================
      SINGAPORE TIME
   ====================================================== */

   const orderTime = new Date().toISOString();

   /* ======================================================
      CUSTOMER IP
   ====================================================== */

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

   /* ======================================================
      WEBSITE URL
   ====================================================== */

   const websiteUrl = typeof window !== "undefined" ? window.location.hostname : "";

   /* ======================================================
      CREATE PRODUCT ROWS
   ====================================================== */

   const orderRows = cartItems.map((item) => {
    const productPrice = Number(item.priceNew || item.price || 0);

    const productTotal = productPrice * item.quantity;

    return {
     orderId,

     orderTime,

     customerName: fullName,

     phoneNumber: phone,

     email,

     address,

     zipcode,

     productName: item.name || "",

     productId: item.id || "",

     brand: item.brand || "",

     collection: item.collection || "",

     quantity: item.quantity,

     productPrice,

     productTotal,

     currency: item.currency || "SGD",

     productImage: item.images?.main || "",

     shippingMethod: "Ninja Van Singapore",

     paymentMethod: "Cash on Delivery",

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

     totalQuantity,

     totalPrice,

     createdAt: orderTime,
    };
   });

   /* ======================================================
      ORDER DATA
   ====================================================== */

   const orderData = {
    orderId,

    orderTime,

    createdAt: orderTime,

    paymentMethod: "Cash on Delivery",

    shippingMethod: "Ninja Van Singapore",

    websiteUrl,

    customerIp,

    customer: {
     fullName,

     phone,

     email,

     address,

     zipcode,
    },

    rows: orderRows,

    totalQuantity,

    totalPrice,

    currency: "SGD",

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

   console.log("City Chain SG order data:", orderData);

   /* ======================================================
      SEND TO GOOGLE APPS SCRIPT
   ====================================================== */

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

     googleResult = null;
    }
   }

   if (googleResult && googleResult.success === false) {
    throw new Error(googleResult.message || "Google Apps Script rejected the order.");
   }

   /* ======================================================
      SAVE LAST ORDER
   ====================================================== */

   localStorage.setItem("citychain_last_order", JSON.stringify(orderData));

   /* ======================================================
      SAVE ORDER HISTORY
   ====================================================== */

   try {
    const savedOrders = localStorage.getItem("citychain_orders");

    let orders: any[] = [];

    if (savedOrders) {
     try {
      const parsedOrders = JSON.parse(savedOrders);

      if (Array.isArray(parsedOrders)) {
       orders = parsedOrders;
      }
     } catch (error) {
      console.warn("Cannot parse existing citychain_orders:", error);

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

    localStorage.setItem("citychain_orders", JSON.stringify(orders));
   } catch (error) {
    console.warn("Cannot save citychain_orders:", error);
   }

   /* ======================================================
      REMOVE CART
   ====================================================== */

   localStorage.removeItem("watches_cart");

   window.dispatchEvent(new Event("cartUpdated"));

   /* ======================================================
      GO SUCCESS PAGE
   ====================================================== */

   await router.push("/order/success");
  } catch (error) {
   console.error("City Chain SG order submission error:", error);

   setValidationMessage("Unable to submit your order. Please check your connection and try again.");

   setIsValidationOpen(true);
  } finally {
   setIsSubmitting(false);
  }
 };

 /* =========================================================
    UPDATE QUANTITY
 ========================================================= */

 const updateQuantity = (id: string, newQuantity: number) => {
  if (newQuantity < 1) return;

  if (newQuantity > MAX_QUANTITY) {
   setQuantityMessage(`A maximum of ${MAX_QUANTITY} watches of the same model can be purchased.`);

   return;
  }

  setQuantityMessage("");

  setCartItems((prev) =>
   prev.map((item) =>
    item.id === id
     ? {
        ...item,
        quantity: newQuantity,
       }
     : item,
   ),
  );
 };

 /* =========================================================
    VALIDATION POPUP
 ========================================================= */

 const validationPopper = isValidationOpen ? (
  <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 p-4" onClick={() => setIsValidationOpen(false)}>
   <div className="w-full max-w-[420px] bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
    <div className="border-b border-[#dededb] px-6 py-5">
     <div className="flex items-center gap-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#f4e8e8]">
       <span className="text-lg text-[#b42318]">!</span>
      </div>

      <h3 className="text-lg font-semibold text-[#222]">Please complete your information</h3>
     </div>
    </div>

    <div className="px-6 py-6">
     <p className="text-sm leading-6 text-[#555]">{validationMessage}</p>
    </div>

    <div className="border-t border-[#dededb] px-6 py-4">
     <button
      type="button"
      onClick={() => setIsValidationOpen(false)}
      className="
       w-full
       bg-[#127749]
       px-6
       py-3.5
       text-sm
       font-semibold
       text-white
       transition
       hover:bg-[#0d5f39]
      ">
      Continue
     </button>
    </div>
   </div>
  </div>
 ) : null;

 /* =========================================================
    LOADING
 ========================================================= */

 if (!isCartChecked) {
  return (
   <div className="flex min-h-[300px] items-center justify-center">
    <p className="text-sm text-[#666]">Loading checkout...</p>
   </div>
  );
 }

 /* =========================================================
    EMPTY CART
 ========================================================= */

 if (isCartChecked && cartItems.length === 0) {
  return (
   <div className="flex min-h-[500px] items-center justify-center">
    <div className="w-full max-w-[520px] border border-[#dededb] bg-white px-6 py-12 text-center sm:px-10 sm:py-16">
     <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[#f5f5f3]">
      <FaHeart className="text-2xl text-[#777]" />
     </div>

     <h2 className="text-xl font-semibold text-[#222] sm:text-2xl">No products in your cart</h2>

     <p className="mx-auto mt-3 max-w-[380px] text-sm leading-6 text-[#777]">
      Your shopping cart is currently empty. Please add a watch before proceeding to checkout.
     </p>

     <button
      type="button"
      onClick={() => router.push("/limited-deals")}
      className="
       mt-8
       w-full
       bg-[#127749]
       px-6
       py-4
       text-sm
       font-semibold
       text-white
       transition
       hover:bg-[#0d5f39]
       sm:w-auto
       sm:min-w-[240px]
      ">
      Back to Limited Deals
     </button>
    </div>
   </div>
  );
 }

 /* =========================================================
    MAIN
 ========================================================= */

 return (
  <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
   {validationPopper}

   {/* =====================================================
       LEFT COLUMN
   ===================================================== */}

   <div className="border border-[#dededb] bg-white">
    {/* ==================================================
        ORDER SUMMARY
    ================================================== */}

    <section className="border-b border-[#dededb] p-4 sm:p-5 md:p-8">
     <div className="mb-5 flex items-center justify-between sm:mb-7">
      <h2 className="text-lg font-medium sm:text-xl">1. Order summary</h2>

      <button type="button" className="flex h-8 w-8 cursor-pointer items-center justify-center">
       <FaHeart className="text-base sm:text-lg" />
      </button>
     </div>

     {/* PRODUCTS */}

     <div className="space-y-5">
      {cartItems.map((item) => (
       <div
        key={item.id}
        className="
         flex
         min-w-0
         gap-3
         border-b
         border-[#ededed]
         pb-5
         last:border-b-0
         last:pb-0
         sm:gap-4
        ">
        {/* IMAGE */}

        <div
         className="
          flex
          h-[90px]
          w-[72px]
          shrink-0
          items-center
          justify-center
          sm:h-[120px]
          sm:w-[95px]
          md:h-[150px]
          md:w-[120px]
         ">
         <img src={item.images?.main || "/image/watches/details/m126234-0051.avif"} alt={item.name || "Watch"} className="h-full w-full object-contain" />
        </div>

        {/* PRODUCT INFO */}

        <div className="min-w-0 flex-1">
         <h3
          className="
           line-clamp-2
           text-sm
           font-semibold
           leading-5
           text-[#222]
           sm:text-base
          ">
          {item.name || "No watch selected"}
         </h3>

         {item.brand && <p className="mt-1 line-clamp-1 text-xs text-[#666] sm:mt-2 sm:text-sm">{item.brand}</p>}

         {item.collection && <p className="mt-1 line-clamp-1 text-xs text-[#777] sm:text-sm">{item.collection}</p>}

         {/* PRICE + QUANTITY */}

         <div className="mt-3 flex items-center justify-between gap-2 sm:mt-4">
          {/* PRICE */}

          <span className="min-w-0 text-sm font-semibold text-[#127749] sm:text-base">
           {item.currency || "SGD"} {formatPrice(Number(item.priceNew || item.price || 0))}
          </span>

          {/* QUANTITY */}

          <div className="flex shrink-0 items-center rounded-md bg-[#f6f6f6]">
           <button
            type="button"
            disabled={item.quantity <= 1}
            onClick={() => updateQuantity(item.id, item.quantity - 1)}
            aria-label="Decrease quantity"
            className="
             flex
             h-8
             w-8
             cursor-pointer
             items-center
             justify-center
             text-[#777]
             transition
             hover:bg-[#ededed]
             disabled:cursor-not-allowed
             disabled:opacity-30
             sm:h-9
             sm:w-9
            ">
            <FaMinus size={9} />
           </button>

           <span
            className="
             flex
             h-8
             w-8
             items-center
             justify-center
             bg-white
             text-xs
             font-medium
             text-[#222]
             sm:h-9
             sm:w-9
             sm:text-sm
            ">
            {item.quantity}
           </span>

           <button
            type="button"
            disabled={item.quantity >= MAX_QUANTITY}
            onClick={() => updateQuantity(item.id, item.quantity + 1)}
            aria-label="Increase quantity"
            className="
             flex
             h-8
             w-8
             cursor-pointer
             items-center
             justify-center
             text-[#777]
             transition
             hover:bg-[#ededed]
             disabled:cursor-not-allowed
             disabled:opacity-30
             sm:h-9
             sm:w-9
            ">
            <FaPlus size={9} />
           </button>
          </div>
         </div>
        </div>
       </div>
      ))}
     </div>

     {/* MAX QUANTITY */}

     {quantityMessage && <p className="mt-4 text-xs text-red-500">{quantityMessage}</p>}

     {/* PRICE */}

     <div className="mt-5 border-t border-[#dededb] pt-3 sm:mt-6 sm:pt-4">
      <div className="flex justify-between gap-4 py-2 text-xs sm:text-sm">
       <span>
        Subtotal ({totalQuantity} {totalQuantity === 1 ? "item" : "items"})
       </span>

       <span className="shrink-0">SGD {formatPrice(totalPrice)}</span>
      </div>

      <div className="flex justify-between gap-4 py-2 text-xs sm:text-sm">
       <span>Delivery</span>

       <span className="shrink-0">Complimentary</span>
      </div>
     </div>
    </section>

    {/* ==================================================
        CHECKOUT FORM
    ================================================== */}

    <form id="checkout-form" onSubmit={handleSubmit} className="p-4 sm:p-5 md:p-8">
     <div className="space-y-5">
      {/* FULL NAME */}

      <div>
       <label className="mb-2 ml-2 block text-sm font-semibold">
        Full name <span className="text-red-500">*</span>
       </label>

       <input
        type="text"
        name="fullName"
        value={formData.fullName}
        onChange={handleChange}
        placeholder="Enter your full name"
        required
        className="
         h-14
         w-full
         border
         border-[#d8d8d8]
         bg-white
         px-5
         text-base
         outline-none
         transition
         placeholder:text-[#8a8a8a]
         focus:border-[#127749]
        "
       />
      </div>

      {/* PHONE + EMAIL */}

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
       {/* PHONE */}

       <div>
        <label className="mb-2 ml-2 block text-sm font-semibold">
         Phone number <span className="text-red-500">*</span>
        </label>

        <input
         type="tel"
         name="phone"
         value={formData.phone}
         onChange={handleChange}
         placeholder="Enter your phone number"
         required
         className="
          h-14
          w-full
          border
          border-[#d8d8d8]
          bg-white
          px-5
          text-base
          outline-none
          transition
          placeholder:text-[#8a8a8a]
          focus:border-[#127749]
         "
        />
       </div>

       {/* EMAIL */}

       <div>
        <label className="mb-2 ml-2 block text-sm font-semibold">
         Email <span className="text-red-500">*</span>
        </label>

        <input
         type="email"
         name="email"
         value={formData.email}
         onChange={handleChange}
         placeholder="Enter your email"
         required
         className="
          h-14
          w-full
          border
          border-[#d8d8d8]
          bg-white
          px-5
          text-base
          outline-none
          transition
          placeholder:text-[#8a8a8a]
          focus:border-[#127749]
         "
        />
       </div>
      </div>

      {/* ADDRESS */}

      <div>
       <label className="mb-2 ml-2 block text-sm font-semibold">
        Address <span className="text-red-500">*</span>
       </label>

       <input
        type="text"
        name="address"
        value={formData.address}
        onChange={handleChange}
        placeholder="Enter your address"
        required
        className="
         h-14
         w-full
         border
         border-[#d8d8d8]
         bg-white
         px-5
         text-base
         outline-none
         transition
         placeholder:text-[#8a8a8a]
         focus:border-[#127749]
        "
       />
      </div>

      {/* ZIPCODE */}

      <div className="w-full sm:max-w-[50%]">
       <label className="mb-2 ml-2 block text-sm font-semibold">
        Postal Code <span className="text-red-500">*</span>
       </label>

       <input
        name="zipcode"
        value={formData.zipcode}
        onChange={handleChange}
        required
        placeholder="Enter your postal code"
        className="
         h-14
         w-full
         border
         border-[#d8d8d8]
         bg-white
         px-5
         text-base
         outline-none
         transition
         placeholder:text-[#8a8a8a]
         focus:border-[#127749]
        "
       />
      </div>
     </div>
    </form>
   </div>

   {/* =====================================================
       SHIPPING
   ===================================================== */}

   <aside className="border border-[#dededb] bg-white">
    <div className="border-b border-[#dededb] px-6 py-5 md:px-8">
     <h2 className="text-xl font-semibold">Shipping method</h2>

     <p className="mt-1 text-sm text-[#777]">Select your preferred delivery method.</p>
    </div>

    <div className="divide-y divide-[#dededb]">
     {/* NINJA VAN */}

     <label className="flex cursor-pointer items-start gap-4 px-6 py-5 md:px-8">
      <input type="radio" name="shippingMethod" value="Ninja Van Singapore" defaultChecked className="mt-1 h-4 w-4 accent-[var(--primary-color)]" />

      <div className="flex-1">
       <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
        <div>
         <h3 className="font-medium text-[#111]">Ninja Van Singapore</h3>

         <p className="mt-1 text-sm text-[#777]">Cash on delivery (COD)</p>
        </div>

        <span className="text-sm font-medium text-[var(--primary-color)]">Available</span>
       </div>

       <div className="mt-4 flex flex-col gap-3 text-sm text-[#555]">
        <p>
         Estimated delivery: <span className="font-medium text-[#111]">{getEstimatedDeliveryDate()}</span>
        </p>

        <div className="flex items-center gap-2 text-sm font-medium text-[var(--primary-color)]">
         <FaTruck className="text-base" />

         <span>Free shipping</span>
        </div>
       </div>
      </div>
     </label>

     {/* FEDEX */}

     <div className="flex items-start gap-4 px-6 py-5 opacity-50 md:px-8">
      <input type="radio" name="shippingMethod" disabled className="mt-1 h-4 w-4" />

      <div className="flex-1">
       <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
        <div>
         <h3 className="font-medium text-[#111]">FedEx</h3>

         <p className="mt-1 text-sm text-[#777]">Express delivery</p>
        </div>

        <span className="text-sm font-medium text-[#888]">Unavailable</span>
       </div>

       <p className="mt-3 text-xs text-[#888]">This delivery method is currently unavailable.</p>
      </div>
     </div>

     {/* SINGPOST */}

     <div className="flex items-start gap-4 px-6 py-5 opacity-50 md:px-8">
      <input type="radio" name="shippingMethod" disabled className="mt-1 h-4 w-4" />

      <div className="flex-1">
       <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
        <div>
         <h3 className="font-medium text-[#111]">SingPost</h3>

         <p className="mt-1 text-sm text-[#777]">Standard delivery</p>
        </div>

        <span className="text-sm font-medium text-[#888]">Unavailable</span>
       </div>

       <p className="mt-3 text-xs text-[#888]">This delivery method is currently unavailable.</p>
      </div>
     </div>

     {/* TOTAL */}

     <div className="mt-2 flex items-center justify-between gap-4 border-t border-[#dededb] py-5 pt-4 md:px-8">
      <span className="text-base sm:text-lg">Total</span>

      <div className="text-right">
       <div className="text-sm font-semibold sm:text-base">SGD {formatPrice(totalPrice)}</div>

       <span className="text-[10px] text-[#777] sm:text-xs">Inclusive of GST</span>
      </div>
     </div>

     {/* CONFIRM */}

     <div className="w-full pt-3">
      <button
       form="checkout-form"
       type="submit"
       disabled={isSubmitting}
       className="
        mb-2
        w-full
        bg-[#127749]
        px-6
        py-4
        text-sm
        font-semibold
        text-white
        transition
        hover:bg-[#0d5f39]
        disabled:cursor-not-allowed
        disabled:opacity-60
        sm:px-8
       ">
       {isSubmitting ? "Submitting..." : "Confirm Order"}
      </button>
     </div>
    </div>
   </aside>
  </div>
 );
}
