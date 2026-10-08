import { useEffect, useRef, useState } from "react";

export default function Watches() {
 const sectionRef = useRef(null);
 const [isVisible, setIsVisible] = useState(false);

 useEffect(() => {
  const observer = new IntersectionObserver(
   ([entry]) => {
    setIsVisible(entry.isIntersecting);
   },
   {
    rootMargin: "-40% 0px -40% 0px",
    threshold: 0,
   },
  );

  if (sectionRef.current) {
   observer.observe(sectionRef.current);
  }

  return () => observer.disconnect();
 }, []);

 return (
  <div>
   <section className="relative w-full overflow-hidden">
    {/* ================= MOBILE ================= */}
    <div className="relative block lg:hidden">
     <img
      src="https://media.rolex.com/image/upload/q_auto/f_auto/c_limit,w_1600/v1761118588/rolexcom/accessories/landing/rolex-accessories-cover-rolexcufflinks_2312jva_002_rvb_v2-portrait"
      alt="Rolex accessories"
      className="w-full h-auto"
     />

     {/* Nội dung phía trên ảnh */}
     <div className="absolute inset-0 flex flex-col justify-center items-center">
      {/* Title */}
      <div className="absolute top-[24%] w-full text-center text-white">
       <p className="text-2xl font-semibold uppercase tracking-wide">Collection</p>

       <h1 className="mt-1 text-5xl font-bold leading-[0.95]">
        Rolex
        <br />
        accessories
       </h1>
      </div>

      {/* Description */}
      <div className="absolute bottom-[10%] left-0 w-full px-4 text-white">
       <h2 className="text-4xl font-bold">Elegant and precious cufflinks. A thoughtfully designed desk clock. Exclusive accessories by Rolex.</h2>

       <p className="mt-5 text-lg leading-[1.45] pl-20">
        These accessories, available at Official Retailers, reflect the visual codes of the brand while still meeting the same high standards in terms of
        quality and reliability as those of any Rolex watch.
       </p>
      </div>
     </div>
    </div>

    {/* ================= DESKTOP ================= */}
    <div className="relative hidden lg:block">
     <img
      src="https://media.rolex.com/image/upload/q_auto/f_auto/c_limit,w_1920/v1761060029/rolexcom/accessories/landing/rolex-accessories-cover-rolexcufflinks_2312jva_002_rvb_v2"
      alt="Rolex accessories"
      className="w-full h-auto"
     />

     {/* Nội dung phía trên ảnh */}
     <div className="container absolute inset-0">
      {/* Title */}
      <div className="absolute top-[25%] text-white md:left-1/2 md:-translate-x-1/2 md:text-center">
       <p className="text-sm font-semibold uppercase tracking-wide">Collection</p>

       <h1 className="mt-3 text-7xl font-bold leading-[0.95]">
        Rolex
        <br />
        accessories
       </h1>
      </div>

      {/* Description */}
      <div className="absolute left-[12%] bottom-[12%] w-[40%] text-white">
       <h2 className="text-3xl font-bold leading-[1.1]">Elegant and precious cufflinks. A thoughtfully designed desk clock. Exclusive accessories by Rolex.</h2>

       <p className="mt-6 text-base leading-[1.5]">
        These accessories, available at Official Retailers, reflect the visual codes of the brand while still meeting the same high standards in terms of
        quality and reliability as those of any Rolex watch.
       </p>
      </div>
     </div>
    </div>
   </section>

   <section className="relative h-[610px] overflow-hidden md:h-screen">
    {/* VIDEO */}
    <video className="absolute inset-0 h-full w-full object-cover" autoPlay muted loop playsInline preload="auto">
     <source
      media="(max-width: 767px)"
      src="https://media.rolex.com/video/upload/c_limit,w_640/f_auto:video/q_auto:best/v1/rolexcom/094398bf1f99/collection/hub/videos/cover/rolex-watches-collection-cover-autoplay"
      type="video/mp4"
     />

     <source
      src="https://media.rolex.com/video/upload/c_limit,w_2560/f_auto:video/q_auto:best/v1/rolexcom/094398bf1f99/collection/hub/videos/cover/rolex-watches-collection-cover-autoplay"
      type="video/mp4"
     />
    </video>

    {/* OVERLAY */}
    <div className="absolute inset-0 bg-black/10"></div>

    {/* CONTENT */}
    <div className="container relative mx-auto h-full px-5 md:px-10">
     <div className="absolute left-1/2 top-[18%] flex w-full -translate-x-1/2 flex-col items-center text-center text-white md:top-[18%]">
      <span className="text-sm font-medium tracking-[0.15em] md:text-xl">THE COLLECTION</span>

      <h2 className="mt-1 text-4xl font-bold md:text-7xl">Rolex watches</h2>
     </div>

     {/* DISCOVER */}
     <button className="absolute bottom-8 left-1/2 flex -translate-x-1/2 items-center gap-2 whitespace-nowrap text-sm font-bold text-white md:bottom-6 md:text-base">
      Discover the new 2026 watches
      <span className="text-xl">›</span>
     </button>
    </div>
   </section>
   <section className="bg-white">
    <div className="container mx-auto py-8  md:py-20">
     {/* TOP CONTENT */}
     <div className="grid gap-8 md:grid-cols-2 md:gap-20">
      {/* TITLE */}
      <div>
       <h2 className="max-w-[500px] text-2xl font-bold leading-tight text-[#127749] md:text-5xl">Explore the Rolex collection</h2>
      </div>

      {/* DESCRIPTION */}
      <div className="flex flex-col">
       <p className="max-w-[650px] text-sm leading-relaxed text-[#525354] md:text-2xl">
        The Rolex collection offers a wide range of prestigious, high-precision timepieces, from Professional to Classic models to suit any wrist.
       </p>

       {/* FIND YOUR ROLEX */}
       <button className="mt-8 flex w-fit items-center gap-2 font-bold text-[#127749] hover:text-black md:mt-16 md:text-lg">
        <span>Find your Rolex</span>
        <span className="text-2xl">›</span>
       </button>
      </div>
     </div>

     {/* BOTTOM NAVIGATION */}
     <div className="mt-12 flex items-center justify-between gap-5 md:mt-28">
      {/* TABS */}
      <div className="flex min-w-0 gap-8 overflow-x-auto whitespace-nowrap scrollbar-hide md:mx-auto md:gap-14 md:overflow-visible">
       <button className="shrink-0 font-bold text-[#127749] md:text-lg">All</button>

       <button className="shrink-0 font-bold hover:text-[#127749] md:text-lg">Classic</button>

       <button className="shrink-0 font-bold hover:text-[#127749] md:text-lg">Professional</button>

       <button className="shrink-0 font-bold hover:text-[#127749] md:text-lg">Watches by theme</button>
      </div>

      {/* CONFIGURE */}
      <button className="hidden shrink-0 rounded-full bg-[#127749] px-8 py-3 font-bold text-white hover:bg-black md:block">Configure</button>
     </div>
    </div>
   </section>

   <section className="relative h-[700px] overflow-hidden md:h-screen">
    <picture className="absolute inset-0 block h-full w-full">
     <source
      media="(max-width: 767px)"
      srcSet="https://media.rolex.com/image/upload/q_auto:best/f_auto/c_limit,w_240/v1775074869/rolexcom/094398bf1f99/collection/hub/watches-2026-land-dweller-hub-portrait"
     />

     <img
      src="https://media.rolex.com/image/upload/q_auto:best/f_auto/c_limit,w_1920/v1775074850/rolexcom/094398bf1f99/collection/hub/watches-2026-land-dweller-hub"
      alt="Land-Dweller"
      className="h-full w-full object-cover"
     />
    </picture>

    <div className="container relative h-full ">
     <div className="absolute bottom-12 left-5 md:bottom-[15%] md:left-10">
      <h2 className="text-3xl font-bold md:text-5xl">Land-Dweller</h2>

      <p className="mt-2 text-xl md:text-3xl">A new perspective</p>

      <button className="mt-5 flex items-center gap-2 font-bold">
       Discover more
       <span className="text-2xl">›</span>
      </button>
     </div>
    </div>
   </section>
   <section className="relative h-[700px] overflow-hidden md:h-screen">
    <picture className="absolute inset-0 block h-full w-full">
     <source
      media="(max-width: 767px)"
      srcSet="https://media.rolex.com/image/upload/q_auto:best/f_auto/c_limit,w_240/v1775074869/rolexcom/094398bf1f99/collection/hub/watches-2026-land-dweller-hub-portrait"
     />

     <img
      src="https://media.rolex.com/image/upload/q_auto:best/f_auto/c_limit,w_1920/v1775074850/rolexcom/094398bf1f99/collection/hub/watches-2026-land-dweller-hub"
      alt="Land-Dweller"
      className="h-full w-full object-cover"
     />
    </picture>

    <div className="container relative h-full">
     <div className="absolute bottom-12 left-5 md:bottom-[15%] md:left-10">
      <h2 className="text-3xl font-bold md:text-5xl">Land-Dweller</h2>

      <p className="mt-2 text-xl md:text-3xl">A new perspective</p>

      <button className="mt-5 flex items-center gap-2 font-bold">
       Discover more
       <span className="text-2xl">›</span>
      </button>
     </div>
    </div>
   </section>
  </div>
 );
}
Watches.Layout = "Default";
