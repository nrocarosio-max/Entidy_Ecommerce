import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
 FaBox,
 FaCalendarAlt,
 FaCheckCircle,
 FaEdit,
 FaChevronLeft,
 FaChevronRight,
 FaEye,
 FaFilter,
 FaMapMarkerAlt,
 FaMoneyBillWave,
 FaSearch,
 FaShoppingBag,
 FaSyncAlt,
 FaTimes,
 FaTimesCircle,
 FaTruck,
} from "react-icons/fa";

interface Store {
 _id: string;
 name?: string;
 storeName?: string;
}

interface Customer {
 _id?: string;
 name?: string;
 phone?: string;
 email?: string;
}

interface OrderStatusOption {
 id: string;
 code: string;
 name: string;
 color?: string;
 icon?: string;
 sortOrder?: number;
 count?: number;
}

interface PopulatedNextStatus {
 _id: string;
 name: string;
 code: string;
 color?: string;
 isActive?: boolean;
}

interface OrderStatusData {
 _id: string;
 name: string;
 code: string;
 description?: string;
 color?: string;
 icon?: string;
 sortOrder?: number;
 isInitial?: boolean;
 isFinal?: boolean;
 isActive?: boolean;
 nextStatusIds?: Array<string | PopulatedNextStatus>;
}

interface ShippingAddress {
 address?: string;
 ward?: string;
 district?: string;
 province?: string;
 postalCode?: string;
}

interface OrderItemDetail {
 _id: string;
 productId?:
  | {
     _id?: string;
     name?: string;
     sku?: string;
     images?: {
      main?: string;
     };
    }
  | string;
 productSnapshot?: {
  name?: string;
  sku?: string;
  slug?: string;
  image?: string;
 };
 quantity: number;
 price: number;
 subtotal: number;
 currency: string;
}

interface OrderHistoryItem {
 _id: string;
 fromStatusName?: string;
 toStatusName?: string;
 fromStatusId?: {
  name?: string;
  color?: string;
 };
 toStatusId?: {
  name?: string;
  color?: string;
 };
 changedBy?: {
  name?: string;
  email?: string;
 };
 note?: string;
 createdAt?: string;
}
interface PaymentStatusHistoryItem {
 _id: string;
 fromPaymentStatus?: string;
 toPaymentStatus?: string;
 changedBy?: {
  name?: string;
  email?: string;
 };
 note?: string;
 createdAt?: string;
}
interface Order {
 _id: string;
 orderNumber?: string;
 storeId?: string | { _id: string; name?: string; slug?: string };
 customerId?: Customer | string | null;
 customerSnapshot?: Customer;
 statusId?: OrderStatusData | string | null;
 paymentMethod?: string;
 paymentStatus?: string;
 currency?: string;
 subtotal?: number;
 shippingFee?: number;
 discount?: number;
 total?: number;
 shippingAddress?: ShippingAddress;
 shippingMethod?: string;
 trackingNumber?: string;
 note?: string;
 createdAt?: string;
 updatedAt?: string;
 createdBy?:
  | {
     name?: string;
     email?: string;
    }
  | string
  | null;
 customer?: Customer;
 items?: OrderItemDetail[];

 affiliateId?:
  | {
     _id?: string;
     name?: string;
     email?: string;
    }
  | string
  | null;

 affiliateUserId?:
  | {
     _id?: string;
     name?: string;
     email?: string;
    }
  | string
  | null;

 affiliateStoreId?:
  | {
     _id?: string;
     name?: string;
     storeName?: string;
    }
  | string
  | null;

 affiliateCommission?: number;
 commissionAmount?: number;
 hasAffiliate?: boolean;
}

interface Pagination {
 page: number;
 limit: number;
 total: number;
 totalPages: number;
}

interface Summary {
 totalOrders: number;
 totalAmount: number;
}

interface OrdersResponse {
 success: boolean;
 message?: string;
 orders?: Order[];
 stores?: Store[];
 pagination?: Pagination;
 summary?: Summary;
 statusSummary?: OrderStatusOption[];
}

interface OrderDetailResponse {
 success: boolean;
 message?: string;
 order?: Order;
 items?: OrderItemDetail[];
 history?: OrderHistoryItem[];
 paymentHistory?: PaymentStatusHistoryItem[];
}
interface EditableOrderItem {
 productId: string;
 productName: string;
 sku: string;
 quantity: number;
 price: number;
}
const PAGE_SIZE = 20;

const PAYMENT_STATUS_OPTIONS = [
 { value: "", label: "All payment statuses" },
 { value: "PENDING", label: "Pending" },
 { value: "PAID", label: "Paid" },
 { value: "FAILED", label: "Failed" },
 { value: "REFUNDED", label: "Refunded" },
];

const formatPrice = (amount: number, currency = "VNĐ") => {
 const value = Number(amount || 0);

 return `${currency} ${value.toLocaleString("en-US", {
  maximumFractionDigits: 2,
 })}`;
};

const formatDate = (value?: string) => {
 if (!value) return "—";

 const date = new Date(value);

 if (Number.isNaN(date.getTime())) return "—";

 return date.toLocaleString("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
 });
};

const getCustomer = (order: Order): Customer => {
 if (order.customerSnapshot) {
  return order.customerSnapshot;
 }

 if (order.customer && typeof order.customer === "object") {
  return order.customer;
 }

 if (order.customerId && typeof order.customerId === "object") {
  return order.customerId;
 }

 return {};
};

const getOrderStatus = (order: Order): OrderStatusData | null => {
 if (order.statusId && typeof order.statusId === "object") {
  return order.statusId;
 }

 return null;
};

const getForwardStatuses = (currentStatus: OrderStatusData | null, statuses: OrderStatusOption[]): OrderStatusOption[] => {
 if (!currentStatus) {
  return statuses;
 }

 const allowedIds = new Set((currentStatus.nextStatusIds || []).map((status) => (typeof status === "string" ? status : status._id)));

 return statuses
  .filter((status) => status.id !== currentStatus._id && (!currentStatus.nextStatusIds || allowedIds.size === 0 || allowedIds.has(status.id)))
  .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
};

const getStatusId = (status: string | PopulatedNextStatus): string => {
 return typeof status === "string" ? status : status._id;
};

const getPaymentStatusStyle = (status?: string) => {
 switch ((status || "PENDING").toUpperCase()) {
  case "PAID":
   return "bg-emerald-50 text-emerald-700";
  case "FAILED":
   return "bg-red-50 text-red-700";
  case "REFUNDED":
  case "PARTIALLY_REFUNDED":
   return "bg-purple-50 text-purple-700";
  default:
   return "bg-amber-50 text-amber-700";
 }
};

const getStoreName = (order: Order, fallback = "—") => {
 if (order.storeId && typeof order.storeId === "object") {
  return order.storeId.name || fallback;
 }

 return fallback;
};

const getCreatedByName = (order: Order) => {
 if (order.createdBy && typeof order.createdBy === "object") {
  return order.createdBy.name || order.createdBy.email || "—";
 }

 return "—";
};

export default function OrdersPage() {
 const { data: session, status: sessionStatus } = useSession();

 const user = session?.user as
  | {
     role?: string;
     storeId?: string;
    }
  | undefined;

 const isSuperAdmin = user?.role === "SUPER_ADMIN";

 const [orders, setOrders] = useState<Order[]>([]);
 const [stores, setStores] = useState<Store[]>([]);
 const [statusOptions, setStatusOptions] = useState<OrderStatusOption[]>([]);

 const [selectedStoreId, setSelectedStoreId] = useState("");
 const [selectedStatusId, setSelectedStatusId] = useState("");
 const [selectedPaymentStatus, setSelectedPaymentStatus] = useState("");
 const [search, setSearch] = useState("");
 const [dateFrom, setDateFrom] = useState("");
 const [dateTo, setDateTo] = useState("");
 const [deletedFilter, setDeletedFilter] = useState<"active" | "deleted" | "all">("active");
 const [page, setPage] = useState(1);
 const [pagination, setPagination] = useState<Pagination>({
  page: 1,
  limit: PAGE_SIZE,
  total: 0,
  totalPages: 0,
 });
 const [isEditOpen, setIsEditOpen] = useState(false);
 const [isSavingEdit, setIsSavingEdit] = useState(false);

 const [editingOrder, setEditingOrder] = useState<Order | null>(null);

 const [editCustomer, setEditCustomer] = useState({
  name: "",
  phone: "",
  email: "",
 });

 const [editAddress, setEditAddress] = useState({
  address: "",
  province: "",
  district: "",
  zipcode: "",
 });

 const [editShippingFee, setEditShippingFee] = useState(0);
 const [editDiscount, setEditDiscount] = useState(0);
 const [editShippingMethod, setEditShippingMethod] = useState("");
 const [editTrackingNumber, setEditTrackingNumber] = useState("");
 const [editNote, setEditNote] = useState("");
 const [editItems, setEditItems] = useState<EditableOrderItem[]>([]);
 const [summary, setSummary] = useState<Summary>({
  totalOrders: 0,
  totalAmount: 0,
 });

 const [loading, setLoading] = useState(true);
 const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
 const [updatingPaymentOrderId, setUpdatingPaymentOrderId] = useState<string | null>(null);
 const [savingDetailPaymentStatus, setSavingDetailPaymentStatus] = useState(false);
 const [error, setError] = useState("");
 const [notice, setNotice] = useState("");

 const [detailOrder, setDetailOrder] = useState<Order | null>(null);
 const [detailItems, setDetailItems] = useState<OrderItemDetail[]>([]);
 const [detailHistory, setDetailHistory] = useState<OrderHistoryItem[]>([]);
 const [detailPaymentHistory, setDetailPaymentHistory] = useState<PaymentStatusHistoryItem[]>([]);
 const [detailLoading, setDetailLoading] = useState(false);
 const [detailStatusId, setDetailStatusId] = useState("");
 const [detailNote, setDetailNote] = useState("");
 const [savingDetailStatus, setSavingDetailStatus] = useState(false);
 const [detailPaymentStatus, setDetailPaymentStatus] = useState("PENDING");
 const selectedStore = useMemo(() => stores.find((store) => store._id === selectedStoreId), [stores, selectedStoreId]);
 const [deletingOrderId, setDeletingOrderId] = useState<string | null>(null);

 const handleDeleteOrder = async (orderId: string) => {
  const confirmed = window.confirm("Bạn có chắc chắn muốn chuyển đơn hàng này vào danh sách đã xóa không?");

  if (!confirmed) return;

  setDeletingOrderId(orderId);
  setError("");
  setNotice("");

  try {
   const response = await fetch(`/api/admin/orders/${orderId}`, {
    method: "DELETE",
   });

   const result = await response.json();

   if (!response.ok || !result.success) {
    throw new Error(result.message || "Unable to delete order.");
   }

   setOrders((currentOrders) => currentOrders.filter((order) => order._id !== orderId));

   setNotice(result.message || "Order moved to deleted orders.");

   // Nếu đơn cuối cùng trên trang bị xóa, chuyển về trang trước.
   if (orders.length === 1 && page > 1) {
    setPage((currentPage) => currentPage - 1);
   }
  } catch (err) {
   setError(err instanceof Error ? err.message : "Unable to delete order.");
  } finally {
   setDeletingOrderId(null);
  }
 };
 useEffect(() => {
  if (sessionStatus !== "authenticated") return;

  if (!isSuperAdmin) {
   if (user?.storeId) {
    setSelectedStoreId(user.storeId);
   } else {
    setError("Your account is not assigned to a store.");
    setLoading(false);
   }

   return;
  }

  let cancelled = false;

  const loadStores = async () => {
   try {
    const response = await fetch("/api/admin/stores");
    const result = await response.json();

    if (!response.ok) {
     throw new Error(result.message || "Unable to load stores.");
    }

    const storeList: Store[] = Array.isArray(result.stores) ? result.stores : Array.isArray(result.data) ? result.data : [];

    if (!cancelled) {
     setStores(storeList);

     setSelectedStoreId((current) => {
      if (current && storeList.some((store) => store._id === current)) {
       return current;
      }

      return storeList[0]?._id || "";
     });
    }
   } catch (err) {
    if (!cancelled) {
     setError(err instanceof Error ? err.message : "Unable to load stores.");
     setLoading(false);
    }
   }
  };

  void loadStores();

  return () => {
   cancelled = true;
  };
 }, [sessionStatus, isSuperAdmin, user?.storeId]);

 const loadOrders = useCallback(async () => {
  if (sessionStatus !== "authenticated") return;

  if (isSuperAdmin && !selectedStoreId) {
   setOrders([]);
   setLoading(false);
   return;
  }

  if (!isSuperAdmin && !user?.storeId) {
   setLoading(false);
   return;
  }

  setLoading(true);
  setError("");

  try {
   const params = new URLSearchParams();

   params.set("storeId", isSuperAdmin ? selectedStoreId : user?.storeId || "");
   params.set("page", String(page));
   params.set("limit", String(PAGE_SIZE));
   params.set("deleted", deletedFilter);

   if (search.trim()) params.set("search", search.trim());
   if (selectedStatusId) params.set("statusId", selectedStatusId);
   if (selectedPaymentStatus) params.set("paymentStatus", selectedPaymentStatus);
   if (dateFrom) params.set("dateFrom", dateFrom);
   if (dateTo) params.set("dateTo", dateTo);

   const response = await fetch(`/api/admin/orders?${params.toString()}`);
   const result: OrdersResponse = await response.json();

   if (!response.ok || !result.success) {
    throw new Error(result.message || "Unable to load orders.");
   }

   setOrders(Array.isArray(result.orders) ? result.orders : []);

   setPagination(
    result.pagination || {
     page,
     limit: PAGE_SIZE,
     total: 0,
     totalPages: 0,
    },
   );

   setSummary(
    result.summary || {
     totalOrders: 0,
     totalAmount: 0,
    },
   );

   setStatusOptions(Array.isArray(result.statusSummary) ? result.statusSummary : []);
  } catch (err) {
   setError(err instanceof Error ? err.message : "Unable to load orders.");
   setOrders([]);
  } finally {
   setLoading(false);
  }
 }, [sessionStatus, isSuperAdmin, selectedStoreId, user?.storeId, page, search, selectedStatusId, selectedPaymentStatus, dateFrom, dateTo, deletedFilter]);

 useEffect(() => {
  if (sessionStatus === "authenticated") {
   void loadOrders();
  }
 }, [sessionStatus, loadOrders]);

 useEffect(() => {
  if (!detailOrder) return;

  const previousOverflow = document.body.style.overflow;
  document.body.style.overflow = "hidden";

  const handleKeyDown = (event: KeyboardEvent) => {
   if (event.key === "Escape" && !savingDetailStatus) {
    setDetailOrder(null);
   }
  };

  window.addEventListener("keydown", handleKeyDown);

  return () => {
   document.body.style.overflow = previousOverflow;
   window.removeEventListener("keydown", handleKeyDown);
  };
 }, [detailOrder, savingDetailStatus]);

 const resetFilters = () => {
  setSearch("");
  setSelectedStatusId("");
  setSelectedPaymentStatus("");
  setDateFrom("");
  setDateTo("");
  setPage(1);
  setNotice("");
  setDeletedFilter("active");
 };

 const handleStoreChange = (value: string) => {
  setSelectedStoreId(value);
  setPage(1);
  setSelectedStatusId("");
  setNotice("");
 };

 const handleStatusChange = async (order: Order, nextStatusId: string) => {
  const currentStatus = getOrderStatus(order);

  if (!nextStatusId || nextStatusId === currentStatus?._id) return;

  setUpdatingOrderId(order._id);
  setError("");
  setNotice("");

  try {
   const response = await fetch(`/api/admin/orders/${order._id}`, {
    method: "PATCH",
    headers: {
     "Content-Type": "application/json",
    },
    body: JSON.stringify({
     statusId: nextStatusId,
     note: "",
    }),
   });

   const result: OrderDetailResponse = await response.json();

   if (!response.ok || !result.success || !result.order) {
    throw new Error(result.message || "Unable to update order status.");
   }

   const updatedOrder = result.order;

   // Update only the order that changed.
   setOrders((currentOrders) =>
    currentOrders.map((item) =>
     item._id === order._id
      ? {
         ...item,
         statusId: updatedOrder.statusId,
         updatedAt: updatedOrder.updatedAt,
        }
      : item,
    ),
   );

   setNotice(result.message || "Order status updated successfully.");
  } catch (err) {
   setError(err instanceof Error ? err.message : "Unable to update order status.");
  } finally {
   setUpdatingOrderId(null);
  }
 };

 const handlePaymentStatusChange = async (order: Order, nextPaymentStatus: string): Promise<boolean> => {
  const currentPaymentStatus = order.paymentStatus || "PENDING";

  if (!nextPaymentStatus || nextPaymentStatus === currentPaymentStatus) {
   return true;
  }

  setUpdatingPaymentOrderId(order._id);
  setError("");
  setNotice("");

  try {
   const response = await fetch(`/api/admin/orders/${order._id}`, {
    method: "PATCH",
    headers: {
     "Content-Type": "application/json",
    },
    body: JSON.stringify({
     paymentStatus: nextPaymentStatus,
     note: "Payment status updated by administrator.",
    }),
   });

   const result = await response.json();

   if (!response.ok || !result.success) {
    throw new Error(result.message || "Unable to update payment status.");
   }

   const savedPaymentStatus = result.order?.paymentStatus || nextPaymentStatus;

   setOrders((currentOrders) => currentOrders.map((item) => (item._id === order._id ? { ...item, paymentStatus: savedPaymentStatus } : item)));

   setDetailOrder((currentOrder) => (currentOrder?._id === order._id ? { ...currentOrder, paymentStatus: savedPaymentStatus } : currentOrder));

   setDetailPaymentStatus(savedPaymentStatus);

   if (Array.isArray(result.paymentHistory)) {
    setDetailPaymentHistory(result.paymentHistory);
   } else {
    // Fallback: reload payment history from the order details endpoint.
    try {
     const historyResponse = await fetch(`/api/admin/orders/${order._id}`);
     const historyResult: OrderDetailResponse = await historyResponse.json();

     if (historyResponse.ok && historyResult.success) {
      setDetailPaymentHistory(Array.isArray(historyResult.paymentHistory) ? historyResult.paymentHistory : []);
     }
    } catch (historyError) {
     console.error("Unable to refresh payment history:", historyError);
    }
   }

   setNotice(result.message || "Payment status updated successfully.");

   return true;
  } catch (err) {
   setError(err instanceof Error ? err.message : "Unable to update payment status.");

   return false;
  } finally {
   setUpdatingPaymentOrderId(null);
  }
 };

 const openOrderDetail = async (orderId: string) => {
  // Open the popup immediately so loading is visible.
  setDetailOrder({
   _id: orderId,
   orderNumber: "Loading order...",
  });

  setDetailItems([]);
  setDetailHistory([]);
  setDetailPaymentHistory([]);
  setDetailStatusId("");
  setDetailNote("");
  setDetailPaymentStatus("PENDING");
  setDetailLoading(true);
  setError("");
  setNotice("");

  try {
   const response = await fetch(`/api/admin/orders/${orderId}`);
   const result: OrderDetailResponse = await response.json();

   if (!response.ok || !result.success || !result.order) {
    throw new Error(result.message || `Unable to load order details (HTTP ${response.status}).`);
   }

   setDetailOrder(result.order);
   setDetailItems(Array.isArray(result.items) ? result.items : []);
   setDetailHistory(Array.isArray(result.history) ? result.history : []);
   setDetailPaymentHistory(Array.isArray(result.paymentHistory) ? result.paymentHistory : []);

   const status = result.order.statusId;

   setDetailStatusId(status && typeof status === "object" ? status._id : typeof status === "string" ? status : "");

   setDetailPaymentStatus(result.order.paymentStatus || "PENDING");
  } catch (err) {
   setDetailOrder(null);
   setError(err instanceof Error ? err.message : "Unable to load order details.");
   console.error("openOrderDetail error:", err);
  } finally {
   setDetailLoading(false);
  }
 };

 const openEditOrder = async (orderId: string) => {
  setIsEditOpen(false);
  setIsSavingEdit(false);
  setEditingOrder(null);
  setError("");
  setNotice("");

  try {
   const response = await fetch(`/api/admin/orders/${orderId}`);
   const result: OrderDetailResponse = await response.json();

   if (!response.ok || !result.success || !result.order) {
    throw new Error(result.message || "Unable to load order for editing.");
   }

   const order = result.order;
   const customer = getCustomer(order);
   const address = order.shippingAddress || {};

   setEditingOrder(order);

   setEditCustomer({
    name: customer.name || "",
    phone: customer.phone || "",
    email: customer.email || "",
   });

   setEditAddress({
    address: address.address || "",
    province: address.province || "",
    district: address.district || "",
    zipcode: address.postalCode || "",
   });

   setEditShippingFee(Number(order.shippingFee || 0));
   setEditDiscount(Number(order.discount || 0));
   setEditShippingMethod(order.shippingMethod || "");
   setEditTrackingNumber(order.trackingNumber || "");
   setEditNote(order.note || "");

   setEditItems(
    (result.items || []).map((item) => {
     const product = item.productId && typeof item.productId === "object" ? item.productId : undefined;

     const productId = typeof item.productId === "string" ? item.productId : item.productId?._id || "";

     return {
      productId,
      productName: item.productSnapshot?.name || product?.name || "Product",
      sku: item.productSnapshot?.sku || product?.sku || "",
      quantity: Number(item.quantity || 1),
      price: Number(item.price || 0),
     };
    }),
   );

   setIsEditOpen(true);
  } catch (err) {
   setError(err instanceof Error ? err.message : "Unable to load order for editing.");
  }
 };

 const saveEditOrder = async () => {
  if (!editingOrder || isSavingEdit) return;

  if (!editCustomer.name.trim() || !editCustomer.phone.trim() || !editAddress.address.trim()) {
   setError("Please enter the customer's name, phone, and address.");
   return;
  }

  if (
   editItems.length === 0 ||
   editItems.some((item) => !item.productId || !Number.isInteger(item.quantity) || item.quantity < 1 || !Number.isFinite(item.price) || item.price < 0)
  ) {
   setError("Please check the products, quantities, and prices.");
   return;
  }

  setIsSavingEdit(true);
  setError("");
  setNotice("");

  try {
   const response = await fetch(`/api/admin/orders/${editingOrder._id}`, {
    method: "PATCH",
    headers: {
     "Content-Type": "application/json",
    },
    body: JSON.stringify({
     customerSnapshot: {
      name: editCustomer.name.trim(),
      phone: editCustomer.phone.trim(),
      email: editCustomer.email.trim(),
     },
     shippingAddress: {
      address: editAddress.address.trim(),
      province: editAddress.province.trim(),
      district: editAddress.district.trim(),
      postalCode: editAddress.zipcode.trim(),
     },
     shippingFee: Number(editShippingFee),
     discount: Number(editDiscount),
     shippingMethod: editShippingMethod.trim(),
     trackingNumber: editTrackingNumber.trim(),
     note: editNote.trim(),
     items: editItems.map((item) => ({
      productId: item.productId,
      quantity: Number(item.quantity),
      price: Number(item.price),
     })),
    }),
   });

   const result = await response.json();

   if (!response.ok || !result.success) {
    throw new Error(result.message || "Unable to update order.");
   }

   setIsEditOpen(false);
   setEditingOrder(null);
   setNotice(result.message || "Order updated successfully.");

   await loadOrders();

   if (detailOrder?._id === editingOrder._id) {
    await openOrderDetail(editingOrder._id);
   }
  } catch (err) {
   setError(err instanceof Error ? err.message : "Unable to update order.");
  } finally {
   setIsSavingEdit(false);
  }
 };

 const saveDetailStatus = async () => {
  if (!detailOrder || !detailStatusId || savingDetailStatus) return;

  const currentStatus = getOrderStatus(detailOrder);

  if (detailStatusId === currentStatus?._id) {
   setNotice("The selected status is already applied.");
   return;
  }

  setSavingDetailStatus(true);
  setError("");
  setNotice("");

  try {
   const response = await fetch(`/api/admin/orders/${detailOrder._id}`, {
    method: "PATCH",
    headers: {
     "Content-Type": "application/json",
    },
    body: JSON.stringify({
     statusId: detailStatusId,
     note: detailNote,
    }),
   });

   const result = await response.json();

   if (!response.ok || !result.success) {
    throw new Error(result.message || "Unable to update order status.");
   }

   setNotice(result.message || "Order status updated successfully.");

   const refreshedResponse = await fetch(`/api/admin/orders/${detailOrder._id}`);
   const refreshed: OrderDetailResponse = await refreshedResponse.json();

   if (!refreshedResponse.ok || !refreshed.success || !refreshed.order) {
    throw new Error(refreshed.message || "Status saved, but order details could not be refreshed.");
   }

   setDetailOrder(refreshed.order);
   setDetailItems(Array.isArray(refreshed.items) ? refreshed.items : []);
   setDetailHistory(Array.isArray(refreshed.history) ? refreshed.history : []);
   setDetailPaymentHistory(Array.isArray(refreshed.paymentHistory) ? refreshed.paymentHistory : []);

   const updatedStatus = refreshed.order.statusId;

   setDetailStatusId(updatedStatus && typeof updatedStatus === "object" ? updatedStatus._id : typeof updatedStatus === "string" ? updatedStatus : "");

   setDetailNote("");
   setOrders((currentOrders) =>
    currentOrders.map((item) =>
     item._id === refreshed.order!._id
      ? {
         ...item,
         statusId: refreshed.order!.statusId,
         updatedAt: refreshed.order!.updatedAt,
        }
      : item,
    ),
   );
  } catch (err) {
   setError(err instanceof Error ? err.message : "Unable to update order status.");
  } finally {
   setSavingDetailStatus(false);
  }
 };

 const totalPages = Math.max(1, pagination.totalPages || Math.ceil(pagination.total / PAGE_SIZE));

 if (sessionStatus === "loading") {
  return (
   <div className="flex min-h-[300px] items-center justify-center">
    <FaSyncAlt className="animate-spin text-2xl text-gray-500" />
   </div>
  );
 }

 const currentDetailStatus = detailOrder ? getOrderStatus(detailOrder) : null;

 const detailNextStatuses = getForwardStatuses(currentDetailStatus, statusOptions);
 const updateEditItem = (index: number, field: "quantity" | "price", value: number) => {
  setEditItems((currentItems) => currentItems.map((item, itemIndex) => (itemIndex === index ? { ...item, [field]: value } : item)));
 };

 const removeEditItem = (index: number) => {
  setEditItems((currentItems) => currentItems.filter((_, itemIndex) => itemIndex !== index));
 };
 return (
  <div className="min-h-screen bg-gray-50 p-4 text-gray-800 sm:p-6 lg:p-8">
   <div className="mx-auto max-w-[1600px] space-y-6">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
     <div>
      <p className="text-sm font-medium text-gray-500">Admin / Orders</p>
      <h1 className="mt-1 text-2xl font-bold sm:text-3xl">Order Management</h1>
      <p className="mt-2 text-sm text-gray-500">Review orders, payments, and order processing status.</p>
     </div>

     <div className="flex flex-wrap gap-3">
      <button
       type="button"
       onClick={() => void loadOrders()}
       disabled={loading}
       className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium hover:bg-gray-100 disabled:opacity-50">
       <FaSyncAlt className={loading ? "animate-spin" : ""} />
       Refresh
      </button>

      <Link
       href="/admin/orders/create"
       className="inline-flex items-center justify-center gap-2 rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-gray-700">
       <FaShoppingBag />
       Create order
      </Link>
     </div>
    </div>

    {isSuperAdmin && (
     <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <label className="mb-2 block text-sm font-semibold">Store</label>

      <select
       value={selectedStoreId}
       onChange={(event) => handleStoreChange(event.target.value)}
       className="w-full max-w-md rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-gray-500">
       <option value="">Select a store</option>
       {stores.map((store) => (
        <option key={store._id} value={store._id}>
         {store.name || store.storeName || store._id}
        </option>
       ))}
      </select>
     </div>
    )}

    {selectedStore && isSuperAdmin && (
     <p className="text-sm text-gray-500">
      Showing orders for <span className="font-semibold text-gray-800">{selectedStore.name || selectedStore.storeName || "Selected store"}</span>
     </p>
    )}

    {error && (
     <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
      <FaTimesCircle className="mt-0.5 shrink-0" />
      <div className="flex-1">{error}</div>
      <button type="button" onClick={() => setError("")} aria-label="Dismiss error" className="text-red-500 hover:text-red-800">
       <FaTimesCircle />
      </button>
     </div>
    )}

    {notice && (
     <div className="flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
      <FaCheckCircle className="mt-0.5 shrink-0" />
      <div className="flex-1">{notice}</div>
      <button type="button" onClick={() => setNotice("")} aria-label="Dismiss notice" className="text-emerald-600 hover:text-emerald-800">
       <FaTimesCircle />
      </button>
     </div>
    )}

    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
     <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
       <div>
        <p className="text-sm text-gray-500">Total orders</p>
        <p className="mt-2 text-2xl font-bold">{summary.totalOrders.toLocaleString("en-US")}</p>
       </div>
       <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-xl text-blue-600">
        <FaBox />
       </div>
      </div>
     </div>

     <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
       <div>
        <p className="text-sm text-gray-500">Total order value</p>
        <p className="mt-2 text-2xl font-bold">{formatPrice(summary.totalAmount)}</p>
       </div>
       <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-xl text-emerald-600">
        <FaMoneyBillWave />
       </div>
      </div>
     </div>

     <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
       <div>
        <p className="text-sm text-gray-500">Statuses available</p>
        <p className="mt-2 text-2xl font-bold">{statusOptions.length}</p>
       </div>
       <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-50 text-xl text-purple-600">
        <FaTruck />
       </div>
      </div>
     </div>
    </div>

    {statusOptions.length > 0 && (
     <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
       <FaFilter className="text-gray-500" />
       <h2 className="font-semibold">Order status overview</h2>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2">
       <button
        type="button"
        onClick={() => {
         setSelectedStatusId("");
         setPage(1);
        }}
        className={`min-w-[130px] rounded-lg border p-3 text-left transition ${
         selectedStatusId === "" ? "border-gray-900 bg-gray-900 text-white" : "border-gray-200 bg-white hover:bg-gray-50"
        }`}>
        <p className="text-xs opacity-80">All statuses</p>
        <p className="mt-1 text-xl font-bold">{summary.totalOrders}</p>
       </button>

       {statusOptions.map((status) => {
        const active = selectedStatusId === status.id;

        return (
         <button
          key={status.id}
          type="button"
          onClick={() => {
           setSelectedStatusId(active ? "" : status.id);
           setPage(1);
          }}
          className={`min-w-[150px] rounded-lg border p-3 text-left transition ${
           active ? "border-gray-900 bg-gray-900 text-white" : "border-gray-200 bg-white hover:bg-gray-50"
          }`}>
          <div className="flex items-center gap-2">
           <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: status.color || "#6B7280" }} />
           <span className="text-sm font-medium">{status.name}</span>
          </div>
          <p className="mt-2 text-xl font-bold">{status.count || 0}</p>
         </button>
        );
       })}
      </div>
     </div>
    )}

    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
     <div className="mb-4 flex items-center gap-2">
      <FaFilter className="text-gray-500" />
      <h2 className="font-semibold">Filters</h2>
     </div>

     <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-6">
      <div className="sm:col-span-2">
       <label className="mb-1.5 block text-xs font-semibold text-gray-600">Search orders</label>
       <div className="relative">
        <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
         type="search"
         value={search}
         onChange={(event) => {
          setSearch(event.target.value);
          setPage(1);
         }}
         placeholder="Order number, customer, phone..."
         className="w-full rounded-lg border border-gray-300 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-gray-500"
        />
       </div>
      </div>

      <div>
       <label className="mb-1.5 block text-xs font-semibold text-gray-600">Order status</label>
       <select
        value={selectedStatusId}
        onChange={(event) => {
         setSelectedStatusId(event.target.value);
         setPage(1);
        }}
        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-gray-500">
        <option value="">All statuses</option>
        {statusOptions.map((status) => (
         <option key={status.id} value={status.id}>
          {status.name}
         </option>
        ))}
       </select>
      </div>

      <div>
       <label className="mb-1.5 block text-xs font-semibold text-gray-600">Payment status</label>
       <select
        value={selectedPaymentStatus}
        onChange={(event) => {
         setSelectedPaymentStatus(event.target.value);
         setPage(1);
        }}
        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-gray-500">
        {PAYMENT_STATUS_OPTIONS.map((option) => (
         <option key={option.value} value={option.value}>
          {option.label}
         </option>
        ))}
       </select>
      </div>

      <div>
       <label className="mb-1.5 block text-xs font-semibold text-gray-600">From date</label>
       <input
        type="date"
        value={dateFrom}
        onChange={(event) => {
         setDateFrom(event.target.value);
         setPage(1);
        }}
        className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-gray-500"
       />
      </div>
      <div>
       <label className="mb-1.5 block text-xs font-semibold text-gray-600">Order deletion status</label>

       <select
        value={deletedFilter}
        onChange={(event) => {
         setDeletedFilter(event.target.value as "active" | "deleted" | "all");
         setPage(1);
        }}
        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-gray-500">
        <option value="active">Active orders</option>
        <option value="deleted">Deleted orders</option>
        <option value="all">All orders</option>
       </select>
      </div>
      <div>
       <label className="mb-1.5 block text-xs font-semibold text-gray-600">To date</label>
       <input
        type="date"
        value={dateTo}
        min={dateFrom || undefined}
        onChange={(event) => {
         setDateTo(event.target.value);
         setPage(1);
        }}
        className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-gray-500"
       />
      </div>
     </div>

     <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-4">
      <p className="text-sm text-gray-500">{pagination.total.toLocaleString("en-US")} order(s) found</p>

      <button type="button" onClick={resetFilters} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50">
       Clear filters
      </button>
     </div>
    </div>

    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
     <div className="flex flex-col gap-2 border-b border-gray-200 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
      <div>
       <h2 className="font-semibold">Orders</h2>
       <p className="mt-1 text-xs text-gray-500">
        Page {pagination.page} of {Math.max(totalPages, 1)}
       </p>
      </div>
      <span className="text-sm text-gray-500">{orders.length} order(s) on this page</span>
     </div>

     {loading ? (
      <div className="flex min-h-[250px] items-center justify-center gap-3 text-sm text-gray-500">
       <FaSyncAlt className="animate-spin" />
       Loading orders...
      </div>
     ) : orders.length === 0 ? (
      <div className="flex min-h-[250px] flex-col items-center justify-center px-4 text-center">
       <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 text-2xl text-gray-400">
        <FaBox />
       </div>
       <h3 className="mt-4 font-semibold">No orders found</h3>
       <p className="mt-1 text-sm text-gray-500">Try changing your filters or search terms.</p>
      </div>
     ) : (
      <>
       <div className="w-full overflow-x-auto">
        <table className="w-max min-w-[2200px] table-fixed text-left text-sm">
         <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
          <tr>
           <th className="px-5 py-4 font-semibold">Order</th>
           <th className="px-5 py-4 font-semibold">Customer</th>
           <th className="px-5 py-4 font-semibold">Date</th>
           <th className="px-5 py-4 font-semibold">Total</th>
           <th className="px-5 py-4 font-semibold">Payment</th>
           <th className="px-5 py-4 font-semibold">Order status</th>
           <th className="px-5 py-4 text-right font-semibold">Actions</th>
          </tr>
         </thead>

         <tbody className="divide-y divide-gray-100">
          {orders.map((order) => {
           const customer = getCustomer(order);
           const currentStatus = getOrderStatus(order);

           const nextStatuses = getForwardStatuses(currentStatus, statusOptions);

           const currency = order.currency || "VNĐ";

           return (
            <tr key={order._id} className="hover:bg-gray-50/70">
             <td className="px-5 py-4 align-top">
              <button type="button" onClick={() => void openOrderDetail(order._id)} className="text-left font-semibold text-blue-700 hover:underline">
               {order.orderNumber || order._id}
              </button>
              <p className="mt-1 text-xs text-gray-400">ID: {order._id.slice(-8)}</p>
             </td>

             <td className="max-w-[230px] px-5 py-4 align-top">
              <p className="font-medium text-gray-800">{customer.name || "Guest"}</p>
              <p className="mt-1 text-xs text-gray-500">{customer.phone || "No phone"}</p>
              {customer.email && <p className="mt-1 truncate text-xs text-gray-500">{customer.email}</p>}
             </td>

             <td className="whitespace-nowrap px-5 py-4 align-top text-gray-600">
              <div className="flex items-center gap-2">
               <FaCalendarAlt className="text-gray-400" />
               {formatDate(order.createdAt)}
              </div>
             </td>

             <td className="whitespace-nowrap px-5 py-4 align-top">
              <span className="font-semibold">{formatPrice(Number(order.total || 0), currency)}</span>
             </td>

             <td className="px-5 py-4 align-top">
              <p className="text-xs text-gray-500">{order.paymentMethod || "—"}</p>

              <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getPaymentStatusStyle(order.paymentStatus)}`}>
               {(order.paymentStatus || "PENDING").replace(/_/g, " ")}
              </span>

              <select
               value={order.paymentStatus || "PENDING"}
               disabled={updatingPaymentOrderId === order._id}
               onChange={(event) => {
                void handlePaymentStatusChange(order, event.target.value);
               }}
               className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-2 py-2 text-xs outline-none focus:border-blue-500 disabled:opacity-50"
               aria-label={`Change payment status for ${order.orderNumber || order._id}`}>
               {PAYMENT_STATUS_OPTIONS.filter((option) => option.value !== "").map((option) => (
                <option key={option.value} value={option.value}>
                 {option.label}
                </option>
               ))}
              </select>

              {updatingPaymentOrderId === order._id && <p className="mt-1 text-xs text-gray-500">Updating payment...</p>}
             </td>

             <td className="min-w-[210px] px-5 py-4 align-top">
              <div className="flex items-center gap-2">
               <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{
                 backgroundColor: currentStatus?.color || "#6B7280",
                }}
               />
               <span className="font-medium">{currentStatus?.name || "Unknown status"}</span>
              </div>

              {nextStatuses.length > 0 ? (
               <select
                value=""
                disabled={updatingOrderId === order._id}
                onChange={(event) => {
                 const nextStatusId = event.target.value;

                 if (nextStatusId) {
                  void handleStatusChange(order, nextStatusId);
                 }
                }}
                className="mt-3 w-full rounded-lg border border-gray-300 bg-white px-2.5 py-2 text-xs outline-none focus:border-blue-500 disabled:opacity-50">
                <option value="">{updatingOrderId === order._id ? "Updating..." : "Change order status"}</option>

                {nextStatuses.map((status) => (
                 <option key={status.id} value={status.id}>
                  {status.name}
                 </option>
                ))}
               </select>
              ) : (
               <p className="mt-2 text-xs text-gray-400">{currentStatus?.isFinal ? "This order has reached its final status" : "No later status available"}</p>
              )}
             </td>

             <td className="px-5 py-4 text-right align-top flex gap-1">
              <button
               type="button"
               onClick={() => handleDeleteOrder(order._id)}
               disabled={deletingOrderId === order._id}
               className="rounded-md bg-red-600 px-3 py-2 text-sm text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50">
               {deletingOrderId === order._id ? "Đang xóa..." : "Xóa"}
              </button>
              <button
               type="button"
               onClick={() => void openOrderDetail(order._id)}
               aria-label={`View order ${order.orderNumber || order._id}`}
               className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-xs font-semibold hover:bg-gray-100">
               <FaEye />
               View details
              </button>

              <button
               type="button"
               onClick={() => void openEditOrder(order._id)}
               className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-100">
               <FaEdit />
               Edit
              </button>
             </td>
            </tr>
           );
          })}
         </tbody>
        </table>
       </div>

       <div className="flex flex-col gap-3 border-t border-gray-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <p className="text-sm text-gray-500">
         Showing {pagination.total === 0 ? 0 : (pagination.page - 1) * pagination.limit + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)}{" "}
         of {pagination.total} orders
        </p>

        <div className="flex items-center gap-2">
         <button
          type="button"
          disabled={page <= 1 || loading}
          onClick={() => setPage((current) => Math.max(1, current - 1))}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40">
          <FaChevronLeft />
          Previous
         </button>

         <span className="min-w-[90px] text-center text-sm text-gray-600">
          Page {pagination.page} / {Math.max(totalPages, 1)}
         </span>

         <button
          type="button"
          disabled={page >= totalPages || loading}
          onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40">
          Next
          <FaChevronRight />
         </button>
        </div>
       </div>
      </>
     )}
    </div>
   </div>
   {/* Order detail popup */}
   {(detailLoading || detailOrder) && (
    <div
     className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50 p-2 backdrop-blur-sm sm:p-5"
     onMouseDown={(event) => {
      if (event.target === event.currentTarget && !detailLoading && !savingDetailStatus) {
       setDetailOrder(null);
      }
     }}>
     <section
      role="dialog"
      aria-modal="true"
      aria-labelledby="order-detail-title"
      className="flex max-h-[96vh] w-full max-w-[1500px] flex-col overflow-hidden rounded-2xl bg-gray-100 shadow-2xl">
      {/* Popup header */}
      <header className="flex shrink-0 items-center justify-between border-b border-gray-200 bg-white px-4 py-3 sm:px-6">
       <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Order management</p>
        <h2 id="order-detail-title" className="mt-1 truncate text-lg font-bold text-gray-900">
         {detailOrder?.orderNumber || "Loading order..."}
        </h2>
        {detailOrder && <p className="mt-1 text-sm text-gray-500">{getCustomer(detailOrder).name || "Guest"}</p>}
       </div>

       <button
        type="button"
        onClick={() => {
         if (!savingDetailStatus) setDetailOrder(null);
        }}
        disabled={savingDetailStatus}
        aria-label="Close order details"
        className="ml-3 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-100 disabled:opacity-50">
        <FaTimes />
       </button>
      </header>

      {/* Scrollable popup content */}
      <div className="min-h-0 flex-1 overflow-y-auto p-3 sm:p-5">
       {detailLoading || !detailOrder ? (
        <div className="flex min-h-[300px] items-center justify-center gap-3 text-sm text-gray-500">
         <FaSyncAlt className="animate-spin" />
         Loading order details...
        </div>
       ) : (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.5fr)_minmax(320px,0.9fr)]">
         {/* Main column */}
         <div className="space-y-4">
          <section className="overflow-hidden rounded-xl border border-gray-200 bg-white">
           <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
            <h3 className="font-semibold">Products</h3>
            <span className="text-sm text-gray-500">{detailItems.length} item type(s)</span>
           </div>

           {detailItems.length === 0 ? (
            <p className="p-5 text-sm text-gray-500">No products found for this order.</p>
           ) : (
            <div className="divide-y divide-gray-100">
             {detailItems.map((item) => {
              const snapshot = item.productSnapshot || {};
              const product = item.productId && typeof item.productId === "object" ? item.productId : undefined;

              const name = snapshot.name || product?.name || "Product";
              const sku = snapshot.sku || product?.sku || "—";
              const image = snapshot.image || product?.images?.main;

              return (
               <div key={item._id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
                <div className="flex min-w-0 flex-1 items-center gap-3">
                 <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-gray-100 bg-gray-50">
                  {image ? (
                   // eslint-disable-next-line @next/next/no-img-element
                   <img src={image} alt={name} className="h-full w-full object-contain" />
                  ) : (
                   <FaBox className="text-xl text-gray-300" />
                  )}
                 </div>

                 <div className="min-w-0">
                  <p className="break-words font-semibold text-gray-800">{name}</p>
                  <p className="mt-1 text-xs text-gray-500">SKU: {sku}</p>
                  <p className="mt-1 text-xs text-gray-500">Quantity: {item.quantity}</p>
                 </div>
                </div>

                <div className="flex shrink-0 items-center justify-between gap-4 border-t border-gray-100 pt-3 sm:min-w-[210px] sm:flex-col sm:items-end sm:justify-center sm:border-0 sm:pt-0">
                 <div className="text-sm text-gray-500">
                  {formatPrice(item.price, item.currency || detailOrder.currency)} × {item.quantity}
                 </div>
                 <p className="font-bold text-gray-900">{formatPrice(item.subtotal, item.currency || detailOrder.currency)}</p>
                </div>
               </div>
              );
             })}
            </div>
           )}
          </section>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
           <section className="rounded-xl border border-gray-200 bg-white p-4">
            <h3 className="mb-4 font-semibold">Payment</h3>

            <dl className="space-y-4 text-sm">
             <div>
              <dt className="text-gray-500">Payment method</dt>
              <dd className="mt-1 font-medium">{(detailOrder.paymentMethod || "COD").replace(/_/g, " ")}</dd>
             </div>

             <div>
              <dt className="text-gray-500">Current payment status</dt>
              <dd className="mt-1">
               <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getPaymentStatusStyle(detailOrder.paymentStatus)}`}>
                {(detailOrder.paymentStatus || "PENDING").replace(/_/g, " ")}
               </span>
              </dd>
             </div>

             <div>
              <label htmlFor="detail-payment-status" className="mb-1.5 block text-xs font-semibold text-gray-600">
               Change payment status
              </label>

              <select
               id="detail-payment-status"
               value={detailPaymentStatus}
               disabled={savingDetailPaymentStatus}
               onChange={(event) => {
                setDetailPaymentStatus(event.target.value);
               }}
               className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 disabled:opacity-50">
               {PAYMENT_STATUS_OPTIONS.filter((option) => option.value !== "").map((option) => (
                <option key={option.value} value={option.value}>
                 {option.label}
                </option>
               ))}
              </select>

              <button
               type="button"
               disabled={
                savingDetailPaymentStatus || updatingPaymentOrderId === detailOrder._id || detailPaymentStatus === (detailOrder.paymentStatus || "PENDING")
               }
               onClick={async () => {
                if (savingDetailPaymentStatus) return;

                setSavingDetailPaymentStatus(true);

                const previousPaymentStatus = detailOrder.paymentStatus || "PENDING";

                try {
                 const success = await handlePaymentStatusChange(detailOrder, detailPaymentStatus);

                 if (!success) {
                  setDetailPaymentStatus(previousPaymentStatus);
                 }
                } finally {
                 setSavingDetailPaymentStatus(false);
                }
               }}
               className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50">
               {savingDetailPaymentStatus ? <FaSyncAlt className="animate-spin" /> : <FaCheckCircle />}

               {savingDetailPaymentStatus ? "Saving..." : "Save payment status"}
              </button>
             </div>
            </dl>
           </section>

           <section className="rounded-xl border border-gray-200 bg-white p-4">
            <h3 className="mb-3 font-semibold">Order notes</h3>
            <p className="whitespace-pre-wrap break-words text-sm text-gray-600">{detailOrder.note || "No order note."}</p>
           </section>
          </div>

          <section className="rounded-xl border border-gray-200 bg-white p-4">
           <h3 className="mb-4 font-semibold">Status history</h3>

           {detailHistory.length === 0 ? (
            <p className="text-sm text-gray-500">No status history available.</p>
           ) : (
            <div className="space-y-4">
             {detailHistory.map((history) => (
              <div key={history._id} className="flex gap-3">
               <div className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-blue-500" />
               <div className="min-w-0 flex-1">
                <p className="break-words text-sm font-semibold text-gray-800">
                 {history.fromStatusName || history.fromStatusId?.name || "—"} → {history.toStatusName || history.toStatusId?.name || "—"}
                </p>
                <p className="mt-1 text-xs text-gray-500">
                 {formatDate(history.createdAt)}
                 {history.changedBy?.name ? ` · ${history.changedBy.name}` : ""}
                </p>
                {history.note && <p className="mt-1 whitespace-pre-wrap text-sm text-gray-600">{history.note}</p>}
               </div>
              </div>
             ))}
            </div>
           )}
          </section>

          <section className="rounded-xl border border-gray-200 bg-white p-4">
           <div className="mb-4 flex items-center justify-between gap-3">
            <h3 className="font-semibold">Payment history</h3>
            <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">{detailPaymentHistory.length} record(s)</span>
           </div>

           {detailPaymentHistory.length === 0 ? (
            <p className="text-sm text-gray-500">No payment history available.</p>
           ) : (
            <div className="space-y-4">
             {detailPaymentHistory.map((history) => (
              <div key={history._id} className="flex gap-3">
               <div className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-emerald-500" />

               <div className="min-w-0 flex-1">
                <p className="break-words text-sm font-semibold text-gray-800">
                 {(history.fromPaymentStatus || "PENDING").replace(/_/g, " ")}
                 {" → "}
                 {(history.toPaymentStatus || "PENDING").replace(/_/g, " ")}
                </p>

                <p className="mt-1 text-xs text-gray-500">
                 {formatDate(history.createdAt)}
                 {history.changedBy?.name ? ` · ${history.changedBy.name}` : history.changedBy?.email ? ` · ${history.changedBy.email}` : ""}
                </p>

                {history.note && <p className="mt-1 whitespace-pre-wrap break-words text-sm text-gray-600">{history.note}</p>}
               </div>
              </div>
             ))}
            </div>
           )}
          </section>
         </div>

         {/* Sidebar */}
         <div className="space-y-4">
          <section className="rounded-xl border border-gray-200 bg-white p-4">
           <h3 className="mb-4 font-semibold">Order information</h3>

           <dl className="space-y-3 text-sm">
            <div>
             <dt className="text-gray-500">Order number</dt>
             <dd className="mt-1 break-all font-semibold">{detailOrder.orderNumber || detailOrder._id}</dd>
            </div>
            <div>
             <dt className="text-gray-500">Order ID</dt>
             <dd className="mt-1 break-all text-xs">{detailOrder._id}</dd>
            </div>
            <div>
             <dt className="text-gray-500">Created at</dt>
             <dd className="mt-1">{formatDate(detailOrder.createdAt)}</dd>
            </div>
            <div>
             <dt className="text-gray-500">Last updated</dt>
             <dd className="mt-1">{formatDate(detailOrder.updatedAt)}</dd>
            </div>
            <div>
             <dt className="text-gray-500">Store</dt>
             <dd className="mt-1">{getStoreName(detailOrder, selectedStore?.name || selectedStore?.storeName || "—")}</dd>
            </div>
            <div>
             <dt className="text-gray-500">Created by</dt>
             <dd className="mt-1">{getCreatedByName(detailOrder)}</dd>
            </div>
           </dl>
          </section>

          <section className="rounded-xl border border-gray-200 bg-white p-4">
           <h3 className="mb-4 font-semibold">Customer</h3>

           <dl className="space-y-3 text-sm">
            <div>
             <dt className="text-gray-500">Full name</dt>
             <dd className="mt-1 break-words font-medium">{getCustomer(detailOrder).name || "Guest"}</dd>
            </div>
            <div>
             <dt className="text-gray-500">Phone</dt>
             <dd className="mt-1 break-words">{getCustomer(detailOrder).phone || "—"}</dd>
            </div>
            <div>
             <dt className="text-gray-500">Email</dt>
             <dd className="mt-1 break-words">{getCustomer(detailOrder).email || "—"}</dd>
            </div>
           </dl>
          </section>

          <section className="rounded-xl border border-gray-200 bg-white p-4">
           <div className="mb-4 flex items-center gap-2">
            <FaMapMarkerAlt className="text-gray-500" />
            <h3 className="font-semibold">Shipping address</h3>
           </div>

           <p className="break-words text-sm leading-6 text-gray-700">
            {[
             detailOrder.shippingAddress?.address,
             detailOrder.shippingAddress?.ward,
             detailOrder.shippingAddress?.district,
             detailOrder.shippingAddress?.province,
             detailOrder.shippingAddress?.postalCode,
            ]
             .filter(Boolean)
             .join(", ") || "No shipping address"}
           </p>

           <div className="mt-4 border-t border-gray-100 pt-3 text-sm">
            <p className="text-gray-500">Shipping method</p>
            <p className="mt-1 font-medium">{detailOrder.shippingMethod || "—"}</p>

            <p className="mt-3 text-gray-500">Tracking number</p>
            <p className="mt-1 break-all font-medium">{detailOrder.trackingNumber || "—"}</p>
           </div>
          </section>

          <section className="rounded-xl border border-gray-200 bg-white p-4">
           <h3 className="mb-4 font-semibold">Payment</h3>

           <dl className="space-y-3 text-sm">
            <div>
             <dt className="text-gray-500">Payment method</dt>
             <dd className="mt-1 font-medium">{(detailOrder.paymentMethod || "COD").replace(/_/g, " ")}</dd>
            </div>
            <div>
             <dt className="text-gray-500">Payment status</dt>
             <dd className="mt-1">
              <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getPaymentStatusStyle(detailOrder.paymentStatus)}`}>
               {(detailOrder.paymentStatus || "PENDING").replace(/_/g, " ")}
              </span>
             </dd>
            </div>
           </dl>
          </section>
         </div>
        </div>
       )}
      </div>

      {/* Fixed footer */}
      {detailOrder && !detailLoading && (
       <footer className="shrink-0 border-t border-gray-200 bg-white p-3 sm:p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
         <div className="grid flex-1 grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
           <select
            value={detailStatusId}
            onChange={(event) => setDetailStatusId(event.target.value)}
            disabled={savingDetailStatus}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 disabled:opacity-50">
            {currentDetailStatus && <option value={currentDetailStatus._id}>Current: {currentDetailStatus.name}</option>}

            {detailNextStatuses.map((status: any) => {
             const id = getStatusId(status);
             const populated = typeof status === "string" ? statusOptions.find((option) => option.id === status) : status;

             return (
              <option key={id} value={id}>
               {populated?.name || id}
              </option>
             );
            })}
           </select>
          </div>

          <div>
           <label className="mb-1.5 block text-xs font-semibold text-gray-600">Status change note</label>
           <input
            value={detailNote}
            onChange={(event) => setDetailNote(event.target.value)}
            placeholder="Optional note..."
            disabled={savingDetailStatus}
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 disabled:opacity-50"
           />
          </div>
         </div>

         <div className="flex flex-wrap items-center justify-between gap-2 lg:justify-end">
          <div className="mr-2">
           <p className="text-xs text-gray-500">Order total</p>
           <p className="text-lg font-bold">{formatPrice(detailOrder.total || 0, detailOrder.currency)}</p>
          </div>

          <button
           type="button"
           onClick={() => setDetailOrder(null)}
           disabled={savingDetailStatus}
           className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-semibold hover:bg-gray-50 disabled:opacity-50">
           Close
          </button>

          <button
           type="button"
           onClick={() => void saveDetailStatus()}
           disabled={savingDetailStatus || !detailStatusId || detailStatusId === currentDetailStatus?._id}
           className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50">
           {savingDetailStatus ? <FaSyncAlt className="animate-spin" /> : <FaCheckCircle />}
           {savingDetailStatus ? "Saving..." : "Save status"}
          </button>
         </div>
        </div>
       </footer>
      )}
     </section>
    </div>
   )}

   {/* Edit Order Modal */}
   {isEditOpen && editingOrder && (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-3 sm:p-6">
     <div className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-5 py-4 sm:px-7">
       <div>
        <h2 className="text-xl font-bold text-gray-900">Edit Order</h2>
        <p className="mt-1 text-sm text-gray-500">Order ID: {editingOrder._id}</p>
       </div>

       <button
        type="button"
        onClick={() => {
         if (!isSavingEdit) {
          setIsEditOpen(false);
          setEditingOrder(null);
         }
        }}
        disabled={isSavingEdit}
        className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 disabled:opacity-50"
        aria-label="Close edit form">
        ✕
       </button>
      </div>

      {/* Form content */}
      <div className="flex-1 space-y-6 overflow-y-auto p-5 sm:p-7">
       {/* Customer information */}
       <section>
        <h3 className="mb-3 font-semibold text-gray-900">Customer Information</h3>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
         <label className="text-sm text-gray-700">
          Full name *
          <input
           value={editCustomer.name}
           onChange={(event) =>
            setEditCustomer({
             ...editCustomer,
             name: event.target.value,
            })
           }
           className="mt-1 w-full rounded-lg border px-3 py-2.5 outline-none focus:border-blue-500"
           required
          />
         </label>

         <label className="text-sm text-gray-700">
          Phone *
          <input
           value={editCustomer.phone}
           onChange={(event) =>
            setEditCustomer({
             ...editCustomer,
             phone: event.target.value,
            })
           }
           className="mt-1 w-full rounded-lg border px-3 py-2.5 outline-none focus:border-blue-500"
           required
          />
         </label>

         <label className="text-sm text-gray-700 sm:col-span-2">
          Email
          <input
           type="email"
           value={editCustomer.email}
           onChange={(event) =>
            setEditCustomer({
             ...editCustomer,
             email: event.target.value,
            })
           }
           className="mt-1 w-full rounded-lg border px-3 py-2.5 outline-none focus:border-blue-500"
          />
         </label>
        </div>
       </section>

       {/* Shipping address */}
       <section>
        <h3 className="mb-3 font-semibold text-gray-900">Shipping Address</h3>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
         <label className="text-sm text-gray-700 sm:col-span-2">
          Address *
          <input
           value={editAddress.address}
           onChange={(event) =>
            setEditAddress({
             ...editAddress,
             address: event.target.value,
            })
           }
           className="mt-1 w-full rounded-lg border px-3 py-2.5 outline-none focus:border-blue-500"
           required
          />
         </label>

         <label className="text-sm text-gray-700">
          Province / State
          <input
           value={editAddress.province}
           onChange={(event) =>
            setEditAddress({
             ...editAddress,
             province: event.target.value,
            })
           }
           className="mt-1 w-full rounded-lg border px-3 py-2.5 outline-none focus:border-blue-500"
          />
         </label>

         <label className="text-sm text-gray-700">
          District / City
          <input
           value={editAddress.district}
           onChange={(event) =>
            setEditAddress({
             ...editAddress,
             district: event.target.value,
            })
           }
           className="mt-1 w-full rounded-lg border px-3 py-2.5 outline-none focus:border-blue-500"
          />
         </label>

         <label className="text-sm text-gray-700">
          Postal Code
          <input
           value={editAddress.zipcode}
           onChange={(event) =>
            setEditAddress({
             ...editAddress,
             zipcode: event.target.value,
            })
           }
           className="mt-1 w-full rounded-lg border px-3 py-2.5 outline-none focus:border-blue-500"
          />
         </label>
        </div>
       </section>

       {/* Order items */}
       <section>
        <div className="mb-3 flex items-center justify-between">
         <h3 className="font-semibold text-gray-900">Order Items</h3>
         <span className="text-xs text-gray-500">Edit quantity and unit price</span>
        </div>

        <div className="space-y-3">
         {editItems.map((item, index) => (
          <div key={`${item.productId}-${index}`} className="rounded-xl border p-4">
           <div className="mb-3 flex items-start justify-between gap-3">
            <div className="min-w-0">
             <p className="break-words font-medium text-gray-900">{item.productName}</p>
             {item.sku && <p className="mt-1 text-xs text-gray-500">SKU: {item.sku}</p>}
            </div>

            <button
             type="button"
             onClick={() => removeEditItem(index)}
             className="shrink-0 rounded-lg px-2 py-1 text-sm font-medium text-red-600 hover:bg-red-50">
             Remove
            </button>
           </div>

           <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <label className="text-sm text-gray-700">
             Quantity
             <input
              type="number"
              min={1}
              step={1}
              value={item.quantity}
              onChange={(event) => updateEditItem(index, "quantity", Number(event.target.value))}
              className="mt-1 w-full rounded-lg border px-3 py-2 outline-none focus:border-blue-500"
             />
            </label>

            <label className="text-sm text-gray-700">
             Unit Price
             <input
              type="number"
              min={0}
              step="0.01"
              value={item.price}
              onChange={(event) => updateEditItem(index, "price", Number(event.target.value))}
              className="mt-1 w-full rounded-lg border px-3 py-2 outline-none focus:border-blue-500"
             />
            </label>

            <div className="text-sm text-gray-700">
             Line Total
             <p className="mt-1 rounded-lg bg-gray-50 px-3 py-2 font-semibold text-gray-900">{(item.quantity * item.price).toLocaleString()}</p>
            </div>
           </div>
          </div>
         ))}

         {editItems.length === 0 && <p className="rounded-xl border border-dashed p-6 text-center text-sm text-gray-500">No products in this order.</p>}
        </div>
       </section>

       {/* Shipping and discount */}
       <section>
        <h3 className="mb-3 font-semibold text-gray-900">Additional Charges</h3>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
         <label className="text-sm text-gray-700">
          Shipping Fee
          <input
           type="number"
           min={0}
           value={editShippingFee}
           onChange={(event) => setEditShippingFee(Number(event.target.value))}
           className="mt-1 w-full rounded-lg border px-3 py-2.5 outline-none focus:border-blue-500"
          />
         </label>

         <label className="text-sm text-gray-700">
          Discount
          <input
           type="number"
           min={0}
           value={editDiscount}
           onChange={(event) => setEditDiscount(Number(event.target.value))}
           className="mt-1 w-full rounded-lg border px-3 py-2.5 outline-none focus:border-blue-500"
          />
         </label>

         <label className="text-sm text-gray-700">
          Shipping Method
          <input
           value={editShippingMethod}
           onChange={(event) => setEditShippingMethod(event.target.value)}
           className="mt-1 w-full rounded-lg border px-3 py-2.5 outline-none focus:border-blue-500"
          />
         </label>

         <label className="text-sm text-gray-700">
          Tracking Number
          <input
           value={editTrackingNumber}
           onChange={(event) => setEditTrackingNumber(event.target.value)}
           className="mt-1 w-full rounded-lg border px-3 py-2.5 outline-none focus:border-blue-500"
          />
         </label>

         <label className="text-sm text-gray-700 sm:col-span-2">
          Order Note
          <textarea
           rows={3}
           value={editNote}
           onChange={(event) => setEditNote(event.target.value)}
           className="mt-1 w-full rounded-lg border px-3 py-2.5 outline-none focus:border-blue-500"
          />
         </label>
        </div>
       </section>
      </div>

      {/* Footer */}
      <div className="flex flex-col-reverse gap-3 border-t bg-gray-50 px-5 py-4 sm:flex-row sm:justify-end sm:px-7">
       <button
        type="button"
        onClick={() => {
         if (!isSavingEdit) {
          setIsEditOpen(false);
          setEditingOrder(null);
         }
        }}
        disabled={isSavingEdit}
        className="rounded-lg border bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-100 disabled:opacity-50">
        Cancel
       </button>

       <button
        type="button"
        onClick={() => void saveEditOrder()}
        disabled={isSavingEdit}
        className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50">
        {isSavingEdit ? "Saving..." : "Save Changes"}
       </button>
      </div>
     </div>
    </div>
   )}
  </div>
 );
}

OrdersPage.Layout = "Admin";
