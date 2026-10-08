import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";

interface Store {
 _id: string;
 name: string;
 slug: string;
}
interface Customer {
 _id: string;
 name: string;
 phone: string;
 email?: string;
 isActive: boolean;
}

interface Product {
 _id: string;
 name: string;
 sku: string;
 price: number;
 currency: string;
 quantity: number;
 images?: string[];
 status: string;
}

interface CartItem {
 productId: string;
 name: string;
 sku: string;
 price: number;
 currency: string;
 quantity: number;
 image: string;
 availableQuantity: number;
}

interface ShippingAddress {
 province: string;
 district: string;
 ward: string;
 address: string;
 postalCode: string;
}

const paymentMethods = [
 {
  value: "COD",
  label: "Cash on Delivery",
 },
 {
  value: "BANK_TRANSFER",
  label: "Bank Transfer",
 },
 {
  value: "CREDIT_CARD",
  label: "Credit Card",
 },
 {
  value: "DEBIT_CARD",
  label: "Debit Card",
 },
 {
  value: "OTHER",
  label: "Other",
 },
];

export default function CreateOrderPage() {
 const router = useRouter();
 const { data: session, status: sessionStatus } = useSession();

 const [stores, setStores] = useState<Store[]>([]);
 const [storeId, setStoreId] = useState("");

 const [customers, setCustomers] = useState<Customer[]>([]);
 const [customerSearch, setCustomerSearch] = useState("");
 const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
 const [customerMode, setCustomerMode] = useState<"existing" | "new">("existing");

 const [newCustomer, setNewCustomer] = useState({
  name: "",
  phone: "",
  email: "",
 });
 const [products, setProducts] = useState<Product[]>([]);
 const [productSearch, setProductSearch] = useState("");

 const [cart, setCart] = useState<CartItem[]>([]);

 const [shippingAddress, setShippingAddress] = useState<ShippingAddress>({
  province: "",
  district: "",
  ward: "",
  address: "",
  postalCode: "",
 });

 const [shippingFee, setShippingFee] = useState(0);

 const [discount, setDiscount] = useState(0);

 const [paymentMethod, setPaymentMethod] = useState("COD");

 const [shippingMethod, setShippingMethod] = useState("");

 const [note, setNote] = useState("");

 const [loadingStores, setLoadingStores] = useState(false);

 const [loadingCustomers, setLoadingCustomers] = useState(false);

 const [loadingProducts, setLoadingProducts] = useState(false);

 const [submitting, setSubmitting] = useState(false);

 const [error, setError] = useState("");

 const isSuperAdmin = session?.user?.role === "SUPER_ADMIN";

 /*
  * --------------------------------------------------
  * LOAD STORES
  * --------------------------------------------------
  */

 useEffect(() => {
  if (sessionStatus !== "authenticated" || !isSuperAdmin) {
   return;
  }

  const loadStores = async () => {
   try {
    setLoadingStores(true);

    const response = await fetch("/api/admin/stores");

    const data = await response.json();

    if (!response.ok) {
     throw new Error(data.message || "Failed to load stores.");
    }

    const nextStores = data.stores || [];

    setStores(nextStores);

    if (nextStores.length > 0 && !storeId) {
     setStoreId(nextStores[0]._id);
    }
   } catch (err: any) {
    setError(err?.message || "Failed to load stores.");
   } finally {
    setLoadingStores(false);
   }
  };

  loadStores();
 }, [sessionStatus, isSuperAdmin, storeId]);

 /*
  * --------------------------------------------------
  * STORE FOR NON SUPER ADMIN
  * --------------------------------------------------
  */

 useEffect(() => {
  if (sessionStatus !== "authenticated") {
   return;
  }

  if (!isSuperAdmin) {
   setStoreId(session?.user?.storeId || "");
  }
 }, [sessionStatus, isSuperAdmin, session?.user?.storeId]);

 /*
  * --------------------------------------------------
  * LOAD CUSTOMERS
  * --------------------------------------------------
  */

 useEffect(() => {
  if (sessionStatus !== "authenticated" || !storeId) {
   return;
  }

  const timer = setTimeout(async () => {
   try {
    setLoadingCustomers(true);

    const params = new URLSearchParams();

    params.set("storeId", storeId);

    params.set("page", "1");

    params.set("limit", "20");

    if (customerSearch.trim()) {
     params.set("search", customerSearch.trim());
    }

    const response = await fetch(`/api/admin/customers?${params.toString()}`);

    const data = await response.json();

    if (!response.ok) {
     throw new Error(data.message || "Failed to load customers.");
    }

    setCustomers(data.customers || []);
   } catch (err: any) {
    setError(err?.message || "Failed to load customers.");
   } finally {
    setLoadingCustomers(false);
   }
  }, 300);

  return () => {
   clearTimeout(timer);
  };
 }, [sessionStatus, storeId, customerSearch]);

 /*
  * --------------------------------------------------
  * LOAD PRODUCTS
  * --------------------------------------------------
  */

 useEffect(() => {
  if (sessionStatus !== "authenticated" || !storeId) {
   return;
  }

  const timer = setTimeout(async () => {
   try {
    setLoadingProducts(true);

    const params = new URLSearchParams();

    params.set("storeId", storeId);

    params.set("page", "1");

    params.set("limit", "50");

    if (productSearch.trim()) {
     params.set("search", productSearch.trim());
    }

    const response = await fetch(`/api/admin/products?${params.toString()}`);

    const data = await response.json();
    console.log("Product API response:", data);
    console.log("STORE ID:", storeId);
    if (!response.ok) {
     throw new Error(data.message || "Failed to load products.");
    }

    setProducts(data.products || []);
   } catch (err: any) {
    setError(err?.message || "Failed to load products.");
   } finally {
    setLoadingProducts(false);
   }
  }, 300);

  return () => {
   clearTimeout(timer);
  };
 }, [sessionStatus, storeId, productSearch]);

 /*
  * --------------------------------------------------
  * CART
  * --------------------------------------------------
  */

 const addProduct = (product: Product) => {
  setError("");

  if (product.quantity <= 0) {
   setError(`${product.name} is out of stock.`);

   return;
  }

  setCart((current) => {
   const existing = current.find((item) => item.productId === product._id);

   if (existing) {
    if (existing.quantity >= product.quantity) {
     setError(`Only ${product.quantity} units of ${product.name} are available.`);

     return current;
    }

    return current.map((item) =>
     item.productId === product._id
      ? {
         ...item,
         quantity: item.quantity + 1,
        }
      : item,
    );
   }

   return [
    ...current,
    {
     productId: product._id,
     name: product.name,
     sku: product.sku,
     price: product.price,
     currency: product.currency,
     quantity: 1,
     image: product.images?.[0] || "",
     availableQuantity: product.quantity,
    },
   ];
  });
 };

 const updateQuantity = (productId: string, quantity: number) => {
  if (quantity <= 0) {
   setCart((current) => current.filter((item) => item.productId !== productId));

   return;
  }

  setCart((current) =>
   current.map((item) => {
    if (item.productId !== productId) {
     return item;
    }

    const nextQuantity = Math.min(quantity, item.availableQuantity);

    return {
     ...item,
     quantity: nextQuantity,
    };
   }),
  );
 };

 const removeProduct = (productId: string) => {
  setCart((current) => current.filter((item) => item.productId !== productId));
 };

 /*
  * --------------------------------------------------
  * TOTALS
  * --------------------------------------------------
  */

 const subtotal = useMemo(() => cart.reduce((sum, item) => sum + item.price * item.quantity, 0), [cart]);

 const total = Math.max(0, subtotal + Number(shippingFee || 0) - Number(discount || 0));

 const currency = cart[0]?.currency || "VND";

 /*
  * --------------------------------------------------
  * CREATE ORDER
  * --------------------------------------------------
  */

 const handleSubmit = async (event: FormEvent) => {
  event.preventDefault();

  setError("");

  if (!storeId) {
   setError("Please select a store.");

   return;
  }

  if (customerMode === "existing" && !selectedCustomer) {
   setError("Please select a customer.");

   return;
  }

  if (customerMode === "new") {
   if (!newCustomer.name.trim()) {
    setError("Customer name is required.");

    return;
   }

   if (!newCustomer.phone.trim()) {
    setError("Customer phone is required.");

    return;
   }
  }

  if (cart.length === 0) {
   setError("Please add at least one product.");

   return;
  }

  if (!shippingAddress.address.trim()) {
   setError("Shipping address is required.");

   return;
  }

  try {
   setSubmitting(true);

   const response = await fetch("/api/admin/orders", {
    method: "POST",
    headers: {
     "Content-Type": "application/json",
    },
    body: JSON.stringify({
     storeId,

     ...(customerMode === "existing"
      ? {
         customerId: selectedCustomer?._id,
        }
      : {
         customer: {
          name: newCustomer.name.trim(),
          phone: newCustomer.phone.trim(),
          email: newCustomer.email.trim(),
         },
        }),

     shippingAddress,

     items: cart.map((item) => ({
      productId: item.productId,
      quantity: item.quantity,
      price: item.price,
      currency: item.currency,
     })),

     subtotal,
     shippingFee: Number(shippingFee || 0),
     discount: Number(discount || 0),
     total,

     currency,

     paymentMethod,

     paymentStatus: "PENDING",

     note,

     shippingMethod,
    }),
   });

   const data = await response.json();

   if (!response.ok) {
    throw new Error(data.message || "Failed to create order.");
   }

   router.push(`/admin/orders/${data.order._id}`);
  } catch (err: any) {
   setError(err?.message || "Failed to create order.");
  } finally {
   setSubmitting(false);
  }
 };

 /*
  * --------------------------------------------------
  * LOADING
  * --------------------------------------------------
  */

 if (sessionStatus === "loading") {
  return <div className="p-6">Loading...</div>;
 }

 /*
  * --------------------------------------------------
  * RENDER
  * --------------------------------------------------
  */

 return (
  <div className="min-h-screen bg-gray-100 p-4 md:p-6">
   <div className="mx-auto max-w-7xl">
    {/* Header */}

    <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
     <div>
      <div className="mb-2 text-sm text-gray-500">
       Orders
       <span className="mx-2">/</span>
       Create Order
      </div>

      <h1 className="text-2xl font-bold text-gray-900">Create Order</h1>

      <p className="mt-1 text-sm text-gray-500">Create a new order manually from the admin dashboard.</p>
     </div>

     <Link
      href="/admin/orders"
      className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50">
      Back to Orders
     </Link>
    </div>

    {error && <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

    <form onSubmit={handleSubmit} className="grid gap-6 xl:grid-cols-[1fr_380px]">
     <div className="space-y-6">
      {/* Store */}

      <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
       <h2 className="mb-4 text-lg font-semibold text-gray-900">Store</h2>

       {isSuperAdmin ? (
        <select
         value={storeId}
         onChange={(event) => {
          setStoreId(event.target.value);
          setSelectedCustomer(null);
          setCart([]);
         }}
         disabled={loadingStores}
         className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-black">
         <option value="">Select store</option>

         {stores.map((store) => (
          <option key={store._id} value={store._id}>
           {store.name}
          </option>
         ))}
        </select>
       ) : (
        <div className="rounded-lg bg-gray-50 px-4 py-3 text-sm text-gray-700">
         Store ID: <span className="font-medium">{storeId}</span>
        </div>
       )}
      </section>

      {/* Customer */}

      <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
       <div className="mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Customer</h2>

        <p className="mt-1 text-sm text-gray-500">Select an existing customer or enter a new customer manually.</p>
       </div>

       <div className="mb-5 grid grid-cols-2 gap-2">
        <button
         type="button"
         onClick={() => {
          setCustomerMode("existing");
          setError("");
         }}
         className={`rounded-lg border px-4 py-2.5 text-sm font-medium transition ${
          customerMode === "existing" ? "border-black bg-black text-white" : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
         }`}>
         Existing Customer
        </button>

        <button
         type="button"
         onClick={() => {
          setCustomerMode("new");
          setSelectedCustomer(null);
          setError("");
         }}
         className={`rounded-lg border px-4 py-2.5 text-sm font-medium transition ${
          customerMode === "new" ? "border-black bg-black text-white" : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
         }`}>
         New Customer
        </button>
       </div>

       {customerMode === "existing" ? (
        selectedCustomer ? (
         <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
          <div className="flex items-start justify-between gap-4">
           <div>
            <div className="font-medium text-gray-900">{selectedCustomer.name}</div>

            <div className="mt-1 text-sm text-gray-500">{selectedCustomer.phone}</div>

            {selectedCustomer.email && <div className="mt-1 text-sm text-gray-500">{selectedCustomer.email}</div>}
           </div>

           <button type="button" onClick={() => setSelectedCustomer(null)} className="text-sm font-medium text-red-600 hover:underline">
            Change
           </button>
          </div>
         </div>
        ) : (
         <>
          <input
           type="text"
           value={customerSearch}
           onChange={(event) => setCustomerSearch(event.target.value)}
           placeholder="Search customer by name or phone..."
           className="mb-3 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-black"
          />

          <div className="max-h-64 overflow-y-auto rounded-lg border border-gray-200">
           {loadingCustomers ? (
            <div className="p-4 text-sm text-gray-500">Loading customers...</div>
           ) : customers.length === 0 ? (
            <div className="p-4 text-sm text-gray-500">No customers found.</div>
           ) : (
            customers.map((customer) => (
             <button
              key={customer._id}
              type="button"
              onClick={() => setSelectedCustomer(customer)}
              className="block w-full border-b border-gray-100 px-4 py-3 text-left transition last:border-b-0 hover:bg-gray-50">
              <div className="font-medium text-gray-900">{customer.name}</div>

              <div className="mt-1 text-sm text-gray-500">{customer.phone}</div>

              {customer.email && <div className="mt-1 text-xs text-gray-400">{customer.email}</div>}
             </button>
            ))
           )}
          </div>
         </>
        )
       ) : (
        <div className="space-y-4">
         <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">Full name *</label>

          <input
           type="text"
           value={newCustomer.name}
           onChange={(event) =>
            setNewCustomer((current) => ({
             ...current,
             name: event.target.value,
            }))
           }
           placeholder="Customer full name"
           className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-black"
          />
         </div>

         <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">Phone *</label>

          <input
           type="text"
           value={newCustomer.phone}
           onChange={(event) =>
            setNewCustomer((current) => ({
             ...current,
             phone: event.target.value,
            }))
           }
           placeholder="Customer phone number"
           className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-black"
          />
         </div>

         <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">Email</label>

          <input
           type="email"
           value={newCustomer.email}
           onChange={(event) =>
            setNewCustomer((current) => ({
             ...current,
             email: event.target.value,
            }))
           }
           placeholder="customer@example.com"
           className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-black"
          />
         </div>
        </div>
       )}
      </section>

      {/* Products */}

      <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
       <h2 className="mb-4 text-lg font-semibold text-gray-900">Products</h2>

       <input
        type="text"
        value={productSearch}
        onChange={(event) => setProductSearch(event.target.value)}
        placeholder="Search product by name or SKU..."
        className="mb-4 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-black"
       />

       <div className="grid max-h-80 gap-3 overflow-y-auto md:grid-cols-2">
        {loadingProducts ? (
         <div className="p-4 text-sm text-gray-500">Loading products...</div>
        ) : products.length === 0 ? (
         <div className="p-4 text-sm text-gray-500">No products found.</div>
        ) : (
         products.map((product) => (
          <button
           key={product._id}
           type="button"
           onClick={() => addProduct(product)}
           disabled={product.quantity <= 0}
           className="flex gap-3 rounded-lg border border-gray-200 p-3 text-left transition hover:border-gray-400 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50">
           <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-gray-100">
            {product.images?.[0] ? <img src={product.images[0]} alt={product.name} className="h-full w-full object-cover" /> : null}
           </div>

           <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-medium text-gray-900">{product.name}</div>

            <div className="mt-1 text-xs text-gray-500">SKU: {product.sku}</div>

            <div className="mt-2 flex items-center justify-between">
             <span className="font-semibold text-gray-900">
              {product.price.toLocaleString()} {product.currency}
             </span>

             <span className="text-xs text-gray-500">Stock: {product.quantity}</span>
            </div>
           </div>
          </button>
         ))
        )}
       </div>
      </section>

      {/* Cart */}

      <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
       <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Order Items</h2>

        <span className="text-sm text-gray-500">
         {cart.length} product
         {cart.length !== 1 ? "s" : ""}
        </span>
       </div>

       {cart.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 px-4 py-10 text-center text-sm text-gray-500">Add products to this order.</div>
       ) : (
        <div className="divide-y divide-gray-100">
         {cart.map((item) => (
          <div key={item.productId} className="flex gap-4 py-4 first:pt-0 last:pb-0">
           <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-gray-100">
            {item.image ? <img src={item.image} alt={item.name} className="h-full w-full object-cover" /> : null}
           </div>

           <div className="min-w-0 flex-1">
            <div className="font-medium text-gray-900">{item.name}</div>

            <div className="mt-1 text-xs text-gray-500">{item.sku}</div>

            <div className="mt-2 text-sm font-medium text-gray-900">
             {item.price.toLocaleString()} {item.currency}
            </div>
           </div>

           <div className="flex flex-col items-end gap-2">
            <div className="flex items-center rounded-lg border border-gray-300">
             <button type="button" onClick={() => updateQuantity(item.productId, item.quantity - 1)} className="px-3 py-1.5 text-gray-600 hover:bg-gray-50">
              −
             </button>

             <span className="min-w-10 text-center text-sm">{item.quantity}</span>

             <button
              type="button"
              onClick={() => updateQuantity(item.productId, item.quantity + 1)}
              disabled={item.quantity >= item.availableQuantity}
              className="px-3 py-1.5 text-gray-600 hover:bg-gray-50 disabled:opacity-40">
              +
             </button>
            </div>

            <button type="button" onClick={() => removeProduct(item.productId)} className="text-xs text-red-600 hover:underline">
             Remove
            </button>
           </div>
          </div>
         ))}
        </div>
       )}
      </section>

      {/* Shipping Address */}

      <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
       <h2 className="mb-4 text-lg font-semibold text-gray-900">Shipping Address</h2>

       <div className="grid gap-4 md:grid-cols-2">
        <input
         value={shippingAddress.province}
         onChange={(event) =>
          setShippingAddress((current) => ({
           ...current,
           province: event.target.value,
          }))
         }
         placeholder="Province"
         className="rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-black"
        />

        <input
         value={shippingAddress.district}
         onChange={(event) =>
          setShippingAddress((current) => ({
           ...current,
           district: event.target.value,
          }))
         }
         placeholder="District"
         className="rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-black"
        />

        <input
         value={shippingAddress.ward}
         onChange={(event) =>
          setShippingAddress((current) => ({
           ...current,
           ward: event.target.value,
          }))
         }
         placeholder="Ward"
         className="rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-black"
        />

        <input
         value={shippingAddress.postalCode}
         onChange={(event) =>
          setShippingAddress((current) => ({
           ...current,
           postalCode: event.target.value,
          }))
         }
         placeholder="Postal code"
         className="rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-black"
        />

        <textarea
         value={shippingAddress.address}
         onChange={(event) =>
          setShippingAddress((current) => ({
           ...current,
           address: event.target.value,
          }))
         }
         placeholder="Full address"
         rows={3}
         className="md:col-span-2 rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-black"
        />
       </div>
      </section>

      {/* Shipping / Payment */}

      <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
       <h2 className="mb-4 text-lg font-semibold text-gray-900">Shipping & Payment</h2>

       <div className="grid gap-4 md:grid-cols-2">
        <div>
         <label className="mb-1.5 block text-sm font-medium text-gray-700">Shipping method</label>

         <input
          value={shippingMethod}
          onChange={(event) => setShippingMethod(event.target.value)}
          placeholder="e.g. Standard Delivery"
          className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-black"
         />
        </div>

        <div>
         <label className="mb-1.5 block text-sm font-medium text-gray-700">Payment method</label>

         <select
          value={paymentMethod}
          onChange={(event) => setPaymentMethod(event.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-black">
          {paymentMethods.map((method) => (
           <option key={method.value} value={method.value}>
            {method.label}
           </option>
          ))}
         </select>
        </div>

        <div>
         <label className="mb-1.5 block text-sm font-medium text-gray-700">Shipping fee</label>

         <input
          type="number"
          min="0"
          value={shippingFee}
          onChange={(event) => setShippingFee(Number(event.target.value))}
          className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-black"
         />
        </div>

        <div>
         <label className="mb-1.5 block text-sm font-medium text-gray-700">Discount</label>

         <input
          type="number"
          min="0"
          value={discount}
          onChange={(event) => setDiscount(Number(event.target.value))}
          className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-black"
         />
        </div>
       </div>

       <div className="mt-4">
        <label className="mb-1.5 block text-sm font-medium text-gray-700">Note</label>

        <textarea
         value={note}
         onChange={(event) => setNote(event.target.value)}
         rows={3}
         placeholder="Internal order note..."
         className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-black"
        />
       </div>
      </section>
     </div>

     {/* Summary */}

     <aside className="h-fit xl:sticky xl:top-6">
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
       <h2 className="text-lg font-semibold text-gray-900">Order Summary</h2>

       <div className="mt-5 space-y-3 text-sm">
        <div className="flex justify-between">
         <span className="text-gray-500">Subtotal</span>

         <span className="font-medium text-gray-900">
          {subtotal.toLocaleString()} {currency}
         </span>
        </div>

        <div className="flex justify-between">
         <span className="text-gray-500">Shipping</span>

         <span className="font-medium text-gray-900">
          {Number(shippingFee || 0).toLocaleString()} {currency}
         </span>
        </div>

        <div className="flex justify-between">
         <span className="text-gray-500">Discount</span>

         <span className="font-medium text-red-600">
          -{Number(discount || 0).toLocaleString()} {currency}
         </span>
        </div>

        <div className="border-t border-gray-200 pt-4">
         <div className="flex items-center justify-between">
          <span className="text-base font-semibold text-gray-900">Total</span>

          <span className="text-xl font-bold text-gray-900">
           {total.toLocaleString()} {currency}
          </span>
         </div>
        </div>
       </div>

       <div className="mt-5 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
        New orders start in <strong>Waiting for Stock</strong>. Inventory is deducted when the order reaches <strong>Confirmed</strong>.
       </div>

       <button
        type="submit"
        disabled={
         submitting ||
         !storeId ||
         cart.length === 0 ||
         (customerMode === "existing" && !selectedCustomer) ||
         (customerMode === "new" && (!newCustomer.name.trim() || !newCustomer.phone.trim()))
        }
        className="mt-5 w-full rounded-lg bg-black px-4 py-3 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50">
        {submitting ? "Creating Order..." : "Create Order"}
       </button>
      </div>
     </aside>
    </form>
   </div>
  </div>
 );
}

CreateOrderPage.Layout = "Admin";
