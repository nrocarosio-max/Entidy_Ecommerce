import Link from "next/link";
import { FaArrowRight, FaBoxOpen, FaChevronRight, FaExclamationTriangle } from "react-icons/fa";

interface LowStockProduct {
 _id: string;
 name: string;
 sku: string;
 quantity: number;
 lowStockThreshold: number;
 currency: string;
}

interface LowStockProductsProps {
 products: LowStockProduct[];
}

function getStockPercentage(quantity: number, threshold: number) {
 if (threshold <= 0) {
  return 100;
 }

 return Math.min(100, Math.max(0, (quantity / threshold) * 100));
}

export default function LowStockProducts({ products }: LowStockProductsProps) {
 return (
  <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
   {/* Header */}
   <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
    <div>
     <h2 className="text-base font-semibold text-gray-900">Low Stock Products</h2>

     <p className="mt-0.5 text-xs text-gray-400">Products that need restocking.</p>
    </div>

    <Link href="/admin/inventory" className="flex items-center gap-2 text-xs font-semibold text-gray-500 transition hover:text-gray-900">
     View inventory
     <FaArrowRight size={10} />
    </Link>
   </div>

   {products.length === 0 ? (
    <div className="flex min-h-[300px] flex-col items-center justify-center px-5 text-center">
     <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-400">
      <FaBoxOpen size={18} />
     </div>

     <p className="mt-3 text-sm font-medium text-gray-700">Stock looks good</p>

     <p className="mt-1 text-xs text-gray-400">No products are currently below the stock threshold.</p>
    </div>
   ) : (
    <>
     {/* Desktop */}
     <div className="hidden md:block">
      <div className="divide-y divide-gray-100">
       {products.map((product) => {
        const percentage = getStockPercentage(product.quantity, product.lowStockThreshold);

        return (
         <Link key={product._id} href={`/admin/products/${product._id}`} className="block px-5 py-4 transition hover:bg-gray-50">
          <div className="flex items-start gap-3">
           <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-orange-50 text-orange-500">
            <FaExclamationTriangle size={13} />
           </div>

           <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
             <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-gray-800">{product.name}</p>

              <p className="mt-0.5 text-[11px] text-gray-400">SKU: {product.sku}</p>
             </div>

             <div className="shrink-0 text-right">
              <p className="text-sm font-bold text-gray-900">{product.quantity}</p>

              <p className="text-[10px] text-gray-400">left</p>
             </div>
            </div>

            <div className="mt-3 flex items-center gap-2">
             <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-100">
              <div
               className="h-full rounded-full bg-orange-400 transition-all"
               style={{
                width: `${percentage}%`,
               }}
              />
             </div>

             <span className="shrink-0 text-[10px] text-gray-400">Min. {product.lowStockThreshold}</span>
            </div>
           </div>

           <FaChevronRight size={9} className="mt-2 shrink-0 text-gray-300" />
          </div>
         </Link>
        );
       })}
      </div>
     </div>

     {/* Mobile */}
     <div className="divide-y divide-gray-100 md:hidden">
      {products.map((product) => (
       <Link key={product._id} href={`/admin/products/${product._id}`} className="flex items-center gap-3 px-5 py-4 transition hover:bg-gray-50">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-orange-50 text-orange-500">
         <FaExclamationTriangle size={13} />
        </div>

        <div className="min-w-0 flex-1">
         <p className="truncate text-sm font-semibold text-gray-800">{product.name}</p>

         <p className="mt-0.5 text-[11px] text-gray-400">SKU: {product.sku}</p>

         <div className="mt-2 flex items-center gap-2">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-100">
           <div
            className="h-full rounded-full bg-orange-400"
            style={{
             width: `${getStockPercentage(product.quantity, product.lowStockThreshold)}%`,
            }}
           />
          </div>
         </div>
        </div>

        <div className="shrink-0 text-right">
         <p className="text-sm font-bold text-gray-900">{product.quantity}</p>

         <p className="text-[10px] text-gray-400">left</p>
        </div>

        <FaChevronRight size={9} className="shrink-0 text-gray-300" />
       </Link>
      ))}
     </div>
    </>
   )}
  </section>
 );
}
