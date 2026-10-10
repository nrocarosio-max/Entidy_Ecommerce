import type { NextApiRequest, NextApiResponse } from "next";
import mongoose from "mongoose";

import { connectDB } from "~/lib/mongodb";
import { requireSuperAdmin } from "~/lib/permissions";
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
  await requireSuperAdmin(req);

  const { id } = req.query;

  if (typeof id !== "string" || !mongoose.Types.ObjectId.isValid(id)) {
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

  if (req.method === "GET") {
   return res.status(200).json({
    success: true,
    data: status,
   });
  }

  if (req.method === "PATCH") {
   const body = req.body ?? {};

   if (body.name !== undefined) {
    if (typeof body.name !== "string" || !body.name.trim()) {
     return res.status(400).json({
      success: false,
      message: "Status name cannot be empty.",
     });
    }

    status.name = body.name.trim();
   }

   if (body.code !== undefined) {
    if (typeof body.code !== "string" || !body.code.trim()) {
     return res.status(400).json({
      success: false,
      message: "Status code cannot be empty.",
     });
    }

    const normalizedCode = body.code.trim().toUpperCase();

    const duplicate = await OrderStatus.findOne({
     code: normalizedCode,
     _id: { $ne: status._id },
    }).lean();

    if (duplicate) {
     return res.status(409).json({
      success: false,
      message: "This status code already exists.",
     });
    }

    status.code = normalizedCode;
   }

   if (body.description !== undefined) {
    if (typeof body.description !== "string") {
     return res.status(400).json({
      success: false,
      message: "description must be a string.",
     });
    }

    status.description = body.description.trim();
   }

   if (body.color !== undefined) {
    if (typeof body.color !== "string") {
     return res.status(400).json({
      success: false,
      message: "color must be a string.",
     });
    }

    status.color = body.color.trim() || "#6B7280";
   }

   if (body.icon !== undefined) {
    if (typeof body.icon !== "string") {
     return res.status(400).json({
      success: false,
      message: "icon must be a string.",
     });
    }

    status.icon = body.icon.trim();
   }

   if (body.sortOrder !== undefined) {
    if (typeof body.sortOrder !== "number" || !Number.isFinite(body.sortOrder) || body.sortOrder < 0) {
     return res.status(400).json({
      success: false,
      message: "sortOrder must be a non-negative number.",
     });
    }

    status.sortOrder = body.sortOrder;
   }

   for (const field of ["isActive", "isInitial", "isFinal"] as const) {
    if (body[field] !== undefined && typeof body[field] !== "boolean") {
     return res.status(400).json({
      success: false,
      message: `${field} must be a boolean.`,
     });
    }
   }

   if (body.nextStatusIds !== undefined) {
    if (
     !Array.isArray(body.nextStatusIds) ||
     !body.nextStatusIds.every((nextId: unknown) => typeof nextId === "string" && mongoose.Types.ObjectId.isValid(nextId))
    ) {
     return res.status(400).json({
      success: false,
      message: "nextStatusIds must be an array of valid IDs.",
     });
    }

    const nextIds: string[] = body.nextStatusIds;

    if (nextIds.some((nextId) => nextId === id)) {
     return res.status(400).json({
      success: false,
      message: "A status cannot transition to itself.",
     });
    }

    const uniqueIds = nextIds.filter((nextId: string, index: number, array: string[]) => array.indexOf(nextId) === index);

    const count = await OrderStatus.countDocuments({
     _id: { $in: uniqueIds },
    });

    if (count !== uniqueIds.length) {
     return res.status(400).json({
      success: false,
      message: "One or more nextStatusIds do not exist.",
     });
    }

    status.nextStatusIds = uniqueIds as unknown as typeof status.nextStatusIds;
   }

   if (body.isActive !== undefined) {
    status.isActive = body.isActive;
   }

   if (body.isFinal !== undefined) {
    status.isFinal = body.isFinal;
   }

   if (body.isInitial === true) {
    await OrderStatus.updateMany(
     {
      _id: { $ne: status._id },
      isInitial: true,
     },
     {
      $set: { isInitial: false },
     },
    );
   }

   if (body.isInitial !== undefined) {
    status.isInitial = body.isInitial;
   }

   await status.save();

   return res.status(200).json({
    success: true,
    message: "Order status updated successfully.",
    data: status,
   });
  }

  if (req.method === "DELETE") {
   if (status.isInitial) {
    return res.status(409).json({
     success: false,
     message: "Set another initial status before deleting this one.",
    });
   }

   const orderUsingStatus = await Order.exists({
    statusId: status._id,
   });

   if (orderUsingStatus) {
    return res.status(409).json({
     success: false,
     message: "This status is used by existing orders and cannot be deleted.",
    });
   }

   const referencedByAnotherStatus = await OrderStatus.exists({
    nextStatusIds: status._id,
   });

   if (referencedByAnotherStatus) {
    return res.status(409).json({
     success: false,
     message: "Remove this status from other statuses' nextStatusIds first.",
    });
   }

   await status.deleteOne();

   return res.status(200).json({
    success: true,
    message: "Order status deleted successfully.",
   });
  }

  res.setHeader("Allow", ["GET", "PATCH", "DELETE"]);

  return res.status(405).json({
   success: false,
   message: "Method not allowed.",
  });
 } catch (error) {
  console.error("GLOBAL ORDER STATUS DETAIL API ERROR:", error);

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
     message: "Only SUPER_ADMIN can manage global order statuses.",
    });
   }
  }

  if (typeof error === "object" && error !== null && "code" in error && error.code === 11000) {
   return res.status(409).json({
    success: false,
    message: "This status code already exists.",
   });
  }

  return res.status(500).json({
   success: false,
   message: "Internal server error.",
  });
 }
}
