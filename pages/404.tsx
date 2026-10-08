import Link from "next/link";

const Custom404 = () => {
 return (
  <main className="min-h-screen bg-white text-black">
   {/* TOP BORDER */}
   <div className="border-t border-[#e5e5e5]" />

   {/* CONTENT */}
   <section className="flex min-h-[calc(100vh-1px)] items-center justify-center px-6">
    <div className="mb-8 text-center">
     <h1 className="font-serif text-[42px] font-normal leading-none tracking-[-0.02em] md:text-[54px] lg:text-[58px]">404 PAGE NOT FOUND</h1>

     <p className="mt-5 text-[15px] leading-relaxed text-[#222] md:text-[17px]">The page you were looking for does not exist.</p>

     <Link href="/" className="mt-7 inline-block border-b border-black pb-1 text-[16px] leading-none transition-opacity hover:opacity-60 md:text-[17px]">
      Continue shopping
     </Link>
    </div>
   </section>
  </main>
 );
};

Custom404.Layout = "Default";

export default Custom404;
