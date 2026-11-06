/* =====================================================
   TYPES
===================================================== */

export interface ProductReview {
 name: string;
 avatar?: string;
 rating: number;
 content: string;
 date?: string;
 image?: string;
}

export interface ProductDetail {
 _id?: string;
 productId: string;
 storeId: string;
 name: string;
 slug: string;
 category?: string;

 images: string[];

 price: number;
 originalPrice?: number;

 shortDescription: string;
 description?: string;

 rating?: number;
 reviewCount?: number;

 badges?: string[];

 benefits?: string[];
 features?: string[];

 ingredients?: string[];

 usageSteps?: {
  title: string;
  description: string;
  image?: string;
 }[];

 specifications?: {
  label: string;
  value: string;
 }[];

 reviews?: ProductReview[];

 shippingText?: string;
 warrantyText?: string;
 origin?: string;
}

export interface OrderPayload {
 productId?: string;
 productName: string;
 productSlug: string;
 quantity: number;
 unitPrice: number;
 totalPrice: number;
 customerName: string;
 phone: string;
 address: string;
 note: string;
}

/* =====================================================
   PRODUCT DATA
===================================================== */

export const productData: ProductDetail = {
 _id: "product_001",
 productId: "6aed9b80ad563c2d047bde20",
 storeId: "6ac893cea0eb14f70dafb234",
 name: "Đai định hình mặt thoáng khí hỗ trợ hàm tạo cằm V",

 slug: "dai-dinh-hinh-mat-thoang-khi-tao-cam-v",

 category: "Chăm sóc sắc đẹp",

 images: [
  "/image/mask/sg-11134301-8257x-mqbz8dg4eolo1d.webp",
  "/image/mask/sg-11134301-82583-mqbz8dj13cp896.webp",
  "/image/mask/sg-11134301-8259d-mqbz8dj1vg1uab.webp",
  "/image/mask/sg-11134301-8259d-mqbz8dj1vg1uab.webp",
 ],

 price: 99000,

 originalPrice: 247500,

 shortDescription:
  "Đai định hình khuôn mặt là phụ kiện chăm sóc sắc đẹp dành cho cả nam và nữ, giúp nâng đỡ vùng da mặt, hỗ trợ hạn chế tình trạng da chảy xệ và tạo cảm giác khuôn mặt thon gọn, săn chắc hơn.",

 description:
  "Đai nâng cơ mặt V-Line giúp bạn sở hữu gương mặt thon gọn, không nọng cằm và làn da săn chắc ngay tại nhà. Thiết kế thông minh ôm sát vùng cằm – má, sử dụng lực kéo vật lý giúp nâng cơ, chống chảy xệ, định hình đường viền mặt V-line rõ rệt. Có 2 chất liệu cao cấp để lựa chọn: vải su mềm mịn – co giãn tốt, và silicon siêu mỏng – dẻo nhẹ, dễ vệ sinh. Dễ dàng đeo khi ngủ, làm việc, thư giãn mà vẫn thoải mái. Sản phẩm hỗ trợ làm săn chắc da, cải thiện độ đàn hồi và chống lão hóa rõ rệt. Duy trì sử dụng đều đặn mỗi ngày từ 30–60 phút, bạn sẽ cảm nhận khuôn mặt gọn gàng, da mịn màng và trẻ trung hơn chỉ sau 1–2 tuần -  Green Pharma",

 rating: 4.9,

 reviewCount: 328,

 badges: ["Giảm giá 60%", "Bán chạy"],

 features: [
  "Hỗ trợ vùng da chảy xệ",
  "Chất liệu thoáng khí, tạo cảm giác dễ chịu",
  "Dây đeo co giãn, dễ dàng điều chỉnh",
  "Có thể tái sử dụng nhiều lần",
  "Phù hợp cho cả nam và nữ",
 ],

 benefits: ["Hỗ trợ nâng đỡ da mặt.", "Tạo đường nét V-line.", "Định hình vùng cằm.", "Hỗ trợ vùng da chảy xệ.", "Có thể giặt và tái sử dụng theo hướng dẫn."],

 ingredients: ["Chất liệu vải co giãn", "Vải thoáng khí", "Dây đeo điều chỉnh"],

 usageSteps: [
  {
   title: "Đeo đai lên mặt",

   description: "Đặt phần đai vào vùng cằm, căn chỉnh để đai ôm vừa vặn với khuôn mặt.",

   image: "/image/mask/Golden Mask Fitting Tutorial.png",
  },

  {
   title: "Điều chỉnh dây đeo",

   description: "Kéo và điều chỉnh dây đeo sao cho vừa vặn, không quá chật hoặc gây khó chịu.",

   image: "/image/mask/Adjusting the Face-Lifting Strap.png",
  },

  {
   title: "Sử dụng và tháo đai",

   description: "Sử dụng trong thời gian phù hợp, sau đó tháo ra và vệ sinh theo hướng dẫn.",

   image: "/image/mask/Hướng Dẫn Sử Dụng Đai Nâng Cơ.png",
  },
 ],

 specifications: [
  {
   label: "Loại sản phẩm",
   value: "Đai định hình mặt",
  },

  {
   label: "Công dụng",
   value: "Hỗ trợ ôm vùng cằm và đường viền hàm",
  },

  {
   label: "Chất liệu",
   value: "Vải co giãn, thoáng khí",
  },

  {
   label: "Đặc điểm",
   value: "Có thể điều chỉnh và tái sử dụng",
  },

  {
   label: "Đối tượng",
   value: "Nam và nữ",
  },
 ],

 origin: "Hàn Quốc",

 shippingText: "Hỗ trợ giao hàng toàn quốc",

 warrantyText: "Hỗ trợ đổi trả theo chính sách cửa hàng",

 reviews: [
  {
   name: "Nguyễn Thị A",

   rating: 5,

   content: "Đai dễ đeo, chất liệu khá thoáng và có thể điều chỉnh cho vừa khuôn mặt.",

   avatar: "/image/reviews/customer-1.jpg",
  },

  {
   name: "Trần Văn B",

   rating: 5,

   content: "Sản phẩm dễ sử dụng, dây đeo co giãn và có thể tái sử dụng.",

   avatar: "/image/reviews/customer-2.jpg",
  },
 ],
};
