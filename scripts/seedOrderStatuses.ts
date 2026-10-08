import "dotenv/config";
import mongoose from "mongoose";

import { connectDB } from "../lib/mongodb";
import { OrderStatus } from "../models/OrderStatus";

const STORE_ID = "6ac651383599f4feba2d846b";

const statuses = [
 {
  name: "Chờ hàng",
  code: "WAITING_STOCK",
  description: "Đơn hàng đang chờ hàng.",
  color: "#F59E0B",
  icon: "clock",
  sortOrder: 1,
  isActive: true,
  isInitial: true,
  isFinal: false,
 },
 {
  name: "Ưu tiên xuất đơn",
  code: "PRIORITY",
  description: "Đơn hàng được ưu tiên xuất trước.",
  color: "#8B5CF6",
  icon: "zap",
  sortOrder: 2,
  isActive: true,
  isInitial: false,
  isFinal: false,
 },
 {
  name: "Chờ in",
  code: "WAITING_PRINT",
  description: "Đơn hàng đang chờ in.",
  color: "#3B82F6",
  icon: "printer",
  sortOrder: 3,
  isActive: true,
  isInitial: false,
  isFinal: false,
 },
 {
  name: "Xác nhận đơn hàng",
  code: "CONFIRMED",
  description: "Đơn hàng đã được xác nhận.",
  color: "#0EA5E9",
  icon: "check-circle",
  sortOrder: 4,
  isActive: true,
  isInitial: false,
  isFinal: false,
 },
 {
  name: "Đang đóng hàng",
  code: "PACKING",
  description: "Đơn hàng đang được đóng gói.",
  color: "#6366F1",
  icon: "package",
  sortOrder: 5,
  isActive: true,
  isInitial: false,
  isFinal: false,
 },
 {
  name: "Chờ chuyển hàng",
  code: "WAITING_SHIPMENT",
  description: "Đơn hàng đã đóng xong và chờ bàn giao vận chuyển.",
  color: "#14B8A6",
  icon: "truck",
  sortOrder: 6,
  isActive: true,
  isInitial: false,
  isFinal: false,
 },
 {
  name: "Gửi hàng đi",
  code: "SHIPPED",
  description: "Đơn hàng đã được bàn giao cho đơn vị vận chuyển.",
  color: "#22C55E",
  icon: "send",
  sortOrder: 7,
  isActive: true,
  isInitial: false,
  isFinal: false,
 },
 {
  name: "Hủy đơn",
  code: "CANCELLED",
  description: "Đơn hàng đã bị hủy.",
  color: "#EF4444",
  icon: "x-circle",
  sortOrder: 8,
  isActive: true,
  isInitial: false,
  isFinal: true,
 },
];

async function seedOrderStatuses() {
 try {
  await connectDB();

  console.log("Connected to MongoDB.");

  const createdStatuses: Record<string, mongoose.Types.ObjectId> = {};

  for (const status of statuses) {
   const existing = await OrderStatus.findOne({
    storeId: STORE_ID,
    code: status.code,
   });

   if (existing) {
    console.log(`Already exists: ${status.code}`);

    createdStatuses[status.code] = existing._id;

    continue;
   }

   const created = await OrderStatus.create({
    storeId: STORE_ID,
    ...status,
    nextStatusIds: [],
   });

   createdStatuses[status.code] = created._id;

   console.log(`Created: ${status.code} - ${status.name}`);
  }

  /*
   * Define the workflow.
   */
  const transitions: Record<string, string[]> = {
   WAITING_STOCK: ["PRIORITY", "CANCELLED"],

   PRIORITY: ["WAITING_PRINT", "CANCELLED"],

   WAITING_PRINT: ["CONFIRMED", "CANCELLED"],

   CONFIRMED: ["PACKING", "CANCELLED"],

   PACKING: ["WAITING_SHIPMENT", "CANCELLED"],

   WAITING_SHIPMENT: ["SHIPPED", "CANCELLED"],

   SHIPPED: [],

   CANCELLED: [],
  };

  for (const [code, nextCodes] of Object.entries(transitions)) {
   const statusId = createdStatuses[code];

   if (!statusId) continue;

   const nextStatusIds = nextCodes.map((nextCode) => createdStatuses[nextCode]).filter(Boolean);

   await OrderStatus.findByIdAndUpdate(statusId, {
    $set: {
     nextStatusIds,
    },
   });
  }

  console.log("Order status workflow configured.");

  console.log("Seed completed.");

  process.exit(0);
 } catch (error) {
  console.error("Seed order statuses failed:", error);

  process.exit(1);
 }
}

seedOrderStatuses();
