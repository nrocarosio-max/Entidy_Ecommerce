import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import Image from "next/image";
import Link from "next/link";

import { FaChevronLeft, FaChevronRight, FaMinus, FaPlus, FaShoppingBag, FaStore } from "react-icons/fa";

import { addToCart } from "~/lib/cart";

type Brand = {
 _id: string;
 name: string;
 slug: string;
 logo?: string;
 description?: string;
};

type Category = {
 _id: string;
 name: string;
 slug: string;
 description?: string;
 image?: string;
 parentId?: string | null;
};

type Product = {
 _id: string;
 storeId: string;
 name: string;
 slug: string;
 sku: string;
 description: string;
 categoryId?: Category | null;
 brandId?: Brand | null;
 price: number;
 compareAtPrice?: number | null;
 costPrice?: number | null;
 currency: string;
 images: string[];
 tryOnImage?: string;
 videos: string[];
 quantity: number;
 lowStockThreshold: number;
 status: "DRAFT" | "ACTIVE" | "INACTIVE" | "OUT_OF_STOCK";
 isFeatured: boolean;
 isActive: boolean;
};

type Store = {
 _id: string;
 name: string;
 slug: string;
 description?: string;
 logo?: string;
 email?: string;
 phone?: string;
 address?: string;
};

type ApiResponse = {
 success: boolean;
 message?: string;
 product?: Product;
 store?: Store;
};

export default function ProductDetailPage() {
 const router = useRouter();

 const { storeSlug, productSlug } = router.query;

 const [product, setProduct] = useState<Product | null>(null);
 const [store, setStore] = useState<Store | null>(null);

 const [loading, setLoading] = useState(true);
 const [error, setError] = useState("");

 const [selectedImage, setSelectedImage] = useState(0);
 const [quantity, setQuantity] = useState(1);
 const [addedToCart, setAddedToCart] = useState(false);

 /*
  * ============================================================
  * FETCH PRODUCT
  * ============================================================
  */

 useEffect(() => {
  if (!router.isReady || typeof storeSlug !== "string" || typeof productSlug !== "string") {
   return;
  }

  const fetchProduct = async () => {
   try {
    setLoading(true);
    setError("");

    const response = await fetch(`/api/products/${encodeURIComponent(storeSlug)}/${encodeURIComponent(productSlug)}`);

    const data: ApiResponse = await response.json();

    if (!response.ok || !data.success || !data.product) {
     throw new Error(data.message || "Product not found.");
    }

    setProduct(data.product);
    setStore(data.store || null);
    setSelectedImage(0);
    setQuantity(1);
    setAddedToCart(false);
   } catch (error) {
    console.error("PRODUCT DETAIL FETCH ERROR:", error);

    setError(error instanceof Error ? error.message : "Unable to load product.");
   } finally {
    setLoading(false);
   }
  };

  fetchProduct();
 }, [router.isReady, storeSlug, productSlug]);

 /*
  * ============================================================
  * FORMAT PRICE
  * ============================================================
  */

 const formatPrice = (price: number) => {
  if (!product) {
   return "";
  }

  return new Intl.NumberFormat("en-US", {
   style: "currency",
   currency: product.currency || "VNĐ",
   maximumFractionDigits: 0,
  }).format(price);
 };

 /*
  * ============================================================
  * DISCOUNT
  * ============================================================
  */

 const discountPercentage = useMemo(() => {
  if (!product?.compareAtPrice || product.compareAtPrice <= product.price) {
   return 0;
  }

  return Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100);
 }, [product]);

 /*
  * ============================================================
  * STOCK
  * ============================================================
  */

 const isOutOfStock = !product || product.quantity <= 0 || product.status === "OUT_OF_STOCK";

 const isLowStock = !!product && !isOutOfStock && product.quantity <= product.lowStockThreshold;

 /*
  * ============================================================
  * QUANTITY
  * ============================================================
  */

 const increaseQuantity = () => {
  if (!product) {
   return;
  }

  setQuantity((current) => Math.min(current + 1, product.quantity));

  setAddedToCart(false);
 };

 const decreaseQuantity = () => {
  setQuantity((current) => Math.max(current - 1, 1));

  setAddedToCart(false);
 };

 /*
  * ============================================================
  * ADD TO CART
  * ============================================================
  */

 const handleAddToCart = () => {
  if (!product || !store || isOutOfStock) {
   return;
  }

  addToCart(
   {
    _id: product._id,
    name: product.name,
    slug: product.slug,
    sku: product.sku,
    price: product.price,
    compareAtPrice: product.compareAtPrice,
    currency: product.currency,
    images: product.images,
    quantity: product.quantity,
    storeId: product.storeId,
    storeSlug: store.slug,
    storeName: store.name,
   },
   quantity,
  );

  setAddedToCart(true);

  window.setTimeout(() => {
   setAddedToCart(false);
  }, 3000);
 };

 /*
  * ============================================================
  * IMAGE NAVIGATION
  * ============================================================
  */

 const images = product?.images || [];

 const nextImage = () => {
  if (images.length <= 1) {
   return;
  }

  setSelectedImage((current) => (current === images.length - 1 ? 0 : current + 1));
 };

 const previousImage = () => {
  if (images.length <= 1) {
   return;
  }

  setSelectedImage((current) => (current === 0 ? images.length - 1 : current - 1));
 };

 /*
  * ============================================================
  * LOADING
  * ============================================================
  */

 if (loading) {
  return (
   <main className="min-h-screen bg-white">
    <div className="container py-8 md:py-12">
     <div className="animate-pulse">
      <div className="mb-8 h-4 w-64 rounded bg-gray-200" />

      <div className="grid gap-10 lg:grid-cols-2">
       <div className="aspect-square rounded bg-gray-100" />

       <div className="space-y-6">
        <div className="h-4 w-32 rounded bg-gray-200" />

        <div className="h-10 w-3/4 rounded bg-gray-200" />

        <div className="h-8 w-48 rounded bg-gray-200" />

        <div className="h-24 rounded bg-gray-200" />

        <div className="h-12 rounded bg-gray-200" />
       </div>
      </div>
     </div>
    </div>
   </main>
  );
 }

 /*
  * ============================================================
  * ERROR
  * ============================================================
  */

 if (error || !product) {
  return (
   <main className="min-h-screen bg-white">
    <div className="container flex min-h-[60vh] items-center justify-center py-16">
     <div className="max-w-md text-center">
      <div className="mb-5 text-6xl font-light text-gray-300">404</div>

      <h1 className="text-2xl font-semibold text-gray-900">Product not found</h1>

      <p className="mt-3 text-sm leading-6 text-gray-500">{error || "The product you are looking for does not exist or is no longer available."}</p>

      {storeSlug && typeof storeSlug === "string" && (
       <Link
        href={`/store/${storeSlug}`}
        className="mt-8 inline-flex items-center justify-center rounded-md bg-black px-6 py-3 text-sm font-medium text-white transition hover:bg-gray-800">
        Back to store
       </Link>
      )}
     </div>
    </div>
   </main>
  );
 }

 /*
  * ============================================================
  * MAIN PRODUCT DETAIL
  * ============================================================
  */

 return (
  <main className="min-h-screen bg-white">
   <div className="container py-6 md:py-10">
    {/* Breadcrumb */}
    <nav className="mb-8 flex flex-wrap items-center gap-2 text-xs text-gray-500">
     <Link href="/" className="transition hover:text-black">
      Home
     </Link>

     <span>/</span>

     {store && (
      <>
       <Link href={`/store/${store.slug}`} className="transition hover:text-black">
        {store.name}
       </Link>

       <span>/</span>
      </>
     )}

     {product.categoryId && (
      <>
       <span className="text-gray-400">{product.categoryId.name}</span>

       <span>/</span>
      </>
     )}

     <span className="max-w-[240px] truncate text-gray-900">{product.name}</span>
    </nav>

    <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
     {/* =====================================================
              PRODUCT GALLERY
              ===================================================== */}

     <section>
      <div className="relative overflow-hidden bg-gray-100">
       {images.length > 0 ? (
        <>
         <div className="relative aspect-square">
          <Image src={images[selectedImage]} alt={product.name} fill priority className="object-cover" sizes="(max-width: 1024px) 100vw, 50vw" />
         </div>

         {images.length > 1 && (
          <>
           <button
            type="button"
            onClick={previousImage}
            aria-label="Previous image"
            className="absolute left-4 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-gray-800 shadow-sm transition hover:bg-white">
            <FaChevronLeft size={12} />
           </button>

           <button
            type="button"
            onClick={nextImage}
            aria-label="Next image"
            className="absolute right-4 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-gray-800 shadow-sm transition hover:bg-white">
            <FaChevronRight size={12} />
           </button>
          </>
         )}

         {discountPercentage > 0 && <div className="absolute left-4 top-4 bg-black px-3 py-1.5 text-xs font-semibold text-white">-{discountPercentage}%</div>}
        </>
       ) : (
        <div className="flex aspect-square items-center justify-center text-sm text-gray-400">No image available</div>
       )}
      </div>

      {/* Thumbnail gallery */}
      {images.length > 1 && (
       <div className="mt-4 grid grid-cols-5 gap-3 sm:grid-cols-6">
        {images.map((image, index) => (
         <button
          key={`${image}-${index}`}
          type="button"
          onClick={() => setSelectedImage(index)}
          className={`relative aspect-square overflow-hidden border transition ${
           selectedImage === index ? "border-black" : "border-gray-200 hover:border-gray-400"
          }`}>
          <Image src={image} alt={`${product.name} ${index + 1}`} fill className="object-cover" sizes="100px" />
         </button>
        ))}
       </div>
      )}

      {/* Try-on image */}
      {product.tryOnImage && (
       <div className="mt-8 border border-gray-200 p-5">
        <div className="mb-4">
         <h3 className="text-sm font-semibold text-gray-900">Try On</h3>

         <p className="mt-1 text-xs text-gray-500">See how this product looks before ordering.</p>
        </div>

        <div className="relative aspect-[4/5] overflow-hidden bg-gray-100">
         <Image src={product.tryOnImage} alt={`${product.name} try on`} fill className="object-cover" sizes="(max-width: 1024px) 100vw, 50vw" />
        </div>
       </div>
      )}
     </section>

     {/* =====================================================
              PRODUCT INFORMATION
              ===================================================== */}

     <section className="flex flex-col">
      {/* Brand */}
      {product.brandId && (
       <div className="mb-3 flex items-center gap-3">
        {product.brandId.logo && (
         <div className="relative h-8 w-8 overflow-hidden">
          <Image src={product.brandId.logo} alt={product.brandId.name} fill className="object-contain" sizes="32px" />
         </div>
        )}

        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">{product.brandId.name}</span>
       </div>
      )}

      {/* Name */}
      <h1 className="text-3xl font-semibold tracking-tight text-gray-950 md:text-4xl">{product.name}</h1>

      {/* SKU */}
      <div className="mt-3 text-xs text-gray-500">
       SKU: <span className="font-medium text-gray-700">{product.sku}</span>
      </div>

      {/* Price */}
      <div className="mt-7 flex flex-wrap items-center gap-3">
       <span className="text-2xl font-semibold text-gray-950">{formatPrice(product.price)}</span>

       {product.compareAtPrice && product.compareAtPrice > product.price && (
        <span className="text-base text-gray-400 line-through">{formatPrice(product.compareAtPrice)}</span>
       )}
      </div>

      {/* Stock */}
      <div className="mt-5">
       {isOutOfStock ? (
        <div className="inline-flex items-center rounded-full bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700">Out of stock</div>
       ) : isLowStock ? (
        <div className="inline-flex items-center rounded-full bg-orange-50 px-3 py-1.5 text-xs font-medium text-orange-700">Only {product.quantity} left</div>
       ) : (
        <div className="inline-flex items-center rounded-full bg-green-50 px-3 py-1.5 text-xs font-medium text-green-700">In stock</div>
       )}
      </div>

      {/* Description */}
      {product.description && (
       <div className="mt-8 border-t border-gray-200 pt-7">
        <h2 className="text-sm font-semibold uppercase tracking-[0.15em] text-gray-900">Description</h2>

        <div className="mt-4 whitespace-pre-line text-sm leading-7 text-gray-600">{product.description}</div>
       </div>
      )}

      {/* Category */}
      {product.categoryId && (
       <div className="mt-7 flex items-center justify-between border-t border-gray-200 pt-5 text-sm">
        <span className="text-gray-500">Category</span>

        <span className="font-medium text-gray-900">{product.categoryId.name}</span>
       </div>
      )}

      {/* Store */}
      {store && (
       <div className="mt-4 flex items-start gap-3 border-t border-gray-200 pt-5">
        <FaStore className="mt-0.5 text-gray-400" size={14} />

        <div>
         <div className="text-xs font-semibold uppercase tracking-[0.12em] text-gray-900">{store.name}</div>

         {store.address && <p className="mt-1 text-xs leading-5 text-gray-500">{store.address}</p>}
        </div>
       </div>
      )}

      {/* Purchase */}
      <div className="mt-8 border-t border-gray-200 pt-7">
       <div className="flex flex-col gap-4 sm:flex-row">
        {/* Quantity */}
        <div className="flex h-12 items-center border border-gray-300">
         <button
          type="button"
          onClick={decreaseQuantity}
          disabled={isOutOfStock || quantity <= 1}
          className="flex h-full w-11 items-center justify-center text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Decrease quantity">
          <FaMinus size={11} />
         </button>

         <span className="flex h-full min-w-[44px] items-center justify-center border-x border-gray-300 text-sm font-medium">{quantity}</span>

         <button
          type="button"
          onClick={increaseQuantity}
          disabled={isOutOfStock || quantity >= product.quantity}
          className="flex h-full w-11 items-center justify-center text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Increase quantity">
          <FaPlus size={11} />
         </button>
        </div>

        {/* Add to cart */}
        <button
         type="button"
         onClick={handleAddToCart}
         disabled={isOutOfStock || !store}
         className={`flex h-12 flex-1 items-center justify-center gap-3 px-6 text-sm font-semibold text-white transition ${
          isOutOfStock || !store ? "cursor-not-allowed bg-gray-300" : addedToCart ? "bg-green-600 hover:bg-green-600" : "bg-black hover:bg-gray-800"
         }`}>
         <FaShoppingBag size={15} />

         {isOutOfStock ? "Out of stock" : addedToCart ? "Added to cart" : "Add to cart"}
        </button>
       </div>

       {/* Add to cart success */}
       {addedToCart && (
        <div className="mt-3 rounded-md bg-green-50 px-4 py-3 text-center text-xs font-medium text-green-700">Product added to your cart successfully.</div>
       )}

       {!isOutOfStock && <p className="mt-3 text-center text-xs text-gray-400">Maximum available quantity: {product.quantity}</p>}
      </div>
     </section>
    </div>

    {/* =======================================================
            PRODUCT VIDEOS
            ======================================================= */}

    {product.videos?.length > 0 && (
     <section className="mt-16 border-t border-gray-200 pt-12 md:mt-24">
      <div className="mb-8">
       <h2 className="text-2xl font-semibold text-gray-950">Product Videos</h2>

       <p className="mt-2 text-sm text-gray-500">Explore more details about this product.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
       {product.videos.map((video, index) => (
        <div key={`${video}-${index}`} className="overflow-hidden bg-black">
         <video src={video} controls playsInline className="aspect-video h-full w-full object-cover">
          Your browser does not support the video tag.
         </video>
        </div>
       ))}
      </div>
     </section>
    )}
   </div>
  </main>
 );
}

ProductDetailPage.Layout = "Default";
