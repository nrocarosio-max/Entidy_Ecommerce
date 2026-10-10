import type { NextApiRequest, NextApiResponse } from "next";
import mongoose from "mongoose";

import { normalizeText } from "~/lib/normalizeText";
import { connectDB } from "~/lib/mongodb";
import { requirePermission } from "~/lib/permissions";

import { Customer } from "~/models/Customer";
import { Order } from "~/models/Order";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
 try {
  await connectDB();

  const { id } = req.query;

  if (typeof id !== "string" || !mongoose.Types.ObjectId.isValid(id)) {
   return res.status(400).json({
    success: false,
    message: "Invalid customer ID.",
   });
  }

  const customerId = new mongoose.Types.ObjectId(id);

  /**
   * GET CUSTOMER
   */
  if (req.method === "GET") {
   const user = await requirePermission(req, "customers.read");

   const customer = await Customer.findById(customerId).populate("storeId", "name slug").lean();

   if (!customer) {
    return res.status(404).json({
     success: false,
     message: "Customer not found.",
    });
   }

   const customerStoreId = customer.storeId && typeof customer.storeId === "object" ? customer.storeId._id.toString() : customer.storeId?.toString();

   if (user.role !== "SUPER_ADMIN" && (!user.storeId || user.storeId !== customerStoreId)) {
    return res.status(403).json({
     success: false,
     message: "You do not have access to this customer.",
    });
   }

   const orders = await Order.find({
    customerId: customerId,
   })
    .sort({ createdAt: -1 })
    .lean();

   return res.status(200).json({
    success: true,
    customer,
    orders,
   });
  }

  /**
   * UPDATE CUSTOMER
   */
  if (req.method === "PATCH") {
   const user = await requirePermission(req, "customers.update");

   const customer = await Customer.findById(customerId);

   if (!customer) {
    return res.status(404).json({
     success: false,
     message: "Customer not found.",
    });
   }

   const customerStoreId = customer.storeId.toString();

   if (user.role !== "SUPER_ADMIN" && (!user.storeId || user.storeId !== customerStoreId)) {
    return res.status(403).json({
     success: false,
     message: "You do not have access to this customer.",
    });
   }

   const { name, phone, isActive } = req.body;

   if (name !== undefined) {
    const customerName = String(name).trim();

    if (!customerName) {
     return res.status(400).json({
      success: false,
      message: "Customer name is required.",
     });
    }

    customer.name = customerName;
    customer.nameNormalized = normalizeText(customerName);
   }

   if (phone !== undefined) {
    const customerPhone = String(phone).trim();

    if (!customerPhone) {
     return res.status(400).json({
      success: false,
      message: "Customer phone is required.",
     });
    }

    customer.phone = customerPhone;
   }

   if (isActive !== undefined) {
    customer.isActive = Boolean(isActive);
   }

   await customer.save();

   const updatedCustomer = await Customer.findById(customerId).populate("storeId", "name slug").lean();

   return res.status(200).json({
    success: true,
    message: "Customer updated successfully.",
    customer: updatedCustomer,
   });
  }

  /**
   * RESTORE CUSTOMER
   */
  if (req.method === "PUT") {
   const user = await requirePermission(req, "customers.update");

   const customer = await Customer.findById(customerId);

   if (!customer) {
    return res.status(404).json({
     success: false,
     message: "Customer not found.",
    });
   }

   const customerStoreId = customer.storeId.toString();

   if (user.role !== "SUPER_ADMIN" && (!user.storeId || user.storeId !== customerStoreId)) {
    return res.status(403).json({
     success: false,
     message: "You do not have access to this customer.",
    });
   }

   customer.isActive = true;

   await customer.save();

   return res.status(200).json({
    success: true,
    message: "Customer restored successfully.",
   });
  }

  /**
   * DELETE CUSTOMER
   *
   * Soft delete:
   * isActive = false
   */
  if (req.method === "DELETE") {
   const user = await requirePermission(req, "customers.delete");

   const customer = await Customer.findById(customerId);

   if (!customer) {
    return res.status(404).json({
     success: false,
     message: "Customer not found.",
    });
   }

   const customerStoreId = customer.storeId.toString();

   if (user.role !== "SUPER_ADMIN" && (!user.storeId || user.storeId !== customerStoreId)) {
    return res.status(403).json({
     success: false,
     message: "You do not have access to this customer.",
    });
   }

   customer.isActive = false;

   await customer.save();

   return res.status(200).json({
    success: true,
    message: "Customer deleted successfully.",
   });
  }

  res.setHeader("Allow", ["GET", "PATCH", "PUT", "DELETE"]);

  return res.status(405).json({
   success: false,
   message: `Method ${req.method} not allowed.`,
  });
 } catch (error: any) {
  console.error("Customer detail API error:", error);

  if (error?.message === "UNAUTHORIZED") {
   return res.status(401).json({
    success: false,
    message: "Unauthorized.",
   });
  }

  if (error?.message === "FORBIDDEN") {
   return res.status(403).json({
    success: false,
    message: "You do not have permission to perform this action.",
   });
  }

  if (error?.code === 11000) {
   return res.status(409).json({
    success: false,
    message: "Customer data already exists.",
   });
  }

  return res.status(500).json({
   success: false,
   message: error?.message || "Internal server error.",
  });
 }
}
