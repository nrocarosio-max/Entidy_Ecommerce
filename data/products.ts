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
 videos: string[];
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

/* =====================================================
   ORDER PAYLOAD
===================================================== */

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

export const productData: ProductDetail[] = [
 // ===================================================
 // PRODUCT 1: ĐAI ĐỊNH HÌNH MẶT
 // ===================================================

 {
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
  ],

  videos: [],

  price: 99000,
  originalPrice: 247500,

  shortDescription:
   "Đai định hình khuôn mặt là phụ kiện chăm sóc sắc đẹp dành cho cả nam và nữ, giúp nâng đỡ vùng da mặt, hỗ trợ hạn chế tình trạng da chảy xệ và tạo cảm giác khuôn mặt thon gọn, săn chắc hơn.",

  description:
   "Đai nâng cơ mặt V-Line giúp bạn chăm sóc vùng cằm và đường viền hàm ngay tại nhà. Thiết kế ôm sát vùng cằm – má, sử dụng lực kéo vật lý giúp nâng đỡ vùng da mặt. Có chất liệu co giãn, mềm mại, dễ điều chỉnh và tái sử dụng. Dễ dàng đeo khi thư giãn hoặc làm việc. Sử dụng theo hướng dẫn để có trải nghiệm thoải mái.",

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

  benefits: [
   "Hỗ trợ nâng đỡ da mặt.",
   "Tạo cảm giác đường nét V-line.",
   "Định hình vùng cằm.",
   "Hỗ trợ vùng da chảy xệ.",
   "Có thể giặt và tái sử dụng theo hướng dẫn.",
  ],

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
 },

 // ===================================================
 // PRODUCT 2: XÀ PHÒNG GỘI THẢO DƯỢC GREENSEVEN
 // ===================================================

 {
  _id: "6afaccc10106508fc7b0d3df",
  productId: "6afaccc10106508fc7b0d3df",
  storeId: "6ac893cea0eb14f70dafb234",

  name: "Xà phòng thảo dược tân cương 120g",
  slug: "xa-phong-thao-duoc-tan-cuong-120g",

  category: "Chăm sóc tóc",

  images: ["/image/soap/vn-11134207-81ztc-ml20v0ghmy9t88.webp"],

  videos: ["/image/soap/sg-11110106-6vkta-mv4nikz463npcd.16000031793796409.mp4"],

  // Cập nhật giá bán thực tế
  price: 129000,
  originalPrice: 189000,

  shortDescription:
   "Xà phòng gội thảo dược GREENSEVEN Cỏ Usma Tân Cương 120g, kết hợp 29 loại thảo mộc tự nhiên. Sản phẩm dạng bánh tiện lợi, hỗ trợ làm sạch tóc và da đầu, chăm sóc tóc và kiểm soát dầu.",

  description:
   "GREENSEVEN Xà Phòng Gội Thảo Dược Cỏ Usma Tân Cương 120g là sản phẩm chăm sóc tóc dạng bánh, được giới thiệu với công thức kết hợp 29 loại thảo mộc tự nhiên. Sản phẩm hướng đến nhu cầu làm sạch tóc và da đầu, hỗ trợ kiểm soát dầu, làm sạch gàu và chăm sóc tóc. Thiết kế dạng bánh nhỏ gọn, tiện lợi cho việc bảo quản và sử dụng hằng ngày.",

  badges: ["29 loại thảo mộc", "Khối lượng 120g", "GREENSEVEN"],

  features: [
   "Kết hợp 29 loại thảo mộc tự nhiên",
   "Dạng bánh xà phòng gội đầu tiện lợi",
   "Hỗ trợ làm sạch tóc và da đầu",
   "Hỗ trợ kiểm soát dầu trên da đầu",
   "Hỗ trợ làm sạch gàu",
   "Tiện lợi khi sử dụng và bảo quản",
  ],

  benefits: [
   "Hỗ trợ làm sạch tóc và da đầu.",
   "Hỗ trợ loại bỏ dầu thừa và bụi bẩn.",
   "Hỗ trợ làm sạch gàu trên da đầu.",
   "Hỗ trợ chăm sóc tóc chắc khỏe.",
   "Mang đến trải nghiệm gội đầu với thảo mộc tự nhiên.",
  ],

  ingredients: ["Cỏ Usma", "29 loại thảo mộc tự nhiên"],

  usageSteps: [
   {
    title: "Làm ướt tóc",
    description: "Làm ướt toàn bộ tóc và da đầu bằng nước sạch trước khi gội.",
   },
   {
    title: "Tạo bọt xà phòng",
    description: "Làm ướt bánh xà phòng, xoa nhẹ để tạo bọt trên tay.",
   },
   {
    title: "Massage da đầu",
    description: "Thoa bọt lên tóc và da đầu, massage nhẹ nhàng để làm sạch.",
   },
   {
    title: "Xả sạch với nước",
    description: "Xả kỹ tóc và da đầu bằng nước sạch sau khi gội.",
   },
  ],

  specifications: [
   {
    label: "Tên sản phẩm",
    value: "Xà Phòng Gội Thảo Dược Cỏ Usma Tân Cương",
   },
   {
    label: "Thương hiệu",
    value: "GREENSEVEN",
   },
   {
    label: "Khối lượng",
    value: "120g",
   },
   {
    label: "Dạng sản phẩm",
    value: "Xà phòng gội đầu dạng bánh",
   },
   {
    label: "Thành phần nổi bật",
    value: "Cỏ Usma và 29 loại thảo mộc",
   },
   {
    label: "Công dụng",
    value: "Làm sạch tóc và chăm sóc da đầu",
   },
   {
    label: "Đối tượng sử dụng",
    value: "Người có nhu cầu chăm sóc tóc và da đầu",
   },
  ],

  origin: "Cần xác nhận theo thông tin trên bao bì",

  shippingText: "Hỗ trợ giao hàng toàn quốc",

  warrantyText: "Hỗ trợ đổi trả theo chính sách cửa hàng",

  reviews: [],
 },
];
