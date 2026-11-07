import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { FiMenu, FiX, FiArrowRight, FiCheck, FiHeart, FiShield, FiRefreshCw, FiChevronDown, FiStar, FiShoppingBag, FiUser } from "react-icons/fi";

const productImage = "";

const benefits = [
 {
  icon: <FiHeart size={25} />,
  title: "Hỗ trợ nâng đỡ khuôn mặt",
  description: "Thiết kế ôm sát vùng cằm và hai bên má, hỗ trợ nâng đỡ vùng cơ mặt khi sử dụng.",
 },
 {
  icon: <FiShield size={25} />,
  title: "Thiết kế thoáng khí",
  description: "Chất liệu có độ co giãn, tạo cảm giác thoải mái và hạn chế bí bách khi đeo.",
 },
 {
  icon: <FiRefreshCw size={25} />,
  title: "Có thể tái sử dụng",
  description: "Thiết kế tiện lợi, dễ tháo ra và sử dụng nhiều lần theo hướng dẫn.",
 },
];

const features = [
 "Thiết kế ôm sát vùng cằm và đường viền hàm",
 "Dây đeo hỗ trợ cố định sản phẩm",
 "Chất liệu co giãn, thoáng khí",
 "Phù hợp với nhu cầu chăm sóc cá nhân tại nhà",
];

const faqs = [
 {
  question: "Sản phẩm này có công dụng gì?",
  answer:
   "Đai được thiết kế để ôm và hỗ trợ nâng đỡ vùng cằm, hai bên má và đường viền hàm khi đeo. Sản phẩm là dụng cụ chăm sóc cá nhân, không phải thiết bị điều trị hay phương pháp thay đổi cấu trúc xương mặt.",
 },
 {
  question: "Có thể sử dụng sản phẩm mỗi ngày không?",
  answer:
   "Bạn nên bắt đầu với thời gian đeo ngắn để làm quen, sau đó điều chỉnh theo cảm giác thoải mái và hướng dẫn sử dụng của nhà sản xuất. Không đeo quá chặt hoặc sử dụng khi có dấu hiệu khó chịu.",
 },
 {
  question: "Sản phẩm có phù hợp với mọi khuôn mặt không?",
  answer: "Sản phẩm có thiết kế co giãn để ôm vùng mặt. Tuy nhiên, cảm giác vừa vặn sẽ tùy thuộc vào kích thước và hình dáng khuôn mặt của từng người.",
 },
 {
  question: "Có thể tái sử dụng sản phẩm không?",
  answer: "Có. Sản phẩm được thiết kế để sử dụng nhiều lần. Bạn nên vệ sinh và bảo quản theo hướng dẫn của nhà sản xuất.",
 },
];

export default function Home() {
 const [menuOpen, setMenuOpen] = useState(false);
 const [openFaq, setOpenFaq] = useState<number | null>(0);

 return (
  <>
   <Head>
    <title>BeautyStore | Chăm sóc và làm đẹp mỗi ngày</title>
    <meta name="description" content="Khám phá đai định hình mặt thoáng khí hỗ trợ nâng đỡ khuôn mặt. Thiết kế tiện lợi, co giãn và có thể tái sử dụng." />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
   </Head>

   <div className="min-h-screen overflow-hidden bg-[#fffdfc] text-[#513b40]">
    {/* HEADER */}
    <header className="sticky top-0 z-50 border-b border-[#f4e8e9] bg-white/95 backdrop-blur-md">
     <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
      <Link href="/" className="shrink-0">
       <span className="font-serif text-2xl font-bold tracking-wide text-[#d65376] sm:text-3xl">BeautyStore</span>
      </Link>

      <nav className="hidden items-center gap-9 md:flex">
       <Link href="#trang-chu" className="text-sm font-medium text-[#513b40] transition hover:text-[#d65376]">
        Trang chủ
       </Link>
       <Link href="#san-pham" className="text-sm font-medium text-[#513b40] transition hover:text-[#d65376]">
        Sản phẩm
       </Link>
       <Link href="#loi-ich" className="text-sm font-medium text-[#513b40] transition hover:text-[#d65376]">
        Lợi ích
       </Link>
       <Link href="#huong-dan" className="text-sm font-medium text-[#513b40] transition hover:text-[#d65376]">
        Hướng dẫn sử dụng
       </Link>
       <Link href="#lien-he" className="text-sm font-medium text-[#513b40] transition hover:text-[#d65376]">
        Liên hệ
       </Link>
      </nav>

      <div className="hidden items-center gap-3 md:flex">
       <Link
        href="#san-pham"
        className="flex items-center gap-2 rounded-full bg-[#d65376] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#bd4264]">
        <FiShoppingBag size={16} />
        Khám phá ngay
       </Link>
      </div>

      <button
       onClick={() => setMenuOpen(!menuOpen)}
       className="flex h-10 w-10 items-center justify-center rounded-full bg-[#fcf2f3] text-[#d65376] md:hidden"
       aria-label="Mở menu">
       {menuOpen ? <FiX size={22} /> : <FiMenu size={22} />}
      </button>
     </div>

     {menuOpen && (
      <div className="border-t border-[#f4e8e9] bg-white px-5 py-5 md:hidden">
       <nav className="flex flex-col gap-5">
        {[
         ["Trang chủ", "#trang-chu"],
         ["Sản phẩm", "#san-pham"],
         ["Lợi ích", "#loi-ich"],
         ["Hướng dẫn sử dụng", "#huong-dan"],
         ["Liên hệ", "#lien-he"],
        ].map(([label, href]) => (
         <Link key={href} href={href} onClick={() => setMenuOpen(false)} className="text-sm font-medium text-[#513b40]">
          {label}
         </Link>
        ))}
       </nav>
      </div>
     )}
    </header>

    <main>
     {/* HERO */}
     <section id="trang-chu" className="relative overflow-hidden bg-[#fcf4f3]">
      <div className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-[#f3dce1] opacity-60 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -left-32 h-96 w-96 rounded-full bg-[#f6e4e2] opacity-70 blur-3xl" />

      <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-2 lg:gap-16 lg:px-8 lg:py-20">
       <div className="order-2 lg:order-1">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#efd5dc] bg-white/80 px-4 py-2">
         <span className="h-2 w-2 rounded-full bg-[#d65376]" />
         <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#d65376] sm:text-xs">Chăm sóc vẻ đẹp mỗi ngày</span>
        </div>

        <h1 className="max-w-xl font-serif text-[38px] font-semibold leading-[1.2] text-[#513b40] sm:text-5xl lg:text-[58px]">
         Tự tin với đường nét khuôn mặt <span className="italic text-[#d65376]">thanh thoát</span>
        </h1>

        <p className="mt-6 max-w-lg text-sm leading-7 text-[#90777e] sm:text-base sm:leading-8">
         Khám phá đai định hình mặt thoáng khí với thiết kế ôm sát vùng cằm và hai bên má, hỗ trợ nâng đỡ khuôn mặt trong quá trình chăm sóc cá nhân tại nhà.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
         <Link
          href="#san-pham"
          className="inline-flex items-center justify-center gap-3 rounded-full bg-[#d65376] px-8 py-4 text-sm font-semibold text-white shadow-lg shadow-[#d65376]/20 transition hover:-translate-y-1 hover:bg-[#bd4264]">
          Khám phá sản phẩm
          <FiArrowRight size={18} />
         </Link>

         <Link
          href="#loi-ich"
          className="inline-flex items-center justify-center rounded-full border border-[#e8cbd2] bg-white px-8 py-4 text-sm font-semibold text-[#d65376] transition hover:bg-[#fff8f9]">
          Tìm hiểu thêm
         </Link>
        </div>

        <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-4 border-t border-[#ead9dc] pt-7">
         <div>
          <p className="font-serif text-2xl font-semibold text-[#d65376]">Thoáng khí</p>
          <p className="mt-1 text-xs text-[#9b858b]">Cảm giác dễ chịu</p>
         </div>

         <div className="h-10 w-px bg-[#e8d5da]" />

         <div>
          <p className="font-serif text-2xl font-semibold text-[#d65376]">Co giãn</p>
          <p className="mt-1 text-xs text-[#9b858b]">Ôm sát khuôn mặt</p>
         </div>

         <div className="h-10 w-px bg-[#e8d5da]" />

         <div>
          <p className="font-serif text-2xl font-semibold text-[#d65376]">Tái sử dụng</p>
          <p className="mt-1 text-xs text-[#9b858b]">Tiện lợi mỗi ngày</p>
         </div>
        </div>
       </div>

       <div className="relative order-1 mx-auto w-full max-w-[540px] lg:order-2">
        <div className="absolute inset-5 rounded-[48%] bg-[#f0dadd] blur-2xl" />

        <div className="relative overflow-hidden rounded-[32px] border-[8px] border-white bg-white shadow-2xl shadow-[#8b5966]/10 sm:rounded-[40px]">
         <Image
          src={productImage}
          alt="Đai định hình mặt thoáng khí hỗ trợ nâng đỡ khuôn mặt"
          width={1200}
          height={1200}
          priority
          className="h-auto w-full object-cover"
         />
        </div>

        <div className="absolute -bottom-5 left-2 rounded-2xl border border-[#f3e3e6] bg-white px-5 py-4 shadow-xl sm:-left-8 sm:px-6">
         <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#fbedf0] text-[#d65376]">
           <FiHeart size={21} />
          </div>
          <div>
           <p className="text-sm font-semibold text-[#513b40]">Yêu thương bản thân</p>
           <p className="mt-1 text-xs text-[#a18c91]">Chăm sóc từ những điều nhỏ nhất</p>
          </div>
         </div>
        </div>

        <div className="absolute -right-2 top-8 rounded-full bg-white px-4 py-3 shadow-lg sm:-right-5">
         <span className="text-xs font-semibold text-[#d65376]">✦ Chăm sóc tại nhà</span>
        </div>
       </div>
      </div>
     </section>

     {/* BENEFITS STRIP */}
     <section className="border-b border-[#f2e6e7] bg-white">
      <div className="mx-auto grid max-w-7xl grid-cols-1 divide-y divide-[#f2e6e7] px-4 py-5 sm:grid-cols-3 sm:divide-x sm:divide-y-0 sm:px-6 lg:px-8">
       {[
        {
         icon: <FiShield size={21} />,
         title: "Thiết kế ôm sát",
         desc: "Hỗ trợ nâng đỡ vùng hàm",
        },
        {
         icon: <FiHeart size={21} />,
         title: "Chất liệu thoáng khí",
         desc: "Hạn chế cảm giác bí bách",
        },
        {
         icon: <FiRefreshCw size={21} />,
         title: "Sử dụng tiện lợi",
         desc: "Có thể tái sử dụng",
        },
       ].map((item, index) => (
        <div key={index} className="flex items-center justify-center gap-4 py-5 sm:py-2">
         <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#fcf0f2] text-[#d65376]">{item.icon}</div>
         <div>
          <p className="text-sm font-semibold text-[#513b40]">{item.title}</p>
          <p className="mt-1 text-xs text-[#a18c91]">{item.desc}</p>
         </div>
        </div>
       ))}
      </div>
     </section>

     {/* INTRODUCTION */}
     <section id="loi-ich" className="bg-white py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
       <div className="mx-auto mb-12 max-w-2xl text-center">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.25em] text-[#d65376]">Chăm sóc bản thân</p>
        <h2 className="font-serif text-3xl font-semibold leading-tight text-[#513b40] sm:text-4xl">Một lựa chọn nhỏ cho thói quen làm đẹp mỗi ngày</h2>
        <p className="mt-5 text-sm leading-7 text-[#90777e]">
         Thiết kế hướng đến sự tiện lợi, giúp bạn dễ dàng bổ sung một bước chăm sóc cá nhân vào thời gian nghỉ ngơi tại nhà.
        </p>
       </div>

       <div className="grid gap-6 md:grid-cols-3">
        {benefits.map((item, index) => (
         <div
          key={index}
          className="group rounded-3xl border border-[#f1e3e5] bg-[#fffafa] p-7 transition duration-300 hover:-translate-y-2 hover:border-[#e8c4cd] hover:shadow-xl hover:shadow-[#d65376]/5">
          <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f9e9ed] text-[#d65376] transition group-hover:bg-[#d65376] group-hover:text-white">
           {item.icon}
          </div>

          <h3 className="font-serif text-xl font-semibold text-[#513b40]">{item.title}</h3>

          <p className="mt-4 text-sm leading-7 text-[#90777e]">{item.description}</p>
         </div>
        ))}
       </div>
      </div>
     </section>

     {/* PRODUCT SHOWCASE */}
     <section id="san-pham" className="overflow-hidden bg-[#fcf4f3] py-16 sm:py-24">
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:gap-20 lg:px-8">
       <div className="relative mx-auto w-full max-w-[540px]">
        <div className="absolute -inset-5 rounded-[40px] bg-[#f1dfe2]" />
        <div className="relative overflow-hidden rounded-[30px] bg-white p-2 shadow-xl">
         <Image
          src={productImage}
          alt="Hình ảnh đai định hình và nâng đỡ khuôn mặt"
          width={1200}
          height={1200}
          className="h-auto w-full rounded-[24px] object-cover"
         />
        </div>
        <div className="absolute -bottom-5 -right-2 rounded-2xl bg-white px-5 py-4 shadow-xl sm:-right-5">
         <p className="text-xs text-[#a18c91]">Thiết kế</p>
         <p className="mt-1 font-serif text-lg font-semibold text-[#d65376]">Thoáng khí & co giãn</p>
        </div>
       </div>

       <div className="pt-4">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#d65376]">Sản phẩm nổi bật</p>

        <h2 className="mt-4 font-serif text-3xl font-semibold leading-tight text-[#513b40] sm:text-4xl">
         Đai định hình mặt thoáng khí hỗ trợ nâng đỡ khuôn mặt
        </h2>

        <p className="mt-6 text-sm leading-8 text-[#90777e]">
         Sản phẩm có thiết kế bao quanh vùng cằm và hai bên má, kết hợp dây đeo giúp cố định trên đầu. Phù hợp với những ai muốn tìm kiếm một dụng cụ hỗ trợ
         chăm sóc khuôn mặt tại nhà.
        </p>

        <div className="mt-8 space-y-4">
         {features.map((feature, index) => (
          <div key={index} className="flex items-start gap-3">
           <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#d65376] text-white">
            <FiCheck size={12} />
           </span>
           <p className="text-sm leading-6 text-[#705a60]">{feature}</p>
          </div>
         ))}
        </div>

        <Link
         href="#dat-hang"
         className="mt-9 inline-flex items-center gap-3 rounded-full bg-[#d65376] px-8 py-4 text-sm font-semibold text-white shadow-lg shadow-[#d65376]/20 transition hover:-translate-y-1 hover:bg-[#bd4264]">
         Tìm hiểu và đặt hàng
         <FiArrowRight size={18} />
        </Link>
       </div>
      </div>
     </section>

     {/* HOW TO USE */}
     <section id="huong-dan" className="bg-white py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
       <div className="mx-auto mb-14 max-w-2xl text-center">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.25em] text-[#d65376]">Hướng dẫn sử dụng</p>
        <h2 className="font-serif text-3xl font-semibold text-[#513b40] sm:text-4xl">Sử dụng đơn giản tại nhà</h2>
        <p className="mt-4 text-sm leading-7 text-[#90777e]">
         Thực hiện theo hướng dẫn của nhà sản xuất để sản phẩm được cố định đúng vị trí và tạo cảm giác thoải mái.
        </p>
       </div>

       <div className="grid gap-5 md:grid-cols-3">
        {[
         {
          number: "01",
          title: "Đặt đai lên khuôn mặt",
          desc: "Đưa phần đai vào đúng vị trí vùng cằm và hai bên má.",
         },
         {
          number: "02",
          title: "Cố định dây đeo",
          desc: "Điều chỉnh dây đeo để sản phẩm ôm vừa vặn, không siết quá chặt.",
         },
         {
          number: "03",
          title: "Điều chỉnh thoải mái",
          desc: "Kiểm tra độ vừa vặn trước khi sử dụng và tháo ra nếu thấy khó chịu.",
         },
        ].map((item) => (
         <div key={item.number} className="rounded-3xl border border-[#f0e3e5] bg-[#fffafa] p-7 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#f8e8ec] font-serif text-xl font-semibold text-[#d65376]">
           {item.number}
          </div>
          <h3 className="mt-6 font-serif text-xl font-semibold text-[#513b40]">{item.title}</h3>
          <p className="mt-3 text-sm leading-7 text-[#90777e]">{item.desc}</p>
         </div>
        ))}
       </div>

       <p className="mx-auto mt-8 max-w-2xl text-center text-xs leading-6 text-[#a18c91]">
        Lưu ý: Không đeo quá chặt. Ngừng sử dụng nếu xuất hiện đau, tê, kích ứng hoặc khó chịu. Sản phẩm không thay thế tư vấn y tế và không đảm bảo thay đổi
        hình dáng khuôn mặt vĩnh viễn.
       </p>
      </div>
     </section>

     {/* PROMOTION / CTA */}
     <section id="dat-hang" className="relative overflow-hidden bg-[#d65376] py-16 sm:py-20">
      <div className="pointer-events-none absolute -left-20 -top-24 h-72 w-72 rounded-full border border-white/10" />
      <div className="pointer-events-none absolute -bottom-40 -right-20 h-96 w-96 rounded-full border border-white/10" />

      <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6">
       <p className="text-xs font-semibold uppercase tracking-[0.25em] text-white/75">Chăm sóc bản thân theo cách của bạn</p>

       <h2 className="mt-5 font-serif text-3xl font-semibold leading-tight text-white sm:text-5xl">Dành một chút thời gian để yêu thương chính mình</h2>

       <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-white/85 sm:text-base">
        Khám phá sản phẩm đai định hình mặt thoáng khí và tìm hiểu cách bổ sung sản phẩm vào thói quen chăm sóc cá nhân mỗi ngày.
       </p>

       <Link
        href="#san-pham"
        className="mt-8 inline-flex items-center gap-3 rounded-full bg-white px-9 py-4 text-sm font-semibold text-[#d65376] shadow-xl transition hover:-translate-y-1 hover:bg-[#fff5f7]">
        Khám phá sản phẩm ngay
        <FiArrowRight size={18} />
       </Link>
      </div>
     </section>

     {/* FAQ */}
     <section className="bg-[#fffdfc] py-16 sm:py-24">
      <div className="mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:gap-20 lg:px-8">
       <div>
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#d65376]">Bạn cần biết</p>
        <h2 className="mt-4 font-serif text-3xl font-semibold leading-tight text-[#513b40] sm:text-4xl">Những câu hỏi thường gặp</h2>
        <p className="mt-5 text-sm leading-7 text-[#90777e]">Một số thông tin giúp bạn hiểu rõ hơn về sản phẩm trước khi lựa chọn.</p>
       </div>

       <div className="space-y-3">
        {faqs.map((faq, index) => (
         <div key={index} className="overflow-hidden rounded-2xl border border-[#f0e2e5] bg-white">
          <button
           type="button"
           onClick={() => setOpenFaq(openFaq === index ? null : index)}
           className="flex w-full items-center justify-between gap-4 px-5 py-5 text-left">
           <span className="text-sm font-semibold text-[#513b40]">{faq.question}</span>
           <FiChevronDown size={19} className={`shrink-0 text-[#d65376] transition-transform ${openFaq === index ? "rotate-180" : ""}`} />
          </button>

          {openFaq === index && (
           <div className="border-t border-[#f5e9eb] px-5 py-5">
            <p className="text-sm leading-7 text-[#90777e]">{faq.answer}</p>
           </div>
          )}
         </div>
        ))}
       </div>
      </div>
     </section>
    </main>

    {/* FOOTER */}
    <footer id="lien-he" className="border-t border-[#f0e2e5] bg-[#fcf7f6]">
     <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
       <div>
        <Link href="/">
         <span className="font-serif text-3xl font-bold text-[#d65376]">BeautyStore</span>
        </Link>
        <p className="mt-5 max-w-sm text-sm leading-7 text-[#90777e]">
         Đồng hành cùng phụ nữ trên hành trình chăm sóc bản thân, nuôi dưỡng vẻ đẹp và sự tự tin mỗi ngày.
        </p>
       </div>

       <div>
        <h3 className="font-serif text-lg font-semibold text-[#513b40]">Hỗ trợ khách hàng</h3>
        <div className="mt-5 flex flex-col gap-4 text-sm text-[#90777e]">
         <Link href="#san-pham" className="hover:text-[#d65376]">
          Thông tin sản phẩm
         </Link>
         <Link href="#huong-dan" className="hover:text-[#d65376]">
          Hướng dẫn sử dụng
         </Link>
         <Link href="#dat-hang" className="hover:text-[#d65376]">
          Hướng dẫn đặt hàng
         </Link>
        </div>
       </div>

       <div>
        <h3 className="font-serif text-lg font-semibold text-[#513b40]">Liên hệ với chúng tôi</h3>
        <p className="mt-5 text-sm leading-7 text-[#90777e]">Chúng tôi luôn sẵn sàng hỗ trợ và giải đáp thắc mắc của bạn.</p>
        <p className="mt-3 text-sm text-[#d65376]">Hotline: Cập nhật số điện thoại</p>
       </div>
      </div>

      <div className="mt-12 border-t border-[#efdee1] pt-7 text-center">
       <p className="text-xs text-[#a18c91]">© {new Date().getFullYear()} BeautyStore. Đã đăng ký bản quyền.</p>
       <p className="mt-2 text-xs text-[#a18c91]">Đồng hành cùng vẻ đẹp và sự tự tin của phụ nữ Việt Nam.</p>
      </div>
     </div>
    </footer>
   </div>
  </>
 );
}
