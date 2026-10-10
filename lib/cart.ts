export type CartProduct = {
 _id: string;
 name: string;
 slug: string;
 sku: string;
 price: number;
 compareAtPrice?: number | null;
 currency: string;
 images?: string[];
 quantity: number;
 storeId: string;
 storeSlug: string;
 storeName: string;
};

export type CartItem = {
 product: CartProduct;
 quantity: number;
};

export const CART_STORAGE_KEY = "ecommerce_cart";

export function getCart(): CartItem[] {
 if (typeof window === "undefined") {
  return [];
 }

 try {
  const raw = localStorage.getItem(CART_STORAGE_KEY);

  if (!raw) {
   return [];
  }

  const parsed = JSON.parse(raw);

  if (!Array.isArray(parsed)) {
   return [];
  }

  return parsed;
 } catch (error) {
  console.error("GET CART ERROR:", error);
  return [];
 }
}

export function saveCart(cart: CartItem[]): void {
 if (typeof window === "undefined") {
  return;
 }

 localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));

 window.dispatchEvent(
  new CustomEvent("cartUpdated", {
   detail: cart,
  }),
 );
}

export function addToCart(product: CartProduct, quantity = 1): CartItem[] {
 const cart = getCart();

 const existingIndex = cart.findIndex((item) => item.product._id === product._id);

 if (existingIndex >= 0) {
  const existingItem = cart[existingIndex];

  const nextQuantity = Math.min(existingItem.quantity + quantity, product.quantity);

  cart[existingIndex] = {
   ...existingItem,
   product,
   quantity: nextQuantity,
  };
 } else {
  cart.push({
   product,
   quantity: Math.min(quantity, product.quantity),
  });
 }

 saveCart(cart);

 return cart;
}

export function updateCartQuantity(productId: string, quantity: number): CartItem[] {
 const cart = getCart();

 const nextCart = cart
  .map((item) => {
   if (item.product._id !== productId) {
    return item;
   }

   const nextQuantity = Math.min(Math.max(quantity, 1), item.product.quantity);

   return {
    ...item,
    quantity: nextQuantity,
   };
  })
  .filter((item) => item.quantity > 0);

 saveCart(nextCart);

 return nextCart;
}

export function removeFromCart(productId: string): CartItem[] {
 const cart = getCart();

 const nextCart = cart.filter((item) => item.product._id !== productId);

 saveCart(nextCart);

 return nextCart;
}

export function clearCart(): void {
 saveCart([]);
}

export function getCartItemCount(): number {
 return getCart().reduce((total, item) => total + item.quantity, 0);
}

export function getCartSubtotal(): number {
 return getCart().reduce((total, item) => total + item.product.price * item.quantity, 0);
}
