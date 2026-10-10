import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";

import { FaArrowLeft, FaMinus, FaPlus, FaShoppingBag, FaTrash } from "react-icons/fa";

import { CartItem, getCart, getCartItemCount, getCartSubtotal, removeFromCart, updateCartQuantity } from "~/lib/cart";

export default function CartPage() {
 const [cart, setCart] = useState<CartItem[]>([]);
 const [loading, setLoading] = useState(true);

 /*
  * ============================================================
  * LOAD CART
  * ============================================================
  */

 useEffect(() => {
  const loadCart = () => {
   setCart(getCart());
   setLoading(false);
  };

  loadCart();

  const handleCartUpdated = () => {
   loadCart();
  };

  window.addEventListener("cartUpdated", handleCartUpdated);

  return () => {
   window.removeEventListener("cartUpdated", handleCartUpdated);
  };
 }, []);

 /*
  * ============================================================
  * UPDATE QUANTITY
  * ============================================================
  */

 const handleQuantityChange = (productId: string, quantity: number) => {
  const updatedCart = updateCartQuantity(productId, quantity);

  setCart(updatedCart);
 };

 /*
  * ============================================================
  * REMOVE ITEM
  * ============================================================
  */

 const handleRemove = (productId: string) => {
  const updatedCart = removeFromCart(productId);

  setCart(updatedCart);
 };

 /*
  * ============================================================
  * FORMAT PRICE
  * ============================================================
  */

 const formatPrice = (price: number, currency: string) => {
  return new Intl.NumberFormat("en-US", {
   style: "currency",
   currency: currency || "VNĐ",
   maximumFractionDigits: 0,
  }).format(price);
 };

 /*
  * ============================================================
  * TOTALS
  * ============================================================
  */

 const itemCount = getCartItemCount();

 const subtotal = getCartSubtotal();

 /*
  * ============================================================
  * LOADING
  * ============================================================
  */

 if (loading) {
  return (
   <main className="min-h-screen bg-white">
    <div className="container py-10 md:py-16">
     <div className="animate-pulse">
      <div className="h-8 w-32 rounded bg-gray-200" />

      <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_380px]">
       <div className="space-y-4">
        {[1, 2, 3].map((item) => (
         <div key={item} className="flex gap-5 border-b border-gray-200 pb-6">
          <div className="h-32 w-32 rounded bg-gray-200" />

          <div className="flex-1 space-y-3">
           <div className="h-5 w-1/2 rounded bg-gray-200" />

           <div className="h-4 w-1/3 rounded bg-gray-200" />

           <div className="h-10 w-32 rounded bg-gray-200" />
          </div>
         </div>
        ))}
       </div>

       <div className="h-64 rounded bg-gray-100" />
      </div>
     </div>
    </div>
   </main>
  );
 }

 /*
  * ============================================================
  * EMPTY CART
  * ============================================================
  */

 if (cart.length === 0) {
  return (
   <main className="min-h-screen bg-white">
    <div className="container flex min-h-[70vh] items-center justify-center py-16">
     <div className="w-full max-w-md text-center">
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gray-100">
       <FaShoppingBag size={28} className="text-gray-400" />
      </div>

      <h1 className="mt-7 text-3xl font-semibold tracking-tight text-gray-950">Your cart is empty</h1>

      <p className="mt-3 text-sm leading-6 text-gray-500">You haven't added any products to your cart yet.</p>

      <Link
       href="/"
       className="mt-8 inline-flex h-12 items-center justify-center gap-2 bg-black px-7 text-sm font-semibold text-white transition hover:bg-gray-800">
       <FaArrowLeft size={12} />
       Continue Shopping
      </Link>
     </div>
    </div>
   </main>
  );
 }

 /*
  * ============================================================
  * CART PAGE
  * ============================================================
  */

 return (
  <main className="min-h-screen bg-white">
   <div className="container py-8 md:py-12">
    {/* Header */}
    <div className="border-b border-gray-200 pb-6">
     <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
       <h1 className="text-3xl font-semibold tracking-tight text-gray-950 md:text-4xl">Shopping Cart</h1>

       <p className="mt-2 text-sm text-gray-500">
        {itemCount} {itemCount === 1 ? "item" : "items"} in your cart
       </p>
      </div>

      <Link href="/" className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 transition hover:text-black">
       <FaArrowLeft size={11} />
       Continue Shopping
      </Link>
     </div>
    </div>

    <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_380px] lg:items-start">
     {/* =====================================================
              CART ITEMS
              ===================================================== */}

     <section>
      <div className="divide-y divide-gray-200 border-y border-gray-200">
       {cart.map((item) => {
        const product = item.product;

        const itemTotal = product.price * item.quantity;

        return (
         <article key={product._id} className="py-6">
          <div className="flex gap-4 sm:gap-6">
           {/* Product Image */}
           <Link
            href={`/store/${product.storeSlug}/product/${product.slug}`}
            className="relative h-28 w-28 flex-shrink-0 overflow-hidden bg-gray-100 sm:h-36 sm:w-36">
            {product.images?.[0] ? (
             <Image src={product.images[0]} alt={product.name} fill className="object-cover" sizes="144px" />
            ) : (
             <div className="flex h-full items-center justify-center text-xs text-gray-400">No image</div>
            )}
           </Link>

           {/* Product Information */}
           <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-4">
             <div className="min-w-0">
              <Link
               href={`/store/${product.storeSlug}/product/${product.slug}`}
               className="line-clamp-2 text-base font-semibold text-gray-950 transition hover:text-gray-600 sm:text-lg">
               {product.name}
              </Link>

              <div className="mt-1 text-xs text-gray-500">
               SKU: <span className="text-gray-700">{product.sku}</span>
              </div>

              <div className="mt-1 text-xs text-gray-500">
               Store: <span className="font-medium text-gray-700">{product.storeName}</span>
              </div>
             </div>

             {/* Remove */}
             <button
              type="button"
              onClick={() => handleRemove(product._id)}
              aria-label={`Remove ${product.name}`}
              className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-gray-400 transition hover:bg-red-50 hover:text-red-600">
              <FaTrash size={13} />
             </button>
            </div>

            {/* Price */}
            <div className="mt-4 flex flex-wrap items-center gap-2">
             <span className="text-base font-semibold text-gray-950">{formatPrice(product.price, product.currency)}</span>

             {product.compareAtPrice && product.compareAtPrice > product.price && (
              <span className="text-xs text-gray-400 line-through">{formatPrice(product.compareAtPrice, product.currency)}</span>
             )}
            </div>

            {/* Quantity + Total */}
            <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
             <div className="flex h-10 items-center border border-gray-300">
              <button
               type="button"
               onClick={() => handleQuantityChange(product._id, item.quantity - 1)}
               disabled={item.quantity <= 1}
               className="flex h-full w-9 items-center justify-center text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-30"
               aria-label="Decrease quantity">
               <FaMinus size={9} />
              </button>

              <span className="flex h-full min-w-[40px] items-center justify-center border-x border-gray-300 text-sm font-medium">{item.quantity}</span>

              <button
               type="button"
               onClick={() => handleQuantityChange(product._id, item.quantity + 1)}
               disabled={item.quantity >= product.quantity}
               className="flex h-full w-9 items-center justify-center text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-30"
               aria-label="Increase quantity">
               <FaPlus size={9} />
              </button>
             </div>

             <div className="text-right">
              <div className="text-xs text-gray-500">Item total</div>

              <div className="mt-1 text-sm font-semibold text-gray-950">{formatPrice(itemTotal, product.currency)}</div>
             </div>
            </div>

            {/* Stock warning */}
            {product.quantity <= product.quantity && <div className="mt-3 text-xs text-gray-400">{product.quantity} available</div>}
           </div>
          </div>
         </article>
        );
       })}
      </div>
     </section>

     {/* =====================================================
              ORDER SUMMARY
              ===================================================== */}

     <aside className="lg:sticky lg:top-24">
      <div className="border border-gray-200 bg-gray-50 p-6 sm:p-7">
       <h2 className="text-lg font-semibold text-gray-950">Order Summary</h2>

       <div className="mt-6 space-y-4 border-b border-gray-200 pb-6">
        <div className="flex items-center justify-between gap-4 text-sm">
         <span className="text-gray-500">Items</span>

         <span className="font-medium text-gray-900">{itemCount}</span>
        </div>

        <div className="flex items-center justify-between gap-4 text-sm">
         <span className="text-gray-500">Subtotal</span>

         <span className="font-semibold text-gray-950">{formatPrice(subtotal, cart[0]?.product.currency || "VNĐ")}</span>
        </div>

        <div className="flex items-center justify-between gap-4 text-sm">
         <span className="text-gray-500">Shipping</span>

         <span className="font-medium text-gray-900">Calculated at checkout</span>
        </div>
       </div>

       <div className="flex items-center justify-between gap-4 py-6">
        <span className="text-base font-semibold text-gray-950">Total</span>

        <span className="text-xl font-semibold text-gray-950">{formatPrice(subtotal, cart[0]?.product.currency || "VNĐ")}</span>
       </div>

       <Link
        href="/checkout"
        className="flex h-12 w-full items-center justify-center bg-black px-6 text-sm font-semibold text-white transition hover:bg-gray-800">
        Proceed to Checkout
       </Link>

       <p className="mt-4 text-center text-xs leading-5 text-gray-400">Secure checkout. Your order information will be handled securely.</p>
      </div>

      {/* Store notice */}
      <div className="mt-4 border border-gray-200 p-5">
       <h3 className="text-sm font-semibold text-gray-900">Shopping from</h3>

       <p className="mt-2 text-xs leading-5 text-gray-500">
        Your cart can contain products from multiple stores. Store and shipping information will be confirmed during checkout.
       </p>
      </div>
     </aside>
    </div>
   </div>
  </main>
 );
}

CartPage.Layout = "Default";
