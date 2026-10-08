import "dotenv/config";

import mongoose from "mongoose";

import { connectDB } from "../lib/mongodb";
import { Customer } from "../models/Customer";
import { normalizeText } from "../lib/normalizeText";

async function migrateCustomers() {
 await connectDB();

 const customers = await Customer.find({}).select("_id name").lean();

 console.log(`Found ${customers.length} customers.`);

 let updated = 0;

 for (const customer of customers) {
  const nameNormalized = normalizeText(customer.name);

  await Customer.updateOne(
   { _id: customer._id },
   {
    $set: {
     nameNormalized,
    },
   },
  );

  updated++;

  console.log(`${updated}/${customers.length} - ${customer.name} -> ${nameNormalized}`);
 }

 console.log(`Migration completed. Updated: ${updated}`);

 await mongoose.disconnect();
}

migrateCustomers().catch((error) => {
 console.error("Migration failed:", error);
 process.exit(1);
});
