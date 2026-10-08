import Link from "next/link";
import { motion } from "framer-motion";
import { FaArrowDown, FaArrowRight, FaFacebookF, FaInstagram, FaPlay, FaQuoteLeft, FaTiktok } from "react-icons/fa";
import { SiThreads } from "react-icons/si";

const socialLinks = [
 {
  name: "Instagram",
  href: "#",
  icon: FaInstagram,
 },
 {
  name: "TikTok",
  href: "#",
  icon: FaTiktok,
 },
 {
  name: "Threads",
  href: "#",
  icon: SiThreads,
 },
 {
  name: "Facebook",
  href: "#",
  icon: FaFacebookF,
 },
];

const services = [
 {
  number: "01",
  title: "Makeup cá nhân",
  description: "Phong cách makeup được thiết kế theo đường nét khuôn mặt, outfit và cá tính riêng của bạn.",
 },
 {
  number: "02",
  title: "Makeup sự kiện",
  description: "Makeup chỉn chu cho tiệc cưới, sinh nhật, sự kiện, party và những buổi gặp gỡ đặc biệt.",
 },
 {
  number: "03",
  title: "Makeup photoshoot",
  description: "Makeup chuyên nghiệp cho beauty shoot, fashion shoot, profile cá nhân và content creator.",
 },
 {
  number: "04",
  title: "Makeup cô dâu",
  description: "Phong cách thanh lịch, trong trẻo nhưng vẫn nổi bật để bạn tự tin trong ngày quan trọng.",
 },
];

const gallery = [
 {
  image: "/images/makeup-artist/look-01.jpg",
  title: "Soft Glam",
  category: "Beauty",
 },
 {
  image: "/images/makeup-artist/look-02.jpg",
  title: "Clean Girl",
  category: "Personal",
 },
 {
  image: "/images/makeup-artist/look-03.jpg",
  title: "Elegant",
  category: "Event",
 },
 {
  image: "/images/makeup-artist/look-04.jpg",
  title: "Bridal Glow",
  category: "Bridal",
 },
 {
  image: "/images/makeup-artist/look-05.jpg",
  title: "Editorial",
  category: "Photoshoot",
 },
 {
  image: "/images/makeup-artist/look-06.jpg",
  title: "Modern Beauty",
  category: "Beauty",
 },
];

const testimonials = [
 {
  quote: "Makeup rất đẹp nhưng vẫn giữ được nét riêng của mình. Mình thích nhất là cảm giác tự nhiên và không bị quá nặng mặt.",
  name: "Minh Anh",
  role: "Personal Makeup",
 },
 {
  quote: "Phong cách làm việc rất nhẹ nhàng, chuyên nghiệp. Makeup lên hình cực kỳ đẹp và ngoài đời cũng rất tự nhiên.",
  name: "Khánh Linh",
  role: "Photoshoot",
 },
 {
  quote: "Mình chỉ đưa một vài hình reference nhưng makeup artist đã biến nó thành phiên bản phù hợp với khuôn mặt của mình.",
  name: "Ngọc Mai",
  role: "Event Makeup",
 },
];

export default function MakeupArtistPage() {
 return (
  <main className="min-h-screen overflow-hidden bg-[#f8f5f2] text-[#292522]">
   {/* Header */}
   <header className="fixed left-0 top-0 z-50 w-full">
    <div className="mx-auto mt-4 flex max-w-[1400px] items-center justify-between rounded-full border border-black/5 bg-white/75 px-5 py-3 shadow-sm backdrop-blur-xl md:px-7">
     <Link href="/" className="group flex items-center gap-3">
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#292522] text-xs font-bold tracking-widest text-white">MA</span>

      <div>
       <p className="text-sm font-semibold tracking-[0.12em]">MAKEUP ARTIST</p>
       <p className="text-[9px] uppercase tracking-[0.22em] text-black/40">Beauty · Makeup · Art</p>
      </div>
     </Link>

     <nav className="hidden items-center gap-7 text-[11px] font-medium uppercase tracking-[0.16em] md:flex">
      <a href="#about" className="transition hover:text-[#a87868]">
       About
      </a>

      <a href="#services" className="transition hover:text-[#a87868]">
       Services
      </a>

      <a href="#work" className="transition hover:text-[#a87868]">
       Portfolio
      </a>

      <a href="#contact" className="transition hover:text-[#a87868]">
       Booking
      </a>
     </nav>

     <a
      href="#contact"
      className="rounded-full bg-[#292522] px-5 py-2.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-white transition hover:bg-[#a87868]">
      Book me
     </a>
    </div>
   </header>

   {/* Hero */}
   <section className="relative min-h-screen pt-28">
    <div className="mx-auto grid min-h-[calc(100vh-7rem)] max-w-[1400px] items-center gap-10 px-5 pb-12 md:grid-cols-2 md:px-8 lg:px-12">
     {/* Text */}
     <motion.div initial={{ opacity: 0, y: 35 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="relative z-10 py-10 md:py-20">
      <p className="mb-6 text-[10px] font-semibold uppercase tracking-[0.35em] text-[#a87868]">Makeup Artist · Hanoi</p>

      <h1 className="max-w-[700px] text-[clamp(4rem,8vw,8.5rem)] font-light leading-[0.82] tracking-[-0.07em]">
       Your
       <br />
       <span className="font-serif italic">beauty,</span>
       <br />
       your story.
      </h1>

      <p className="mt-8 max-w-md text-sm leading-7 text-black/55 md:text-base">
       Makeup không phải để biến bạn thành một người khác. Đó là cách làm nổi bật phiên bản đẹp nhất và tự tin nhất của chính bạn.
      </p>

      <div className="mt-9 flex flex-wrap items-center gap-4">
       <a
        href="#contact"
        className="group flex items-center gap-4 rounded-full bg-[#292522] px-6 py-4 text-[11px] font-semibold uppercase tracking-[0.15em] text-white transition hover:bg-[#a87868]">
        Book an appointment
        <FaArrowRight className="transition-transform group-hover:translate-x-1" />
       </a>

       <a href="#work" className="flex items-center gap-2 px-3 py-4 text-[11px] font-semibold uppercase tracking-[0.15em]">
        View portfolio
       </a>
      </div>

      {/* Social */}
      <div className="mt-12 flex items-center gap-3">
       <span className="mr-2 text-[9px] uppercase tracking-[0.25em] text-black/35">Follow</span>

       {socialLinks.map((social) => {
        const Icon = social.icon;

        return (
         <a
          key={social.name}
          href={social.href}
          target="_blank"
          rel="noreferrer"
          aria-label={social.name}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-black/10 bg-white text-sm transition hover:-translate-y-1 hover:border-[#a87868] hover:bg-[#a87868] hover:text-white">
          <Icon />
         </a>
        );
       })}
      </div>
     </motion.div>

     {/* Hero image */}
     <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 1 }}
      className="relative mx-auto w-full max-w-[620px]">
      <div className="absolute -right-3 -top-3 h-28 w-28 rounded-full border border-[#a87868]/30 md:-right-8 md:-top-8 md:h-40 md:w-40" />

      <div className="relative aspect-[4/5] overflow-hidden rounded-[45%_45%_10%_10%] bg-[#ded4ce]">
       <img src="/images/makeup-artist/hero.jpg" alt="Makeup Artist" className="h-full w-full object-cover" />
      </div>

      <div className="absolute -bottom-5 -left-3 rounded-full border border-black/5 bg-white px-5 py-4 shadow-xl md:-left-8">
       <p className="text-[9px] uppercase tracking-[0.2em] text-black/40">Creating beauty</p>

       <p className="mt-1 font-serif text-lg italic">one face at a time.</p>
      </div>
     </motion.div>
    </div>

    <div className="absolute bottom-7 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-3 md:flex">
     <span className="text-[8px] uppercase tracking-[0.3em] text-black/35">Scroll</span>

     <FaArrowDown className="animate-bounce text-xs text-[#a87868]" />
    </div>
   </section>

   {/* About */}
   <section id="about" className="bg-[#292522] py-24 text-white md:py-32">
    <div className="mx-auto grid max-w-[1400px] gap-14 px-5 md:grid-cols-[0.8fr_1.2fr] md:px-8 lg:px-12">
     <div>
      <p className="text-[10px] uppercase tracking-[0.3em] text-[#d7aaa0]">01 · About</p>

      <h2 className="mt-5 max-w-md text-5xl font-light leading-[0.95] tracking-[-0.05em] md:text-7xl">
       Beauty
       <br />
       <span className="font-serif italic">with intention.</span>
      </h2>
     </div>

     <div className="max-w-2xl">
      <p className="text-xl font-light leading-9 text-white/85 md:text-2xl">
       Mỗi khuôn mặt đều có một câu chuyện riêng. Công việc của tôi là lắng nghe câu chuyện đó và tạo nên một layout makeup phù hợp với bạn nhất.
      </p>

      <p className="mt-7 text-sm leading-7 text-white/50">
       Từ makeup trong trẻo hàng ngày đến những layout nổi bật cho sự kiện, beauty shoot và cô dâu — mọi look đều được xây dựng dựa trên đường nét khuôn mặt,
       làn da, outfit và cảm giác mà bạn muốn mang đến.
      </p>

      <div className="mt-10 grid grid-cols-3 border-t border-white/10 pt-7">
       <div>
        <p className="text-3xl font-light">5+</p>
        <p className="mt-2 text-[9px] uppercase tracking-[0.18em] text-white/40">Years</p>
       </div>

       <div>
        <p className="text-3xl font-light">300+</p>
        <p className="mt-2 text-[9px] uppercase tracking-[0.18em] text-white/40">Clients</p>
       </div>

       <div>
        <p className="text-3xl font-light">∞</p>
        <p className="mt-2 text-[9px] uppercase tracking-[0.18em] text-white/40">Looks</p>
       </div>
      </div>
     </div>
    </div>
   </section>

   {/* Services */}
   <section id="services" className="py-24 md:py-32">
    <div className="mx-auto max-w-[1400px] px-5 md:px-8 lg:px-12">
     <div className="mb-16 flex flex-col justify-between gap-6 md:flex-row md:items-end">
      <div>
       <p className="text-[10px] uppercase tracking-[0.3em] text-[#a87868]">02 · Services</p>

       <h2 className="mt-4 text-5xl font-light tracking-[-0.05em] md:text-7xl">
        What I<span className="font-serif italic"> do.</span>
       </h2>
      </div>

      <p className="max-w-sm text-sm leading-7 text-black/45">Một trải nghiệm makeup được cá nhân hóa, từ tư vấn đến hoàn thiện look cuối cùng.</p>
     </div>

     <div className="border-t border-black/10">
      {services.map((service) => (
       <motion.div
        key={service.number}
        whileHover={{ x: 8 }}
        className="group grid gap-5 border-b border-black/10 py-8 md:grid-cols-[100px_0.8fr_1fr_40px] md:items-center">
        <span className="text-xs text-black/30">{service.number}</span>

        <h3 className="text-2xl font-light tracking-tight md:text-3xl">{service.title}</h3>

        <p className="max-w-lg text-sm leading-7 text-black/45">{service.description}</p>

        <FaArrowRight className="hidden text-[#a87868] transition-transform group-hover:translate-x-2 md:block" />
       </motion.div>
      ))}
     </div>
    </div>
   </section>

   {/* Portfolio */}
   <section id="work" className="bg-[#eee7e2] py-24 md:py-32">
    <div className="mx-auto max-w-[1400px] px-5 md:px-8 lg:px-12">
     <div className="mb-14 flex flex-col justify-between gap-6 md:flex-row md:items-end">
      <div>
       <p className="text-[10px] uppercase tracking-[0.3em] text-[#a87868]">03 · Selected work</p>

       <h2 className="mt-4 text-5xl font-light tracking-[-0.05em] md:text-7xl">
        Recent
        <span className="font-serif italic"> looks.</span>
       </h2>
      </div>

      <p className="max-w-sm text-sm leading-7 text-black/45">Một vài phong cách makeup tiêu biểu từ những project gần đây.</p>
     </div>

     <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {gallery.map((item, index) => (
       <motion.a
        href={item.image}
        target="_blank"
        rel="noreferrer"
        key={item.image}
        initial={{ opacity: 0, y: 25 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: index * 0.05 }}
        className="group relative overflow-hidden">
        <div className={`overflow-hidden bg-[#ddd2cb] ${index % 3 === 1 ? "aspect-[4/5]" : "aspect-[4/5]"}`}>
         <img src={item.image} alt={item.title} className="h-full w-full object-cover transition duration-700 group-hover:scale-105" />
        </div>

        <div className="flex items-center justify-between py-4">
         <div>
          <p className="text-sm font-medium">{item.title}</p>

          <p className="mt-1 text-[9px] uppercase tracking-[0.2em] text-black/40">{item.category}</p>
         </div>

         <FaArrowRight className="text-xs text-black/30 transition-transform group-hover:translate-x-1" />
        </div>
       </motion.a>
      ))}
     </div>
    </div>
   </section>

   {/* Video / Social */}
   <section className="bg-[#f8f5f2] py-24 md:py-32">
    <div className="mx-auto max-w-[1400px] px-5 md:px-8 lg:px-12">
     <div className="grid gap-12 md:grid-cols-[1fr_0.8fr] md:items-center">
      <div className="relative aspect-[16/10] overflow-hidden bg-[#d9d0cb]">
       <img src="/images/makeup-artist/reels.jpg" alt="Makeup Artist Reels" className="h-full w-full object-cover" />

       <a
        href="#"
        className="absolute left-1/2 top-1/2 flex h-20 w-20 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white text-sm shadow-xl transition hover:scale-110">
        <FaPlay className="ml-1" />
       </a>

       <div className="absolute bottom-5 left-5 rounded-full bg-white/90 px-4 py-2 text-[9px] font-semibold uppercase tracking-[0.2em] backdrop-blur">
        Watch reels
       </div>
      </div>

      <div>
       <p className="text-[10px] uppercase tracking-[0.3em] text-[#a87868]">Follow the journey</p>

       <h2 className="mt-5 text-5xl font-light leading-[0.95] tracking-[-0.05em] md:text-6xl">
        Beauty,
        <br />
        <span className="font-serif italic">behind the scenes.</span>
       </h2>

       <p className="mt-7 max-w-md text-sm leading-7 text-black/50">
        Theo dõi các video makeup, tips làm đẹp, before & after và những khoảnh khắc hậu trường trên các nền tảng social.
       </p>

       <div className="mt-8 flex flex-wrap gap-2">
        {socialLinks.map((social) => {
         const Icon = social.icon;

         return (
          <a
           key={social.name}
           href={social.href}
           target="_blank"
           rel="noreferrer"
           className="flex items-center gap-3 rounded-full border border-black/10 bg-white px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.12em] transition hover:border-[#a87868] hover:text-[#a87868]">
           <Icon />
           {social.name}
          </a>
         );
        })}
       </div>
      </div>
     </div>
    </div>
   </section>

   {/* Testimonials */}
   <section className="bg-[#292522] py-24 text-white md:py-32">
    <div className="mx-auto max-w-[1400px] px-5 md:px-8 lg:px-12">
     <div className="mb-14">
      <p className="text-[10px] uppercase tracking-[0.3em] text-[#d7aaa0]">04 · Kind words</p>

      <h2 className="mt-4 text-5xl font-light tracking-[-0.05em] md:text-7xl">
       From my
       <span className="font-serif italic"> clients.</span>
      </h2>
     </div>

     <div className="grid gap-px overflow-hidden bg-white/10 md:grid-cols-3">
      {testimonials.map((testimonial) => (
       <div key={testimonial.name} className="bg-[#292522] p-8 md:p-10">
        <FaQuoteLeft className="text-[#d7aaa0]" />

        <p className="mt-7 text-base font-light leading-8 text-white/75">“{testimonial.quote}”</p>

        <div className="mt-9 border-t border-white/10 pt-5">
         <p className="text-sm">{testimonial.name}</p>

         <p className="mt-1 text-[9px] uppercase tracking-[0.2em] text-white/35">{testimonial.role}</p>
        </div>
       </div>
      ))}
     </div>
    </div>
   </section>

   {/* Booking */}
   <section id="contact" className="relative overflow-hidden py-24 md:py-36">
    <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-[#e7cfc7]/50 blur-3xl" />

    <div className="relative mx-auto max-w-[1000px] px-5 text-center md:px-8">
     <p className="text-[10px] uppercase tracking-[0.35em] text-[#a87868]">05 · Booking</p>

     <h2 className="mt-6 text-6xl font-light leading-[0.9] tracking-[-0.06em] md:text-8xl">
      Let's create
      <br />
      <span className="font-serif italic">your look.</span>
     </h2>

     <p className="mx-auto mt-8 max-w-xl text-sm leading-7 text-black/50">
      Bạn đang có một sự kiện, photoshoot hoặc đơn giản là muốn một ngày mình thật xinh? Hãy gửi thông tin để bắt đầu.
     </p>

     <a
      href="mailto:hello@example.com"
      className="group mx-auto mt-9 inline-flex items-center gap-5 rounded-full bg-[#292522] px-7 py-4 text-[10px] font-semibold uppercase tracking-[0.18em] text-white transition hover:bg-[#a87868]">
      Book an appointment
      <FaArrowRight className="transition-transform group-hover:translate-x-1" />
     </a>

     <div className="mt-12 flex justify-center gap-3">
      {socialLinks.map((social) => {
       const Icon = social.icon;

       return (
        <a
         key={social.name}
         href={social.href}
         target="_blank"
         rel="noreferrer"
         aria-label={social.name}
         className="flex h-11 w-11 items-center justify-center rounded-full border border-black/10 transition hover:-translate-y-1 hover:bg-[#292522] hover:text-white">
         <Icon />
        </a>
       );
      })}
     </div>
    </div>
   </section>

   {/* Footer */}
   <footer className="border-t border-black/10 px-5 py-8 md:px-8">
    <div className="mx-auto flex max-w-[1400px] flex-col justify-between gap-5 md:flex-row md:items-center">
     <div>
      <p className="text-sm font-semibold tracking-[0.12em]">MAKEUP ARTIST</p>

      <p className="mt-1 text-[9px] uppercase tracking-[0.2em] text-black/35">Beauty · Makeup · Art</p>
     </div>

     <p className="text-[9px] uppercase tracking-[0.2em] text-black/30">© {new Date().getFullYear()} All rights reserved.</p>
    </div>
   </footer>
  </main>
 );
}
