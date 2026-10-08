import "dotenv/config";

import mongoose from "mongoose";

import { connectDB } from "~/lib/mongodb";
import { Order } from "~/models/Order";
import { OrderStatus } from "~/models/OrderStatus";

const STORE_ID = "6ac651383599f4feba2d846b";

const statusMapping: Record<string, string> = {
 PENDING: "WAITING_STOCK",
 CONFIRMED: "CONFIRMED",
 PROCESSING: "PACKING",
 SHIPPED: "SHIPPED",
 DELIVERED: "SHIPPED",
 CANCELLED: "CANCELLED",
 RETURNED: "SHIPPED",
};

async function migrateOrders() {
 try {
  await connectDB();

  console.log("Connected to MongoDB.");

  const statuses = await OrderStatus.find({
   storeId: STORE_ID,
  }).lean();

  const statusMap = new Map(statuses.map((status) => [status.code, status]));

  const orders = await Order.find({
   storeId: STORE_ID,
   $or: [{ statusId: { $exists: false } }, { statusId: null }],
  });

  console.log(`Found ${orders.length} orders to migrate.`);

  let migrated = 0;
  let skipped = 0;

  for (const order of orders) {
   const oldStatus = (order as any).status;

   if (!oldStatus) {
    console.log(`Skipped ${order.orderNumber}: old status not found.`);

    skipped++;
    continue;
   }

   const newStatusCode = statusMapping[oldStatus];

   if (!newStatusCode) {
    console.log(`Skipped ${order.orderNumber}: unsupported status ${oldStatus}.`);

    skipped++;
    continue;
   }

   const newStatus = statusMap.get(newStatusCode);

   if (!newStatus) {
    console.log(`Skipped ${order.orderNumber}: OrderStatus ${newStatusCode} not found.`);

    skipped++;
    continue;
   }

   order.statusId = newStatus._id;

   await order.save();

   migrated++;

   console.log(`Migrated ${order.orderNumber}: ${oldStatus} -> ${newStatusCode}`);
  }

  console.log("");
  console.log("Migration completed.");
  console.log(`Migrated: ${migrated}`);
  console.log(`Skipped: ${skipped}`);
 } catch (error) {
  console.error("Migration failed:", error);
  process.exitCode = 1;
 } finally {
  await mongoose.disconnect();
 }
}

migrateOrders();
