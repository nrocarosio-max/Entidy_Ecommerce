import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

import bcrypt from "bcryptjs";

import { connectDB } from "../lib/mongodb";
import { User } from "../models/User";
import { Role } from "../models/Role";

async function createAdmin() {
 try {
  console.log("1. Loading environment variables...");

  console.log("MONGODB_URI:", process.env.MONGODB_URI ? "FOUND" : "NOT FOUND");

  console.log("2. Connecting to MongoDB...");

  await connectDB();

  console.log("3. MongoDB connected.");

  const email = "entidy.me@gmail.com";
  const password = "732002@Entidy";

  console.log("4. Finding SUPER_ADMIN role...");

  const superAdminRole = await Role.findOne({
   code: "SUPER_ADMIN",
  });

  if (!superAdminRole) {
   throw new Error("SUPER_ADMIN role not found. Please run npm run create-roles first.");
  }

  console.log("SUPER_ADMIN Role ID:", superAdminRole._id.toString());

  console.log("5. Checking existing admin...");

  const existingAdmin = await User.findOne({
   email,
  });

  if (existingAdmin) {
   console.log("Admin already exists.");
   console.log("Admin ID:", existingAdmin._id.toString());

   return;
  }

  console.log("6. Creating password hash...");

  const passwordHash = await bcrypt.hash(password, 12);

  console.log("7. Creating admin...");

  const admin = await User.create({
   name: "System Admin",
   email,
   phone: "",
   passwordHash,

   roleId: superAdminRole._id,

   storeId: null,

   isActive: true,
  });

  console.log("8. Admin created successfully!");
  console.log("Admin ID:", admin._id.toString());
  console.log("Email:", admin.email);
  console.log("Role ID:", admin.roleId.toString());
  console.log("Role: SUPER_ADMIN");
 } catch (error) {
  console.error("CREATE ADMIN ERROR:");
  console.error(error);
 } finally {
  process.exit(0);
 }
}

createAdmin();
