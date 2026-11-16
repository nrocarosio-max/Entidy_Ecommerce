import React, { useMemo, useRef, useState } from "react";
import { useRouter } from "next/router";
import axios from "axios";

import {
 FiShoppingCart,
 FiHeart,
 FiTruck,
 FiShield,
 FiHeadphones,
 FiMinus,
 FiPlus,
 FiCheck,
 FiStar,
 FiChevronRight,
 FiPackage,
 FiSearch,
 FiMapPin,
 FiMessageCircle,
 FiShare2,
 FiClock,
 FiRotateCcw,
 FiShoppingBag,
 FiMenu,
 FiX,
 FiHome,
 FiChevronDown,
} from "react-icons/fi";

import { productData, type ProductDetail } from "~/data/products";

const ORANGE = "#EE4D2D";

const provinces = [
 ["201", "Hà Nội"],
 ["202", "Hồ Chí Minh"],
 ["224", "Hải Phòng"],
 ["220", "Cần Thơ"],
 ["203", "Đà Nẵng"],
 ["217", "An Giang"],
 ["206", "Bà Rịa - Vũng Tàu"],
 ["248", "Bắc Giang"],
 ["245", "Bắc Kạn"],
 ["253", "Bạc Liêu"],
 ["249", "Bắc Ninh"],
 ["213", "Bến Tre"],
 ["262", "Bình Định"],
 ["205", "Bình Dương"],
 ["239", "Bình Phước"],
 ["258", "Bình Thuận"],
 ["252", "Cà Mau"],
 ["246", "Cao Bằng"],
 ["210", "Đắk Lắk"],
 ["241", "Đắk Nông"],
 ["265", "Điện Biên"],
 ["204", "Đồng Nai"],
 ["216", "Đồng Tháp"],
 ["207", "Gia Lai"],
 ["227", "Hà Giang"],
 ["232", "Hà Nam"],
 ["236", "Hà Tĩnh"],
 ["225", "Hải Dương"],
 ["250", "Hậu Giang"],
 ["267", "Hòa Bình"],
 ["268", "Hưng Yên"],
 ["208", "Khánh Hòa"],
 ["219", "Kiên Giang"],
 ["259", "Kon Tum"],
 ["264", "Lai Châu"],
 ["209", "Lâm Đồng"],
 ["247", "Lạng Sơn"],
 ["269", "Lào Cai"],
 ["211", "Long An"],
 ["231", "Nam Định"],
 ["235", "Nghệ An"],
 ["233", "Ninh Bình"],
 ["261", "Ninh Thuận"],
 ["229", "Phú Thọ"],
 ["260", "Phú Yên"],
 ["237", "Quảng Bình"],
 ["243", "Quảng Nam"],
 ["242", "Quảng Ngãi"],
 ["230", "Quảng Ninh"],
 ["238", "Quảng Trị"],
 ["218", "Sóc Trăng"],
 ["266", "Sơn La"],
 ["240", "Tây Ninh"],
 ["226", "Thái Bình"],
 ["244", "Thái Nguyên"],
 ["234", "Thanh Hóa"],
 ["223", "Thừa Thiên - Huế"],
 ["212", "Tiền Giang"],
 ["214", "Trà Vinh"],
 ["228", "Tuyên Quang"],
 ["215", "Vĩnh Long"],
 ["221", "Vĩnh Phúc"],
 ["263", "Yên Bái"],
];

export default function ProductDetailPage() {
 const router = useRouter();
 const { productSlug } = router.query;

 const product: ProductDetail = productData;

 const [selectedImage, setSelectedImage] = useState(0);
 const [quantity, setQuantity] = useState(1);
 const [activeTab, setActiveTab] = useState("description");

 const [customerName, setCustomerName] = useState("");
 const [phone, setPhone] = useState("");
 const [address, setAddress] = useState("");
 const [note, setNote] = useState("");
 const [province, setProvince] = useState("");

 const [isSubmitting, setIsSubmitting] = useState(false);
 const [submitMessage, setSubmitMessage] = useState("");

 const [showSuccessPopup, setShowSuccessPopup] = useState(false);
 const [successOrderNumber, setSuccessOrderNumber] = useState("");

 const [isFavorite, setIsFavorite] = useState(false);
 const [searchQuery, setSearchQuery] = useState("");
 const [showMobileMenu, setShowMobileMenu] = useState(false);

 const thumbnailRef = useRef<HTMLDivElement>(null);

 const images = product.images || [];

 const availableTabs = [
  { id: "description", label: "Mô tả sản phẩm" },
  ...(product.usageSteps?.length ? [{ id: "usage", label: "Hướng dẫn sử dụng" }] : []),
  ...(product.specifications?.length ? [{ id: "specifications", label: "Thông tin chi tiết" }] : []),
  ...(product.reviews?.length ? [{ id: "reviews", label: "Đánh giá sản phẩm" }] : []),
 ];

 const formatPrice = (price: number) => {
  return new Intl.NumberFormat("vi-VN").format(price) + "₫";
 };

 const discount = useMemo(() => {
  if (!product.originalPrice || product.originalPrice <= product.price) {
   return 0;
  }

  return Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100);
 }, [product.originalPrice, product.price]);

 const totalPrice = product.price * quantity;

 const scrollToOrder = () => {
  document.getElementById("order-form")?.scrollIntoView({
   behavior: "smooth",
   block: "start",
  });
 };

 const handleQuantity = (type: "increase" | "decrease") => {
  setQuantity((prev) => {
   if (type === "increase") {
    return Math.min(prev + 1, 99);
   }

   return Math.max(prev - 1, 1);
  });
 };

 const scrollThumbnails = (direction: "left" | "right") => {
  thumbnailRef.current?.scrollBy({
   left: direction === "right" ? 150 : -150,
   behavior: "smooth",
  });
 };

 const scrollToSection = (id: string) => {
  setActiveTab(id);

  document.getElementById(id)?.scrollIntoView({
   behavior: "smooth",
   block: "start",
  });
 };

 const handleSearch = (event: React.FormEvent<HTMLFormElement>) => {
  event.preventDefault();

  document.getElementById("product-detail")?.scrollIntoView({
   behavior: "smooth",
  });
 };

 const handleSubmitOrder = async (event: React.FormEvent<HTMLFormElement>) => {
  event.preventDefault();

  if (!customerName.trim() || !phone.trim() || !province || !address.trim()) {
   setSubmitMessage("Vui lòng nhập đầy đủ thông tin nhận hàng.");
   return;
  }

  if (!/^(0|\+84)[0-9]{9,10}$/.test(phone.trim())) {
   setSubmitMessage("Số điện thoại không hợp lệ.");
   return;
  }

  if (!product.productId || !product.storeId) {
   setSubmitMessage("Thông tin sản phẩm hoặc cửa hàng chưa được cấu hình.");
   return;
  }

  const payload = {
   storeId: product.storeId,

   customer: {
    name: customerName.trim(),
    phone: phone.trim(),
    email: "",
   },

   shippingAddress: {
    province,
    district: "",
    ward: "",
    address: address.trim(),
    postalCode: "",
   },

   items: [
    {
     productId: product.productId,
     quantity,
    },
   ],

   shippingFee: 0,
   discount: 0,
   currency: "VND",
   paymentMethod: "COD",
   note: note.trim(),
   shippingMethod: "",
  };

  try {
   setIsSubmitting(true);
   setSubmitMessage("");

   const response = await axios.post("/api/orders", payload);

   if (!response.data?.success) {
    throw new Error(response.data?.message || "Không thể tạo đơn hàng.");
   }

   const orderNumber = response.data.order?.orderNumber || "";

   setSuccessOrderNumber(orderNumber);
   setShowSuccessPopup(true);

   setCustomerName("");
   setPhone("");
   setAddress("");
   setNote("");
   setProvince("");
   setQuantity(1);
  } catch (error: any) {
   console.error("Submit order error:", error);

   const message = error.response?.data?.message || error.message || "Không thể gửi đơn hàng. Vui lòng thử lại.";

   setSubmitMessage(message);
  } finally {
   setIsSubmitting(false);
  }
 };

 if (!router.isReady) {
  return (
   <div className="flex min-h-screen items-center justify-center bg-[#f5f5f5]">
    <div className="h-9 w-9 animate-spin rounded-full border-4 border-[#ffd5ca] border-t-[#EE4D2D]" />
   </div>
  );
 }

 if (productSlug !== product.slug) {
  return (
   <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
    <FiPackage size={48} className="text-gray-300" />
    <h1 className="text-xl font-medium">Không tìm thấy sản phẩm</h1>
    <a href="/" className="text-sm text-[#EE4D2D] hover:underline">
     Quay lại trang chủ
    </a>
   </div>
  );
 }

 return (
  <>
   <main className="mx-auto max-w-[1200px] px-3 md:px-4">
    {/* PRODUCT DETAIL */}

    <section id="product-detail" className="bg-white p-3 shadow-sm sm:p-5 lg:p-7">
     <div className="grid grid-cols-1 gap-6 lg:grid-cols-[450px_minmax(0,1fr)] lg:gap-8">
      {/* PRODUCT GALLERY */}

      <div className="min-w-0">
       <div className="relative aspect-square overflow-hidden bg-white">
        {images.length > 0 ? (
         <img src={images[selectedImage] || images[0]} alt={product.name} className="h-full w-full object-contain" fetchPriority="high" />
        ) : (
         <div className="flex h-full items-center justify-center text-gray-300">
          <FiPackage size={60} />
         </div>
        )}

        {product.badges?.[0] && <span className="absolute left-0 top-0 bg-[#EE4D2D] px-3 py-1 text-xs text-white">{product.badges[0]}</span>}

        {discount > 0 && (
         <div className="absolute right-0 top-0 flex flex-col items-center bg-[#FFD839] px-2 py-1 text-[#EE4D2D]">
          <span className="text-xs font-bold">-{discount}%</span>
          <span className="text-[9px] font-medium">GIẢM</span>
         </div>
        )}
       </div>

       {/* THUMBNAILS */}

       <div className="relative mt-3">
        <div ref={thumbnailRef} className="flex gap-2 overflow-x-auto scroll-smooth [&::-webkit-scrollbar]:hidden">
         {images.map((image, index) => (
          <button
           key={`${image}-${index}`}
           type="button"
           onClick={() => setSelectedImage(index)}
           className={`aspect-square w-[72px] shrink-0 overflow-hidden border-2 transition sm:w-[82px] ${
            selectedImage === index ? "border-[#EE4D2D]" : "border-transparent hover:border-[#EE4D2D]"
           }`}>
           <img src={image} alt={`${product.name} - ảnh ${index + 1}`} className="h-full w-full object-cover" loading="lazy" />
          </button>
         ))}
        </div>

        {images.length > 5 && (
         <>
          <button
           type="button"
           onClick={() => scrollThumbnails("left")}
           className="absolute -left-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-white shadow-md"
           aria-label="Ảnh trước">
           ‹
          </button>

          <button
           type="button"
           onClick={() => scrollThumbnails("right")}
           className="absolute -right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-white shadow-md"
           aria-label="Ảnh tiếp theo">
           ›
          </button>
         </>
        )}
       </div>

       {/* SHARE / FAVORITE */}

       <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-4">
        <div className="flex items-center gap-3 text-sm">
         <span>Chia sẻ:</span>

         <button
          type="button"
          onClick={() => {
           if (navigator.clipboard) {
            navigator.clipboard.writeText(window.location.href);
           }
          }}
          className="text-[#EE4D2D]"
          aria-label="Chia sẻ sản phẩm">
          <FiShare2 size={20} />
         </button>
        </div>

        <button type="button" onClick={() => setIsFavorite(!isFavorite)} className="flex items-center gap-2 border-l border-gray-200 pl-4 text-sm">
         <FiHeart size={20} className={isFavorite ? "fill-[#EE4D2D] text-[#EE4D2D]" : "text-gray-500"} />

         <span>{isFavorite ? "Đã yêu thích" : "Yêu thích sản phẩm"}</span>
        </button>
       </div>
      </div>

      {/* PRODUCT INFORMATION */}

      <div className="min-w-0">
       {/* TITLE */}

       <div className="flex flex-wrap items-start gap-2">
        {product.badges?.[0] && (
         <span className="mt-1 shrink-0 rounded-sm bg-[#EE4D2D] px-1.5 py-0.5 text-[11px] font-medium text-white">{product.badges[0]}</span>
        )}

        <h1 className="text-lg font-medium leading-7 text-[#222] sm:text-xl">{product.name}</h1>
       </div>

       {/* RATING */}

       <div className="mt-4 flex flex-wrap items-center gap-4 text-sm">
        {product.rating !== undefined && (
         <div className="flex items-center gap-2">
          <span className="border-b border-[#EE4D2D] pb-1 text-[#EE4D2D]">{product.rating.toFixed(1)}</span>

          <div className="flex gap-0.5 text-[#EE4D2D]">
           {Array.from({ length: 5 }).map((_, index) => (
            <FiStar key={index} size={13} fill={index < Math.round(product.rating!) ? "currentColor" : "none"} />
           ))}
          </div>
         </div>
        )}

        {product.reviewCount !== undefined && (
         <button type="button" onClick={() => scrollToSection("reviews")} className="border-l border-gray-200 pl-4 text-gray-600">
          <span className="border-b border-gray-500 font-medium text-[#333]">{product.reviewCount}</span> Đánh giá
         </button>
        )}

        <div className="border-l border-gray-200 pl-4 text-gray-600">
         <span className="font-medium text-[#333]">-</span> Đã bán
        </div>
       </div>

       {/* PRICE */}

       <div className="mt-6 flex flex-wrap items-center gap-3 bg-[#FFF5F1] px-4 py-5 sm:px-5">
        {product.originalPrice && product.originalPrice > product.price && (
         <span className="text-sm text-gray-400 line-through">{formatPrice(product.originalPrice)}</span>
        )}

        <span className="text-3xl font-medium text-[#EE4D2D]">{formatPrice(product.price)}</span>

        {discount > 0 && <span className="rounded-sm bg-[#EE4D2D] px-2 py-1 text-xs font-semibold text-white">GIẢM {discount}%</span>}
       </div>

       {/* SHIPPING */}

       <div className="mt-6 space-y-5 text-sm">
        <div className="grid grid-cols-[105px_1fr] gap-3">
         <span className="text-gray-500">Vận chuyển</span>

         <div className="space-y-2">
          <div className="flex items-start gap-2">
           <FiTruck size={19} className="shrink-0 text-[#EE4D2D]" />

           <div>
            <p>{product.shippingText || "Hỗ trợ giao hàng toàn quốc"}</p>

            <p className="mt-1 text-xs text-gray-400">Thời gian giao hàng tùy theo khu vực</p>
           </div>
          </div>

          <div className="flex items-center gap-2 text-gray-500">
           <FiMapPin className="text-[#EE4D2D]" />
           <span>Giao hàng trên toàn quốc</span>
          </div>
         </div>
        </div>

        <div className="grid grid-cols-[105px_1fr] gap-3">
         <span className="text-gray-500">Chính sách</span>

         <div className="flex items-center gap-2">
          <FiShield className="text-[#EE4D2D]" />
          <span>{product.warrantyText || "Hỗ trợ khách hàng khi cần thiết"}</span>
         </div>
        </div>
       </div>

       {/* QUANTITY */}

       <div className="mt-7 flex flex-wrap items-center gap-5">
        <span className="w-[90px] shrink-0 text-sm text-gray-500">Số lượng</span>

        <div className="flex h-8 items-center border border-gray-300">
         <button
          type="button"
          onClick={() => handleQuantity("decrease")}
          disabled={quantity <= 1}
          className="flex h-full w-8 items-center justify-center text-gray-500 hover:bg-gray-100 disabled:opacity-30"
          aria-label="Giảm số lượng">
          <FiMinus size={13} />
         </button>

         <span className="flex h-full min-w-12 items-center justify-center border-x border-gray-300 px-3 text-sm">{quantity}</span>

         <button
          type="button"
          onClick={() => handleQuantity("increase")}
          disabled={quantity >= 99}
          className="flex h-full w-8 items-center justify-center text-gray-500 hover:bg-gray-100 disabled:opacity-30"
          aria-label="Tăng số lượng">
          <FiPlus size={13} />
         </button>
        </div>

        <span className="text-xs text-gray-400">Tối đa 99 sản phẩm</span>
       </div>

       {/* PURCHASE BUTTONS */}

       <div className="mt-8 flex flex-wrap gap-3">
        <button
         type="button"
         onClick={scrollToOrder}
         className="flex h-12 flex-1 items-center justify-center gap-2 border border-[#EE4D2D] bg-[#FFF5F1] px-4 text-sm text-[#EE4D2D] transition hover:bg-[#ffebe5] sm:flex-none sm:px-6">
         <FiShoppingCart size={19} />
         <span>Thêm vào giỏ hàng</span>
        </button>

        <button
         type="button"
         onClick={scrollToOrder}
         className="h-12 flex-1 bg-[#EE4D2D] px-6 text-sm font-medium text-white transition hover:bg-[#d83e20] sm:flex-none sm:px-10">
         Mua ngay
        </button>
       </div>

       <div className="mt-5 flex items-center gap-2 text-xs text-gray-500">
        <FiShield className="text-[#EE4D2D]" />
        Cam kết hỗ trợ khách hàng trong quá trình mua hàng.
       </div>
      </div>
     </div>
    </section>

    {/* SHOP INFORMATION */}

    <section className="mt-4 bg-white p-5 shadow-sm">
     <div className="flex flex-wrap items-center justify-between gap-5">
      <div className="flex min-w-0 items-center gap-4">
       <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-[#EE4D2D] bg-[#FFF5F1]">
        <FiShoppingBag size={25} className="text-[#EE4D2D]" />
       </div>

       <div className="min-w-0">
        <h3 className="font-medium text-[#333]">Cửa hàng chính hãng</h3>

        <p className="mt-1 text-xs text-gray-400">Đang hoạt động</p>

        <div className="mt-2 flex items-center gap-2">
         <span className="h-2 w-2 rounded-full bg-green-500" />
         <span className="text-xs text-gray-500">Sẵn sàng hỗ trợ khách hàng</span>
        </div>
       </div>
      </div>

      <div className="flex flex-wrap gap-2">
       <button type="button" onClick={scrollToOrder} className="flex h-9 items-center gap-2 border border-[#EE4D2D] bg-[#FFF5F1] px-4 text-xs text-[#EE4D2D]">
        <FiMessageCircle />
        Chat ngay
       </button>

       <button type="button" onClick={scrollToOrder} className="flex h-9 items-center gap-2 border border-gray-200 px-4 text-xs text-gray-600">
        Xem sản phẩm
       </button>
      </div>
     </div>

     <div className="mt-5 grid grid-cols-2 gap-4 border-t border-gray-100 pt-5 text-xs sm:grid-cols-4">
      <div>
       <p className="text-gray-400">Sản phẩm</p>
       <p className="mt-1 font-medium">Chất lượng</p>
      </div>

      <div>
       <p className="text-gray-400">Dịch vụ</p>
       <p className="mt-1 font-medium">Tận tâm</p>
      </div>

      <div>
       <p className="text-gray-400">Giao hàng</p>
       <p className="mt-1 font-medium">Toàn quốc</p>
      </div>

      <div>
       <p className="text-gray-400">Hỗ trợ</p>
       <p className="mt-1 font-medium">Khách hàng</p>
      </div>
     </div>
    </section>

    {/* PRODUCT DESCRIPTION TABS */}

    <section className="mt-4 bg-white shadow-sm">
     <div className="border-b border-gray-100 px-5 py-5">
      <h2 className="text-base font-medium uppercase text-[#333]">Chi tiết sản phẩm</h2>
     </div>

     <div className="sticky top-0 z-20 flex gap-7 overflow-x-auto border-b border-gray-100 bg-white px-5 text-sm [&::-webkit-scrollbar]:hidden">
      {availableTabs.map((tab) => (
       <button
        key={tab.id}
        type="button"
        onClick={() => scrollToSection(tab.id)}
        className={`relative shrink-0 py-4 transition ${activeTab === tab.id ? "font-medium text-[#EE4D2D]" : "text-gray-600 hover:text-[#EE4D2D]"}`}>
        {tab.label}

        {activeTab === tab.id && <span className="absolute bottom-0 left-0 h-[2px] w-full bg-[#EE4D2D]" />}
       </button>
      ))}
     </div>

     {/* DESCRIPTION */}

     <div id="description" className="scroll-mt-20 p-5 sm:p-7">
      <h3 className="mb-5 text-base font-medium uppercase text-[#333]">Mô tả sản phẩm</h3>

      {product.description && <p className="whitespace-pre-line text-sm leading-7 text-gray-700">{product.description}</p>}

      {product.benefits && product.benefits.length > 0 && (
       <div className="mt-8">
        <h3 className="mb-4 font-medium">Công dụng nổi bật</h3>

        <div className="space-y-3">
         {product.benefits.map((benefit, index) => (
          <div key={index} className="flex items-start gap-3 text-sm text-gray-600">
           <FiCheck className="mt-1 shrink-0 text-[#EE4D2D]" />
           <p className="leading-7">{benefit}</p>
          </div>
         ))}
        </div>
       </div>
      )}

      {product.features && product.features.length > 0 && (
       <div className="mt-8">
        <h3 className="mb-4 font-medium">Đặc điểm nổi bật</h3>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
         {product.features.map((feature, index) => (
          <div key={index} className="flex items-center gap-3 bg-[#f8f8f8] p-3 text-sm text-gray-600">
           <FiCheck className="shrink-0 text-[#EE4D2D]" />
           {feature}
          </div>
         ))}
        </div>
       </div>
      )}

      {product.ingredients && product.ingredients.length > 0 && (
       <div className="mt-8">
        <h3 className="mb-4 font-medium">Thành phần</h3>

        <div className="flex flex-wrap gap-2">
         {product.ingredients.map((ingredient, index) => (
          <span key={index} className="bg-[#f5f5f5] px-3 py-2 text-sm text-gray-600">
           {ingredient}
          </span>
         ))}
        </div>
       </div>
      )}
     </div>

     {/* USAGE */}

     {product.usageSteps && product.usageSteps.length > 0 && (
      <div id="usage" className="scroll-mt-20 border-t border-gray-100 p-5 sm:p-7">
       <h3 className="mb-6 text-base font-medium uppercase">Hướng dẫn sử dụng</h3>

       <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {product.usageSteps.map((step, index) => (
         <div key={index}>
          {step.image && (
           <div className="mb-4 aspect-[4/3] overflow-hidden bg-gray-50">
            <img src={step.image} alt={step.title} loading="lazy" className="h-full w-full object-cover" />
           </div>
          )}

          <div className="flex items-center gap-2">
           <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#FFF1EC] text-xs font-medium text-[#EE4D2D]">{index + 1}</span>

           <h4 className="text-sm font-medium">{step.title}</h4>
          </div>

          <p className="mt-3 text-sm leading-7 text-gray-500">{step.description}</p>
         </div>
        ))}
       </div>
      </div>
     )}

     {/* SPECIFICATIONS */}

     {product.specifications && product.specifications.length > 0 && (
      <div id="specifications" className="scroll-mt-20 border-t border-gray-100 p-5 sm:p-7">
       <h3 className="mb-5 text-base font-medium uppercase">Thông tin chi tiết</h3>

       <div className="max-w-3xl">
        {product.specifications.map((item, index) => (
         <div key={index} className={`grid grid-cols-2 gap-4 px-4 py-4 text-sm ${index % 2 === 0 ? "bg-[#f8f8f8]" : "bg-white"}`}>
          <span className="text-gray-500">{item.label}</span>

          <span className="font-medium text-gray-800">{item.value}</span>
         </div>
        ))}

        {product.origin && (
         <div className="grid grid-cols-2 gap-4 px-4 py-4 text-sm">
          <span className="text-gray-500">Xuất xứ</span>

          <span className="font-medium">{product.origin}</span>
         </div>
        )}
       </div>
      </div>
     )}

     {/* REVIEWS */}

     {product.reviews && product.reviews.length > 0 && (
      <div id="reviews" className="scroll-mt-20 border-t border-gray-100 p-5 sm:p-7">
       <div className="mb-7 flex flex-wrap items-center justify-between gap-4">
        <div>
         <h3 className="text-base font-medium uppercase">Đánh giá sản phẩm</h3>

         <p className="mt-2 text-sm text-gray-500">Đánh giá và phản hồi từ khách hàng</p>
        </div>

        {product.rating !== undefined && (
         <div className="text-right">
          <div className="text-3xl font-medium text-[#EE4D2D]">{product.rating.toFixed(1)}/5</div>

          <div className="mt-1 flex justify-end gap-1 text-[#EE4D2D]">
           {Array.from({ length: 5 }).map((_, index) => (
            <FiStar key={index} fill={index < Math.round(product.rating!) ? "currentColor" : "none"} />
           ))}
          </div>
         </div>
        )}
       </div>

       <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {product.reviews.map((review, index) => (
         <div key={index} className="border border-gray-100 p-4">
          <div className="flex items-center gap-3">
           {review.avatar ? (
            <img src={review.avatar} alt={review.name} className="h-10 w-10 rounded-full object-cover" loading="lazy" />
           ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#FFF1EC] text-sm text-[#EE4D2D]">
             {review.name.charAt(0).toUpperCase()}
            </div>
           )}

           <div>
            <p className="text-sm font-medium">{review.name}</p>

            {review.date && <p className="mt-1 text-xs text-gray-400">{review.date}</p>}
           </div>
          </div>

          <div className="mt-4 flex gap-1 text-[#EE4D2D]">
           {Array.from({ length: 5 }).map((_, starIndex) => (
            <FiStar key={starIndex} size={13} fill={starIndex < review.rating ? "currentColor" : "none"} />
           ))}
          </div>

          <p className="mt-3 text-sm leading-7 text-gray-600">{review.content}</p>

          {review.image && <img src={review.image} alt={`Ảnh đánh giá của ${review.name}`} loading="lazy" className="mt-4 h-24 w-24 object-cover" />}
         </div>
        ))}
       </div>
      </div>
     )}
    </section>

    {/* ORDER FORM */}

    <section id="order-form" className="scroll-mt-6 mt-4 bg-white p-5 shadow-sm sm:p-7">
     <div className="mb-7 border-b border-gray-100 pb-5">
      <h2 className="text-lg font-medium uppercase text-[#333]">Đặt hàng</h2>

      <p className="mt-2 text-sm text-gray-500">Điền thông tin nhận hàng để hoàn tất đơn hàng của bạn.</p>
     </div>

     {/* SELECTED PRODUCT */}

     <div className="flex gap-4 border-b border-gray-100 pb-5">
      <div className="h-24 w-24 shrink-0 overflow-hidden bg-gray-50">
       {images[0] && <img src={images[0]} alt={product.name} loading="lazy" className="h-full w-full object-cover" />}
      </div>

      <div className="min-w-0 flex-1">
       <h3 className="line-clamp-2 text-sm font-medium">{product.name}</h3>

       <p className="mt-2 text-lg font-medium text-[#EE4D2D]">{formatPrice(product.price)}</p>

       <p className="mt-1 text-xs text-gray-400">Số lượng: {quantity}</p>
      </div>
     </div>

     <form onSubmit={handleSubmitOrder} className="mt-6 space-y-5">
      <div>
       <label className="mb-2 block text-sm font-medium">
        Họ và tên <span className="text-red-500">*</span>
       </label>

       <input
        type="text"
        required
        autoComplete="name"
        value={customerName}
        onChange={(event) => setCustomerName(event.target.value)}
        placeholder="Nhập họ và tên của bạn"
        className="h-11 w-full rounded-sm border border-gray-300 px-4 text-sm outline-none transition focus:border-[#EE4D2D]"
       />
      </div>

      <div>
       <label className="mb-2 block text-sm font-medium">
        Số điện thoại <span className="text-red-500">*</span>
       </label>

       <input
        type="tel"
        required
        autoComplete="tel"
        value={phone}
        onChange={(event) => setPhone(event.target.value)}
        placeholder="Nhập số điện thoại nhận hàng"
        className="h-11 w-full rounded-sm border border-gray-300 px-4 text-sm outline-none transition focus:border-[#EE4D2D]"
       />
      </div>

      <div>
       <label className="mb-2 block text-sm font-medium">
        Tỉnh/Thành phố <span className="text-red-500">*</span>
       </label>

       <div className="relative">
        <select
         required
         name="province"
         value={province}
         onChange={(event) => setProvince(event.target.value)}
         className="h-11 w-full appearance-none rounded-sm border border-gray-300 bg-white px-4 pr-10 text-sm outline-none transition focus:border-[#EE4D2D]">
         <option value="" disabled>
          Chọn tỉnh/thành phố
         </option>

         {provinces.map(([id, name]) => (
          <option key={id} value={`${id}:${name}`}>
           {name}
          </option>
         ))}
        </select>

        <FiChevronDown className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" />
       </div>
      </div>

      <div>
       <label className="mb-2 block text-sm font-medium">
        Địa chỉ nhận hàng <span className="text-red-500">*</span>
       </label>

       <textarea
        required
        autoComplete="street-address"
        value={address}
        onChange={(event) => setAddress(event.target.value)}
        placeholder="Số nhà, tên đường, phường/xã..."
        rows={3}
        className="w-full resize-none rounded-sm border border-gray-300 p-4 text-sm outline-none transition focus:border-[#EE4D2D]"
       />
      </div>

      <div>
       <label className="mb-2 block text-sm font-medium">
        Ghi chú <span className="font-normal text-gray-400">(Không bắt buộc)</span>
       </label>

       <textarea
        value={note}
        onChange={(event) => setNote(event.target.value)}
        placeholder="Ghi chú thêm cho người bán..."
        rows={2}
        className="w-full resize-none rounded-sm border border-gray-300 p-4 text-sm outline-none transition focus:border-[#EE4D2D]"
       />
      </div>

      {/* ORDER SUMMARY */}

      <div className="border border-gray-200 p-5">
       <h3 className="mb-5 text-sm font-medium">Chi tiết đơn hàng</h3>

       <div className="flex items-center justify-between text-sm">
        <span className="text-gray-500">Đơn giá</span>

        <span>{formatPrice(product.price)}</span>
       </div>

       <div className="mt-5 flex items-center justify-between text-sm">
        <span className="text-gray-500">Số lượng</span>

        <div className="flex h-8 items-center border border-gray-300">
         <button
          type="button"
          onClick={() => handleQuantity("decrease")}
          disabled={quantity <= 1}
          className="flex h-full w-8 items-center justify-center text-gray-500 hover:bg-gray-100 disabled:opacity-30">
          <FiMinus size={12} />
         </button>

         <span className="min-w-10 text-center">{quantity}</span>

         <button
          type="button"
          onClick={() => handleQuantity("increase")}
          disabled={quantity >= 99}
          className="flex h-full w-8 items-center justify-center text-gray-500 hover:bg-gray-100 disabled:opacity-30">
          <FiPlus size={12} />
         </button>
        </div>
       </div>

       <div className="mt-5 flex items-center justify-between border-t border-gray-100 pt-5">
        <span className="text-sm font-medium">Tổng thanh toán</span>

        <span className="text-2xl font-medium text-[#EE4D2D]">{formatPrice(totalPrice)}</span>
       </div>

       <p className="mt-3 text-xs text-gray-400">Phí vận chuyển sẽ được xác nhận theo địa chỉ nhận hàng.</p>
      </div>

      {submitMessage && (
       <div role="status" className="bg-[#FFF1EC] p-4 text-sm text-[#EE4D2D]">
        {submitMessage}
       </div>
      )}

      <button
       type="submit"
       disabled={isSubmitting}
       className="flex h-12 w-full items-center justify-center gap-2 rounded-sm bg-[#EE4D2D] text-sm font-medium text-white transition hover:bg-[#d83e20] disabled:cursor-not-allowed disabled:opacity-60">
       <FiShoppingCart size={18} />

       {isSubmitting ? "ĐANG GỬI ĐƠN HÀNG..." : "ĐẶT HÀNG NGAY"}
      </button>

      <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
       <FiShield className="text-[#EE4D2D]" />
       Thông tin của bạn được bảo mật.
      </div>
     </form>
    </section>

    {/* FOOTER */}

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
   </main>

   {/* MOBILE STICKY PURCHASE BAR */}

   <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-gray-200 bg-white p-3 shadow-lg md:hidden">
    <div className="flex items-center gap-3">
     <button
      type="button"
      onClick={scrollToOrder}
      className="flex h-11 w-12 shrink-0 items-center justify-center border border-[#EE4D2D] bg-[#FFF5F1] text-[#EE4D2D]">
      <FiShoppingCart size={20} />
     </button>

     <div className="min-w-0 flex-1">
      <p className="text-[10px] text-gray-400">Tổng tiền ({quantity} sản phẩm)</p>

      <p className="truncate text-base font-medium text-[#EE4D2D]">{formatPrice(totalPrice)}</p>
     </div>

     <button type="button" onClick={scrollToOrder} className="h-11 shrink-0 bg-[#EE4D2D] px-5 text-sm font-medium text-white">
      Mua ngay
     </button>
    </div>
   </div>

   {/* SUCCESS POPUP */}

   {showSuccessPopup && (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 px-4 py-6">
     <div className="relative w-full max-w-md rounded-sm bg-white px-6 py-8 text-center shadow-2xl sm:px-8">
      <button type="button" onClick={() => setShowSuccessPopup(false)} className="absolute right-4 top-4 text-gray-400 hover:text-gray-700" aria-label="Đóng">
       <FiX size={22} />
      </button>

      <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-[#FFF1EC]">
       <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#EE4D2D]">
        <FiCheck size={32} className="text-white" />
       </div>
      </div>

      <h2 className="text-xl font-bold text-[#333] sm:text-2xl">ĐẶT HÀNG THÀNH CÔNG!</h2>

      <p className="mt-3 text-sm leading-6 text-gray-500">
       Cảm ơn bạn đã tin tưởng và lựa chọn sản phẩm của chúng tôi. Đơn hàng của bạn đã được ghi nhận thành công.
      </p>

      {successOrderNumber && (
       <div className="mt-5 bg-[#FFF5F1] p-4">
        <p className="text-xs text-gray-500">MÃ ĐƠN HÀNG CỦA BẠN</p>

        <p className="mt-2 text-lg font-bold text-[#EE4D2D]">{successOrderNumber}</p>
       </div>
      )}

      <div className="mt-5 flex items-start gap-2 bg-green-50 p-3 text-left">
       <FiClock className="mt-0.5 shrink-0 text-green-600" />

       <p className="text-xs leading-5 text-green-700">Nhân viên của chúng tôi sẽ sớm liên hệ với bạn để xác nhận thông tin và giao hàng.</p>
      </div>

      <button
       type="button"
       onClick={() => setShowSuccessPopup(false)}
       className="mt-6 h-12 w-full rounded-sm bg-[#EE4D2D] text-sm font-medium text-white transition hover:bg-[#d83e20]">
       TIẾP TỤC MUA SẮM
      </button>
     </div>
    </div>
   )}
  </>
 );
}

ProductDetailPage.Layout = "Default";
