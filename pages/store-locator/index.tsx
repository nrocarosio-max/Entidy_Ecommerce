"use client";

import { useState } from "react";
import { FaSearch, FaMapMarkerAlt, FaChevronDown, FaArrowRight } from "react-icons/fa";

const retailers = [
 {
  name: "CORTINA WATCH",
  location: "SINGAPORE RAFFLES CITY SHOPPING CENTRE",
  address: "252 North Bridge Road #01-36 Raffles City Shopping Centre",
  postal: "Singapore 179103",
  phone: "+65 6339 9185",
  type: "Rolex Retailer",
 },
 {
  name: "THE HOUR GLASS",
  location: "SINGAPORE NGEE ANN CITY",
  address: "391 Orchard Road #01-02 to 03 Ngee Ann City",
  postal: "Singapore 238872",
  phone: "+65 6734 2420",
  type: "Rolex Retailer",
 },
 {
  name: "ROLEX BOUTIQUE",
  location: "KEE HING HUNG 18 ROBINSON",
  address: "18 Robinson Road #01-04",
  postal: "Singapore 048547",
  phone: "+65 6222 5151",
  type: "Rolex Boutique",
 },
 {
  name: "ROLEX BOUTIQUE",
  location: "WATCH PALACE SINGAPORE MANDARIN GALLERY",
  address: "333A Orchard Road #01-07 Mandarin Gallery",
  postal: "Singapore 238897",
  phone: "+65 6735 5151",
  type: "Rolex Boutique",
 },
 {
  name: "THE HOUR GLASS",
  location: "SINGAPORE TANG PLAZA",
  address: "320 Orchard Road Ground Floor, Tang Plaza",
  postal: "Singapore 238865",
  phone: "+65 6235 7198",
  type: "Rolex Retailer",
 },
 {
  name: "GASSAN WATCH",
  location: "CHANGI AIRPORT TERMINAL 2",
  address: "60 Airport Boulevard Departure/Transit Lounge",
  postal: "Singapore 819643",
  phone: "+65 6214 9762",
  type: "Rolex Retailer",
 },
 {
  name: "ROLEX BOUTIQUE",
  location: "SWISS WATCH RESORTS WORLD SENTOSA",
  address: "26 Sentosa Gateway, Luxury Fashion Galleria",
  postal: "Singapore 098138",
  phone: "+65 6723 8002",
  type: "Rolex Boutique",
 },
 {
  name: "ROLEX BOUTIQUE",
  location: "THE HOUR GLASS SINGAPORE ION ORCHARD",
  address: "2 Orchard Turn #01-02, ION Orchard",
  postal: "Singapore 238801",
  phone: "+65 6509 9282",
  type: "Rolex Boutique",
 },
 {
  name: "ROLEX BOUTIQUE",
  location: "GASSAN WATCH CHANGI AIRPORT TERMINAL 3",
  address: "65 Airport Boulevard, Terminal 3",
  postal: "Singapore 819663",
  phone: "+65 6241 1528",
  type: "Rolex Boutique",
 },
 {
  name: "ROLEX BOUTIQUE",
  location: "THE TIME PLACE SINGAPORE MARINA BAY SANDS",
  address: "2 Bayfront Avenue, The Shoppes at Marina Bay Sands",
  postal: "Singapore 018972",
  phone: "+65 6688 7211",
  type: "Rolex Boutique",
 },
];

export default function SingaporeStoreLocator() {
 const [search, setSearch] = useState("");
 const [selected, setSelected] = useState<number | null>(null);

 const filteredRetailers = retailers.filter((retailer) =>
  `${retailer.name} ${retailer.location} ${retailer.address}`.toLowerCase().includes(search.toLowerCase()),
 );

 return (
  <main className="bg-white text-[#111]">
   {/* =====================================================
          HEADER
      ===================================================== */}
   <section className="border-b border-[#ddd] pt-28 md:pt-36">
    <div className="container">
     <div className="flex flex-col gap-8 pb-10 md:flex-row md:items-end md:justify-between">
      <div>
       <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#127749]">Store locator</p>

       <h1 className="mt-4 text-4xl font-bold md:text-6xl">Singapore</h1>
      </div>

      <div className="flex items-center gap-3 text-lg font-semibold">
       <FaMapMarkerAlt className="text-[#127749]" />
       <span>Singapore</span>
       <FaChevronDown size={12} />
      </div>
     </div>
    </div>
   </section>

   {/* =====================================================
          SEARCH
      ===================================================== */}
   <section className="border-b border-[#ddd] bg-[#f5f5f5] py-8">
    <div className="container">
     <div className="relative max-w-[700px]">
      <FaSearch className="absolute left-5 top-1/2 -translate-y-1/2 text-[#666]" size={17} />

      <input
       type="text"
       value={search}
       onChange={(e) => setSearch(e.target.value)}
       placeholder="Search by location"
       className="w-full rounded-full border border-[#aaa] bg-white py-4 pl-14 pr-6 text-lg outline-none focus:border-[#127749]"
      />
     </div>
    </div>
   </section>

   {/* =====================================================
          MAIN CONTENT
      ===================================================== */}
   <section>
    <div className="container grid min-h-[700px] md:grid-cols-[45%_55%]">
     {/* =================================================
              RETAILER LIST
          ================================================= */}
     <div className="border-r border-[#ddd]">
      <div className="border-b border-[#ddd] py-6">
       <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold md:text-3xl">Official Rolex Retailers</h2>

        <span className="text-sm text-[#666]">{filteredRetailers.length} results</span>
       </div>
      </div>

      <div>
       {filteredRetailers.map((retailer, index) => (
        <button
         key={index}
         onClick={() => setSelected(index)}
         className={`w-full border-b border-[#ddd] p-6 text-left transition ${selected === index ? "bg-[#f2f2f2]" : "hover:bg-[#f7f7f7]"}`}>
         <div className="flex justify-between gap-5">
          <div>
           <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#127749]">{retailer.type}</p>

           <h3 className="mt-2 text-lg font-bold md:text-xl">{retailer.name}</h3>

           <p className="mt-1 font-semibold">{retailer.location}</p>

           <p className="mt-3 text-sm leading-relaxed text-[#666]">
            {retailer.address}
            <br />
            {retailer.postal}
           </p>

           <p className="mt-3 text-sm text-[#666]">{retailer.phone}</p>
          </div>

          <FaArrowRight className="mt-2 shrink-0 text-[#127749]" size={14} />
         </div>
        </button>
       ))}
      </div>
     </div>

     {/* =================================================
              MAP
          ================================================= */}
     <div className="relative hidden bg-[#e5e5e5] md:block">
      {/* FAKE MAP BACKGROUND */}
      <div className="absolute inset-0 bg-[#e8e8e8]">
       <div className="absolute left-[15%] top-[20%] h-[1px] w-[70%] rotate-[15deg] bg-white" />

       <div className="absolute left-[5%] top-[45%] h-[1px] w-[90%] rotate-[-8deg] bg-white" />

       <div className="absolute left-[25%] top-[70%] h-[1px] w-[65%] rotate-[20deg] bg-white" />

       <div className="absolute left-[40%] top-[5%] h-[90%] w-[1px] rotate-[15deg] bg-white" />

       <div className="absolute left-[70%] top-[0%] h-[100%] w-[1px] rotate-[-12deg] bg-white" />
      </div>

      {/* MARKERS */}
      {retailers.map((retailer, index) => (
       <button
        key={index}
        onClick={() => setSelected(index)}
        className={`absolute flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-4 border-white shadow-lg transition ${
         selected === index ? "z-20 scale-125 bg-[#127749]" : "bg-[#111] hover:scale-110"
        }`}
        style={{
         left: `${15 + ((index * 17) % 70)}%`,
         top: `${18 + ((index * 23) % 65)}%`,
        }}>
        <FaMapMarkerAlt className="text-white" size={15} />
       </button>
      ))}

      {/* SELECTED CARD */}
      {selected !== null && (
       <div className="absolute bottom-8 left-8 right-8 z-30 bg-white p-6 shadow-xl">
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#127749]">{retailers[selected].type}</p>

        <h3 className="mt-2 text-xl font-bold">{retailers[selected].name}</h3>

        <p className="font-semibold">{retailers[selected].location}</p>

        <p className="mt-3 text-sm text-[#666]">
         {retailers[selected].address}
         <br />
         {retailers[selected].postal}
        </p>

        <button className="mt-5 flex items-center gap-3 font-bold hover:text-[#127749]">
         View details
         <FaArrowRight size={13} />
        </button>
       </div>
      )}
     </div>
    </div>
   </section>

   {/* =====================================================
          MOBILE MAP BUTTON
      ===================================================== */}
   <div className="sticky bottom-4 z-40 flex justify-center md:hidden">
    <button className="flex items-center gap-3 rounded-full bg-[#111] px-7 py-4 font-bold text-white shadow-xl">
     <FaMapMarkerAlt />
     View map
    </button>
   </div>

   {/* =====================================================
          BUYING A ROLEX
      ===================================================== */}
   <section className="bg-[#f3f3f3] py-20 md:py-28">
    <div className="container">
     <div className="max-w-[800px]">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#127749]">Buying a Rolex</p>

      <h2 className="mt-4 text-4xl font-bold md:text-6xl">The choice of a lifetime</h2>

      <p className="mt-6 text-lg leading-relaxed text-[#525354] md:text-2xl">
       New and genuine Rolex watches are exclusively sold by official Rolex Retailers. They warrant the authenticity of your Rolex and ensure that it enjoys a
       five-year international guarantee.
      </p>

      <button className="mt-8 flex items-center gap-3 font-bold hover:text-[#127749]">
       Learn more
       <FaArrowRight />
      </button>
     </div>
    </div>
   </section>

   {/* =====================================================
          SERVICE CENTRE
      ===================================================== */}
   <section className="bg-white py-20 md:py-28">
    <div className="container">
     <div className="grid gap-10 md:grid-cols-2 md:items-center md:gap-20">
      <div>
       <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#127749]">Servicing your Rolex</p>

       <h2 className="mt-4 text-4xl font-bold md:text-6xl">Rolex service</h2>

       <p className="mt-6 text-lg leading-relaxed text-[#525354] md:text-2xl">
        Rolex service centres and Official Rolex Retailers provide expert care to preserve the precision and reliability of your watch.
       </p>

       <button className="mt-8 flex items-center gap-3 font-bold hover:text-[#127749]">
        Find a service centre
        <FaArrowRight />
       </button>
      </div>
     </div>
    </div>
   </section>
  </main>
 );
}

SingaporeStoreLocator.Layout = "Default";
