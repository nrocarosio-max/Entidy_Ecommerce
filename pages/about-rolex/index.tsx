"use client";

import { FaArrowRight } from "react-icons/fa";

export default function AboutRolex() {
 return (
  <main className="bg-white text-[#111]">
   {/* =========================================================
          HERO
      ========================================================= */}
   <section className="relative h-[650px] overflow-hidden md:h-screen">
    <img
     src="https://media.rolex.com/image/upload/q_auto:eco/f_auto/c_limit,w_1920/v1708384234/rolexcom/about-rolex/hub/about-rolex-hub-cover-aca202310cw-0002-portrait"
     alt="About Rolex"
     className="absolute inset-0 h-full w-full object-cover"
    />

    <div className="absolute inset-0 bg-black/10" />

    <div className="container relative flex h-full items-center">
     <div className="text-white">
      <p className="text-sm font-semibold uppercase tracking-[0.2em]">About Rolex</p>

      <h1 className="mt-4 text-6xl font-bold leading-[0.95] md:text-8xl">
       About
       <br />
       Rolex
      </h1>
     </div>
    </div>
   </section>

   {/* =========================================================
          INTRO
      ========================================================= */}
   <section className="bg-white py-20 md:py-32">
    <div className="container">
     <div className="grid gap-12 md:grid-cols-[40%_60%] md:gap-20">
      {/* LEFT */}
      <div>
       <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#127749]">About Rolex</p>

       <h2 className="mt-5 text-4xl font-bold leading-tight md:text-6xl">An unrivalled reputation for quality and expertise</h2>
      </div>

      {/* RIGHT */}
      <div>
       <p className="text-xl leading-relaxed text-[#525354] md:text-3xl">
        Rolex is an integrated and independent Swiss watch manufacture. Headquartered in Geneva, it is recognized for its expertise and the quality of its
        products.
       </p>

       <p className="mt-8 text-lg leading-relaxed text-[#525354] md:text-xl">
        Hans Wilsdorf, founder of the company, instilled a notion of perpetual excellence, leading to major watchmaking innovations, such as the Oyster, the
        first waterproof wristwatch and the Perpetual rotor self-winding mechanism.
       </p>

       <p className="mt-6 text-lg leading-relaxed text-[#525354] md:text-xl">
        The brand designs, develops and produces the majority of its watch components in-house.
       </p>

       <p className="mt-6 text-lg leading-relaxed text-[#525354] md:text-xl">
        Rolex also supports the arts and culture, sport, exploration, and those who are devising solutions to preserve the planet.
       </p>

       <p className="mt-6 text-lg leading-relaxed text-[#525354] md:text-xl">It is a committed and responsible company whose products are made to last.</p>
      </div>
     </div>
    </div>
   </section>

   {/* =========================================================
          SUSTAINABILITY
      ========================================================= */}
   <section className="relative h-[650px] overflow-hidden md:h-[800px]">
    <img
     src="https://media.rolex.com/image/upload/q_auto:eco/f_auto/c_limit,w_1920/v1726218667/rolexcom/about-rolex/hub/about-rolex-hub-sustainability-push-v4_gettyimages-85758322"
     alt="Sustainability"
     className="absolute inset-0 h-full w-full object-cover transition duration-700 hover:scale-105"
    />

    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

    <div className="container relative flex h-full items-end pb-12 md:pb-20">
     <div className="max-w-[700px] text-white">
      <p className="text-sm font-semibold uppercase tracking-[0.2em]">Sustainability</p>

      <h2 className="mt-4 text-4xl font-bold leading-tight md:text-7xl">A long-term vision</h2>

      <p className="mt-5 text-lg leading-relaxed md:text-2xl">Long-term vision is at the heart of our philosophy and our various activities.</p>

      <button className="mt-7 flex cursor-pointer items-center gap-3 font-bold hover:text-[#127749]">
       Discover more
       <FaArrowRight />
      </button>
     </div>
    </div>
   </section>

   {/* =========================================================
          BEHIND THE CROWN
      ========================================================= */}
   <section className="bg-[#f3f3f3] py-20 md:py-32">
    <div className="container">
     <div className="grid gap-12 md:grid-cols-2 md:items-center md:gap-20">
      {/* IMAGE */}
      <div className="overflow-hidden">
       <img
        src="https://media.rolex.com/image/upload/q_auto:eco/f_auto/c_limit,w_1920/v1708396336/rolexcom/about-rolex/hub/about-rolex-hub-behind-the-crown-push-hans-wilsdorf-young"
        alt="Behind the crown"
        className="h-full w-full object-cover transition duration-700 hover:scale-105"
       />
      </div>

      {/* TEXT */}
      <div>
       <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#127749]">Behind the crown</p>

       <h2 className="mt-5 text-4xl font-bold leading-tight md:text-6xl">A quest for excellence</h2>

       <p className="mt-6 text-xl leading-relaxed text-[#525354] md:text-2xl">
        Rolex&apos;s innovations have indelibly marked the history of global watchmaking and bear witness to its founder&apos;s unending quest for excellence.
       </p>

       <button className="mt-8 flex cursor-pointer items-center gap-3 font-bold hover:text-[#127749]">
        Discover more
        <FaArrowRight />
       </button>
      </div>
     </div>
    </div>
   </section>

   {/* =========================================================
          HISTORY
          CHỮ NẰM TRÊN ẢNH
      ========================================================= */}
   <section className="relative h-[650px] overflow-hidden md:h-[800px]">
    {/* IMAGE */}
    <img
     src="https://media.rolex.com/image/upload/q_auto:eco/f_auto/c_limit,w_1920/v1708396336/rolexcom/about-rolex/hub/about-rolex-hub-history-push-1945-oyster-perpetual-datejust-1802jva-m126333-0010-1802jva-002-portrait"
     alt="Rolex History"
     className="absolute inset-0 h-full w-full object-cover"
    />

    {/* DARK OVERLAY */}
    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

    {/* CONTENT */}
    <div className="container relative flex h-full items-end pb-12 md:items-center md:pb-0">
     <div className="max-w-[650px] text-white">
      <p className="text-sm font-semibold uppercase tracking-[0.2em]">History</p>

      <h2 className="mt-4 text-4xl font-bold leading-tight md:text-7xl">A visionary spirit</h2>

      <p className="mt-5 text-lg leading-relaxed md:text-2xl">
       The history of Rolex is inextricably linked to the visionary spirit of Hans Wilsdorf, its founder.
      </p>

      <p className="mt-4 text-lg leading-relaxed md:text-2xl">
       His pioneering vision and pursuit of excellence shaped the foundations of the company and its approach to watchmaking.
      </p>

      <button className="mt-7 flex cursor-pointer items-center gap-3 font-bold hover:text-[#127749]">
       Discover more
       <FaArrowRight />
      </button>
     </div>
    </div>
   </section>

   {/* =========================================================
          ROLEX WATCHES
      ========================================================= */}
  </main>
 );
}

AboutRolex.Layout = "Default";
