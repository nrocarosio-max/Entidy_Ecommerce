import { useEffect, useState } from "react";

import { FaLock, FaTruck, FaShieldAlt, FaCrown } from "react-icons/fa";

import CheckoutFormSG from "~/components/checkout/CheckoutFormSG";
import CheckoutFormMY from "~/components/checkout/CheckoutFormMY";
import DailyOfferCountdown from "~/components/checkout/LimitedTimeOffer";

import { CityChainWatch } from "~/data/CityChainWatch";
import { useCountry } from "~/context/CountryContext";

/* =========================================================
   CITY CHAIN CART TYPE
========================================================= */

type CartWatch = CityChainWatch;

type CartItem = CartWatch & {
 quantity: number;
};

/* =========================================================
   CHECKOUT
========================================================= */

const Checkout = () => {
 const { country, loading: countryLoading } = useCountry();

 const [cartItems, setCartItems] = useState<CartItem[]>([]);
 const [isLoaded, setIsLoaded] = useState(false);

 /* =========================================================
     LOAD CART FROM LOCAL STORAGE
  ========================================================= */

 useEffect(() => {
  if (countryLoading) return;

  try {
   const savedCart = localStorage.getItem("watches_cart");

   if (savedCart) {
    const parsedCart = JSON.parse(savedCart);

    if (Array.isArray(parsedCart)) {
     setCartItems(parsedCart as CartItem[]);
    } else {
     setCartItems([]);
    }
   } else {
    setCartItems([]);
   }
  } catch (error) {
   console.error("Cannot load checkout data:", error);
   setCartItems([]);
  } finally {
   setIsLoaded(true);
  }
 }, [countryLoading]);

 /* =========================================================
     LOADING
  ========================================================= */

 if (!isLoaded || countryLoading) {
  return (
   <main className="flex min-h-screen items-center justify-center bg-[#f8f8f6]">
    <p className="text-sm text-[#666]">Loading checkout...</p>
   </main>
  );
 }

 /* =========================================================
     COUNTRY SETTINGS
  ========================================================= */

 const isSingapore = country === "SG";

 return (
  <main className="min-h-screen overflow-x-hidden bg-[#f8f8f6] text-[#303234]">
   {/* =========================================================
          STEPS
      ========================================================= */}

   <div className="border-b border-[#dededb]">
    <div className="container">
     <div className="flex flex-wrap items-center justify-between gap-8 overflow-x-auto py-4 text-xs md:text-sm">
      <CheckoutStep number="1" title="Customer information" active current />

      <CheckoutStep number="2" title="Order Details" />
     </div>
    </div>
   </div>

   {/* =========================================================
          MAIN CONTENT
      ========================================================= */}

   <section className="container py-8 md:py-14">
    {/* TITLE */}

    <DailyOfferCountdown />

    {/* GRID */}

    <div className="min-w-0">{isSingapore ? <CheckoutFormSG watchData={cartItems} /> : <CheckoutFormMY watchData={cartItems} />}</div>
   </section>

   {/* =========================================================
          FOOTER BENEFITS
      ========================================================= */}

   <footer className="border-t border-[#dededb] bg-[#f8f8f6]">
    <div className="container grid gap-6 py-8 md:grid-cols-4 md:gap-8">
     <FooterItem icon={<FaTruck />} title="Free delivery" text="Complimentary and secure" />

     <FooterItem icon={<FaShieldAlt />} title="Easy returns" text="Return or exchange" />

     <FooterItem icon={<FaCrown />} title="Exclusive service" text="Available in-store and online" />

     <FooterItem icon={<FaLock />} title="Secure payments" text="Safe and encrypted" />
    </div>
   </footer>
  </main>
 );
};

/* =========================================================
   CHECKOUT STEP
========================================================= */

interface CheckoutStepProps {
 number: string;
 title: string;
 active?: boolean;
 current?: boolean;
}

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
  });

 return `${formatDate(minDate)} - ${formatDate(maxDate)}`;
}

const CheckoutStep = ({ number, title, active, current }: CheckoutStepProps) => {
 return (
  <div className="flex shrink-0 items-center gap-2 md:gap-3">
   <span
    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs ${
     active ? "bg-[#1b553e] text-white" : current ? "border border-[#1b553e] text-[#1b553e]" : "bg-[#eeeeec] text-[#777]"
    }`}>
    {number}
   </span>

   <span className={`whitespace-nowrap ${active || current ? "font-medium text-[#1b553e]" : "text-[#666]"}`}>{title}</span>
  </div>
 );
};

/* =========================================================
   FOOTER ITEM
========================================================= */

interface FooterItemProps {
 icon: React.ReactNode;
 title: string;
 text: string;
}

const FooterItem = ({ icon, title, text }: FooterItemProps) => {
 return (
  <div className="flex items-start gap-4 px-4 md:px-0">
   <div className="mt-1 shrink-0 text-[#444]">{icon}</div>

   <div className="min-w-0">
    <h4 className="text-sm font-semibold">{title}</h4>

    <p className="mt-1 text-xs text-[#666]">{text}</p>
   </div>
  </div>
 );
};

Checkout.Layout = "Default";

export default Checkout;
