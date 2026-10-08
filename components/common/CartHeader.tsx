"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { LiaShoppingCartSolid } from "react-icons/lia";
import { IoClose } from "react-icons/io5";
import Link from "next/link";

export default function CartHeader() {
 const [cart, setCart] = useState<any[]>([]);
 const [isOpen, setIsOpen] = useState(false);
 const [isMounted, setIsMounted] = useState(false);

 const getCartFromStorage = () => {
  const savedCart = localStorage.getItem("watches_cart");

  if (savedCart) {
   try {
    setCart(JSON.parse(savedCart));
   } catch {
    setCart([]);
   }
  } else {
   setCart([]);
  }
 };

 useEffect(() => {
  setIsMounted(true);

  // Lấy cart lần đầu
  getCartFromStorage();

  // Chỉ cập nhật dữ liệu cart
  const handleCartUpdated = () => {
   getCartFromStorage();
  };

  // Chỉ mở popper khi Add to Cart
  const handleCartAdded = () => {
   getCartFromStorage();
   setIsOpen(true);
  };

  window.addEventListener("cartUpdated", handleCartUpdated);
  window.addEventListener("cartAdded", handleCartAdded);

  return () => {
   window.removeEventListener("cartUpdated", handleCartUpdated);
   window.removeEventListener("cartAdded", handleCartAdded);
  };
 }, []);

 // Khóa scroll khi Cart mở trên mobile
 useEffect(() => {
  if (!isOpen) return;

  const originalOverflow = document.body.style.overflow;

  document.body.style.overflow = "hidden";

  return () => {
   document.body.style.overflow = originalOverflow;
  };
 }, [isOpen]);

 const cartQuantity = cart.reduce((total, item) => total + (item.quantity || 0), 0);

 const cartPopper =
  isOpen && isMounted
   ? createPortal(
      <div className="fixed inset-0 z-[9999999]">
       {/* OVERLAY DESKTOP */}
       <div onClick={() => setIsOpen(false)} className="absolute inset-0 bg-black/30" />

       {/* CART POPPER */}
       <div
        className="
         absolute
         inset-0
         flex
         flex-col
         bg-white
         shadow-2xl

         md:inset-y-0
         md:left-auto
         md:right-0
         md:w-[480px]
        ">
        {/* HEADER */}
        <div className="flex shrink-0 items-center justify-between border-b border-gray-200 p-5 md:p-6">
         <div>
          <h2 className="text-xl font-bold text-[#303234]">Your Cart</h2>

          <p className="mt-1 text-sm text-gray-500">
           {cartQuantity} item
           {cartQuantity !== 1 ? "s" : ""} in your cart
          </p>
         </div>

         {/* CLOSE */}
         <button
          type="button"
          onClick={() => setIsOpen(false)}
          className="flex h-10 w-10 items-center justify-center rounded-full transition hover:bg-gray-100"
          aria-label="Close cart">
          <IoClose size={26} />
         </button>
        </div>

        {/* CART PRODUCTS */}
        <div className="min-h-0 flex-1 overflow-y-auto p-5 md:p-6">
         {cart.length === 0 ? (
          <div className="flex min-h-full flex-col items-center justify-center py-16 text-center">
           <LiaShoppingCartSolid size={55} className="text-gray-300" />

           <p className="mt-5 text-gray-500">Your cart is empty</p>
          </div>
         ) : (
          <div className="space-y-5">
           {cart.map((item, index) => (
            <div key={`${item.id}-${index}`} className="flex gap-4 border-b border-gray-100 pb-5">
             {/* IMAGE */}
             <div
              className="h-24 w-20 shrink-0 bg-contain bg-center bg-no-repeat md:h-28 md:w-24"
              style={{
               backgroundImage: `url(${item.image || item.images?.main || ""})`,
              }}
             />

             {/* INFO */}
             <div className="min-w-0 flex-1">
              <h3 className="text-sm font-bold text-[#303234]">{item.name}</h3>

              {item.title && <p className="mt-1 text-xs leading-relaxed text-gray-500">{item.title}</p>}

              <div className="mt-4 flex items-end justify-between gap-3">
               <span className="text-sm text-gray-500">Quantity: {item.quantity}</span>

               <span className="text-right text-sm font-bold text-[#303234]">
                {item.currency || "MYR"} {((item.priceNew || item.price || 0) * (item.quantity || 1)).toLocaleString()}
               </span>
              </div>
             </div>
            </div>
           ))}
          </div>
         )}
        </div>

        {/* FOOTER */}
        {cart.length > 0 && (
         <div className="shrink-0 border-t border-gray-200 bg-white p-5 md:p-6">
          <Link
           href="/order/cart"
           onClick={() => setIsOpen(false)}
           className="flex w-full items-center justify-center rounded-full bg-[var(--primary-color)] py-4 font-bold text-white transition hover:opacity-90">
           View Cart
          </Link>
         </div>
        )}
       </div>
      </div>,
      document.body,
     )
   : null;

 return (
  <>
   {/* CART BUTTON */}
   <div className="relative">
    <button type="button" data-cart-icon onClick={() => setIsOpen((prev) => !prev)} className="relative flex items-center justify-center gap-1">
     <div className="relative">
      <LiaShoppingCartSolid size={26} />

      {cartQuantity > 0 && (
       <div className="absolute -right-2 -top-1 flex h-3 w-3 items-center justify-center rounded-full bg-[var(--primary-color)]">
        <span className="text-[6px] text-white">{cartQuantity}</span>
       </div>
      )}
     </div>

     <span className="hidden lg:block">Cart</span>
    </button>
   </div>

   {/* CART POPPER */}
   {cartPopper}
  </>
 );
}
