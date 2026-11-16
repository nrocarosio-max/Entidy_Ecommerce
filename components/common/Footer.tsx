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
  <footer className="mt-4 bg-white px-5 py-8 shadow-sm">
   <div className="grid grid-cols-1 gap-8 text-sm sm:grid-cols-2 lg:grid-cols-4">
    <div>
     <h3 className="mb-4 font-medium uppercase">Chăm sóc khách hàng</h3>

     <ul className="space-y-3 text-xs text-gray-500">
      <li>Trung tâm hỗ trợ</li>
      <li>Hướng dẫn mua hàng</li>
      <li>Chính sách đổi trả</li>
      <li>Chính sách bảo mật</li>
     </ul>
    </div>

    <div>
     <h3 className="mb-4 font-medium uppercase">Về cửa hàng</h3>

     <ul className="space-y-3 text-xs text-gray-500">
      <li>Giới thiệu</li>
      <li>Sản phẩm</li>
      <li>Liên hệ</li>
     </ul>
    </div>

    <div>
     <h3 className="mb-4 font-medium uppercase">Thanh toán</h3>

     <p className="text-xs leading-6 text-gray-500">Hỗ trợ thanh toán khi nhận hàng (COD).</p>
    </div>

    <div>
     <h3 className="mb-4 font-medium uppercase">Hỗ trợ khách hàng</h3>

     <p className="text-xs leading-6 text-gray-500">Chúng tôi luôn sẵn sàng hỗ trợ và giải đáp các thắc mắc của bạn.</p>
    </div>
   </div>

   <div className="mt-8 border-t border-gray-100 pt-5 text-center text-xs text-gray-400">© {new Date().getFullYear()} - Bản quyền thuộc về cửa hàng.</div>
  </footer>
 );
};

export default Footer;
