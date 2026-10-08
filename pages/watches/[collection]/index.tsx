"use client";

import { FaHeart } from "react-icons/fa";
import { useEffect, useRef, useState } from "react";

const collection = [
 {
  eyebrow: "A spirit of freedom",
  title: "Reach for the sky",
  description:
   "Immediately recognizable with its large 3, 6 and 9 hour markers, combined with a prominent minutes scale, the Oyster Perpetual Air-King embodies Rolex's ties with the world of aviation.",
  image: "https://media.rolex.com/image/upload/q_auto/f_auto/v1/rolexcom/collection/air-king/air-king",
 },
 {
  eyebrow: "Since 1958",
  title: "The signature of excellence",
  description:
   "The Air-King joined the Rolex watch family in 1958. Its name, displayed on the dial in a distinctive italic typeface, has remained an instantly recognizable signature.",
  image: "https://media.rolex.com/image/upload/q_auto/f_auto/v1/rolexcom/collection/air-king/heritage",
 },
];

export default function Collection() {
 const [visible, setVisible] = useState(false);
 const heroRef = useRef<HTMLDivElement>(null);

 useEffect(() => {
  const observer = new IntersectionObserver(
   ([entry]) => {
    setVisible(entry.isIntersecting);
   },
   {
    rootMargin: "-40% 0px -30% 0px",
    threshold: 0,
   },
  );

  if (heroRef.current) {
   observer.observe(heroRef.current);
  }

  return () => observer.disconnect();
 }, []);

 return (
  <main className="bg-white">
   {/* ===================================================== */}
   {/* HERO */}
   {/* ===================================================== */}

   <section className="relative h-[650px] min-h-[600px] overflow-hidden md:h-screen">
    <picture className="absolute inset-0 h-full w-full">
     <img
      src="https://media.rolex.com/image/upload/q_auto/f_auto/c_limit,w_1920/v1785418829/rolexcom/collection/family-pages/professional-watches/air-king/family-page/2026/professional-watches-air-king-m126900-0001-cover"
      alt="Rolex Air-King"
      className="h-full w-full object-cover"
     />
    </picture>

    <div className="absolute inset-0 bg-black/10" />

    <div className="container relative mx-auto h-full">
     <div className="absolute left-5 top-1/2 -translate-y-1/2 text-white md:left-10">
      <p className="text-sm font-semibold uppercase tracking-[0.15em] md:text-lg">Oyster Perpetual</p>

      <h1 className="mt-3 text-5xl font-bold leading-none md:text-8xl">Air-King</h1>

      <p className="mt-5 text-2xl md:text-4xl">Reach for the sky</p>

      <button className="mt-8 flex cursor-pointer items-center gap-2 font-bold hover:text-[#127749]">
       Discover more
       <span className="text-2xl">›</span>
      </button>
     </div>
    </div>
   </section>

   {/* ===================================================== */}
   {/* INTRO */}
   {/* ===================================================== */}

   <section ref={heroRef} className="relative overflow-hidden bg-white py-20 md:py-32">
    <div className="container">
     <div className="grid items-center gap-12 md:grid-cols-2 md:gap-20">
      {/* TEXT LEFT */}

      <div className={`transition-all duration-1000 ease-out ${visible ? "translate-y-0 opacity-100" : "translate-y-24 opacity-0"}`}>
       <p className="text-sm font-semibold uppercase tracking-[0.15em]">A spirit of freedom</p>

       <h2 className="mt-4 text-4xl font-bold leading-tight md:text-6xl">Reach for the sky</h2>
      </div>

      {/* TEXT RIGHT */}

      <div className={`transition-all delay-150 duration-1000 ease-out ${visible ? "translate-y-0 opacity-100" : "translate-y-24 opacity-0"}`}>
       <p className="text-xl leading-relaxed text-[#525354] md:text-2xl">
        Immediately recognizable with its large 3, 6 and 9 hour markers, combined with a prominent minutes scale, the Oyster Perpetual Air-King embodies
        Rolex&apos;s ties with the world of aviation.
       </p>

       <p className="mt-8 text-lg leading-relaxed text-[#525354] md:text-xl">
        The Air-King is a watch designed for those who look towards new horizons and embrace a spirit of adventure.
       </p>
      </div>
     </div>
    </div>
   </section>

   {/* ===================================================== */}
   {/* FULL IMAGE */}
   {/* ===================================================== */}

   <section className="relative h-[700px] overflow-hidden md:h-screen">
    <video
     className="w-full"
     autoPlay
     muted
     loop
     playsInline
     src="https://media.rolex.com/video/upload/c_limit,w_3840/f_auto:video/q_auto:best/v1/rolexcom/collection/family-pages/professional-watches/air-king/family-page/2026/video-player/autoplay/professional-watches-air-king-autoplay"></video>

    <div className="absolute inset-0 bg-black/10" />

    <div className="container relative h-full">
     <div className="absolute bottom-12 left-5 text-white md:bottom-[12%] md:left-10">
      <p className="text-sm font-semibold uppercase tracking-[0.15em]">The signature of excellence</p>

      <h2 className="mt-3 text-4xl font-bold md:text-7xl">Air-King</h2>

      <p className="mt-5 max-w-xl text-lg md:text-2xl">A distinctive timepiece with an unmistakable aviation-inspired design.</p>
     </div>
    </div>
   </section>

   {/* ===================================================== */}
   {/* HISTORY */}
   {/* ===================================================== */}

   <section className="bg-[#f4f4f4] py-20 md:py-32">
    <div className="container">
     <div className="grid items-center gap-12 md:grid-cols-2 md:gap-20">
      {/* TEXT */}

      <div>
       <p className="text-sm font-semibold uppercase tracking-[0.15em]">Since 1958</p>

       <h2 className="mt-4 text-4xl font-bold leading-tight md:text-6xl">The signature of excellence</h2>

       <p className="mt-8 max-w-xl text-xl leading-relaxed text-[#525354] md:text-2xl">
        The Air-King joined the Rolex watch family in 1958. Its name, displayed on the dial in a distinctive italic typeface, has remained an instantly
        recognizable signature.
       </p>
      </div>

      {/* IMAGE */}

      <div className="h-[500px] overflow-hidden md:h-[650px]">
       <img
        src="https://media.rolex.com/image/upload/q_auto/f_auto/c_limit,w_1920/v1784732479/rolexcom/collection/family-pages/professional-watches/air-king/family-page/2026/roller-loop/01/professional-watches-air-king-m126900-0001_2403jva_002-rfederer21aa_019_r"
        alt="Air-King heritage"
        className="h-full w-full object-cover"
       />
      </div>
     </div>
    </div>
   </section>

   {/* ===================================================== */}
   {/* STYLE */}
   {/* ===================================================== */}

   <section className="relative h-[700px] overflow-hidden md:h-screen">
    <img
     src="https://media.rolex.com/image/upload/q_auto/f_auto/c_limit,w_1920/v1784734242/rolexcom/collection/family-pages/professional-watches/air-king/family-page/2026/professional-watches-air-king-push-univers"
     alt="Air-King beauty shot"
     className="h-full w-full object-cover"
    />

    <div className="absolute inset-0 bg-black/10" />

    <div className="container relative h-full">
     <div className="absolute bottom-12 left-5 text-white md:bottom-[12%] md:left-10">
      <p className="text-sm font-semibold uppercase tracking-[0.15em]">Irrefutable style</p>

      <h2 className="mt-3 text-4xl font-bold md:text-7xl">A unique personality</h2>

      <p className="mt-5 max-w-2xl text-lg md:text-2xl">
       The Air-King combines a distinctive black dial, prominent minutes scale and characteristic hands inspired by aviation.
      </p>
     </div>
    </div>
   </section>

   {/* ===================================================== */}
   {/* PRECISION */}
   {/* ===================================================== */}

   <section className="bg-white py-20 md:py-32">
    <div className="container">
     <div className="grid items-center gap-12 md:grid-cols-2 md:gap-20">
      {/* IMAGE */}

      <div className="order-2 md:order-1">
       <img
        src="https://media.rolex.com/image/upload/q_auto/f_auto/c_limit,w_1920/v1784734242/rolexcom/collection/family-pages/professional-watches/air-king/family-page/2026/professional-watches-air-king-push-univers"
        alt="Air-King details"
        className="mx-auto max-h-[600px] w-full object-contain"
       />
      </div>

      {/* TEXT */}

      <div className="order-1 md:order-2">
       <p className="text-sm font-semibold uppercase tracking-[0.15em]">Continual improvement</p>

       <h2 className="mt-4 text-4xl font-bold leading-tight md:text-6xl">Precision meets performance</h2>

       <p className="mt-8 text-xl leading-relaxed text-[#525354] md:text-2xl">
        Air-King is equipped with a scratch-resistant sapphire crystal and an Oystersteel case and bracelet.
       </p>

       <p className="mt-6 text-xl leading-relaxed text-[#525354] md:text-2xl">
        The calibre 3230 movement provides precision and a power reserve of approximately 70 hours.
       </p>
      </div>
     </div>
    </div>
   </section>

   {/* ===================================================== */}
   {/* AVIATION */}
   {/* ===================================================== */}

   <section className="relative h-[650px] overflow-hidden md:h-[800px]">
    <video
     className="w-full"
     autoPlay
     muted
     loop
     playsInline
     src="https://media.rolex.com/video/upload/c_limit,w_3840/f_auto:video/q_auto:best/v1/rolexcom/collection/family-pages/professional-watches/air-king/family-page/2026/video-autoplay/professional-watches-air-king-heritage-autoplay"></video>

    <div className="absolute inset-0 bg-black/15" />

    <div className="container relative h-full">
     <div className="absolute left-1/2 top-1/2 w-full -translate-x-1/2 -translate-y-1/2 px-5 text-center text-white md:px-10">
      <p className="text-sm font-semibold uppercase tracking-[0.15em]">Greater heights</p>

      <h2 className="mt-4 text-5xl font-bold md:text-8xl">Reach for the sky</h2>

      <p className="mx-auto mt-6 max-w-2xl text-lg md:text-2xl">Discover new horizons and follow your own inspiration.</p>
     </div>
    </div>
   </section>

   {/* ===================================================== */}
   {/* WATCH FEATURES */}
   {/* ===================================================== */}

   <section className="bg-white py-20 md:py-32">
    <div className="container">
     <div className="mb-12">
      <p className="text-sm font-semibold uppercase tracking-[0.15em]">Air-King</p>

      <h2 className="mt-3 text-4xl font-bold md:text-6xl">Features</h2>
     </div>

     <div className="grid border-t md:grid-cols-2">
      {/* FEATURE 1 */}

      <div className="border-b py-8 md:border-r md:pr-16">
       <h3 className="text-2xl font-bold md:text-3xl">Oystersteel</h3>

       <p className="mt-4 text-lg leading-relaxed text-[#525354] md:text-xl">
        The Air-King is crafted from Oystersteel, an exceptionally corrosion-resistant alloy that retains its beauty over time.
       </p>
      </div>

      {/* FEATURE 2 */}

      <div className="border-b py-8 md:pl-16">
       <h3 className="text-2xl font-bold md:text-3xl">Oyster bracelet</h3>

       <p className="mt-4 text-lg leading-relaxed text-[#525354] md:text-xl">
        The Oyster bracelet provides comfort, reliability and a distinctive Rolex aesthetic.
       </p>
      </div>

      {/* FEATURE 3 */}

      <div className="border-b py-8 md:border-r md:pr-16">
       <h3 className="text-2xl font-bold md:text-3xl">Chromalight display</h3>

       <p className="mt-4 text-lg leading-relaxed text-[#525354] md:text-xl">
        The display provides long-lasting blue luminescence for enhanced readability in dark conditions.
       </p>
      </div>

      {/* FEATURE 4 */}

      <div className="border-b py-8 md:pl-16">
       <h3 className="text-2xl font-bold md:text-3xl">Calibre 3230</h3>

       <p className="mt-4 text-lg leading-relaxed text-[#525354] md:text-xl">
        A new-generation mechanical movement offering precision, reliability and approximately 70 hours of power reserve.
       </p>
      </div>
     </div>
    </div>
   </section>

   {/* ===================================================== */}
   {/* MODEL */}
   {/* ===================================================== */}

   <section className="bg-[#f4f4f4] py-20 md:py-32">
    <div className="container">
     {/* FAVOURITES */}

     <div className="mb-10 flex cursor-pointer items-center gap-2 text-[#127749] hover:text-black">
      <FaHeart />

      <span className="font-bold">Add to favourites</span>
     </div>

     <div className="grid items-center gap-12 md:grid-cols-2 md:gap-20">
      {/* INFORMATION */}

      <div>
       <p className="text-sm font-semibold uppercase tracking-[0.15em]">Oyster Perpetual</p>

       <h2 className="mt-3 text-4xl font-bold md:text-6xl">Air-King</h2>

       <p className="mt-5 text-xl text-[#525354] md:text-2xl">Oyster, 40 mm, Oystersteel</p>

       <p className="mt-3 text-lg text-[#525354] md:text-xl">Reference 126900</p>

       <button className="mt-8 rounded-full bg-[#127749] px-7 py-3 font-bold text-white transition hover:bg-black">Discover this model</button>
      </div>

      {/* WATCH */}

      <div>
       <img
        src="https://media.rolex.com/image/upload/q_auto/f_auto/c_limit,w_1920/v1784732514/rolexcom/collection/family-pages/professional-watches/air-king/family-page/2026/roller-loop/04/professional-watches-air-king-m126900-0001_2410alb_0001"
        alt="Air-King 126900"
        className="mx-auto max-h-[550px] w-full object-contain"
       />
      </div>
     </div>
    </div>
   </section>

   {/* ===================================================== */}
   {/* TECHNICAL INFORMATION */}
   {/* ===================================================== */}

   <section className="container py-20 md:py-32">
    <div className="border-t">
     {/* MODEL CASE */}

     <details className="border-b py-8">
      <summary className="flex cursor-pointer list-none items-center justify-between text-2xl font-bold md:text-3xl">
       Model case
       <span className="text-2xl">+</span>
      </summary>

      <div className="mt-12 grid gap-8 md:grid-cols-3 md:gap-16">
       <div>
        <h4 className="font-bold md:text-xl">Model case</h4>

        <p className="mt-2 text-lg text-[#525354]">Oyster, 40 mm, Oystersteel</p>
       </div>

       <div>
        <h4 className="font-bold md:text-xl">Diameter</h4>

        <p className="mt-2 text-lg text-[#525354]">40 mm</p>
       </div>

       <div>
        <h4 className="font-bold md:text-xl">Water resistance</h4>

        <p className="mt-2 text-lg text-[#525354]">Waterproof to 100 metres / 330 feet</p>
       </div>
      </div>
     </details>

     {/* MOVEMENT */}

     <details className="border-b py-8">
      <summary className="flex cursor-pointer list-none items-center justify-between text-2xl font-bold md:text-3xl">
       Movement
       <span className="text-2xl">+</span>
      </summary>

      <div className="mt-12 grid gap-8 md:grid-cols-3 md:gap-16">
       <div>
        <h4 className="font-bold md:text-xl">Calibre</h4>

        <p className="mt-2 text-lg text-[#525354]">3230, Manufacture Rolex</p>
       </div>

       <div>
        <h4 className="font-bold md:text-xl">Precision</h4>

        <p className="mt-2 text-lg text-[#525354]">-2/+2 seconds per day, after casing</p>
       </div>

       <div>
        <h4 className="font-bold md:text-xl">Power reserve</h4>

        <p className="mt-2 text-lg text-[#525354]">Approximately 70 hours</p>
       </div>
      </div>
     </details>

     {/* BRACELET */}

     <details className="border-b py-8">
      <summary className="flex cursor-pointer list-none items-center justify-between text-2xl font-bold md:text-3xl">
       Bracelet
       <span className="text-2xl">+</span>
      </summary>

      <div className="mt-12 grid gap-8 md:grid-cols-3 md:gap-16">
       <div>
        <h4 className="font-bold md:text-xl">Bracelet</h4>

        <p className="mt-2 text-lg text-[#525354]">Oyster, three-piece solid links</p>
       </div>

       <div>
        <h4 className="font-bold md:text-xl">Material</h4>

        <p className="mt-2 text-lg text-[#525354]">Oystersteel</p>
       </div>

       <div>
        <h4 className="font-bold md:text-xl">Clasp</h4>

        <p className="mt-2 text-lg text-[#525354]">Oysterclasp</p>
       </div>
      </div>
     </details>

     {/* DIAL */}

     <details className="border-b py-8">
      <summary className="flex cursor-pointer list-none items-center justify-between text-2xl font-bold md:text-3xl">
       Dial
       <span className="text-2xl">+</span>
      </summary>

      <div className="mt-12 grid gap-8 md:grid-cols-3 md:gap-16">
       <div>
        <h4 className="font-bold md:text-xl">Dial</h4>

        <p className="mt-2 text-lg text-[#525354]">Black</p>
       </div>

       <div>
        <h4 className="font-bold md:text-xl">Details</h4>

        <p className="mt-2 text-lg text-[#525354]">Chromalight display with long-lasting blue luminescence</p>
       </div>
      </div>
     </details>

     {/* CERTIFICATION */}

     <details className="border-b py-8">
      <summary className="flex cursor-pointer list-none items-center justify-between text-2xl font-bold md:text-3xl">
       Certification
       <span className="text-2xl">+</span>
      </summary>

      <div className="mt-12">
       <h4 className="font-bold md:text-xl">Superlative Chronometer</h4>

       <p className="mt-2 max-w-3xl text-lg text-[#525354]">Official chronometer certification and Rolex certification after casing.</p>
      </div>
     </details>
    </div>
   </section>
  </main>
 );
}
Collection.Layout = "Default";
