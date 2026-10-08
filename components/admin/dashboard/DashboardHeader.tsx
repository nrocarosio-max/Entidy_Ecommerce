import { FaChevronDown, FaStore } from "react-icons/fa";

interface Store {
 _id: string;
 name: string;
 slug: string;
}

interface DashboardHeaderProps {
 userRole: string;
 stores: Store[];
 selectedStore: string;
 fromDate: string;
 toDate: string;
 storesLoading?: boolean;
 onStoreChange: (storeId: string) => void;
 onFromDateChange: (date: string) => void;
 onToDateChange: (date: string) => void;
}

export default function DashboardHeader({
 userRole,
 stores,
 selectedStore,
 fromDate,
 toDate,
 storesLoading = false,
 onStoreChange,
 onFromDateChange,
 onToDateChange,
}: DashboardHeaderProps) {
 return (
  <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
   {/* Page title */}

   <div>
    <div className="flex items-center gap-2 text-sm text-gray-500">
     <FaStore size={13} />

     <span>Admin</span>

     <span>/</span>

     <span>Dashboard</span>
    </div>

    <h1 className="mt-1 text-2xl font-bold tracking-tight text-gray-900 md:text-3xl">Dashboard</h1>

    <p className="mt-1 text-sm text-gray-500">Overview of your store performance.</p>
   </div>

   {/* Filters */}

   <div className="flex flex-col gap-3 sm:flex-row">
    {/* Store selector */}

    {userRole === "SUPER_ADMIN" && (
     <div className="relative">
      <FaStore className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />

      <select
       value={selectedStore}
       onChange={(event) => onStoreChange(event.target.value)}
       disabled={storesLoading}
       className="h-11 min-w-[210px] appearance-none rounded-xl border border-gray-200 bg-white pl-10 pr-10 text-sm font-medium text-gray-700 outline-none transition hover:border-gray-300 focus:border-gray-400 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400">
       <option value="">All Stores</option>

       {stores.map((store) => (
        <option key={store._id} value={store._id}>
         {store.name}
        </option>
       ))}
      </select>

      <FaChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400" />
     </div>
    )}

    {/* Date range */}

    <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white p-1">
     <input
      type="date"
      value={fromDate}
      onChange={(event) => onFromDateChange(event.target.value)}
      className="h-9 rounded-lg border-0 bg-transparent px-2 text-sm text-gray-700 outline-none focus:ring-0"
     />

     <span className="text-gray-300">→</span>

     <input
      type="date"
      value={toDate}
      onChange={(event) => onToDateChange(event.target.value)}
      className="h-9 rounded-lg border-0 bg-transparent px-2 text-sm text-gray-700 outline-none focus:ring-0"
     />
    </div>
   </div>
  </div>
 );
}
