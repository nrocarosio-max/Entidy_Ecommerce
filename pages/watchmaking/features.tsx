"use client";
import { useState } from "react";
export default function WatchmakingFeatures() {
 const [activeTab, setActiveTab] = useState("All");
 return (
  <main className="bg-white text-[#111]">
   {/* ================= HERO ================= */}
   <section className="relative h-[75vh] min-h-[600px] overflow-hidden md:h-screen">
    <img
     src="https://media.rolex.com/image/upload/q_auto:eco/f_auto/c_limit,w_1920/v1708392424/rolexcom/watchmaking/features/hub/videos/cover/watchmaking-features-anatomy-of-excellence-cover-autoplay-posterframe"
     alt="The anatomy of a Rolex"
     className="absolute inset-0 h-full w-full object-cover"
    />
    <div className="container relative flex h-full items-center">
     <div className="max-w-[700px] text-white">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] md:text-base"> Watchmaking </p>
      <h1 className="mt-4 text-5xl font-bold leading-[0.95] md:text-8xl">
       Anatomy <br /> of a Rolex
      </h1>
      <p className="mt-8 max-w-[620px] text-lg leading-relaxed md:text-2xl">
       At Rolex, we like questions. Each one is a challenge which stimulates our inventiveness, encourages us to surpass ourselves and opens us to new
       perspectives.
      </p>
     </div>
    </div>
   </section>
   {/* ================= INTRO ================= */}
   <section className="bg-white py-16 md:py-28">
    <div className="container">
     <div className="mx-auto max-w-[1000px] text-center">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#127749]"> A unique approach </p>
      <h2 className="mt-5 text-4xl font-bold md:text-6xl"> Every detail matters </h2>
      <p className="mx-auto mt-8 max-w-[850px] text-lg leading-relaxed text-[#525354] md:text-2xl">
       Each question requires us to take all the time necessary to reach its most apt resolution. Every single part of every single Rolex watch can be equated
       to the sum of particular questions and their respective answers.
      </p>
     </div>
    </div>
   </section>
   {/* ================= FILTER ================= */}
   <section className="border-b border-t bg-white">
    <div className="container">
     <div className="flex gap-8 overflow-x-auto py-6 md:justify-center md:gap-12">
      {["All", "Movements", "Cases", "Dials", "Bezels", "Bracelets", "Materials"].map((tab) => (
       <button
        key={tab}
        onClick={() => setActiveTab(tab)}
        className={`shrink-0 text-base font-bold transition md:text-lg ${activeTab === tab ? "text-[#127749]" : "text-[#111] hover:text-[#127749]"}`}>
        {tab}
       </button>
      ))}
     </div>
    </div>
   </section>
   {/* ================= FEATURES ================= */}
   <section className="bg-[#f4f4f4] py-12 md:py-20">
    <div className="container">
     <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
      {/* OYSTER CASE */}
      {(activeTab === "All" || activeTab === "Cases") && (
       <article className="group overflow-hidden bg-white">
        <div className="aspect-[4/3] overflow-hidden bg-[#e5e5e5]">
         <img
          src="https://media.rolex.com/image/upload/q_auto:eco/f_auto/c_limit,w_1920/v1778848436/rolexcom/watchmaking/features/watchmaking-cards/hub-grid/bezels/watchmaking-features-bezels-ring-command-bezel-sky-dweller_2301_003b_rvb-2-portrait"
          alt="Oyster case"
          className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
         />
        </div>
        <div className="p-6 md:p-8">
         <p className="text-sm font-semibold uppercase tracking-wide text-[#127749]"> Oyster case </p>
         <h3 className="mt-2 text-2xl font-bold md:text-3xl"> The world is your oyster </h3>
         <button className="mt-8 font-bold hover:text-[#127749]"> Discover more → </button>
        </div>
       </article>
      )}
      {/* PARACHROM */}
      {(activeTab === "All" || activeTab === "Movements") && (
       <article className="group overflow-hidden bg-white">
        <div className="aspect-[4/3] overflow-hidden bg-[#e5e5e5]">
         <img
          src="https://media.rolex.com/image/upload/q_auto:eco/f_auto/c_limit,w_1920/v1778848470/rolexcom/watchmaking/features/watchmaking-cards/hub-grid/movements/watchmaking-features-movements-ceramic-balance-staff-square"
          alt="Parachrom hairspring"
          className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
         />
        </div>
        <div className="p-6 md:p-8">
         <p className="text-sm font-semibold uppercase tracking-wide text-[#127749]"> Parachrom hairspring </p>
         <h3 className="mt-2 text-2xl font-bold md:text-3xl"> Why blue? </h3>
         <button className="mt-8 font-bold hover:text-[#127749]"> Discover more → </button>
        </div>
       </article>
      )}
      {/* BARREL */}
      {(activeTab === "All" || activeTab === "Movements") && (
       <article className="group overflow-hidden bg-white">
        <div className="aspect-[4/3] overflow-hidden bg-[#e5e5e5]">
         <img
          src="https://media.rolex.com/image/upload/q_auto:eco/f_auto/c_limit,w_1920/v1778848468/rolexcom/watchmaking/features/watchmaking-cards/hub-grid/movements/watchmaking-features-movements-chronograph-function-still_ooh_master_rgb-portrait"
          alt="Barrel"
          className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
         />
        </div>
        <div className="p-6 md:p-8">
         <p className="text-sm font-semibold uppercase tracking-wide text-[#127749]"> Barrel </p>
         <h3 className="mt-2 text-2xl font-bold md:text-3xl"> Catch and release </h3>
         <button className="mt-8 font-bold hover:text-[#127749]"> Discover more → </button>
        </div>
       </article>
      )}
      {/* TRANSPARENT CASE BACK */}
      {(activeTab === "All" || activeTab === "Cases") && (
       <article className="group overflow-hidden bg-white">
        <div className="aspect-[4/3] overflow-hidden bg-[#e5e5e5]">
         <img
          src="https://media.rolex.com/image/upload/q_auto:eco/f_auto/c_limit,w_1920/v1778848467/rolexcom/watchmaking/features/watchmaking-cards/hub-grid/movements/watchmaking-features-movements-dynapulse-escapement-still_ooh_08-square"
          alt="Transparent case back"
          className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
         />
        </div>
        <div className="p-6 md:p-8">
         <p className="text-sm font-semibold uppercase tracking-wide text-[#127749]"> Transparent case back </p>
         <h3 className="mt-2 text-2xl font-bold md:text-3xl"> Beyond the visible </h3>
         <button className="mt-8 font-bold hover:text-[#127749]"> Discover more → </button>
        </div>
       </article>
      )}
      {/* REVERSING WHEELS */}
      {(activeTab === "All" || activeTab === "Movements") && (
       <article className="group overflow-hidden bg-white">
        <div className="aspect-[4/3] overflow-hidden bg-[#e5e5e5]">
         <img
          src="https://media.rolex.com/image/upload/q_auto:eco/f_auto/c_limit,w_1920/v1778848446/rolexcom/watchmaking/features/watchmaking-cards/hub-grid/bracelets/watchmaking-features-bracelets-oysterflex-bracelet_oysterflex_2301_004_rvb-portrait"
          alt="Reversing wheels"
          className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
         />
        </div>
        <div className="p-6 md:p-8">
         <p className="text-sm font-semibold uppercase tracking-wide text-[#127749]"> Reversing wheels </p>
         <h3 className="mt-2 text-2xl font-bold md:text-3xl"> Why red? </h3>
         <button className="mt-8 font-bold hover:text-[#127749]"> Discover more → </button>
        </div>
       </article>
      )}
      {/* RING COMMAND */}
      {(activeTab === "All" || activeTab === "Cases") && (
       <article className="group overflow-hidden bg-white">
        <div className="aspect-[4/3] overflow-hidden bg-[#e5e5e5]">
         <img
          src="https://media.rolex.com/image/upload/q_auto:eco/f_auto/c_limit,w_1920/v1778848451/rolexcom/watchmaking/features/watchmaking-cards/hub-grid/case/watchmaking-features-case-twinlock-square"
          alt="Ring command"
          className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
         />
        </div>
        <div className="p-6 md:p-8">
         <p className="text-sm font-semibold uppercase tracking-wide text-[#127749]"> Ring command </p>
         <h3 className="mt-2 text-2xl font-bold md:text-3xl"> Sky-Dweller </h3>
         <button className="mt-8 font-bold hover:text-[#127749]"> Discover more → </button>
        </div>
       </article>
      )}
      {/* CHROMALIGHT */}
      {(activeTab === "All" || activeTab === "Dials") && (
       <article className="group overflow-hidden bg-white">
        <div className="aspect-[4/3] overflow-hidden bg-[#e5e5e5]">
         <img
          src="https://media.rolex.com/image/upload/q_auto:eco/f_auto/c_limit,w_1920/v1778848438/rolexcom/watchmaking/features/watchmaking-cards/hub-grid/bezels/watchmaking-features-bezels-undirectional-rotatable-bezel-rgb-portrait"
          alt="Chromalight"
          className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
         />
        </div>
        <div className="p-6 md:p-8">
         <p className="text-sm font-semibold uppercase tracking-wide text-[#127749]"> Chromalight </p>
         <h3 className="mt-2 text-2xl font-bold md:text-3xl"> Bring on the night </h3>
         <button className="mt-8 font-bold hover:text-[#127749]"> Discover more → </button>
        </div>
       </article>
      )}
      {/* FLUTED BEZEL */}
      {(activeTab === "All" || activeTab === "Bezels") && (
       <article className="group overflow-hidden bg-white">
        <div className="aspect-[4/3] overflow-hidden bg-[#e5e5e5]">
         <img
          src="https://media.rolex.com/image/upload/q_auto:eco/f_auto/c_limit,w_1920/v1778848460/rolexcom/watchmaking/features/watchmaking-cards/hub-grid/materials/watchmaking-features-materials-chromalight-appliques_2302_004_rvb-portrait"
          alt="Fluted bezel"
          className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
         />
        </div>
        <div className="p-6 md:p-8">
         <p className="text-sm font-semibold uppercase tracking-wide text-[#127749]"> Fluted bezel </p>
         <h3 className="mt-2 text-2xl font-bold md:text-3xl"> Brilliant like no other </h3>
         <button className="mt-8 font-bold hover:text-[#127749]"> Discover more → </button>
        </div>
       </article>
      )}
      {/* JUBILEE */}
      {(activeTab === "All" || activeTab === "Bracelets") && (
       <article className="group overflow-hidden bg-white">
        <div className="aspect-[4/3] overflow-hidden bg-[#e5e5e5]">
         <img
          src="https://media.rolex.com/image/upload/q_auto:eco/f_auto/c_limit,w_1920/v1778848456/rolexcom/watchmaking/features/watchmaking-cards/hub-grid/dials/watchmaking-features-dials-pvd-treated-dials-rgb-square"
          alt="Jubilee bracelet"
          className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
         />
        </div>
        <div className="p-6 md:p-8">
         <p className="text-sm font-semibold uppercase tracking-wide text-[#127749]"> Jubilee bracelet </p>
         <h3 className="mt-2 text-2xl font-bold md:text-3xl"> Emblematic </h3>
         <button className="mt-8 font-bold hover:text-[#127749]"> Discover more → </button>
        </div>
       </article>
      )}
     </div>
    </div>
   </section>
   {/* ================= QUOTE ================= */}
   <section className="bg-[#111] py-24 text-white md:py-40">
    <div className="container">
     <div className="mx-auto max-w-[1000px] text-center">
      <p className="text-3xl font-bold leading-tight md:text-6xl">
       “Each question requires us to take all the time necessary to reach its most apt resolution.”
      </p>
      <span className="mt-8 block text-sm uppercase tracking-[0.2em] text-[#aaa]"> Rolex Watchmaking </span>
     </div>
    </div>
   </section>
   {/* ================= BOTTOM ================= */}
   <section className="bg-[#f4f4f4] py-20">
    <div className="container">
     <div className="grid gap-4 md:grid-cols-2">
      <div className="bg-white p-8 md:p-12">
       <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#127749]"> Watchmaking </p>
       <h3 className="mt-4 text-3xl font-bold md:text-5xl"> Excellence in the making </h3>
       <button className="mt-8 font-bold hover:text-[#127749]"> Discover more → </button>
      </div>
      <div className="bg-white p-8 md:p-12">
       <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#127749]"> Anatomy of a Rolex </p>
       <h3 className="mt-4 text-3xl font-bold md:text-5xl"> Explore every detail </h3>
       <button className="mt-8 font-bold hover:text-[#127749]"> Discover more → </button>
      </div>
     </div>
    </div>
   </section>
  </main>
 );
}
WatchmakingFeatures.Layout = "Default";
