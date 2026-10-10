import type { NextApiRequest, NextApiResponse } from "next";

import { connectDB } from "~/lib/mongodb";
import { requireAuth } from "~/lib/permissions";
import { OrderStatus } from "~/models/OrderStatus";
import { Order } from "~/models/Order";

type ApiResponse = {
 success: boolean;
 message?: string;
 data?: unknown;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse<ApiResponse>) {
 try {
  await connectDB();

  const user = await requireAuth(req);

  const { id } = req.query;

  if (typeof id !== "string" || !id.trim()) {
   return res.status(400).json({
    success: false,
    message: "Invalid order status ID.",
   });
  }

  const status = await OrderStatus.findById(id);

  if (!status) {
   return res.status(404).json({
    success: false,
    message: "Order status not found.",
   });
  }

  if (user.role !== "SUPER_ADMIN" && (!user.storeId || status.storeId.toString() !== user.storeId)) {
   return res.status(403).json({
    success: false,
    message: "Forbidden.",
   });
  }

  if (req.method === "GET") {
   return res.status(200).json({
    success: true,
    data: status,
   });
  }

  if (req.method === "PATCH") {
   const { name, code, description, color, icon, sortOrder, isActive, isInitial, isFinal, nextStatusIds } = req.body;

   if (name !== undefined) {
    if (typeof name !== "string" || !name.trim()) {
     return res.status(400).json({
      success: false,
      message: "Status name cannot be empty.",
     });
    }

    status.name = name.trim();
   }

   if (code !== undefined) {
    if (typeof code !== "string" || !code.trim()) {
     return res.status(400).json({
      success: false,
      message: "Status code cannot be empty.",
     });
    }

    const normalizedCode = code.trim().toUpperCase();

    const duplicate = await OrderStatus.findOne({
     storeId: status.storeId,
     code: normalizedCode,
     _id: { $ne: status._id },
    }).lean();

    if (duplicate) {
     return res.status(409).json({
      success: false,
      message: "Order status code already exists for this store.",
     });
    }

    status.code = normalizedCode;
   }

   if (description !== undefined) {
    status.description = typeof description === "string" ? description.trim() : "";
   }

   if (color !== undefined) {
    status.color = typeof color === "string" && color.trim() ? color.trim() : "#6B7280";
   }

   if (icon !== undefined) {
    status.icon = typeof icon === "string" ? icon.trim() : "";
   }

   if (sortOrder !== undefined) {
    if (typeof sortOrder !== "number" || Number.isNaN(sortOrder)) {
     return res.status(400).json({
      success: false,
      message: "sortOrder must be a number.",
     });
    }

    status.sortOrder = sortOrder;
   }

   if (isActive !== undefined) {
    if (typeof isActive !== "boolean") {
     return res.status(400).json({
      success: false,
      message: "isActive must be a boolean.",
     });
    }

    status.isActive = isActive;
   }

   if (isInitial !== undefined) {
    if (typeof isInitial !== "boolean") {
     return res.status(400).json({
      success: false,
      message: "isInitial must be a boolean.",
     });
    }

    if (isInitial === true) {
     await OrderStatus.updateMany(
      {
       storeId: status.storeId,
       _id: { $ne: status._id },
       isInitial: true,
      },
      {
       $set: {
        isInitial: false,
       },
      },
     );
    }

    status.isInitial = isInitial;
   }

   if (isFinal !== undefined) {
    if (typeof isFinal !== "boolean") {
     return res.status(400).json({
      success: false,
      message: "isFinal must be a boolean.",
     });
    }

    status.isFinal = isFinal;
   }

   if (nextStatusIds !== undefined) {
    if (!Array.isArray(nextStatusIds)) {
     return res.status(400).json({
      success: false,
      message: "nextStatusIds must be an array.",
     });
    }

    status.nextStatusIds = nextStatusIds;
   }

   await status.save();

   return res.status(200).json({
    success: true,
    data: status,
   });
  }

  if (req.method === "DELETE") {
   const orderUsingStatus = await Order.exists({
    statusId: status._id,
   });

   if (orderUsingStatus) {
    return res.status(409).json({
     success: false,
     message: "This order status is already used by orders and cannot be deleted.",
    });
   }

   await OrderStatus.findByIdAndDelete(status._id);

   return res.status(200).json({
    success: true,
    message: "Order status deleted successfully.",
   });
  }

  return res.status(405).json({
   success: false,
   message: "Method not allowed.",
  });
 } catch (error) {
  console.error("ORDER STATUS DETAIL API ERROR:", error);

  if (error instanceof Error) {
   if (error.message === "UNAUTHORIZED") {
    return res.status(401).json({
     success: false,
     message: "Unauthorized.",
    });
   }

   if (error.message === "FORBIDDEN") {
    return res.status(403).json({
     success: false,
     message: "Forbidden.",
    });
   }
  }

  return res.status(500).json({
   success: false,
   message: "Internal server error.",
  });
 }
}
