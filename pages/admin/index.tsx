import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

import AdminLayout from "~/layout/AdminLayout";
import DashboardHeader from "~/components/admin/dashboard/DashboardHeader";
import DashboardStats from "~/components/admin/dashboard/DashboardStats";
import LowStockProducts from "~/components/admin/dashboard/LowStockProducts";
import OrderStatusOverview from "~/components/admin/dashboard/OrderStatusOverview";
import RecentOrders from "~/components/admin/dashboard/RecentOrders";
import SalesOverview from "~/components/admin/dashboard/SalesOverview";
import AffiliateOverview from "~/components/admin/dashboard/AffiliateOverview";
interface Store {
 _id: string;
 name: string;
 slug: string;
}

interface DashboardData {
 filters: {
  storeId: string | null;
  fromDate: string;
  toDate: string;
 };

 stats: {
  totalOrders: number;
  totalCustomers: number;
  totalProducts: number;
  revenue: {
   currency: string;
   total: number;
  }[];
  pendingOrders: number;
  lowStockProducts: number;
 };
 affiliateOverview?: {
  activeAffiliates: number;
  referredOrders: number;
  totalCommission: number;
  totalPaid: number;
  remainingCommission: number;
  currency: "VND";
 };
 orderStatus: {
  PENDING: number;
  CONFIRMED: number;
  PROCESSING: number;
  SHIPPED: number;
  DELIVERED: number;
  CANCELLED: number;
  RETURNED: number;
 };

 salesOverview: {
  date: string;
  currency: string;
  total: number;
  orders: number;
 }[];

 recentOrders: {
  _id: string;
  orderNumber: string;
  customerSnapshot?: {
   name: string;
   phone: string;
   email?: string;
  };
  total: number;
  currency: string;
  status: string;
  paymentStatus: string;
  createdAt: string;
 }[];

 lowStockProducts: {
  _id: string;
  name: string;
  sku: string;
  quantity: number;
  lowStockThreshold: number;
  currency: string;
 }[];
}

function getDefaultDateRange() {
 const now = new Date();

 const year = now.getFullYear();
 const month = String(now.getMonth() + 1).padStart(2, "0");

 const fromDate = `${year}-${month}-01`;

 const lastDay = new Date(year, now.getMonth() + 1, 0).getDate();

 const toDate = `${year}-${month}-${String(lastDay).padStart(2, "0")}`;

 return {
  fromDate,
  toDate,
 };
}

export default function AdminDashboard() {
 const { data: session, status } = useSession();

 const [stores, setStores] = useState<Store[]>([]);
 const [storesLoading, setStoresLoading] = useState(false);

 const [selectedStore, setSelectedStore] = useState("");

 const defaultDates = getDefaultDateRange();

 const [fromDate, setFromDate] = useState(defaultDates.fromDate);

 const [toDate, setToDate] = useState(defaultDates.toDate);

 const [dashboard, setDashboard] = useState<DashboardData | null>(null);

 const [loading, setLoading] = useState(true);
 const [error, setError] = useState("");

 const userRole = session?.user?.role ?? "";

 /*
  * Load stores for SUPER_ADMIN
  */
 useEffect(() => {
  if (status !== "authenticated") {
   return;
  }

  if (userRole !== "SUPER_ADMIN") {
   setStores([]);
   return;
  }

  const loadStores = async () => {
   try {
    setStoresLoading(true);

    const response = await fetch("/api/admin/stores");

    const data = await response.json();

    if (!response.ok) {
     throw new Error(data?.message || "Failed to load stores.");
    }

    setStores(data.stores ?? []);
   } catch (error) {
    console.error(error);
   } finally {
    setStoresLoading(false);
   }
  };

  loadStores();
 }, [status, userRole]);

 /*
  * Load dashboard
  */
 useEffect(() => {
  if (status !== "authenticated") {
   return;
  }

  const loadDashboard = async () => {
   try {
    setLoading(true);
    setError("");

    const params = new URLSearchParams();

    if (selectedStore) {
     params.set("storeId", selectedStore);
    }

    if (fromDate) {
     params.set("fromDate", fromDate);
    }

    if (toDate) {
     params.set("toDate", toDate);
    }

    const response = await fetch(`/api/admin/dashboard?${params.toString()}`);

    const data = await response.json();

    if (!response.ok) {
     throw new Error(data?.message || "Failed to load dashboard.");
    }

    setDashboard(data);
   } catch (error) {
    console.error(error);

    setError(error instanceof Error ? error.message : "Failed to load dashboard.");
   } finally {
    setLoading(false);
   }
  };

  loadDashboard();
 }, [status, selectedStore, fromDate, toDate]);

 /*
  * Loading session
  */
 if (status === "loading") {
  return (
   <div className="flex min-h-screen items-center justify-center bg-gray-50">
    <div className="text-sm text-gray-500">Loading...</div>
   </div>
  );
 }

 /*
  * Loading dashboard
  */
 if (loading || !dashboard) {
  return (
   <AdminLayout>
    <div className="p-4 md:p-6">
     <div className="animate-pulse space-y-6">
      <div className="h-20 rounded-2xl bg-gray-200" />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
       {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="h-32 rounded-2xl bg-gray-200" />
       ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
       <div className="h-[360px] rounded-2xl bg-gray-200" />

       <div className="h-[360px] rounded-2xl bg-gray-200" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
       <div className="h-[400px] rounded-2xl bg-gray-200" />

       <div className="h-[400px] rounded-2xl bg-gray-200" />
      </div>
     </div>
    </div>
   </AdminLayout>
  );
 }

 return (
  <AdminLayout>
   <div className="p-4 md:p-6">
    <DashboardHeader
     userRole={userRole}
     stores={stores}
     selectedStore={selectedStore}
     fromDate={fromDate}
     toDate={toDate}
     storesLoading={storesLoading}
     onStoreChange={setSelectedStore}
     onFromDateChange={setFromDate}
     onToDateChange={setToDate}
    />

    {error && <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>}

    <DashboardStats stats={dashboard.stats} />
    {userRole === "SUPER_ADMIN" && dashboard.affiliateOverview && <AffiliateOverview data={dashboard.affiliateOverview} />}
    <div className="mt-6 grid gap-6 xl:grid-cols-[1.5fr_1fr]">
     <SalesOverview data={dashboard.salesOverview} />

     <OrderStatusOverview data={dashboard.orderStatus} totalOrders={dashboard.stats.totalOrders} />
    </div>

    <div className="mt-6 grid gap-6 xl:grid-cols-[1.5fr_1fr]">
     <RecentOrders orders={dashboard.recentOrders} />

     <LowStockProducts products={dashboard.lowStockProducts} />
    </div>
   </div>
  </AdminLayout>
 );
}
