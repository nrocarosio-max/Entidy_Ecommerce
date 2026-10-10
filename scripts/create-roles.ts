import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

import { connectDB } from "../lib/mongodb";
import { Role } from "../models/Role";

const roles = [
 {
  name: "Super Admin",
  code: "SUPER_ADMIN",
  description: "Full access to the entire system.",
  permissions: ["*"],
 },

 {
  name: "Store Admin",
  code: "STORE_ADMIN",
  description: "Manage a specific store and its operations.",
  permissions: [
   "users.read",

   "products.read",
   "products.create",
   "products.update",
   "products.delete",

   "categories.read",
   "categories.create",
   "categories.update",
   "categories.delete",

   "brands.read",
   "brands.create",
   "brands.update",
   "brands.delete",

   "inventory.read",
   "inventory.create",
   "inventory.update",

   "orders.read",
   "orders.update",

   "customers.read",
   "customers.update",

   "reports.read",
  ],
 },

 {
  name: "Marketing",
  code: "MARKETING",
  description: "Manage marketing activities for a specific store.",
  permissions: [
   "products.read",
   "categories.read",
   "brands.read",

   "customers.read",

   "marketing.read",
   "marketing.create",
   "marketing.update",
   "marketing.delete",

   "reports.read",
  ],
 },

 {
  name: "Sales",
  code: "SALES",
  description: "Manage sales and customer activities for a specific store.",
  permissions: [
   "products.read",
   "categories.read",
   "brands.read",

   "customers.read",
   "customers.create",
   "customers.update",

   "orders.read",
   "orders.create",
   "orders.update",
  ],
 },

 {
  name: "Fulfillment",
  code: "FULFILLMENT",
  description: "Manage inventory, orders and shipping operations.",
  permissions: ["products.read", "inventory.read", "inventory.update", "orders.read", "orders.update", "shipping.read", "shipping.create", "shipping.update"],
 },
 {
  name: "Affiliate",
  code: "AFFILIATE",
  description: "Promote products and track personal referrals and commissions.",
  permissions: ["affiliate.dashboard.read", "affiliate.links.read", "affiliate.orders.read", "affiliate.commissions.read"],
 },
];

async function createRoles() {
 try {
  console.log("1. Loading environment variables...");

  console.log("MONGODB_URI:", process.env.MONGODB_URI ? "FOUND" : "NOT FOUND");

  console.log("2. Connecting to MongoDB...");

  await connectDB();

  console.log("3. MongoDB connected.");

  for (const roleData of roles) {
   const role = await Role.findOneAndUpdate(
    {
     code: roleData.code,
    },
    {
     $set: {
      name: roleData.name,
      description: roleData.description,
      permissions: roleData.permissions,
      isActive: true,
     },
    },
    {
     new: true,
     upsert: true,
     setDefaultsOnInsert: true,
    },
   );

   console.log(`Role synced: ${role.code}`);
  }

  console.log("4. All roles synced successfully.");
 } catch (error) {
  console.error("CREATE ROLES ERROR:");
  console.error(error);
 } finally {
  process.exit(0);
 }
}

createRoles();
