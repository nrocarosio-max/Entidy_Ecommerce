"use client";

import { useCountry } from "~/context/CountryContext";

export default function CountrySelector() {
 const { country, showCountryPopup, selectCountry } = useCountry();

 if (!showCountryPopup) {
  return null;
 }

 return (
  <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40">
   <div className="relative w-full max-w-[660px] bg-white px-10 py-12 shadow-xl">
    {/* Close */}
    <button onClick={() => selectCountry(country)} className="absolute right-6 top-6 flex h-8 w-8 items-center justify-center border border-black text-xl">
     ×
    </button>

    <h2 className="max-w-[520px] text-4xl font-medium leading-tight">Welcome to the online store</h2>

    <p className="mt-6 text-base leading-6">To have the best experience on our website, please select the country where you are shopping.</p>

    <div className="mt-12 space-y-3">
     {/* Singapore */}
     <button onClick={() => selectCountry("MY")} className="w-full rounded-full bg-red-600 px-6 py-5 text-sm font-semibold tracking-widest text-white">
      CONTINUE ON THE MALAYSIA WEBSITE 🇲🇾
     </button>

     {/* Malaysia */}
     <button onClick={() => selectCountry("SG")} className="w-full rounded-full border border-black px-6 py-5 text-sm font-semibold tracking-widest">
      CONTINUE ON THE SINGAPORE WEBSITE 🇸🇬
     </button>
    </div>
   </div>
  </div>
 );
}
