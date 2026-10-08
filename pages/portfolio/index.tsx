"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
 FaArrowDown,
 FaArrowUp,
 FaCamera,
 FaCode,
 FaFacebookF,
 FaGraduationCap,
 FaInstagram,
 FaEnvelope,
 FaStar,
 FaGlobe,
 FaBullseye,
 FaPlay,
} from "react-icons/fa";

const services = [
 {
  number: "01",
  icon: FaStar,
  title: "Makeup Artist",
  description: "Trang điểm cá nhân, beauty, sự kiện, chụp hình và xây dựng hình ảnh cá nhân theo phong cách riêng.",
  tags: ["Beauty", "Event", "Photoshoot", "Personal"],
 },
 {
  number: "02",
  icon: FaCode,
  title: "Web Developer",
  description: "Thiết kế và phát triển website hiện đại, tối ưu trải nghiệm người dùng và phù hợp với mục tiêu kinh doanh.",
  tags: ["Next.js", "React", "E-commerce", "Landing Page"],
 },
 {
  number: "03",
  icon: FaFacebookF,
  title: "Facebook Ads",
  description: "Xây dựng chiến lược quảng cáo Facebook, tối ưu chuyển đổi và giúp doanh nghiệp tiếp cận đúng khách hàng.",
  tags: ["Meta Ads", "Conversion", "Tracking", "Strategy"],
 },
 {
  number: "04",
  icon: FaGraduationCap,
  title: "Đào tạo & Chia sẻ",
  description: "Chia sẻ kiến thức thực tế về website, quảng cáo Facebook, marketing và xây dựng thương hiệu cá nhân.",
  tags: ["Training", "Marketing", "Website", "Personal Brand"],
 },
];

const featuredProjects = [
 {
  number: "01",
  title: "Website thương mại điện tử",
  category: "Web Development",
  description: "Xây dựng hệ thống website bán hàng với giao diện hiện đại, giỏ hàng, checkout, tracking và quản lý đơn hàng.",
  image: "/images/projects/project-01.jpg",
  href: "#contact",
 },
 {
  number: "02",
  title: "Xây dựng thương hiệu cá nhân",
  category: "Personal Branding",
  description: "Thiết kế hình ảnh và hệ thống nội dung giúp cá nhân thể hiện rõ chuyên môn và tạo dấu ấn riêng.",
  image: "/images/projects/project-02.jpg",
  href: "#contact",
 },
 {
  number: "03",
  title: "Chiến dịch Facebook Ads",
  category: "Facebook Ads",
  description: "Lên chiến lược quảng cáo, xây dựng funnel và tối ưu dữ liệu để cải thiện hiệu quả chuyển đổi.",
  image: "/images/projects/project-03.jpg",
  href: "https://www.facebook.com/entidy.me/",
 },
];

const makeupWorks = [
 {
  title: "Beauty Makeup",
  image: "/images/makeup/makeup-01.jpg",
 },
 {
  title: "Event Makeup",
  image: "/images/makeup/makeup-02.jpg",
 },
];

const stats = [
 {
  value: "01",
  label: "Con người",
  description: "Nhiều vai trò",
 },
 {
  value: "03+",
  label: "Lĩnh vực",
  description: "Makeup • Web • Ads",
 },
 {
  value: "∞",
  label: "Ý tưởng",
  description: "Luôn học hỏi",
 },
 {
  value: "100%",
  label: "Tận tâm",
  description: "Trong từng dự án",
 },
];

export default function PortfolioPage() {
 return (
  <main className="min-h-screen bg-[#f5f2ed] text-[#171717]">
   {/* Header */}
   <header className="fixed left-0 top-0 z-50 w-full border-b border-black/10 bg-[#f5f2ed]/90 backdrop-blur-xl">
    <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6 lg:px-10">
     <Link href="/" className="group flex items-center gap-3">
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#171717] text-sm font-bold text-white">T</span>

      <div className="hidden sm:block">
       <p className="text-sm font-semibold tracking-[0.18em]">Nguyễn Thế Dương</p>
       <p className="text-[10px] uppercase tracking-[0.25em] text-black/50">Creative Portfolio</p>
      </div>
     </Link>

     <nav className="hidden items-center gap-8 md:flex">
      <a href="#about" className="text-sm font-medium transition hover:text-[#a47b38]">
       Giới thiệu
      </a>

      <a href="#services" className="text-sm font-medium transition hover:text-[#a47b38]">
       Chuyên môn
      </a>

      <a href="#projects" className="text-sm font-medium transition hover:text-[#a47b38]">
       Dự án
      </a>

      <a href="#contact" className="rounded-full bg-[#171717] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-[#a47b38]">
       Liên hệ
      </a>
     </nav>

     <a href="#contact" className="rounded-full bg-[#171717] px-4 py-2 text-xs font-semibold text-white md:hidden">
      Liên hệ
     </a>
    </div>
   </header>

   {/* Hero */}
   <section className="relative flex min-h-screen items-center overflow-hidden pt-20">
    <div className="absolute right-[-10%] top-[10%] h-[400px] w-[400px] rounded-full bg-[#c7a66a]/10 blur-3xl" />
    <div className="absolute bottom-[-15%] left-[-10%] h-[500px] w-[500px] rounded-full bg-black/5 blur-3xl" />

    <div className="relative mx-auto grid w-full max-w-7xl gap-16 px-6 py-20 lg:grid-cols-[1.1fr_0.9fr] lg:px-10">
     <div className="flex flex-col justify-center">
      <motion.p
       initial={{ opacity: 0, y: 20 }}
       animate={{ opacity: 1, y: 0 }}
       transition={{ duration: 0.6 }}
       className="mb-6 flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.3em] text-[#a47b38]">
       <span className="h-px w-10 bg-[#a47b38]" />
       Xin chào, tôi là Entidy
      </motion.p>

      <motion.h1
       initial={{ opacity: 0, y: 30 }}
       animate={{ opacity: 1, y: 0 }}
       transition={{ duration: 0.7, delay: 0.1 }}
       className="max-w-4xl text-5xl font-semibold leading-[0.95] tracking-[-0.04em] sm:text-6xl lg:text-8xl">
       Tôi tạo.
       <br />
       Tôi xây.
       <br />
       <span className="text-[#a47b38]">Tôi chia sẻ.</span>
      </motion.h1>

      <motion.p
       initial={{ opacity: 0, y: 20 }}
       animate={{ opacity: 1, y: 0 }}
       transition={{ duration: 0.6, delay: 0.3 }}
       className="mt-8 max-w-xl text-base leading-8 text-black/60 sm:text-lg">
       Tôi kết hợp giữa sự sáng tạo, công nghệ và marketing để xây dựng hình ảnh, website và những chiến dịch tạo ra giá trị thực tế.
      </motion.p>

      <motion.div
       initial={{ opacity: 0, y: 20 }}
       animate={{ opacity: 1, y: 0 }}
       transition={{ duration: 0.6, delay: 0.4 }}
       className="mt-10 flex flex-wrap gap-4">
       <a
        href="#projects"
        className="group flex items-center gap-3 rounded-full bg-[#171717] px-7 py-4 text-sm font-semibold text-white transition hover:bg-[#a47b38]">
        Xem công việc của tôi
        <FaArrowDown className="transition-transform group-hover:translate-y-1" />
       </a>

       <a
        href="#contact"
        className="rounded-full border border-black/20 px-7 py-4 text-sm font-semibold transition hover:border-[#a47b38] hover:text-[#a47b38]">
        Hãy cùng làm việc
       </a>
      </motion.div>
     </div>

     <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.8, delay: 0.2 }}
      className="relative flex items-center justify-center">
      <div className="relative aspect-[4/5] w-full max-w-md overflow-hidden bg-[#ded9d1]">
       <img src="/images/profile.jpg" alt="Ảnh chân dung" className="h-full w-full object-cover" />

       <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

       <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between text-white">
        <div>
         <p className="text-xs uppercase tracking-[0.25em] text-white/70">Creative</p>
         <p className="mt-1 text-2xl font-semibold">Multi-disciplinary</p>
        </div>

        <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/40">
         <FaArrowUp className="rotate-45 text-sm" />
        </div>
       </div>
      </div>

      <div className="absolute -bottom-8 -left-4 hidden w-44 bg-[#171717] p-5 text-white sm:block lg:-left-10">
       <FaCamera className="mb-4 text-[#c7a66a]" />

       <p className="text-xs uppercase tracking-[0.2em] text-white/50">Creative mind</p>

       <p className="mt-2 text-sm leading-6">Nghệ thuật gặp công nghệ.</p>
      </div>
     </motion.div>
    </div>

    <a
     href="#about"
     className="absolute bottom-8 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-3 text-[10px] font-semibold uppercase tracking-[0.3em] text-black/40 md:flex">
     <span>Cuộn xuống</span>
     <FaArrowDown className="animate-bounce" />
    </a>
   </section>

   {/* About */}
   <section id="about" className="border-y border-black/10 bg-white">
    <div className="mx-auto max-w-7xl px-6 py-24 lg:px-10 lg:py-32">
     <div className="grid gap-16 lg:grid-cols-[0.8fr_1.2fr]">
      <div>
       <p className="mb-5 text-xs font-semibold uppercase tracking-[0.3em] text-[#a47b38]">01 — Về tôi</p>

       <h2 className="max-w-md text-4xl font-semibold leading-tight tracking-[-0.03em] sm:text-5xl">
        Không chỉ có
        <br />
        một nghề.
       </h2>
      </div>

      <div>
       <p className="max-w-3xl text-xl leading-9 text-black/70 sm:text-2xl">
        Tôi tin rằng một người có thể theo đuổi nhiều đam mê cùng lúc. Với tôi, makeup là nghệ thuật, website là công cụ, còn marketing là cách biến một ý tưởng
        thành kết quả.
       </p>

       <p className="mt-8 max-w-3xl text-base leading-8 text-black/50">
        Thay vì giới hạn bản thân trong một lĩnh vực, tôi lựa chọn kết hợp những kỹ năng khác nhau để tạo ra một góc nhìn toàn diện hơn — từ hình ảnh, công nghệ
        cho đến chiến lược kinh doanh.
       </p>

       <div className="mt-12 grid grid-cols-2 gap-6 border-t border-black/10 pt-10 sm:grid-cols-4">
        {stats.map((stat) => (
         <div key={stat.label}>
          <p className="text-3xl font-semibold tracking-tight sm:text-4xl">{stat.value}</p>

          <p className="mt-2 text-sm font-semibold">{stat.label}</p>

          <p className="mt-1 text-xs text-black/40">{stat.description}</p>
         </div>
        ))}
       </div>
      </div>
     </div>
    </div>
   </section>

   {/* Services */}
   <section id="services" className="bg-[#171717] text-white">
    <div className="mx-auto max-w-7xl px-6 py-24 lg:px-10 lg:py-32">
     <div className="mb-16 flex flex-col justify-between gap-8 md:flex-row md:items-end">
      <div>
       <p className="mb-5 text-xs font-semibold uppercase tracking-[0.3em] text-[#c7a66a]">02 — Chuyên môn</p>

       <h2 className="max-w-3xl text-4xl font-semibold leading-tight tracking-[-0.03em] sm:text-6xl">
        Những gì tôi
        <br />
        có thể làm.
       </h2>
      </div>

      <p className="max-w-sm text-sm leading-7 text-white/50">Mỗi lĩnh vực là một phần trong hệ sinh thái kỹ năng mà tôi đang xây dựng và phát triển.</p>
     </div>

     <div className="border-t border-white/15">
      {services.map((service) => {
       const Icon = service.icon;

       return (
        <motion.div
         key={service.number}
         whileHover={{ x: 8 }}
         transition={{ duration: 0.25 }}
         className="group grid gap-6 border-b border-white/15 py-10 md:grid-cols-[80px_70px_1fr_0.7fr] md:items-start">
         <span className="text-sm text-white/30">{service.number}</span>

         <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/20 text-[#c7a66a] transition group-hover:border-[#c7a66a]">
          <Icon size={18} />
         </div>

         <div>
          <h3 className="text-2xl font-semibold tracking-tight sm:text-3xl">{service.title}</h3>

          <p className="mt-4 max-w-xl text-sm leading-7 text-white/50">{service.description}</p>
         </div>

         <div className="flex flex-wrap gap-2 md:justify-end">
          {service.tags.map((tag) => (
           <span key={tag} className="h-fit rounded-full border border-white/15 px-3 py-1.5 text-[10px] uppercase tracking-wider text-white/50">
            {tag}
           </span>
          ))}
         </div>
        </motion.div>
       );
      })}
     </div>
    </div>
   </section>

   {/* Featured Projects */}
   <section id="projects" className="bg-[#f5f2ed]">
    <div className="mx-auto max-w-7xl px-6 py-24 lg:px-10 lg:py-32">
     <div className="mb-16 grid gap-8 md:grid-cols-2 md:items-end">
      <div>
       <p className="mb-5 text-xs font-semibold uppercase tracking-[0.3em] text-[#a47b38]">03 — Dự án</p>

       <h2 className="text-4xl font-semibold leading-tight tracking-[-0.03em] sm:text-6xl">
        Một vài điều
        <br />
        tôi đã thực hiện.
       </h2>
      </div>

      <p className="max-w-md text-sm leading-7 text-black/50 md:ml-auto">
       Mỗi dự án là sự kết hợp giữa tư duy sáng tạo, trải nghiệm người dùng và mục tiêu kinh doanh.
      </p>
     </div>

     <div className="grid gap-8 md:grid-cols-2">
      {featuredProjects.map((project, index) => (
       <motion.div
        key={project.number}
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.6, delay: index * 0.1 }}
        className={index === 0 ? "group md:col-span-2" : "group"}>
        <Link href={project.href}>
         <div className={index === 0 ? "relative aspect-[16/8] overflow-hidden bg-[#ded9d1]" : "relative aspect-[4/3] overflow-hidden bg-[#ded9d1]"}>
          <img src={project.image} alt={project.title} className="h-full w-full object-cover transition duration-700 group-hover:scale-105" />

          <div className="absolute inset-0 bg-black/0 transition group-hover:bg-black/20" />

          <div className="absolute right-5 top-5 flex h-12 w-12 items-center justify-center rounded-full bg-white opacity-0 transition duration-300 group-hover:opacity-100">
           <FaArrowUp className="rotate-45 text-black" />
          </div>
         </div>

         <div className="mt-5 flex items-start justify-between gap-5">
          <div>
           <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#a47b38]">{project.category}</p>

           <h3 className="mt-2 text-xl font-semibold tracking-tight sm:text-2xl">{project.title}</h3>

           <p className="mt-3 max-w-xl text-sm leading-6 text-black/50">{project.description}</p>
          </div>

          <span className="text-xs text-black/30">{project.number}</span>
         </div>
        </Link>
       </motion.div>
      ))}
     </div>
    </div>
   </section>

   {/* Makeup */}
   <section className="bg-white">
    <div className="mx-auto max-w-7xl px-6 py-24 lg:px-10 lg:py-32">
     <div className="grid overflow-hidden bg-[#171717] text-white lg:grid-cols-2">
      <div className="relative min-h-[420px] overflow-hidden">
       <img
        src="/images/makeup-artist/hero.jpg"
        alt="Makeup Artist"
        className="absolute inset-0 h-full w-full object-cover transition duration-700 hover:scale-105"
       />

       <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

       <div className="absolute bottom-8 left-8">
        <p className="text-xs uppercase tracking-[0.3em] text-white/50">Một dịch vụ đặc biệt</p>

        <p className="mt-2 text-3xl font-semibold">Makeup Artist</p>
       </div>
      </div>

      <div className="flex flex-col justify-center p-8 sm:p-12 lg:p-16">
       <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#c7a66a]">Beauty Service</p>

       <h2 className="mt-5 text-4xl font-semibold leading-tight tracking-[-0.03em] sm:text-5xl">
        Bạn cần một
        <br />
        Makeup Artist?
       </h2>

       <p className="mt-6 text-sm leading-7 text-white/50">
        Tôi hợp tác cùng những Makeup Artist chuyên nghiệp để mang đến dịch vụ makeup phù hợp cho từng nhu cầu — từ makeup cá nhân, sự kiện đến beauty và
        photoshoot.
       </p>

       <Link
        href="/portfolio/artists/makeup"
        className="mt-8 inline-flex w-fit items-center gap-3 rounded-full bg-white px-6 py-3.5 text-sm font-semibold text-black transition hover:bg-[#c7a66a]">
        Xem portfolio Makeup Artist
        <FaArrowUp className="rotate-45" />
       </Link>
      </div>
     </div>
    </div>
   </section>

   {/* Digital */}
   <section className="bg-[#ded9d1]">
    <div className="mx-auto max-w-7xl px-6 py-24 lg:px-10 lg:py-32">
     <div className="grid gap-16 lg:grid-cols-2 lg:items-center">
      <div>
       <p className="mb-5 text-xs font-semibold uppercase tracking-[0.3em] text-[#a47b38]">05 — Digital</p>

       <h2 className="text-4xl font-semibold leading-tight tracking-[-0.03em] sm:text-6xl">
        Từ ý tưởng
        <br />
        đến kết quả.
       </h2>

       <p className="mt-8 max-w-xl text-base leading-8 text-black/60">
        Website đẹp chỉ là điểm bắt đầu. Tôi quan tâm đến cách website hoạt động, cách khách hàng tương tác và cách marketing biến traffic thành khách hàng thực
        sự.
       </p>

       <div className="mt-10 grid max-w-lg grid-cols-2 gap-4">
        <div className="border border-black/10 bg-white/40 p-6">
         <FaGlobe className="mb-5 text-[#a47b38]" />

         <h3 className="font-semibold">Website</h3>

         <p className="mt-2 text-xs leading-5 text-black/50">Website doanh nghiệp, landing page và thương mại điện tử.</p>
        </div>

        <div className="border border-black/10 bg-white/40 p-6">
         <FaBullseye className="mb-5 text-[#a47b38]" />

         <h3 className="font-semibold">Marketing</h3>

         <p className="mt-2 text-xs leading-5 text-black/50">Facebook Ads, tracking và tối ưu chuyển đổi.</p>
        </div>
       </div>
      </div>

      <div className="relative">
       <div className="aspect-square overflow-hidden bg-[#171717] p-8 text-white sm:p-12">
        <div className="flex h-full flex-col justify-between border border-white/10 p-8 sm:p-10">
         <div className="flex items-center justify-between">
          <span className="text-xs uppercase tracking-[0.25em] text-white/40">Digital Thinking</span>

          <FaArrowUp className="rotate-45 text-[#c7a66a]" />
         </div>

         <div>
          <p className="text-5xl font-semibold tracking-[-0.04em] sm:text-7xl">Creative</p>

          <p className="mt-2 text-5xl font-semibold tracking-[-0.04em] text-[#c7a66a] sm:text-7xl">+ Digital</p>

          <p className="mt-8 max-w-sm text-sm leading-6 text-white/40">Sáng tạo có chiến lược. Công nghệ có mục tiêu.</p>
         </div>
        </div>
       </div>
      </div>
     </div>
    </div>
   </section>

   {/* Contact */}
   <section id="contact" className="bg-[#171717] text-white">
    <div className="mx-auto max-w-7xl px-6 py-24 lg:px-10 lg:py-32">
     <div className="grid gap-16 lg:grid-cols-[1fr_0.8fr]">
      <div>
       <p className="mb-5 text-xs font-semibold uppercase tracking-[0.3em] text-[#c7a66a]">06 — Liên hệ</p>

       <h2 className="max-w-3xl text-5xl font-semibold leading-[0.95] tracking-[-0.04em] sm:text-7xl">
        Bạn có một
        <br />
        ý tưởng?
        <br />
        <span className="text-[#c7a66a]">Hãy nói với tôi.</span>
       </h2>

       <p className="mt-8 max-w-xl text-base leading-7 text-white/50">
        Dù bạn đang cần makeup, xây dựng website, chạy quảng cáo hay muốn tìm người đồng hành để phát triển thương hiệu cá nhân, hãy kết nối với tôi.
       </p>
      </div>

      <div className="flex flex-col justify-end">
       <a href="mailto:hello@example.com" className="group border-b border-white/15 py-6">
        <div className="flex items-center justify-between">
         <div>
          <p className="text-xs uppercase tracking-[0.2em] text-white/30">Email</p>

          <p className="mt-2 text-lg font-medium">entidy.me@example.com</p>
         </div>

         <FaArrowUp className="rotate-45 text-[#c7a66a] transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
        </div>
       </a>

       <Link href="https://www.facebook.com/entidy.me/" className="group border-b border-white/15 py-6">
        <div className="flex items-center justify-between">
         <div>
          <p className="text-xs uppercase tracking-[0.2em] text-white/30">Facebook</p>

          <p className="mt-2 text-lg font-medium">Nguyễn Thế Dương</p>
         </div>

         <FaFacebookF className="text-[#c7a66a]" />
        </div>
       </Link>

       <a href="#" className="group border-b border-white/15 py-6">
        <div className="flex items-center justify-between">
         <div>
          <p className="text-xs uppercase tracking-[0.2em] text-white/30">Instagram</p>

          <p className="mt-2 text-lg font-medium">Instagram</p>
         </div>

         <FaInstagram className="text-[#c7a66a]" />
        </div>
       </a>

       <a href="#" className="group border-b border-white/15 py-6">
        <div className="flex items-center justify-between">
         <div>
          <p className="text-xs uppercase tracking-[0.2em] text-white/30">Công việc</p>

          <p className="mt-2 text-lg font-medium">Đặt lịch tư vấn</p>
         </div>

         <FaEnvelope className="text-[#c7a66a]" />
        </div>
       </a>
      </div>
     </div>
    </div>
   </section>

   {/* Footer */}
   <footer className="bg-[#111111] text-white">
    <div className="mx-auto flex max-w-7xl flex-col gap-6 px-6 py-8 sm:flex-row sm:items-center sm:justify-between lg:px-10">
     <div>
      <p className="text-sm font-semibold tracking-[0.15em]">Nguyễn Thế Dương</p>

      <p className="mt-1 text-xs text-white/30">Makeup • Web • Marketing • Đào tạo</p>
     </div>

     <p className="text-xs text-white/30">© {new Date().getFullYear()} — Tất cả quyền được bảo lưu.</p>

     <a href="#" className="flex items-center gap-2 text-xs text-white/40 transition hover:text-white">
      Về đầu trang
      <FaArrowUp />
     </a>
    </div>
   </footer>
  </main>
 );
}
