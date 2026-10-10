"use client";

import Link from "next/link";
import { FaChartLine, FaCoins, FaUsers, FaWallet } from "react-icons/fa";

interface AffiliateOverviewData {
 activeAffiliates: number;
 referredOrders: number;
 totalCommission: number;
 totalPaid: number;
 remainingCommission: number;
 currency: "VND";
}

interface AffiliateOverviewProps {
 data: AffiliateOverviewData;
}

const formatVND = (value: number) =>
 new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
  maximumFractionDigits: 0,
 }).format(value);

export default function AffiliateOverview({ data }: AffiliateOverviewProps) {
 const cards = [
  {
   title: "Affiliate đang hoạt động",
   value: data.activeAffiliates.toLocaleString("vi-VN"),
   icon: FaUsers,
   description: "Tài khoản đang hoạt động",
   href: "/admin/affiliates",
  },
  {
   title: "Đơn hàng có affiliate",
   value: data.referredOrders.toLocaleString("vi-VN"),
   icon: FaChartLine,
   description: "Trong khoảng thời gian đã chọn",
   href: "/admin/affiliate-commissions",
  },
  {
   title: "Tổng hoa hồng",
   value: formatVND(data.totalCommission),
   icon: FaCoins,
   description: "Hoa hồng đã ghi nhận",
   href: "/admin/affiliate-commissions",
  },
  {
   title: "Đã thanh toán",
   value: formatVND(data.totalPaid),
   icon: FaWallet,
   description: "Khoản thanh toán thủ công",
   href: "/admin/affiliate-payments",
  },
 ];

 return (
  <section className="mt-8">
   <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
    <div>
     <h2 className="text-lg font-semibold text-gray-900">Affiliate Overview</h2>
     <p className="mt-1 text-sm text-gray-500">Tổng quan hiệu quả và chi phí hoa hồng affiliate.</p>
    </div>

    <Link href="/admin/affiliates" className="text-sm font-medium text-blue-600 hover:text-blue-700">
     Quản lý affiliate →
    </Link>
   </div>

   <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
    {cards.map((card) => {
     const Icon = card.icon;

     return (
      <Link key={card.title} href={card.href} className="rounded-2xl border border-gray-200 bg-white p-5 transition hover:border-blue-300 hover:shadow-sm">
       <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
         <p className="text-sm text-gray-500">{card.title}</p>
         <p className="mt-3 break-words text-xl font-semibold text-gray-900">{card.value}</p>
        </div>

        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
         <Icon />
        </div>
       </div>

       <p className="mt-4 text-xs text-gray-500">{card.description}</p>
      </Link>
     );
    })}
   </div>

   <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-5">
    <div className="flex flex-wrap items-center justify-between gap-3">
     <div>
      <p className="text-sm font-medium text-amber-900">Hoa hồng còn lại cần thanh toán</p>
      <p className="mt-2 text-2xl font-bold text-amber-950">{formatVND(data.remainingCommission)}</p>
      <p className="mt-1 text-xs text-amber-800">Hoa hồng đã ghi nhận trừ các khoản đã thanh toán.</p>
     </div>

     <Link href="/admin/affiliate-payments" className="rounded-xl bg-amber-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-amber-800">
      Quản lý thanh toán
     </Link>
    </div>
   </div>
  </section>
 );
}
