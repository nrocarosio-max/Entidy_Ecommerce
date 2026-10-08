"use client";

import { useEffect, useRef, useState } from "react";

const accessories = [
 {
  eyebrow: "A symbol to have on hand",
  title: "'Crown' cufflinks",
  description:
   "The brand’s logo, a five-pointed crown, can be worn as cufflinks. They add a distinguished touch to the wrists of those for whom excellence must be expressed in the finest of details.",
  image:
   "https://media.rolex.com/image/upload/q_auto/f_auto/c_limit,w_1920/v1756810440/rolexcom/accessories/landing/rolex-accessories-rolex-crown-cufflinks-dyptique-a1018_bom_or18j_couronne",
 },
 {
  eyebrow: "Always shining",
  title: "'Hand' cufflinks",
  description:
   "Taking inspiration from the shape of the round disc found on the tips of the hour hands on Professional models, these cufflinks glow in the dark owing to their luminescent material.",
  image:
   "https://media.rolex.com/image/upload/q_auto/f_auto/c_limit,w_1920/v1756810438/rolexcom/accessories/landing/rolex-accessories-chromalight-cufflinks-dyptique-a1029_bom_or18g_aig_lubabl",
 },
 {
  eyebrow: "An iconic aesthetic",
  title: "'Fluted' cufflinks",
  description:
   "These cufflinks bring together several signature elements of Rolex watches. In the centre, the five-pointed crown is engraved on a Cerachrom disc in ceramic.",
  image:
   "https://media.rolex.com/image/upload/q_auto/f_auto/c_limit,w_1920/v1756810439/rolexcom/accessories/landing/rolex-accessories-fluted-cufflinks-dyptique-a1035_bom_or18r_cann_noir",
 },
];

export default function Accessories() {
 const [visible, setVisible] = useState(false);
 const heroRef = useRef<HTMLDivElement>(null);

 useEffect(() => {
  const observer = new IntersectionObserver(
   ([entry]) => {
    setVisible(entry.isIntersecting);
   },
   {
    threshold: 0.35,
   },
  );

  if (heroRef.current) {
   observer.observe(heroRef.current);
  }

  return () => observer.disconnect();
 }, []);

 return (
  <main>
   {/* HERO */}
   <section className="relative h-[650px] overflow-hidden md:h-screen">
    <picture className="absolute inset-0 h-full w-full">
     <img
      src="https://media.rolex.com/image/upload/q_auto/f_auto/c_limit,w_1920/v1761060029/rolexcom/accessories/landing/rolex-accessories-cover-rolexcufflinks_2312jva_002_rvb_v2"
      alt="Rolex accessories"
      className="h-full w-full object-cover"
     />
    </picture>

    <div className="absolute inset-0 bg-black/10" />

    <div className="relative mx-auto flex h-full max-w-[1600px] items-center justify-center px-6 text-center text-white">
     <div>
      <p className="text-sm font-semibold uppercase tracking-[0.18em] md:text-xl">Collection</p>

      <h1 className="mt-3 text-5xl font-bold leading-[0.95] md:text-7xl">
       Rolex
       <br />
       accessories
      </h1>
     </div>
    </div>
   </section>

   {/* INTRO */}
   <section ref={heroRef} className="relative overflow-hidden bg-white py-20 md:py-32">
    <div className="container mx-auto px-5 md:px-10">
     <div className="grid items-center gap-12 md:grid-cols-2 md:gap-20">
      <div className={`transition-all duration-1000 ease-out ${visible ? "translate-y-0 opacity-100" : "translate-y-20 opacity-0"}`}>
       <h2 className="text-4xl font-bold leading-tight md:text-6xl">
        Elegance
        <br />
        on the wrist
       </h2>
      </div>

      <div className={`transition-all delay-150 duration-1000 ease-out ${visible ? "translate-y-0 opacity-100" : "translate-y-20 opacity-0"}`}>
       <p className="text-xl leading-relaxed text-[#525354] md:text-2xl">
        Elegant and precious cufflinks. A thoughtfully designed desk clock. Exclusive accessories by Rolex.
       </p>

       <p className="mt-8 text-lg leading-relaxed text-[#525354] md:text-xl">
        These accessories reflect the visual codes of the brand while meeting the same high standards of quality and reliability as Rolex watches.
       </p>
      </div>
     </div>
    </div>
   </section>

   {/* CUFFLINKS INTRO IMAGE */}
   <section className="relative h-[500px] overflow-hidden md:h-[700px]">
    <img
     src="https://media.rolex.com/image/upload/q_auto/f_auto/c_limit,w_1920/v1759999281/rolexcom/accessories/landing/rolex-accessories-cufflinks-introduction-background"
     alt="Rolex cufflinks"
     className="h-full w-full object-cover"
    />

    <div className="absolute inset-0 flex items-end bg-black/10">
     <div className="container mx-auto px-5 pb-12 text-white md:px-10 md:pb-20">
      <p className="text-sm font-semibold uppercase tracking-[0.15em]">Elegance on the wrist</p>

      <h2 className="mt-2 text-4xl font-bold md:text-6xl">Cufflinks</h2>

      <p className="mt-4 max-w-xl text-lg md:text-2xl">Three cufflinks of discreet, timeless refinement come in 18 ct yellow, white or Everose gold.</p>
     </div>
    </div>
   </section>

   {/* CUFFLINKS */}
   {accessories.map((item, index) => (
    <AccessorySection key={item.title} {...item} reverse={index % 2 !== 0} />
   ))}

   {/* DESK CLOCK */}
   <section className="relative overflow-hidden bg-[#f3f4f4]">
    <div className="grid md:grid-cols-2">
     <div className="flex items-center px-6 py-20 md:px-20 md:py-32">
      <div>
       <p className="text-sm font-semibold uppercase tracking-[0.15em]">Indoor time</p>

       <h2 className="mt-3 text-4xl font-bold md:text-6xl">Desk clocks</h2>

       <p className="mt-6 max-w-xl text-lg leading-relaxed text-[#525354] md:text-xl">
        Directly inspired by the brand’s iconic models, the desk clocks reinterpret the aesthetic of Rolex watches for an indoor setting.
       </p>
      </div>
     </div>

     <div className="h-[450px] md:h-[650px]">
      <img
       src="https://media.rolex.com/image/upload/q_auto/f_auto/c_limit,w_1920/v1769685395/rolexcom/accessories/landing/rolex-accessories-submariner-desk-clock-c909010ln-0001_2512stj_001_srgb"
       alt="Submariner desk clock"
       className="h-full w-full object-cover"
      />
     </div>
    </div>
   </section>

   {/* CALENDAR CLOCK */}
   <section className="bg-white py-20 md:py-32">
    <div className="container mx-auto px-5 md:px-10">
     <div className="mx-auto max-w-4xl text-center">
      <p className="text-sm font-semibold uppercase tracking-[0.15em]">Honouring the Submariner</p>

      <h2 className="mt-3 text-4xl font-bold md:text-6xl">Calendar clock</h2>

      <p className="mt-8 text-lg leading-relaxed text-[#525354] md:text-xl">
       This Rolex desk clock with a secular calendar faithfully revisits the design of the Submariner Date. It displays the time along with the date and
       features a Cerachrom bezel and Chromalight display.
      </p>
     </div>
    </div>
   </section>
  </main>
 );
}

function AccessorySection({
 eyebrow,
 title,
 description,
 image,
 reverse,
}: {
 eyebrow: string;
 title: string;
 description: string;
 image: string;
 reverse?: boolean;
}) {
 return (
  <section className="overflow-hidden bg-white">
   <div className={`grid md:grid-cols-2 ${reverse ? "md:[&>div:first-child]:order-2" : ""}`}>
    <div className="h-[500px] md:h-[700px]">
     <img src={image} alt={title} className="h-full w-full object-cover transition-transform duration-700 hover:scale-105" />
    </div>

    <div className="flex items-center px-6 py-20 md:px-20 md:py-32">
     <div className="max-w-xl">
      <p className="text-sm font-semibold uppercase tracking-[0.15em]">{eyebrow}</p>

      <h2 className="mt-3 text-4xl font-bold md:text-6xl">{title}</h2>

      <p className="mt-6 text-lg leading-relaxed text-[#525354] md:text-xl">{description}</p>
     </div>
    </div>
   </div>
  </section>
 );
}

Accessories.Layout = "Default";
