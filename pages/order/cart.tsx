import { useEffect, useMemo, useRef, useState } from "react";
import { FaHeart, FaMinus, FaPlus, FaTrash, FaTruck, FaShieldAlt, FaCrown, FaArrowRight, FaExchangeAlt } from "react-icons/fa";

import { CityChainWatch } from "~/data/CityChainWatch";

import { useCountry } from "~/context/CountryContext";

interface CartItem extends CityChainWatch {
 quantity: number;
}

type CityChainCartItem = CityChainWatch & {
 quantity: number;
};

const MAX_QUANTITY = 2;

const Cart = () => {
 const { country, loading: countryLoading } = useCountry();
 const [cartItems, setCartItems] = useState<CityChainCartItem[]>([]);
 const [isLoaded, setIsLoaded] = useState(false);
 const previousCountry = useRef(country);

 // ==========================================
 // LOAD CART
 // ==========================================

 useEffect(() => {
  if (countryLoading) return;

  // Lần đầu load trang
  if (previousCountry.current === country) {
   try {
    const savedCart = localStorage.getItem("watches_cart");

    if (savedCart) {
     const parsedCart = JSON.parse(savedCart);

     if (Array.isArray(parsedCart)) {
      setCartItems(parsedCart);
     } else {
      setCartItems([]);
     }
    } else {
     setCartItems([]);
    }
   } catch (error) {
    console.error("Cannot load cart:", error);
    setCartItems([]);
   } finally {
    setIsLoaded(true);
   }

   return;
  }

  // Country đã thay đổi → clear cart
  previousCountry.current = country;

  setCartItems([]);
  localStorage.removeItem("watches_cart");

  window.dispatchEvent(new Event("cartUpdated"));

  setIsLoaded(true);
 }, [country, countryLoading]);
 // ==========================================
 // SAVE CART
 // ==========================================

 useEffect(() => {
  if (!isLoaded || countryLoading) return;

  localStorage.setItem("watches_cart", JSON.stringify(cartItems));

  window.dispatchEvent(new Event("cartUpdated"));
 }, [cartItems, isLoaded, countryLoading]);
 // ==========================================
 // TOTAL QUANTITY
 // ==========================================

 const totalItems = useMemo(() => {
  return cartItems.reduce((total, item) => {
   return total + item.quantity;
  }, 0);
 }, [cartItems]);

 // ==========================================
 // CURRENCY
 // ==========================================

 const currency = useMemo(() => {
  if (cartItems.length > 0) {
   return cartItems[0].currency;
  }

  return "SGD";
 }, [cartItems]);

 // ==========================================
 // LOCALE
 // ==========================================

 const locale = country === "MY" ? "en-MY" : "en-SG";

 // ==========================================
 // TOTAL PRICE
 // ==========================================

 const totalPrice = useMemo(() => {
  return cartItems.reduce((total, item) => {
   return total + Number(item.priceNew || item.price || 0) * item.quantity;
  }, 0);
 }, [cartItems]);

 // ==========================================
 // FORMAT PRICE
 // ==========================================

 const formatPrice = (price: number) => {
  return Number(price || 0).toLocaleString(locale, {
   minimumFractionDigits: 0,
   maximumFractionDigits: 0,
  });
 };

 // ==========================================
 // UPDATE QUANTITY
 // ==========================================

 const updateQuantity = (id: string, newQuantity: number) => {
  if (newQuantity < 1) return;

  if (newQuantity > MAX_QUANTITY) {
   alert(`A maximum of ${MAX_QUANTITY} watches of the same model can be added to your shopping bag.`);

   return;
  }

  setCartItems((prev) =>
   prev.map((item) =>
    item.id === id
     ? {
        ...item,
        quantity: newQuantity,
       }
     : item,
   ),
  );
 };

 // ==========================================
 // REMOVE ITEM
 // ==========================================

 const removeItem = (id: string) => {
  setCartItems((prev) => prev.filter((item) => item.id !== id));
 };

 // ==========================================
 // CLEAR CART
 // ==========================================

 const clearCart = () => {
  const confirmed = window.confirm("Are you sure you want to remove all items from your shopping bag?");

  if (!confirmed) return;

  setCartItems([]);
 };

 // ==========================================
 // GO CHECKOUT
 // ==========================================

 const handleCheckout = () => {
  if (!cartItems.length) {
   alert("Your shopping bag is empty.");
   return;
  }

  window.location.href = "/order/check-out";
 };

 // ==========================================
 // GO LIMITED DEALS
 // ==========================================

 const handleExploreWatches = () => {
  window.location.href = "/limited-deals";
 };

 // ==========================================
 // LOADING
 // ==========================================

 if (!isLoaded || countryLoading) {
  return (
   <main className="flex min-h-screen items-center justify-center bg-[#f8f8f6]">
    <p className="text-sm text-[#666]">Loading your shopping bag...</p>
   </main>
  );
 }

 return (
  <main className="min-h-screen bg-[#f8f8f6] text-[#303234]">
   {/* ==========================================
          PAGE HEADER
      ========================================== */}

   <section className="border-b border-[#dededb]">
    <div className="container py-10 text-center md:py-14">
     <p className="mb-4 text-xs font-semibold uppercase tracking-[0.25em] text-[#127749]">City Chain</p>

     <h1 className="text-3xl font-medium tracking-[0.15em] md:text-5xl">SHOPPING BAG</h1>

     {cartItems.length > 0 && (
      <p className="mt-5 text-sm text-[#666]">
       {totalItems} {totalItems === 1 ? "item" : "items"} in your shopping bag
      </p>
     )}
    </div>
   </section>

   {/* ==========================================
          EMPTY CART
      ========================================== */}

   {cartItems.length === 0 ? (
    <section className="container py-16 md:py-28">
     <div className="mx-auto max-w-[600px] text-center">
      <FaHeart className="mx-auto text-3xl text-[#127749]" />

      <h2 className="mt-7 text-2xl font-medium md:text-3xl">Your shopping bag is empty</h2>

      <p className="mx-auto mt-4 max-w-[400px] text-sm leading-7 text-[#666]">
       Discover our collection of exceptional timepieces and find the watch that is right for you.
      </p>

      <button
       type="button"
       onClick={handleExploreWatches}
       className="mt-8 bg-[#127749] px-10 py-4 text-sm font-semibold text-white transition hover:bg-[#0d5f39]">
       Explore watches
      </button>
     </div>
    </section>
   ) : (
    <>
     {/* ==========================================
              MAIN CART
          ========================================== */}

     <section className="container py-8 md:py-14">
      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_420px]">
       {/* ======================================
                  LEFT - PRODUCTS
              ====================================== */}

       <section className="border border-[#dededb] bg-white">
        {/* TABLE HEADER */}

        <div className="hidden border-b border-[#dededb] px-8 py-5 md:grid md:grid-cols-[minmax(0,1fr)_160px_150px]">
         <span className="text-xs font-semibold uppercase tracking-[0.15em] text-[#666]">Product</span>

         <span className="text-center text-xs font-semibold uppercase tracking-[0.15em] text-[#666]">Quantity</span>

         <span className="text-right text-xs font-semibold uppercase tracking-[0.15em] text-[#666]">Price</span>
        </div>

        {/* PRODUCTS */}

        {cartItems.map((item) => {
         const itemPrice = Number(item.priceNew || item.price || 0);

         const itemCurrency = item.currency;

         return (
          <div key={item.id} className="border-b border-[#dededb] p-5 last:border-b-0 md:p-8">
           <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_160px_150px] md:items-center">
            {/* PRODUCT */}

            <div className="flex gap-4 md:gap-7">
             {/* IMAGE */}

             <div className="flex h-[130px] w-[100px] shrink-0 items-center justify-center bg-[#f7f7f5] md:h-[170px] md:w-[140px]">
              <img src={item.images.main} alt={item.name} className="h-full w-full object-contain p-2" />
             </div>

             {/* INFO */}

             <div className="flex min-w-0 flex-1 flex-col justify-center">
              <h2 className="text-lg font-medium uppercase tracking-[0.08em] md:text-xl">{item.name}</h2>

              {item.brand && <p className="mt-3 text-sm leading-6 text-[#666]">{item.brand}</p>}
             </div>
            </div>

            {/* QUANTITY */}

            <div className="flex items-center justify-between gap-4">
             <div className="flex flex-col items-start md:items-center">
              <p className="mb-2 text-xs uppercase tracking-[0.12em] text-[#777] md:hidden">Quantity</p>

              <div className="flex h-11 items-center border border-[#dededb]">
               <button
                type="button"
                disabled={item.quantity <= 1}
                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                className="
                                  flex h-full w-11 cursor-pointer
                                  items-center justify-center
                                  transition hover:bg-[#f5f5f5]
                                  disabled:cursor-not-allowed
                                  disabled:opacity-30
                                ">
                <FaMinus size={11} />
               </button>

               <span className="flex h-full min-w-[46px] items-center justify-center border-x border-[#dededb] text-sm font-medium">{item.quantity}</span>

               <button
                type="button"
                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                className="
                                  flex h-full w-11 cursor-pointer
                                  items-center justify-center
                                  transition hover:bg-[#f5f5f5]
                                ">
                <FaPlus size={11} />
               </button>
              </div>

              <button
               type="button"
               onClick={() => removeItem(item.id)}
               className="
                                mt-4 flex cursor-pointer items-center gap-2
                                text-xs uppercase tracking-[0.12em]
                                text-[#666] transition hover:text-red-600
                              ">
               <FaTrash size={11} />
               Remove
              </button>
             </div>

             {/* MOBILE PRICE */}

             <div className="mt-4 font-semibold md:hidden">
              {itemCurrency} {formatPrice(itemPrice * item.quantity)}
             </div>
            </div>

            {/* DESKTOP PRICE */}

            <div className="hidden text-right font-semibold md:block">
             {itemCurrency} {formatPrice(itemPrice * item.quantity)}
            </div>
           </div>
          </div>
         );
        })}

        {/* CART ACTIONS */}

        <div className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between md:px-8 md:py-6">
         <button
          type="button"
          onClick={clearCart}
          className="flex items-center gap-2 text-xs uppercase tracking-[0.12em] text-[#555] transition hover:text-red-600">
          <FaTrash />
          Clear shopping bag
         </button>
        </div>
       </section>

       {/* ======================================
                  RIGHT - ORDER SUMMARY
              ====================================== */}

       <aside className="xl:sticky xl:top-6 xl:h-fit">
        <div className="border border-[#dededb] bg-white p-6 md:p-8">
         <h2 className="text-xl font-medium tracking-[0.12em] md:text-2xl">ORDER SUMMARY</h2>

         {/* SUBTOTAL */}

         <div className="mt-8 flex justify-between gap-5 text-sm">
          <span className="text-[#555]">
           Subtotal ({totalItems} {totalItems === 1 ? "item" : "items"})
          </span>

          <span>
           {currency} {formatPrice(totalPrice)}
          </span>
         </div>

         {/* DELIVERY */}

         <div className="mt-5 flex justify-between gap-5 text-sm">
          <span className="text-[#555]">Delivery</span>

          <span>Cash on delivery(COD)</span>
         </div>

         <div className="my-7 border-t border-[#dededb]" />

         {/* TOTAL */}

         <div className="flex items-start justify-between gap-5">
          <div>
           <p className="text-lg font-medium tracking-[0.1em]">TOTAL</p>

           <p className="mt-2 text-xs text-[#777]">GST included</p>
          </div>

          <p className="text-right text-xl font-semibold md:text-2xl">
           {currency} {formatPrice(totalPrice)}
          </p>
         </div>

         {/* CHECKOUT */}

         <button
          type="button"
          onClick={handleCheckout}
          className="
                      mt-8
                      flex
                      w-full
                      cursor-pointer
                      items-center
                      justify-center
                      gap-3
                      bg-[#127749]
                      py-4
                      text-sm
                      font-semibold
                      uppercase
                      tracking-[0.15em]
                      text-white
                      transition
                      hover:bg-[#0d5f39]
                    ">
          <FaArrowRight size={14} />
          Enter Your Information
         </button>

         {/* SECURITY */}

         <div className="mt-8 border-t border-[#dededb] pt-6">
          <div className="flex items-start gap-3">
           <FaExchangeAlt className="mt-1 shrink-0 text-[#127749]" />

           <div>
            <p className="text-sm font-medium">Easy Returns</p>

            <p className="mt-1 text-xs leading-5 text-[#777]">Free returns within 7 days.</p>
           </div>
          </div>
         </div>
        </div>
       </aside>
      </div>
     </section>

     {/* ==========================================
              BENEFITS
          ========================================== */}

     <section className="border-t border-[#dededb] bg-white">
      <div className="container grid gap-8 py-10 md:grid-cols-3 md:py-14">
       {/* DELIVERY */}

       <div className="flex gap-5">
        <FaTruck className="mt-1 shrink-0 text-2xl text-[#127749]" />

        <div>
         <h3 className="text-sm font-semibold uppercase tracking-[0.12em]">Complimentary delivery</h3>

         <p className="mt-3 text-sm leading-6 text-[#666]">Complimentary and secure delivery to your address.</p>
        </div>
       </div>

       {/* GUARANTEE */}

       <div className="flex gap-5">
        <FaShieldAlt className="mt-1 shrink-0 text-2xl text-[#127749]" />

        <div>
         <h3 className="text-sm font-semibold uppercase tracking-[0.12em]">Five-year guarantee</h3>

         <p className="mt-3 text-sm leading-6 text-[#666]">Five-year international guarantee for your peace of mind.</p>
        </div>
       </div>

       {/* OFFICIAL */}

       <div className="flex gap-5">
        <FaCrown className="mt-1 shrink-0 text-2xl text-[#127749]" />

        <div>
         <h3 className="text-sm font-semibold uppercase tracking-[0.12em]">Official retailer</h3>

         <p className="mt-3 text-sm leading-6 text-[#666]">Exceptional service and expertise for every timepiece.</p>
        </div>
       </div>
      </div>
     </section>
    </>
   )}
  </main>
 );
};
export default Cart;
Cart.Layout = "Default";
