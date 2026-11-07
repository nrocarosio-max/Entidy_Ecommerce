import Link from "next/link";
import { useState } from "react";
import { FiArrowRight, FiFacebook, FiInstagram, FiMail, FiMapPin, FiPhone, FiTruck, FiShield, FiHeart, FiClock } from "react-icons/fi";

const productLinks = [
 { label: "Chăm sóc da mặt", href: "/category/cham-soc-da-mat" },
 { label: "Chăm sóc cơ thể", href: "/category/cham-soc-co-the" },
 { label: "Dụng cụ làm đẹp", href: "/category/dung-cu-lam-dep" },
 { label: "Chăm sóc tóc", href: "/category/cham-soc-toc" },
 { label: "Sản phẩm làm đẹp", href: "/products" },
];

const supportLinks = [
 { label: "Hướng dẫn đặt hàng", href: "/huong-dan-dat-hang" },
 { label: "Phương thức thanh toán", href: "/thanh-toan" },
 { label: "Chính sách giao hàng", href: "/chinh-sach-giao-hang" },
 { label: "Chính sách đổi trả", href: "/chinh-sach-doi-tra" },
 { label: "Câu hỏi thường gặp", href: "/faq" },
];

const Footer = () => {
 const [email, setEmail] = useState("");

 const handleSubscribe = (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault();

  if (!email.trim()) return;

  // TODO: Kết nối API đăng ký nhận tin tại đây.
  alert("Cảm ơn bạn đã đăng ký nhận thông tin từ chúng tôi!");
  setEmail("");
 };

 return (
  <footer className="mt-16 overflow-hidden bg-[#fcf7f6]">
   {/* Newsletter */}
   <div className="border-b border-[#f1dfe2] bg-[#f8e9eb]">
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
     <div className="mx-auto flex max-w-4xl flex-col items-center justify-between gap-7 md:flex-row">
      <div className="text-center md:text-left">
       <p className="mb-2 text-xs font-semibold uppercase tracking-[0.25em] text-[#d65376]">Làm đẹp mỗi ngày</p>

       <h3 className="font-serif text-2xl font-semibold text-[#513b40] sm:text-3xl">Nhận ưu đãi dành riêng cho bạn</h3>

       <p className="mt-2 text-sm leading-6 text-[#90777e]">Đăng ký nhận tin để cập nhật sản phẩm mới và những ưu đãi hấp dẫn.</p>
      </div>

      <form onSubmit={handleSubscribe} className="flex w-full max-w-md gap-2 rounded-full bg-white p-1.5 shadow-sm">
       <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Nhập địa chỉ email của bạn"
        className="border-none focus:outline-none focus:ring-0 focus:border-transparent min-w-0 flex-1 bg-transparent px-4 text-sm text-[#513b40] outline-none placeholder:text-[#b9a5aa]"
       />

       <button
        type="submit"
        className="flex shrink-0 items-center gap-2 rounded-full bg-[#d65376] px-5 py-3 text-xs font-semibold text-white transition hover:bg-[#bd4264]">
        Đăng ký
        <FiArrowRight size={15} />
       </button>
      </form>
     </div>
    </div>
   </div>

   {/* Main footer */}
   <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
    <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-12">
     {/* Brand */}
     <div>
      <Link href="/" className="inline-block">
       <span className="font-serif text-3xl font-bold tracking-wide text-[#d65376]">BeautyStore</span>
      </Link>

      <p className="mt-5 max-w-xs text-sm leading-7 text-[#8e777d]">
       Chúng tôi mang đến những sản phẩm chăm sóc và làm đẹp được chọn lọc dành cho phụ nữ hiện đại. Hãy yêu thương bản thân và tự tin tỏa sáng theo cách riêng
       của bạn.
      </p>

      <div className="mt-6 flex items-center gap-3">
       <a
        href="#"
        aria-label="Facebook"
        className="flex h-10 w-10 items-center justify-center rounded-full border border-[#ead7db] text-[#d65376] transition hover:border-[#d65376] hover:bg-[#d65376] hover:text-white">
        <FiFacebook size={17} />
       </a>

       <a
        href="#"
        aria-label="Instagram"
        className="flex h-10 w-10 items-center justify-center rounded-full border border-[#ead7db] text-[#d65376] transition hover:border-[#d65376] hover:bg-[#d65376] hover:text-white">
        <FiInstagram size={17} />
       </a>
      </div>
     </div>

     {/* Product categories */}
     <div>
      <h4 className="mb-6 font-serif text-lg font-semibold text-[#513b40]">Danh mục sản phẩm</h4>

      <ul className="space-y-4">
       {productLinks.map((item) => (
        <li key={item.label}>
         <Link href={item.href} className="text-sm text-[#8e777d] transition hover:pl-1 hover:text-[#d65376]">
          {item.label}
         </Link>
        </li>
       ))}
      </ul>
     </div>

     {/* Customer support */}
     <div>
      <h4 className="mb-6 font-serif text-lg font-semibold text-[#513b40]">Hỗ trợ khách hàng</h4>

      <ul className="space-y-4">
       {supportLinks.map((item) => (
        <li key={item.label}>
         <Link href={item.href} className="text-sm text-[#8e777d] transition hover:pl-1 hover:text-[#d65376]">
          {item.label}
         </Link>
        </li>
       ))}
      </ul>
     </div>

     {/* Contact */}
     <div>
      <h4 className="mb-6 font-serif text-lg font-semibold text-[#513b40]">Thông tin liên hệ</h4>

      <ul className="space-y-5">
       <li className="flex items-start gap-3">
        <FiMapPin className="mt-1 shrink-0 text-[#d65376]" size={17} />
        <span className="text-sm leading-6 text-[#8e777d]">Địa chỉ cửa hàng của chúng tôi</span>
       </li>

       <li className="flex items-center gap-3">
        <FiPhone className="shrink-0 text-[#d65376]" size={17} />
        <a href="tel:0900000000" className="text-sm text-[#8e777d] transition hover:text-[#d65376]">
         0900 000 000
        </a>
       </li>

       <li className="flex items-center gap-3">
        <FiMail className="shrink-0 text-[#d65376]" size={17} />
        <a href="mailto:contact@beautystore.vn" className="break-all text-sm text-[#8e777d] transition hover:text-[#d65376]">
         contact@beautystore.vn
        </a>
       </li>

       <li className="flex items-center gap-3">
        <FiClock className="shrink-0 text-[#d65376]" size={17} />
        <span className="text-sm text-[#8e777d]">08:00 - 22:00 (Thứ 2 - Chủ nhật)</span>
       </li>
      </ul>
     </div>
    </div>

    {/* Benefits */}
    <div className="mt-14 grid grid-cols-1 gap-5 border-y border-[#efdee1] py-7 sm:grid-cols-3 sm:gap-8">
     <div className="flex items-center justify-center gap-3">
      <FiTruck className="shrink-0 text-[#d65376]" size={23} />
      <div>
       <p className="text-sm font-semibold text-[#513b40]">Giao hàng toàn quốc</p>
       <p className="mt-1 text-xs text-[#a18c91]">Nhận hàng tận nơi tiện lợi</p>
      </div>
     </div>

     <div className="flex items-center justify-center gap-3">
      <FiShield className="shrink-0 text-[#d65376]" size={23} />
      <div>
       <p className="text-sm font-semibold text-[#513b40]">Mua sắm an tâm</p>
       <p className="mt-1 text-xs text-[#a18c91]">Sản phẩm được chọn lọc kỹ càng</p>
      </div>
     </div>

     <div className="flex items-center justify-center gap-3">
      <FiHeart className="shrink-0 text-[#d65376]" size={23} />
      <div>
       <p className="text-sm font-semibold text-[#513b40]">Chăm sóc tận tâm</p>
       <p className="mt-1 text-xs text-[#a18c91]">Luôn đồng hành cùng vẻ đẹp của bạn</p>
      </div>
     </div>
    </div>

    {/* Copyright */}
    <div className="flex flex-col items-center justify-between gap-4 pt-8 text-center sm:flex-row sm:text-left">
     <p className="text-xs text-[#a18c91]">© {new Date().getFullYear()} BeautyStore. Đã đăng ký bản quyền.</p>

     <p className="text-xs text-[#a18c91]">Đồng hành cùng vẻ đẹp và sự tự tin của phụ nữ Việt Nam.</p>
    </div>
   </div>
  </footer>
 );
};

export default Footer;
