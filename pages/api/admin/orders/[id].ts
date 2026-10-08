import type { NextApiRequest, NextApiResponse } from "next";
import mongoose from "mongoose";

import { connectDB } from "~/lib/mongodb";
import { requirePermission } from "~/lib/permissions";

import { Order } from "~/models/Order";
import { OrderItem } from "~/models/OrderItem";
import { OrderStatus } from "~/models/OrderStatus";
import { OrderStatusHistory } from "~/models/OrderStatusHistory";
import { Product } from "~/models/Product";
import { Inventory } from "~/models/Inventory";

function sendError(res: NextApiResponse, status: number, message: string) {
 return res.status(status).json({
  success: false,
  message,
 });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
 await connectDB();

 const { id } = req.query;

 if (typeof id !== "string") {
  return sendError(res, 400, "Invalid order id.");
 }

 if (!mongoose.Types.ObjectId.isValid(id)) {
  return sendError(res, 400, "Invalid order id.");
 }

 try {
  /*
   * GET ORDER
   */
  if (req.method === "GET") {
   const user = await requirePermission(req, "orders.read");

   const order = await Order.findById(id)
    .populate({
     path: "customerId",
     select: "name phone isActive",
    })
    .populate({
     path: "storeId",
     select: "name slug",
    })
    .populate({
     path: "createdBy",
     select: "name email",
    })
    .populate({
     path: "statusId",
     select: "name code description color icon sortOrder isInitial isFinal nextStatusIds",
     populate: {
      path: "nextStatusIds",
      select: "name code description color icon sortOrder isInitial isFinal",
     },
    })
    .lean();

   if (!order) {
    return sendError(res, 404, "Order not found.");
   }

   if (user.role !== "SUPER_ADMIN" && order.storeId?._id?.toString() !== user.storeId) {
    return sendError(res, 403, "Forbidden.");
   }

   const [items, history] = await Promise.all([
    OrderItem.find({
     orderId: id,
    })
     .populate({
      path: "productId",
      select: "name sku slug images price currency quantity status",
     })
     .lean(),

    OrderStatusHistory.find({
     orderId: id,
    })
     .populate({
      path: "fromStatusId",
      select: "name code color icon sortOrder",
     })
     .populate({
      path: "toStatusId",
      select: "name code color icon sortOrder",
     })
     .populate({
      path: "changedBy",
      select: "name email",
     })
     .sort({
      createdAt: -1,
     })
     .lean(),
   ]);

   return res.status(200).json({
    success: true,
    order,
    items,
    history,
   });
  }

  /*
   * UPDATE ORDER STATUS
   */
  if (req.method === "PATCH") {
   const user = await requirePermission(req, "orders.update");

   const { statusId, note = "" } = req.body;

   if (!statusId || !mongoose.Types.ObjectId.isValid(statusId)) {
    return sendError(res, 400, "Valid statusId is required.");
   }

   const order = await Order.findById(id);

   if (!order) {
    return sendError(res, 404, "Order not found.");
   }

   if (user.role !== "SUPER_ADMIN" && order.storeId.toString() !== user.storeId) {
    return sendError(res, 403, "Forbidden.");
   }

   const currentStatus = await OrderStatus.findOne({
    _id: order.statusId,
    storeId: order.storeId,
    isActive: true,
   });

   if (!currentStatus) {
    return sendError(res, 500, "Current order status not found.");
   }

   const nextStatus = await OrderStatus.findOne({
    _id: statusId,
    storeId: order.storeId,
    isActive: true,
   });

   if (!nextStatus) {
    return sendError(res, 404, "Target order status not found.");
   }

   if (currentStatus._id.toString() === nextStatus._id.toString()) {
    return sendError(res, 400, "Order is already in this status.");
   }

   /*
    * Validate transition from OrderStatus.nextStatusIds
    */
   const allowedNextStatusIds = currentStatus.nextStatusIds.map((item: any) => item.toString());

   if (!allowedNextStatusIds.includes(nextStatus._id.toString())) {
    return sendError(res, 400, `Cannot change order from "${currentStatus.name}" to "${nextStatus.name}".`);
   }

   const session = await mongoose.startSession();

   try {
    session.startTransaction();

    /*
     * When order enters CONFIRMED,
     * reserve/deduct inventory.
     */
    if (nextStatus.code === "CONFIRMED") {
     const orderItems = await OrderItem.find({
      orderId: order._id,
     }).session(session);

     if (orderItems.length === 0) {
      await session.abortTransaction();

      return sendError(res, 400, "Order has no items.");
     }

     const productIds = orderItems.map((item) => item.productId);

     const products = await Product.find({
      _id: {
       $in: productIds,
      },
      storeId: order.storeId,
      isActive: true,
     }).session(session);

     const productMap = new Map(products.map((product) => [product._id.toString(), product]));

     for (const item of orderItems) {
      const product = productMap.get(item.productId.toString());

      if (!product) {
       await session.abortTransaction();

       return sendError(res, 400, `Product for order item ${item._id} was not found.`);
      }

      if (product.quantity < item.quantity) {
       await session.abortTransaction();

       return sendError(res, 400, `Not enough stock for product "${product.name}". Available: ${product.quantity}, required: ${item.quantity}.`);
      }
     }

     for (const item of orderItems) {
      const product = productMap.get(item.productId.toString())!;

      const quantityBefore = product.quantity;

      const quantityAfter = quantityBefore - item.quantity;

      product.quantity = quantityAfter;

      if (quantityAfter === 0) {
       product.status = "OUT_OF_STOCK";
      }

      await product.save({
       session,
      });

      await Inventory.create(
       [
        {
         storeId: order.storeId,
         productId: product._id,
         type: "OUT",
         quantity: item.quantity,
         quantityBefore,
         quantityAfter,
         note: "Stock reserved for order confirmation.",
         reference: order.orderNumber,
         createdBy: user.id,
        },
       ],
       {
        session,
       },
      );
     }
    }

    /*
     * Update order status
     */
    order.statusId = nextStatus._id;

    await order.save({
     session,
    });

    /*
     * Create status history
     */
    await OrderStatusHistory.create(
     [
      {
       orderId: order._id,

       fromStatusId: currentStatus._id,

       toStatusId: nextStatus._id,

       fromStatusName: currentStatus.name,

       toStatusName: nextStatus.name,

       changedBy: user.id,

       note: typeof note === "string" ? note.trim() : "",
      },
     ],
     {
      session,
     },
    );

    await session.commitTransaction();
   } catch (error) {
    await session.abortTransaction();
    throw error;
   } finally {
    await session.endSession();
   }

   const updatedOrder = await Order.findById(id)
    .populate({
     path: "customerId",
     select: "name phone isActive",
    })
    .populate({
     path: "storeId",
     select: "name slug",
    })
    .populate({
     path: "createdBy",
     select: "name email",
    })
    .populate({
     path: "statusId",
     select: "name code description color icon sortOrder isInitial isFinal nextStatusIds",
     populate: {
      path: "nextStatusIds",
      select: "name code description color icon sortOrder isInitial isFinal",
     },
    })
    .lean();

   return res.status(200).json({
    success: true,
    message: "Order status updated successfully.",
    order: updatedOrder,
   });
  }

  return res.status(405).json({
   success: false,
   message: "Method not allowed.",
  });
 } catch (error: any) {
  console.error("Admin order detail API error:", error);

  if (error?.message === "UNAUTHORIZED") {
   return sendError(res, 401, "Unauthorized.");
  }

  if (error?.message === "FORBIDDEN") {
   return sendError(res, 403, "Forbidden.");
  }

  return sendError(res, 500, error?.message || "Internal server error.");
 }
}
