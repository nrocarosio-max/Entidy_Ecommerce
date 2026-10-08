"use client";
import { useEffect, useRef, useState } from "react";
import { FaArrowRight, FaDownload } from "react-icons/fa";
export default function SustainableDevelopment() {
 const [isVisible, setIsVisible] = useState(false);
 const sectionRef = useRef<HTMLElement>(null);
 useEffect(() => {
  const observer = new IntersectionObserver(
   ([entry]) => {
    if (entry.isIntersecting) {
     setIsVisible(true);
    }
   },
   { threshold: 0.35 },
  );
  if (sectionRef.current) {
   observer.observe(sectionRef.current);
  }
  return () => observer.disconnect();
 }, []);
 return (
  <main className="bg-white text-[#111]">
   {/* ========================================================= HERO ========================================================= */}
   <section className="relative h-[650px] overflow-hidden md:h-screen">
    <img
     src="https://media.rolex.com/image/upload/q_auto:eco/f_auto/c_limit,w_1920/v1726219786/rolexcom/about-rolex/corporate-social-responsibility/sustainable-development/about-rolex-sustainability-cover-v4_gettyimages-85758322"
     alt="Sustainability"
     className="absolute inset-0 h-full w-full object-cover"
    />
    <div className="absolute inset-0 bg-black/10" />
    <div className="container relative flex h-full items-center">
     <div className={`max-w-[700px] text-white transition-all duration-1000 ${isVisible ? "translate-y-0 opacity-100" : "translate-y-20 opacity-0"}`}>
      <p className="text-sm font-semibold uppercase tracking-[0.2em]"> About Rolex </p>
      <h1 className="mt-4 text-6xl font-bold leading-[0.95] md:text-8xl"> Sustainability </h1>
      <p className="mt-6 text-2xl font-medium md:text-4xl"> A commitment to the future </p>
     </div>
    </div>
   </section>
   {/* ========================================================= MISSION ========================================================= */}
   <section className="bg-white py-20 md:py-32">
    <div className="container">
     <div className="grid gap-12 md:grid-cols-[40%_60%] md:gap-20">
      <div>
       <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#127749]"> Sustainability </p>
       <h2 className="mt-5 text-4xl font-bold leading-tight md:text-6xl"> Our mission as a responsible company </h2>
      </div>
      <div>
       <p className="text-xl leading-relaxed text-[#525354] md:text-3xl">
        To put our high quality standards, sense of innovation and values of excellence at the heart of our sustainability commitments.
       </p>
       <div className="mt-10 border-t border-[#d5d5d5]">
        <div className="border-b py-6 text-lg leading-relaxed md:text-xl">
         Continuing to design and manufacture watches of exceptional quality that stand the test of time.
        </div>
        <div className="border-b py-6 text-lg leading-relaxed md:text-xl"> Continually innovating to reduce the impact of our business. </div>
        <div className="border-b py-6 text-lg leading-relaxed md:text-xl">
         Ensuring that social and environmental responsibility is incorporated into our practices throughout our value chain.
        </div>
        <div className="border-b py-6 text-lg leading-relaxed md:text-xl"> Integrating this mission into our company&apos;s decisions and actions. </div>
       </div>
      </div>
     </div>
    </div>
   </section>
   {/* ========================================================= SUSTAINABILITY REPORT ========================================================= */}
   <section className="bg-[#f3f3f3] py-16 md:py-28">
    <div className="container">
     <div className="grid items-center gap-10 md:grid-cols-2 md:gap-20">
      <div className="overflow-hidden">
       <img
        src="https://media.rolex.com/image/upload/q_auto/f_auto/c_limit,w_1920/v1782897401/rolexcom/about-rolex/corporate-social-responsibility/sustainable-development/about-rolex-sustainability-sustainability-report-push_ext05_office-entrance_b6"
        alt="2025 Sustainability Report"
        className="w-full object-cover transition duration-700 hover:scale-105"
       />
      </div>
      <div>
       <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#127749]"> Our 2025 </p>
       <h2 className="mt-4 text-4xl font-bold md:text-6xl"> Sustainability Report </h2>
       <p className="mt-6 text-lg leading-relaxed text-[#525354] md:text-xl">
        In this new edition, we are reaffirming our commitment to being a responsible brand, driven by excellence, innovation and the mastery of our know-how.
       </p>
       <p className="mt-5 text-lg leading-relaxed text-[#525354] md:text-xl">
        From sourcing to reducing our environmental impact, as well as the well-being of our employees and passing on our knowledge to future generations, we
        outline our actions, our progress and the concrete projects that guide our approach to sustainability.
       </p>
       <a href="#" className="mt-8 inline-flex items-center gap-3 font-bold text-[#127749] hover:text-black">
        <FaDownload size={14} /> Download the 2025 sustainability report
       </a>
      </div>
     </div>
    </div>
   </section>
   {/* ========================================================= CARBON FOOTPRINT ========================================================= */}
   <section className="relative overflow-hidden bg-[#dedede]">
    <div className="grid md:grid-cols-2">
     <div className="flex min-h-[500px] items-center p-8 md:min-h-[700px] md:p-16">
      <div className="max-w-[650px]">
       <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#127749]"> Our carbon footprint </p>
       <h2 className="mt-5 text-4xl font-bold leading-tight md:text-6xl"> Reducing our impact </h2>
       <p className="mt-6 text-lg leading-relaxed text-[#525354] md:text-2xl">
        Through the Science Based Targets initiative, we have committed to reducing our absolute greenhouse gas emissions before 2030.
       </p>
       <p className="mt-5 text-lg leading-relaxed text-[#525354] md:text-2xl">
        Our objectives are aligned with the decarbonisation requirements necessary to limit global warming by 2050, in accordance with the Paris Agreement.
       </p>
       <button className="mt-8 flex items-center gap-3 font-bold hover:text-[#127749]">
        Our targets <FaArrowRight />
       </button>
      </div>
     </div>
     <div className="min-h-[450px] md:min-h-[700px]">
      <img
       src="https://media.rolex.com/image/upload/q_auto:eco/f_auto/c_limit,w_1920/v1782816323/rolexcom/about-rolex/corporate-social-responsibility/sustainable-development/about-rolex-csr-sustainability-gas-emissions-v2"
       alt="Rolex prototype building"
       className="h-full w-full object-cover"
      />
     </div>
    </div>
   </section>
   {/* ========================================================= TRACEABILITY ========================================================= */}
   {/* ========================================================= PERPETUAL INITIATIVES ========================================================= */}
   <section ref={sectionRef} className="relative h-[650px] overflow-hidden md:h-[800px]">
    <img
     src="https://media.rolex.com/image/upload/q_auto/f_auto/c_limit,w_1920/v1782816175/rolexcom/about-rolex/corporate-social-responsibility/sustainable-development/about-rolex-sustainability-our-perpetual-initiatives-push-v2"
     alt="Our Perpetual Initiatives"
     className="absolute inset-0 h-full w-full object-cover"
    />
    <div className="absolute inset-0 bg-black/20" />
    <div className="container relative flex h-full items-end pb-12 md:pb-20">
     <div className={`max-w-[700px] text-white transition-all duration-1000 ease-out ${isVisible ? "translate-y-0 opacity-100" : "translate-y-24 opacity-0"}`}>
      <p className="text-sm font-semibold uppercase tracking-[0.2em]"> Our Perpetual Initiatives </p>
      <h2 className="mt-4 text-4xl font-bold md:text-7xl"> Protecting what matters </h2>
      <p className="mt-5 text-lg leading-relaxed md:text-2xl">
       We strive to protect the planet, perpetuate cultural heritage, promote innovation and inspire future generations.
      </p>
      <button className="mt-7 flex items-center gap-3 font-bold hover:text-[#127749]">
       Discover more <FaArrowRight />
      </button>
     </div>
    </div>
   </section>
   {/* ========================================================= ALERT SYSTEM ========================================================= */}
   <section className="bg-[#f3f3f3] py-20 md:py-28">
    <div className="container">
     <div className="grid gap-10 md:grid-cols-[35%_65%] md:gap-20">
      <div>
       <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#127749]"> Alert system </p>
       <h2 className="mt-4 text-4xl font-bold md:text-6xl"> Make a report </h2>
      </div>
      <div>
       <p className="text-xl leading-relaxed text-[#525354] md:text-3xl">
        Our alert system enables you to report any justified doubt regarding potential or actual harmful effects related to the respect for human rights and
        fundamental freedoms, environmental protection and good governance.
       </p>
       <p className="mt-6 text-lg leading-relaxed text-[#525354] md:text-xl">
        You can submit your report securely and confidentially by following the instructions in the submission form.
       </p>
       <button className="mt-8 rounded-full bg-[#127749] px-7 py-3 font-bold text-white transition hover:bg-black"> Submit an alert </button>
      </div>
     </div>
    </div>
   </section>
   {/* ========================================================= NEXT ========================================================= */}
  </main>
 );
}
SustainableDevelopment.Layout = "Default";
