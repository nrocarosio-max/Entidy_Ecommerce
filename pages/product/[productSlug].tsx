import React, { useMemo, useRef, useState } from "react";
import { useRouter } from "next/router";
import axios from "axios";

import { FiShoppingCart, FiHeart, FiTruck, FiShield, FiHeadphones, FiMinus, FiPlus, FiCheck, FiStar, FiChevronRight, FiPackage } from "react-icons/fi";

import { productData, type ProductDetail, type OrderPayload } from "~/data/products";

/* =====================================================
   COMPONENT
===================================================== */

export default function ProductDetailPage() {
 const router = useRouter();
 const { productSlug } = router.query;
 const [showSuccessPopup, setShowSuccessPopup] = useState(false);
 const [successOrderNumber, setSuccessOrderNumber] = useState("");
 const product: ProductDetail = productData;

 const [selectedImage, setSelectedImage] = useState(0);
 const [quantity, setQuantity] = useState(1);
 const [activeTab, setActiveTab] = useState("description");

 const [customerName, setCustomerName] = useState("");
 const [phone, setPhone] = useState("");
 const [address, setAddress] = useState("");
 const [note, setNote] = useState("");

 const [isSubmitting, setIsSubmitting] = useState(false);
 const [submitMessage, setSubmitMessage] = useState("");
 const [isFavorite, setIsFavorite] = useState(false);
 const [province, setProvince] = useState("");
 const thumbnailRef = useRef<HTMLDivElement>(null);

 const images = product.images || [];

 const availableTabs = [
  { id: "description", label: "Mô tả sản phẩm" },
  ...(product.usageSteps?.length ? [{ id: "usage", label: "Hướng dẫn sử dụng" }] : []),
  ...(product.specifications?.length ? [{ id: "specifications", label: "Thông tin chi tiết" }] : []),
  ...(product.reviews?.length ? [{ id: "reviews", label: "Đánh giá khách hàng" }] : []),
 ];

 const formatPrice = (price: number) => {
  return new Intl.NumberFormat("vi-VN").format(price) + "đ";
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

 const handleSubmitOrder = async (event: React.FormEvent<HTMLFormElement>) => {
  event.preventDefault();

  if (!customerName.trim() || !phone.trim() || !address.trim()) {
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
    province: "",
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

   // Thay bằng đúng đường dẫn file API của bạn.
   const response = await axios.post("/api/orders", payload);

   if (!response.data?.success) {
    throw new Error(response.data?.message || "Không thể tạo đơn hàng.");
   }

   setSubmitMessage(`Đặt hàng thành công! Mã đơn hàng: ${response.data.order?.orderNumber || ""}`);
   setShowSuccessPopup(true);
   setCustomerName("");
   setPhone("");
   setAddress("");
   setNote("");
   setQuantity(1);
  } catch (error: any) {
   console.error("Submit order error:", error);

   const message = error.response?.data?.message || error.message || "Không thể gửi đơn hàng. Vui lòng thử lại.";

   setSubmitMessage(message);
  } finally {
   setIsSubmitting(false);
  }
 };

 /* =====================================================
     ROUTE VALIDATION
  ===================================================== */

 if (!router.isReady) {
  return (
   <div className="flex min-h-screen items-center justify-center bg-white">
    <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#f4dce3] border-t-[#d65376]" />
   </div>
  );
 }

 if (productSlug !== product.slug) {
  return (
   <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
    <FiPackage size={48} className="text-gray-300" />
    <h1 className="text-xl font-medium">Không tìm thấy sản phẩm</h1>
    <a href="/" className="text-sm text-[#d65376] hover:underline">
     Quay lại trang chủ
    </a>
   </div>
  );
 }

 /* =====================================================
     RENDER
  ===================================================== */

 return (
  <div className="min-h-screen bg-white pb-24 text-[#292323] md:pb-0">
   <main className="mx-auto max-w-[1440px] px-4 md:px-8">
    {/* BREADCRUMB */}

    <div className="flex items-center gap-2 overflow-hidden py-5 text-xs text-gray-400">
     <a href="/" className="shrink-0 hover:text-[#cf607d]">
      Trang chủ
     </a>

     <FiChevronRight className="shrink-0" />

     {product.category && (
      <>
       <span className="shrink-0">{product.category}</span>
       <FiChevronRight className="shrink-0" />
      </>
     )}

     <span className="line-clamp-1 text-gray-700">{product.name}</span>
    </div>

    {/* PRODUCT INFORMATION */}

    <section className="grid grid-cols-1 gap-8 pb-12 lg:grid-cols-2 lg:gap-12">
     {/* PRODUCT GALLERY */}

     <div className="flex min-w-0 flex-col-reverse gap-3 sm:flex-row">
      {/* THUMBNAILS */}

      <div className="relative min-w-0 sm:w-[82px] sm:shrink-0">
       <div
        ref={thumbnailRef}
        className="flex gap-2 overflow-x-auto sm:flex-col sm:overflow-x-hidden sm:overflow-y-auto [&::-webkit-scrollbar]:hidden"
        style={{
         scrollbarWidth: "none",
         msOverflowStyle: "none",
        }}>
        {images.map((image, index) => (
         <button
          key={`${image}-${index}`}
          type="button"
          onClick={() => setSelectedImage(index)}
          className={`aspect-square w-[calc((100%-16px)/3)] shrink-0 overflow-hidden rounded-md border-2 bg-[#faf7f6] transition sm:w-full ${
           selectedImage === index ? "border-[#d65b7b]" : "border-transparent hover:border-[#ead4da]"
          }`}>
          <img src={image} alt={`${product.name} - ảnh ${index + 1}`} className="h-full w-full object-cover" loading="lazy" />
         </button>
        ))}
       </div>

       {images.length > 3 && (
        <>
         <button
          type="button"
          onClick={() => scrollThumbnails("left")}
          className="absolute left-1 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-xl shadow-md sm:hidden"
          aria-label="Ảnh trước">
          ‹
         </button>

         <button
          type="button"
          onClick={() => scrollThumbnails("right")}
          className="absolute right-1 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-xl shadow-md sm:hidden"
          aria-label="Ảnh tiếp theo">
          ›
         </button>
        </>
       )}
      </div>

      {/* MAIN IMAGE */}

      <div className="relative aspect-square min-w-0 flex-1 overflow-hidden rounded-md bg-[#faf7f6]">
       {images.length > 0 ? (
        <img
         src={images[selectedImage] || images[0]}
         alt={product.name}
         className="h-full w-full object-cover transition duration-500 hover:scale-[1.03]"
         fetchPriority="high"
        />
       ) : (
        <div className="flex h-full items-center justify-center text-gray-300">
         <FiPackage size={60} />
        </div>
       )}

       {product.badges?.[0] && <span className="absolute left-4 top-4 rounded-sm bg-[#d65b7b] px-3 py-1.5 text-xs text-white">{product.badges[0]}</span>}
      </div>
     </div>

     {/* PRODUCT DETAILS */}

     <div className="flex flex-col">
      {product.category && <p className="mb-2 text-xs uppercase tracking-widest text-gray-400">{product.category}</p>}

      <h1 className="font-serif text-2xl leading-snug text-[#292323] sm:text-3xl lg:text-[36px]">{product.name}</h1>

      {/* RATING */}

      {product.rating !== undefined && (
       <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
        <div className="flex gap-0.5 text-[#e7a83f]">
         {Array.from({ length: 5 }).map((_, index) => (
          <FiStar key={index} size={15} fill={index < Math.round(product.rating!) ? "currentColor" : "none"} />
         ))}
        </div>

        <span className="font-medium">{product.rating.toFixed(1)}</span>

        {product.reviewCount !== undefined && (
         <button type="button" onClick={() => scrollToSection("reviews")} className="text-gray-400 underline underline-offset-2">
          ({product.reviewCount} đánh giá)
         </button>
        )}
       </div>
      )}

      {/* PRICE */}

      <div className="mt-6 flex flex-wrap items-center gap-3">
       <span className="text-3xl font-semibold text-[#d65376]">{formatPrice(product.price)}</span>

       {product.originalPrice && product.originalPrice > product.price && (
        <>
         <span className="text-base text-gray-400 line-through">{formatPrice(product.originalPrice)}</span>

         <span className="rounded-full bg-[#fce9ed] px-3 py-1 text-xs font-medium text-[#d65376]">Giảm {discount}%</span>
        </>
       )}
      </div>

      {/* SHORT DESCRIPTION */}

      <p className="mt-5 text-sm leading-7 text-gray-600">{product.shortDescription}</p>

      {/* FEATURES */}

      {product.features && product.features.length > 0 && (
       <div className="mt-6 grid grid-cols-2 gap-3 border-y border-[#f0e8e8] py-5 sm:grid-cols-3">
        {product.features.slice(0, 6).map((feature, index) => (
         <div key={index} className="flex flex-col items-center justify-center gap-2 px-2 text-center">
          {index % 3 === 0 && <FiCheck className="text-2xl text-[#b47c89]" />}

          {index % 3 === 1 && <FiShield className="text-2xl text-[#b47c89]" />}

          {index % 3 === 2 && <FiHeart className="text-2xl text-[#b47c89]" />}

          <span className="text-xs leading-5 text-gray-600">{feature}</span>
         </div>
        ))}
       </div>
      )}

      {/* QUANTITY */}

      <div className="mt-6">
       <label className="mb-3 block text-sm font-medium">Số lượng</label>

       <div className="flex items-center gap-4">
        <div className="flex h-11 items-center border border-[#e8dede]">
         <button
          type="button"
          onClick={() => handleQuantity("decrease")}
          disabled={quantity <= 1}
          className="flex h-full w-11 items-center justify-center text-gray-500 hover:bg-[#faf4f5] disabled:opacity-30"
          aria-label="Giảm số lượng">
          <FiMinus />
         </button>

         <span className="min-w-[44px] text-center text-sm">{quantity}</span>

         <button
          type="button"
          onClick={() => handleQuantity("increase")}
          disabled={quantity >= 99}
          className="flex h-full w-11 items-center justify-center text-gray-500 hover:bg-[#faf4f5]"
          aria-label="Tăng số lượng">
          <FiPlus />
         </button>
        </div>

        <button
         type="button"
         onClick={scrollToOrder}
         className="flex h-11 flex-1 items-center justify-center gap-2 bg-[#d65376] px-5 text-sm font-medium text-white transition hover:bg-[#bb4566]">
         <FiShoppingCart size={17} />
         Đặt hàng ngay
        </button>
       </div>
      </div>

      {/* SHIPPING */}

      <div className="mt-5 space-y-3 rounded-md bg-[#fcf6f7] p-4">
       <div className="flex items-center gap-3 text-sm text-gray-600">
        <FiTruck className="shrink-0 text-lg text-[#c16d83]" />
        <span>{product.shippingText || "Hỗ trợ giao hàng toàn quốc"}</span>
       </div>

       <div className="flex items-center gap-3 text-sm text-gray-600">
        <FiShield className="shrink-0 text-lg text-[#c16d83]" />
        <span>{product.warrantyText || "Hỗ trợ khách hàng tận tâm"}</span>
       </div>

       <div className="flex items-center gap-3 text-sm text-gray-600">
        <FiHeadphones className="shrink-0 text-lg text-[#c16d83]" />
        <span>Hỗ trợ tư vấn khi cần thiết</span>
       </div>
      </div>
     </div>
    </section>

    {/* PRODUCT CONTENT TABS */}

    <section className="border-t border-[#eee6e6]">
     <div className="sticky top-[68px] z-20 flex gap-7 overflow-x-auto border-b border-[#eee6e6] bg-white py-4 text-sm">
      {availableTabs.map((tab) => (
       <button
        key={tab.id}
        type="button"
        onClick={() => scrollToSection(tab.id)}
        className={`relative shrink-0 pb-1 transition ${activeTab === tab.id ? "font-medium text-[#d65376]" : "text-gray-500 hover:text-[#d65376]"}`}>
        {tab.label}

        {activeTab === tab.id && <span className="absolute bottom-[-17px] left-0 h-[2px] w-full bg-[#d65376]" />}
       </button>
      ))}
     </div>

     {/* DESCRIPTION */}

     <div id="description" className="scroll-mt-32 py-10">
      <h2 className="font-serif text-2xl">Khám phá {product.name}</h2>

      {product.description && <p className="mt-4 whitespace-pre-line text-sm leading-8 text-gray-600">{product.description}</p>}

      {product.benefits && product.benefits.length > 0 && (
       <div className="mt-8">
        <h3 className="mb-5 text-lg font-medium">Công dụng nổi bật</h3>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
         {product.benefits.map((benefit, index) => (
          <div key={index} className="flex items-start gap-3">
           <FiCheck className="mt-1 shrink-0 text-lg text-[#d65376]" />
           <p className="text-sm leading-7 text-gray-600">{benefit}</p>
          </div>
         ))}
        </div>
       </div>
      )}

      {product.ingredients && product.ingredients.length > 0 && (
       <div className="mt-10">
        <h3 className="mb-5 text-lg font-medium">Thành phần nổi bật</h3>

        <div className="flex flex-wrap gap-2">
         {product.ingredients.map((ingredient, index) => (
          <span key={index} className="rounded-full bg-[#fcf3f5] px-4 py-2 text-sm text-[#95616f]">
           {ingredient}
          </span>
         ))}
        </div>
       </div>
      )}
     </div>

     {/* USAGE */}

     {product.usageSteps && product.usageSteps.length > 0 && (
      <div id="usage" className="scroll-mt-32 border-t border-[#eee6e6] py-10">
       <h2 className="mb-8 font-serif text-2xl">Hướng dẫn sử dụng</h2>

       <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {product.usageSteps.map((step, index) => (
         <div key={index}>
          {step.image && (
           <div className="mb-4 aspect-[4/3] overflow-hidden rounded-md bg-[#faf5f5]">
            <img src={step.image} alt={step.title} loading="lazy" className="h-full w-full object-cover" />
           </div>
          )}

          <div className="flex items-center gap-2">
           <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#f9e9ed] text-xs font-medium text-[#c45674]">{index + 1}</span>

           <h3 className="text-sm font-medium">{step.title}</h3>
          </div>

          <p className="mt-3 text-sm leading-7 text-gray-500">{step.description}</p>
         </div>
        ))}
       </div>
      </div>
     )}

     {/* SPECIFICATIONS */}

     {product.specifications && product.specifications.length > 0 && (
      <div id="specifications" className="scroll-mt-32 border-t border-[#eee6e6] py-10">
       <h2 className="mb-6 font-serif text-2xl">Thông tin sản phẩm</h2>

       <div className="max-w-3xl">
        {product.specifications.map((item, index) => (
         <div key={index} className={`grid grid-cols-2 gap-4 px-4 py-4 text-sm ${index % 2 === 0 ? "bg-[#fcf8f8]" : "bg-white"}`}>
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
      <div id="reviews" className="scroll-mt-32 border-t border-[#eee6e6] py-10">
       <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
         <h2 className="font-serif text-2xl">Đánh giá từ khách hàng</h2>

         <p className="mt-2 text-sm text-gray-500">Chia sẻ trải nghiệm thực tế về sản phẩm</p>
        </div>

        {product.rating !== undefined && (
         <div className="text-right">
          <div className="text-3xl font-semibold">{product.rating.toFixed(1)}/5</div>

          <div className="mt-1 flex gap-1 text-[#e7a83f]">
           {Array.from({ length: 5 }).map((_, index) => (
            <FiStar key={index} fill={index < Math.round(product.rating!) ? "currentColor" : "none"} />
           ))}
          </div>
         </div>
        )}
       </div>

       <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {product.reviews.map((review, index) => (
         <div key={index} className="rounded-md border border-[#f0e8e8] p-5">
          <div className="flex items-center gap-3">
           {review.avatar ? (
            <img src={review.avatar} alt={review.name} className="h-11 w-11 rounded-full object-cover" loading="lazy" />
           ) : (
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#f9e9ed] text-sm text-[#c45674]">
             {review.name.charAt(0).toUpperCase()}
            </div>
           )}

           <div>
            <p className="text-sm font-medium">{review.name}</p>

            {review.date && <p className="mt-1 text-xs text-gray-400">{review.date}</p>}
           </div>
          </div>

          <div className="mt-4 flex gap-1 text-[#e7a83f]">
           {Array.from({ length: 5 }).map((_, starIndex) => (
            <FiStar key={starIndex} size={13} fill={starIndex < review.rating ? "currentColor" : "none"} />
           ))}
          </div>

          <p className="mt-3 text-sm leading-7 text-gray-600">{review.content}</p>

          {review.image && <img src={review.image} alt={`Ảnh đánh giá của ${review.name}`} loading="lazy" className="mt-4 h-24 w-24 rounded-md object-cover" />}
         </div>
        ))}
       </div>
      </div>
     )}
    </section>

    {/* ORDER FORM */}

    <section id="order-form" className="scroll-mt-24 border-t border-[#eee6e6] py-12">
     <div className="mx-auto max-w-3xl">
      <div className="mb-8 text-center">
       <p className="text-xs uppercase tracking-[3px] text-[#c16d83]">BeautyStore</p>

       <h2 className="mt-3 font-serif text-3xl">Đặt hàng ngay</h2>

       <p className="mt-3 text-sm text-gray-500">Vui lòng điền thông tin để chúng tôi giao hàng đến bạn.</p>
      </div>

      <div className="rounded-lg border border-[#eee5e5] p-5 sm:p-8">
       {/* SELECTED PRODUCT */}

       <div className="flex gap-4 border-b border-[#eee5e5] pb-5">
        <div className="h-24 w-24 shrink-0 overflow-hidden rounded-md bg-[#faf5f5]">
         {images[0] && <img src={images[0]} alt={product.name} loading="lazy" className="h-full w-full object-cover" />}
        </div>

        <div className="min-w-0 flex-1">
         <h3 className="line-clamp-2 text-sm font-medium">{product.name}</h3>

         <p className="mt-2 text-lg font-semibold text-[#d65376]">{formatPrice(product.price)}</p>

         <p className="mt-1 text-xs text-gray-400">Số lượng: {quantity}</p>
        </div>
       </div>

       {/* FORM */}

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
          className="h-12 w-full rounded-md border border-[#e9dede] px-4 text-sm outline-none transition placeholder:text-gray-400 focus:border-[#d65376]"
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
          className="h-12 w-full rounded-md border border-[#e9dede] px-4 text-sm outline-none transition placeholder:text-gray-400 focus:border-[#d65376]"
         />
        </div>
        <div>
         <label className="mb-2 block text-sm font-medium">
          Tỉnh/Thành phố <span className="text-red-500">*</span>
         </label>

         <select
          required
          name="province"
          value={province}
          onChange={(event) => setProvince(event.target.value)}
          className="h-12 w-full rounded-md border border-[#e9dede] bg-white px-4 text-sm outline-none transition focus:border-[#d65376]">
          <option value="" disabled>
           Chọn tỉnh/thành phố
          </option>

          <option value="201:Hà Nội">Hà Nội</option>
          <option value="202:Hồ Chí Minh">Hồ Chí Minh</option>
          <option value="224:Hải Phòng">Hải Phòng</option>
          <option value="220:Cần Thơ">Cần Thơ</option>
          <option value="203:Đà Nẵng">Đà Nẵng</option>
          <option value="217:An Giang">An Giang</option>
          <option value="206:Bà Rịa - Vũng Tàu">Bà Rịa - Vũng Tàu</option>
          <option value="248:Bắc Giang">Bắc Giang</option>
          <option value="245:Bắc Kạn">Bắc Kạn</option>
          <option value="253:Bạc Liêu">Bạc Liêu</option>
          <option value="249:Bắc Ninh">Bắc Ninh</option>
          <option value="213:Bến Tre">Bến Tre</option>
          <option value="262:Bình Định">Bình Định</option>
          <option value="205:Bình Dương">Bình Dương</option>
          <option value="239:Bình Phước">Bình Phước</option>
          <option value="258:Bình Thuận">Bình Thuận</option>
          <option value="252:Cà Mau">Cà Mau</option>
          <option value="246:Cao Bằng">Cao Bằng</option>
          <option value="210:Đắk Lắk">Đắk Lắk</option>
          <option value="241:Đắk Nông">Đắk Nông</option>
          <option value="265:Điện Biên">Điện Biên</option>
          <option value="204:Đồng Nai">Đồng Nai</option>
          <option value="216:Đồng Tháp">Đồng Tháp</option>
          <option value="207:Gia Lai">Gia Lai</option>
          <option value="227:Hà Giang">Hà Giang</option>
          <option value="232:Hà Nam">Hà Nam</option>
          <option value="236:Hà Tĩnh">Hà Tĩnh</option>
          <option value="225:Hải Dương">Hải Dương</option>
          <option value="250:Hậu Giang">Hậu Giang</option>
          <option value="267:Hòa Bình">Hòa Bình</option>
          <option value="268:Hưng Yên">Hưng Yên</option>
          <option value="208:Khánh Hòa">Khánh Hòa</option>
          <option value="219:Kiên Giang">Kiên Giang</option>
          <option value="259:Kon Tum">Kon Tum</option>
          <option value="264:Lai Châu">Lai Châu</option>
          <option value="209:Lâm Đồng">Lâm Đồng</option>
          <option value="247:Lạng Sơn">Lạng Sơn</option>
          <option value="269:Lào Cai">Lào Cai</option>
          <option value="211:Long An">Long An</option>
          <option value="231:Nam Định">Nam Định</option>
          <option value="235:Nghệ An">Nghệ An</option>
          <option value="233:Ninh Bình">Ninh Bình</option>
          <option value="261:Ninh Thuận">Ninh Thuận</option>
          <option value="229:Phú Thọ">Phú Thọ</option>
          <option value="260:Phú Yên">Phú Yên</option>
          <option value="237:Quảng Bình">Quảng Bình</option>
          <option value="243:Quảng Nam">Quảng Nam</option>
          <option value="242:Quảng Ngãi">Quảng Ngãi</option>
          <option value="230:Quảng Ninh">Quảng Ninh</option>
          <option value="238:Quảng Trị">Quảng Trị</option>
          <option value="218:Sóc Trăng">Sóc Trăng</option>
          <option value="266:Sơn La">Sơn La</option>
          <option value="240:Tây Ninh">Tây Ninh</option>
          <option value="226:Thái Bình">Thái Bình</option>
          <option value="244:Thái Nguyên">Thái Nguyên</option>
          <option value="234:Thanh Hóa">Thanh Hóa</option>
          <option value="223:Thừa Thiên - Huế">Thừa Thiên - Huế</option>
          <option value="212:Tiền Giang">Tiền Giang</option>
          <option value="214:Trà Vinh">Trà Vinh</option>
          <option value="228:Tuyên Quang">Tuyên Quang</option>
          <option value="215:Vĩnh Long">Vĩnh Long</option>
          <option value="221:Vĩnh Phúc">Vĩnh Phúc</option>
          <option value="263:Yên Bái">Yên Bái</option>
         </select>
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
          placeholder="Số nhà, tên đường, phường/xã, tỉnh/thành phố"
          rows={3}
          className="w-full resize-none rounded-md border border-[#e9dede] p-4 text-sm outline-none transition placeholder:text-gray-400 focus:border-[#d65376]"
         />
        </div>

        <div>
         <label className="mb-2 block text-sm font-medium">
          Ghi chú
          <span className="ml-1 font-normal text-gray-400">(Không bắt buộc)</span>
         </label>

         <textarea
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder="Ghi chú thêm cho người bán..."
          rows={2}
          className="w-full resize-none rounded-md border border-[#e9dede] p-4 text-sm outline-none transition placeholder:text-gray-400 focus:border-[#d65376]"
         />
        </div>

        {/* ORDER SUMMARY */}

        <div className="rounded-md bg-[#fcf6f7] p-5">
         <h3 className="mb-4 text-sm font-semibold">Tóm tắt đơn hàng</h3>

         <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">Giá sản phẩm</span>

          <span>{formatPrice(product.price)}</span>
         </div>

         {/* CHỌN SỐ LƯỢNG */}
         <div className="mt-4 space-y-3">
          <label
           className={`flex cursor-pointer items-center gap-3 border p-3 transition ${
            quantity === 1 ? "border-[#d65376] bg-[#fcf6f7]" : "border-gray-200 bg-white"
           }`}>
           <input type="radio" name="quantity" value={1} checked={quantity === 1} onChange={() => setQuantity(1)} className="h-5 w-5 accent-[#d65376]" />

           <span className="flex-1 text-sm leading-6">
            MUA 1 {product.name} – {formatPrice(product.price)}
            <span className="block text-xs text-green-600">Miễn phí vận chuyển</span>
           </span>
          </label>

          <label
           className={`flex cursor-pointer items-center gap-3 border p-3 transition ${
            quantity === 2 ? "border-[#d65376] bg-[#fcf6f7]" : "border-gray-200 bg-white"
           }`}>
           <input type="radio" name="quantity" value={2} checked={quantity === 2} onChange={() => setQuantity(2)} className="h-5 w-5 accent-[#d65376]" />

           <span className="flex-1 text-sm leading-6">
            MUA 2 {product.name} – {formatPrice(product.price * 2)}
            <span className="block text-xs text-green-600">Miễn phí vận chuyển</span>
           </span>
          </label>
         </div>

         <div className="mt-4 flex items-center justify-between border-t border-[#eadde0] pt-4">
          <span className="font-medium">Tổng tiền sản phẩm</span>

          <span className="text-xl font-semibold text-[#d65376]">{formatPrice(totalPrice)}</span>
         </div>

         <p className="mt-3 text-xs leading-5 text-gray-500">Phí vận chuyển sẽ được xác nhận theo địa chỉ nhận hàng.</p>
        </div>

        {submitMessage && (
         <div role="status" className="rounded-md bg-[#fcf3f5] p-4 text-sm text-[#a64d67]">
          {submitMessage}
         </div>
        )}

        <button
         type="submit"
         disabled={isSubmitting}
         className="flex h-14 w-full items-center justify-center gap-2 rounded-md bg-[#d65376] text-sm font-semibold text-white transition hover:bg-[#bb4566] disabled:cursor-not-allowed disabled:opacity-60">
         <FiShoppingCart size={18} />

         {isSubmitting ? "ĐANG GỬI ĐƠN HÀNG..." : "XÁC NHẬN ĐẶT HÀNG"}
        </button>

        <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
         <FiShield className="text-[#b47c89]" />
         Thông tin của bạn được sử dụng để xử lý đơn hàng.
        </div>
       </form>
      </div>
     </div>
    </section>
   </main>

   {/* MOBILE STICKY BUTTON */}

   <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-[#eee5e5] bg-white p-3 md:hidden">
    <div className="flex items-center gap-3">
     <div className="min-w-0 flex-1">
      <p className="text-[11px] text-gray-400">Tổng tiền ({quantity} sản phẩm)</p>

      <p className="truncate text-lg font-semibold text-[#d65376]">{formatPrice(totalPrice)}</p>
     </div>

     <button
      type="button"
      onClick={scrollToOrder}
      className="flex h-12 flex-1 items-center justify-center gap-2 rounded-md bg-[#d65376] px-4 text-sm font-medium text-white">
      <FiShoppingCart />
      Đặt hàng ngay
     </button>
    </div>
   </div>
   {showSuccessPopup && (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 px-4 py-6">
     <div className="relative w-full max-w-md animate-[fadeIn_0.25s_ease-out] rounded-2xl bg-white px-6 py-8 text-center shadow-2xl sm:px-8">
      {/* ICON SUCCESS */}
      <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-green-50">
       <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-500">
        <svg
         xmlns="http://www.w3.org/2000/svg"
         width="32"
         height="32"
         viewBox="0 0 24 24"
         fill="none"
         stroke="white"
         strokeWidth="3"
         strokeLinecap="round"
         strokeLinejoin="round">
         <path d="m5 12 4 4L19 6" />
        </svg>
       </div>
      </div>

      {/* TITLE */}
      <h2 className="text-xl font-bold text-slate-800 sm:text-2xl">ĐẶT HÀNG THÀNH CÔNG!</h2>

      <p className="mt-3 text-sm leading-6 text-gray-500">
       Cảm ơn bạn đã tin tưởng và lựa chọn sản phẩm của chúng tôi. Đơn hàng của bạn đã được ghi nhận thành công.
      </p>

      {/* ORDER NUMBER */}
      {successOrderNumber && (
       <div className="mt-5 rounded-lg bg-[#fcf6f7] p-4">
        <p className="text-xs text-gray-500">MÃ ĐƠN HÀNG CỦA BẠN</p>

        <p className="mt-1 text-lg font-bold text-[#d65376]">{successOrderNumber}</p>
       </div>
      )}

      {/* NOTICE */}
      <div className="mt-5 flex items-start gap-2 rounded-lg bg-green-50 p-3 text-left">
       <svg className="mt-0.5 shrink-0 text-green-600" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 8v4l2 2" />
       </svg>

       <p className="text-xs leading-5 text-green-700">Nhân viên của chúng tôi sẽ sớm liên hệ với bạn để xác nhận thông tin và giao hàng.</p>
      </div>

      {/* BUTTON */}
      <button
       type="button"
       onClick={() => setShowSuccessPopup(false)}
       className="mt-6 h-12 w-full rounded-lg bg-[#d65376] text-sm font-semibold text-white transition hover:bg-[#bb4566]">
       TIẾP TỤC MUA SẮM
      </button>

      <button type="button" onClick={() => setShowSuccessPopup(false)} className="mt-3 text-sm text-gray-400 transition hover:text-gray-600">
       Đóng
      </button>
     </div>
    </div>
   )}
  </div>
 );
}

ProductDetailPage.Layout = "Default";
