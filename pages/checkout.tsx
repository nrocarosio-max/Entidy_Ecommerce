import { FormEvent, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";

import { FaArrowLeft, FaCheck, FaMinus, FaPlus, FaShoppingBag, FaTrash } from "react-icons/fa";

import { CartItem, getCart, removeFromCart, updateCartQuantity } from "~/lib/cart";

type CheckoutForm = {
 fullName: string;
 phone: string;
 email: string;
 address: string;
 city: string;
 district: string;
 postalCode: string;
 note: string;
};

type OrderResponse = {
 success: boolean;
 message?: string;
 order?: {
  _id: string;
  orderNumber?: string;
 };
};

const initialForm: CheckoutForm = {
 fullName: "",
 phone: "",
 email: "",
 address: "",
 city: "",
 district: "",
 postalCode: "",
 note: "",
};

export default function CheckoutPage() {
 const router = useRouter();

 const [cart, setCart] = useState<CartItem[]>([]);
 const [form, setForm] = useState<CheckoutForm>(initialForm);

 const [loading, setLoading] = useState(true);
 const [submitting, setSubmitting] = useState(false);
 const [error, setError] = useState("");

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
  * FORM
  * ============================================================
  */

 const handleChange = (field: keyof CheckoutForm, value: string) => {
  setForm((current) => ({
   ...current,
   [field]: value,
  }));

  if (error) {
   setError("");
  }
 };

 /*
  * ============================================================
  * CART
  * ============================================================
  */

 const handleQuantityChange = (productId: string, quantity: number) => {
  const updatedCart = updateCartQuantity(productId, quantity);

  setCart(updatedCart);
 };

 const handleRemove = (productId: string) => {
  const updatedCart = removeFromCart(productId);

  setCart(updatedCart);
 };

 /*
  * ============================================================
  * PRICE
  * ============================================================
  */

 const subtotal = useMemo(() => {
  return cart.reduce((total, item) => total + item.product.price * item.quantity, 0);
 }, [cart]);

 const itemCount = useMemo(() => {
  return cart.reduce((total, item) => total + item.quantity, 0);
 }, [cart]);

 const currency = cart[0]?.product.currency || "VNĐ";

 const formatPrice = (price: number) => {
  return new Intl.NumberFormat("en-US", {
   style: "currency",
   currency,
   maximumFractionDigits: 0,
  }).format(price);
 };

 /*
  * ============================================================
  * SUBMIT
  * ============================================================
  */

 const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
  event.preventDefault();

  if (cart.length === 0) {
   setError("Your cart is empty.");
   return;
  }

  if (!form.fullName.trim()) {
   setError("Please enter your full name.");
   return;
  }

  if (!form.phone.trim()) {
   setError("Please enter your phone number.");
   return;
  }

  if (!form.email.trim()) {
   setError("Please enter your email address.");
   return;
  }

  if (!form.address.trim()) {
   setError("Please enter your address.");
   return;
  }

  if (!form.city.trim()) {
   setError("Please enter your city.");
   return;
  }

  setSubmitting(true);
  setError("");

  try {
   /*
    * --------------------------------------------------
    * Group cart items by store
    * --------------------------------------------------
    *
    * The current Order API creates one Order
    * for one store at a time.
    */

   const storeGroups = cart.reduce<Record<string, CartItem[]>>((groups, item) => {
    const storeId = item.product.storeId;

    if (!groups[storeId]) {
     groups[storeId] = [];
    }

    groups[storeId].push(item);

    return groups;
   }, {});

   const createdOrders: any[] = [];

   /*
    * --------------------------------------------------
    * Create one Order for each store
    * --------------------------------------------------
    */

   for (const [storeId, storeItems] of Object.entries(storeGroups)) {
    const storeSubtotal = storeItems.reduce((total, item) => total + item.product.price * item.quantity, 0);

    const storeCurrency = storeItems[0]?.product.currency || currency;

    const response = await fetch("/api/orders", {
     method: "POST",
     headers: {
      "Content-Type": "application/json",
     },
     body: JSON.stringify({
      storeId,

      customer: {
       name: form.fullName,
       phone: form.phone,
       email: form.email,
      },

      shippingAddress: {
       province: form.city,
       district: form.district,
       ward: "",
       address: form.address,
       postalCode: form.postalCode,
      },

      items: storeItems.map((item) => ({
       productId: item.product._id,
       quantity: item.quantity,
       price: item.product.price,
       currency: item.product.currency,
      })),

      subtotal: storeSubtotal,
      shippingFee: 0,
      discount: 0,
      total: storeSubtotal,
      currency: storeCurrency,

      paymentMethod: "COD",
      paymentStatus: "PENDING",

      note: form.note,
      shippingMethod: "",
     }),
    });

    const data: OrderResponse = await response.json();

    if (!response.ok || !data.success) {
     throw new Error(data.message || "Unable to place order.");
    }

    if (!data.order?._id) {
     throw new Error("Order was created but no order ID was returned.");
    }

    createdOrders.push(data.order);
   }

   /*
    * --------------------------------------------------
    * All orders created successfully
    * --------------------------------------------------
    */

   if (createdOrders.length === 0) {
    throw new Error("No order was created.");
   }

   localStorage.removeItem("ecommerce_cart");

   window.dispatchEvent(
    new CustomEvent("cartUpdated", {
     detail: [],
    }),
   );

   /*
    * For now, use the first created order.
    *
    * Later we can build the Order Success page
    * to display all orders when checkout contains
    * products from multiple stores.
    */

   const firstOrder = createdOrders[0];

   router.push(`/order/success?orderId=${encodeURIComponent(firstOrder._id)}`);
  } catch (error) {
   console.error("CHECKOUT ERROR:", error);

   setError(error instanceof Error ? error.message : "Unable to place order.");
  } finally {
   setSubmitting(false);
  }
 };

 /*
  * ============================================================
  * LOADING
  * ============================================================
  */

 if (loading) {
  return (
   <main className="min-h-screen bg-white">
    <div className="container py-10 md:py-14">
     <div className="animate-pulse">
      <div className="h-8 w-40 rounded bg-gray-200" />

      <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_400px]">
       <div className="space-y-5">
        <div className="h-12 rounded bg-gray-100" />
        <div className="h-12 rounded bg-gray-100" />
        <div className="h-12 rounded bg-gray-100" />
        <div className="h-32 rounded bg-gray-100" />
       </div>

       <div className="h-80 rounded bg-gray-100" />
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
     <div className="max-w-md text-center">
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gray-100">
       <FaShoppingBag size={28} className="text-gray-400" />
      </div>

      <h1 className="mt-7 text-3xl font-semibold text-gray-950">Your cart is empty</h1>

      <p className="mt-3 text-sm leading-6 text-gray-500">Add some products before proceeding to checkout.</p>

      <Link
       href="/"
       className="mt-8 inline-flex h-12 items-center justify-center gap-2 bg-black px-7 text-sm font-semibold text-white transition hover:bg-gray-800">
       <FaArrowLeft size={11} />
       Continue Shopping
      </Link>
     </div>
    </div>
   </main>
  );
 }

 /*
  * ============================================================
  * CHECKOUT
  * ============================================================
  */

 return (
  <main className="min-h-screen bg-white">
   <div className="container py-8 md:py-12">
    {/* Header */}
    <div className="border-b border-gray-200 pb-6">
     <div className="flex items-center gap-4">
      <Link
       href="/cart"
       className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 text-gray-600 transition hover:border-black hover:text-black"
       aria-label="Back to cart">
       <FaArrowLeft size={12} />
      </Link>

      <div>
       <h1 className="text-3xl font-semibold tracking-tight text-gray-950 md:text-4xl">Checkout</h1>

       <p className="mt-1 text-sm text-gray-500">Complete your information to place your order.</p>
      </div>
     </div>
    </div>

    <form onSubmit={handleSubmit} className="mt-8 grid gap-10 lg:grid-cols-[1fr_400px] lg:items-start">
     {/* =====================================================
              CUSTOMER INFORMATION
              ===================================================== */}

     <section>
      <div className="border border-gray-200 p-6 sm:p-8">
       <div className="mb-7">
        <div className="flex items-center gap-3">
         <div className="flex h-8 w-8 items-center justify-center rounded-full bg-black text-white">
          <FaCheck size={12} />
         </div>

         <h2 className="text-lg font-semibold text-gray-950">Contact Information</h2>
        </div>

        <p className="mt-2 text-sm text-gray-500">We will use these details to contact you about your order.</p>
       </div>

       <div className="grid gap-5 sm:grid-cols-2">
        {/* Full name */}
        <div className="sm:col-span-2">
         <label htmlFor="fullName" className="mb-2 block text-sm font-medium text-gray-900">
          Full name
         </label>

         <input
          id="fullName"
          type="text"
          value={form.fullName}
          onChange={(event) => handleChange("fullName", event.target.value)}
          placeholder="Enter your full name"
          autoComplete="name"
          className="h-12 w-full border border-gray-300 px-4 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-black"
         />
        </div>

        {/* Phone */}
        <div>
         <label htmlFor="phone" className="mb-2 block text-sm font-medium text-gray-900">
          Phone number
         </label>

         <input
          id="phone"
          type="tel"
          value={form.phone}
          onChange={(event) => handleChange("phone", event.target.value)}
          placeholder="Enter your phone"
          autoComplete="tel"
          className="h-12 w-full border border-gray-300 px-4 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-black"
         />
        </div>

        {/* Email */}
        <div>
         <label htmlFor="email" className="mb-2 block text-sm font-medium text-gray-900">
          Email address
         </label>

         <input
          id="email"
          type="email"
          value={form.email}
          onChange={(event) => handleChange("email", event.target.value)}
          placeholder="you@example.com"
          autoComplete="email"
          className="h-12 w-full border border-gray-300 px-4 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-black"
         />
        </div>
       </div>
      </div>

      {/* ===================================================
              SHIPPING INFORMATION
              =================================================== */}

      <div className="mt-6 border border-gray-200 p-6 sm:p-8">
       <div className="mb-7">
        <h2 className="text-lg font-semibold text-gray-950">Shipping Information</h2>

        <p className="mt-2 text-sm text-gray-500">Where should we deliver your order?</p>
       </div>

       <div className="grid gap-5 sm:grid-cols-2">
        {/* Address */}
        <div className="sm:col-span-2">
         <label htmlFor="address" className="mb-2 block text-sm font-medium text-gray-900">
          Address
         </label>

         <input
          id="address"
          type="text"
          value={form.address}
          onChange={(event) => handleChange("address", event.target.value)}
          placeholder="Street address"
          autoComplete="street-address"
          className="h-12 w-full border border-gray-300 px-4 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-black"
         />
        </div>

        {/* City */}
        <div>
         <label htmlFor="city" className="mb-2 block text-sm font-medium text-gray-900">
          City
         </label>

         <input
          id="city"
          type="text"
          value={form.city}
          onChange={(event) => handleChange("city", event.target.value)}
          placeholder="City"
          autoComplete="address-level2"
          className="h-12 w-full border border-gray-300 px-4 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-black"
         />
        </div>

        {/* District */}
        <div>
         <label htmlFor="district" className="mb-2 block text-sm font-medium text-gray-900">
          District
         </label>

         <input
          id="district"
          type="text"
          value={form.district}
          onChange={(event) => handleChange("district", event.target.value)}
          placeholder="District"
          className="h-12 w-full border border-gray-300 px-4 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-black"
         />
        </div>

        {/* Postal code */}
        <div>
         <label htmlFor="postalCode" className="mb-2 block text-sm font-medium text-gray-900">
          Postal code
         </label>

         <input
          id="postalCode"
          type="text"
          value={form.postalCode}
          onChange={(event) => handleChange("postalCode", event.target.value)}
          placeholder="Postal code"
          autoComplete="postal-code"
          className="h-12 w-full border border-gray-300 px-4 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-black"
         />
        </div>
       </div>
      </div>

      {/* ===================================================
              ORDER NOTE
              =================================================== */}

      <div className="mt-6 border border-gray-200 p-6 sm:p-8">
       <label htmlFor="note" className="mb-2 block text-sm font-medium text-gray-900">
        Order note <span className="font-normal text-gray-400">(optional)</span>
       </label>

       <textarea
        id="note"
        value={form.note}
        onChange={(event) => handleChange("note", event.target.value)}
        placeholder="Any special instructions for your order?"
        rows={4}
        className="w-full resize-none border border-gray-300 px-4 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-black"
       />
      </div>

      {/* Error */}
      {error && <div className="mt-6 border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-700">{error}</div>}

      {/* Submit mobile */}
      <div className="mt-6 lg:hidden">
       <button
        type="submit"
        disabled={submitting}
        className="flex h-13 w-full items-center justify-center bg-black px-6 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-300">
        {submitting ? "Placing order..." : "Place Order"}
       </button>
      </div>
     </section>

     {/* =====================================================
              ORDER SUMMARY
              ===================================================== */}

     <aside className="lg:sticky lg:top-24">
      <div className="border border-gray-200 bg-gray-50 p-6 sm:p-7">
       <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-950">Your Order</h2>

        <Link href="/cart" className="text-xs font-medium text-gray-500 transition hover:text-black">
         Edit cart
        </Link>
       </div>

       {/* Items */}
       <div className="mt-6 max-h-[420px] space-y-5 overflow-y-auto pr-1">
        {cart.map((item) => {
         const product = item.product;

         return (
          <div key={product._id} className="flex gap-4">
           <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden bg-white">
            {product.images?.[0] ? (
             <Image src={product.images[0]} alt={product.name} fill className="object-cover" sizes="80px" />
            ) : (
             <div className="flex h-full items-center justify-center text-[10px] text-gray-400">No image</div>
            )}

            <span className="absolute right-1 top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-black px-1 text-[10px] font-semibold text-white">
             {item.quantity}
            </span>
           </div>

           <div className="min-w-0 flex-1">
            <Link href={`/store/${product.storeSlug}/product/${product.slug}`} className="line-clamp-2 text-sm font-medium text-gray-900 hover:text-gray-600">
             {product.name}
            </Link>

            <p className="mt-1 text-xs text-gray-400">{product.storeName}</p>

            <p className="mt-2 text-sm font-semibold text-gray-950">{formatPrice(product.price * item.quantity)}</p>
           </div>
          </div>
         );
        })}
       </div>

       {/* Summary */}
       <div className="mt-6 border-t border-gray-200 pt-5">
        <div className="flex items-center justify-between text-sm">
         <span className="text-gray-500">Items</span>

         <span className="font-medium text-gray-900">{itemCount}</span>
        </div>

        <div className="mt-3 flex items-center justify-between text-sm">
         <span className="text-gray-500">Subtotal</span>

         <span className="font-semibold text-gray-950">{formatPrice(subtotal)}</span>
        </div>

        <div className="mt-3 flex items-center justify-between text-sm">
         <span className="text-gray-500">Shipping</span>

         <span className="font-medium text-gray-900">Calculated later</span>
        </div>
       </div>

       <div className="mt-5 flex items-center justify-between border-t border-gray-200 pt-5">
        <span className="text-base font-semibold text-gray-950">Total</span>

        <span className="text-xl font-semibold text-gray-950">{formatPrice(subtotal)}</span>
       </div>

       {/* Desktop submit */}
       <button
        type="submit"
        disabled={submitting}
        className="mt-6 hidden h-12 w-full items-center justify-center bg-black px-6 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-300 lg:flex">
        {submitting ? "Placing order..." : "Place Order"}
       </button>

       <div className="mt-5 border-t border-gray-200 pt-5">
        <div className="flex items-start gap-3">
         <div className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-white">
          <FaCheck size={10} className="text-green-600" />
         </div>

         <p className="text-xs leading-5 text-gray-500">Your order will be reviewed and confirmed after submission.</p>
        </div>
       </div>
      </div>
     </aside>
    </form>
   </div>
  </main>
 );
}

CheckoutPage.Layout = "Default";
