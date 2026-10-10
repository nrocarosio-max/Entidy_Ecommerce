import type { NextApiRequest, NextApiResponse } from "next";
import mongoose from "mongoose";

import { connectDB } from "~/lib/mongodb";
import { requireSuperAdmin } from "~/lib/permissions";
import { OrderStatus } from "~/models/OrderStatus";

type ApiResponse = {
 success: boolean;
 message?: string;
 data?: unknown;
};

type StatusInput = {
 name?: unknown;
 code?: unknown;
 description?: unknown;
 color?: unknown;
 icon?: unknown;
 sortOrder?: unknown;
 isActive?: unknown;
 isInitial?: unknown;
 isFinal?: unknown;
 nextStatusIds?: unknown;
};

type NormalizedStatus = {
 name: string;
 code: string;
 description: string;
 color: string;
 icon: string;
 sortOrder: number;
 isActive: boolean;
 isInitial: boolean;
 isFinal: boolean;
 nextStatusIds: string[];
};

function validateAndNormalizeStatus(input: StatusInput, index: number): { success: true; data: NormalizedStatus } | { success: false; message: string } {
 const prefix = `Status at index ${index}:`;

 if (typeof input.name !== "string" || !input.name.trim()) {
  return {
   success: false,
   message: `${prefix} Status name is required.`,
  };
 }

 if (typeof input.code !== "string" || !input.code.trim()) {
  return {
   success: false,
   message: `${prefix} Status code is required.`,
  };
 }

 const code = input.code.trim().toUpperCase();

 if (!/^[A-Z0-9_-]+$/.test(code)) {
  return {
   success: false,
   message: `${prefix} Status code may only contain letters, numbers, underscores and hyphens.`,
  };
 }

 if (input.sortOrder !== undefined && (typeof input.sortOrder !== "number" || !Number.isFinite(input.sortOrder) || input.sortOrder < 0)) {
  return {
   success: false,
   message: `${prefix} sortOrder must be a non-negative number.`,
  };
 }

 for (const field of ["isActive", "isInitial", "isFinal"] as const) {
  if (input[field] !== undefined && typeof input[field] !== "boolean") {
   return {
    success: false,
    message: `${prefix} ${field} must be a boolean.`,
   };
  }
 }

 if (input.isInitial === true && input.isActive === false) {
  return {
   success: false,
   message: `${prefix} The initial status must be active.`,
  };
 }

 if (
  input.nextStatusIds !== undefined &&
  (!Array.isArray(input.nextStatusIds) || !input.nextStatusIds.every((id: unknown) => typeof id === "string" && mongoose.Types.ObjectId.isValid(id)))
 ) {
  return {
   success: false,
   message: `${prefix} nextStatusIds must be an array of valid status IDs.`,
  };
 }

 const nextStatusIds = (input.nextStatusIds ?? []) as string[];

 return {
  success: true,
  data: {
   name: input.name.trim(),
   code,
   description: typeof input.description === "string" ? input.description.trim() : "",
   color: typeof input.color === "string" && input.color.trim() ? input.color.trim() : "#6B7280",
   icon: typeof input.icon === "string" ? input.icon.trim() : "",
   sortOrder: typeof input.sortOrder === "number" ? input.sortOrder : index + 1,
   isActive: input.isActive === undefined ? true : (input.isActive as boolean),
   isInitial: input.isInitial === true,
   isFinal: input.isFinal === true,
   nextStatusIds: nextStatusIds.filter((id, i, array) => array.indexOf(id) === i),
  },
 };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<ApiResponse>) {
 try {
  await connectDB();
  await requireSuperAdmin(req);

  if (req.method === "GET") {
   const statuses = await OrderStatus.find({}).sort({ sortOrder: 1, createdAt: 1 }).lean();

   return res.status(200).json({
    success: true,
    data: statuses,
   });
  }

  if (req.method === "POST") {
   const isBulk = Array.isArray(req.body);
   const inputs: StatusInput[] = isBulk ? req.body : [req.body as StatusInput];

   if (inputs.length === 0) {
    return res.status(400).json({
     success: false,
     message: "At least one status is required.",
    });
   }

   if (inputs.length > 100) {
    return res.status(400).json({
     success: false,
     message: "You can create at most 100 statuses per request.",
    });
   }

   if (inputs.some((item) => !item || typeof item !== "object" || Array.isArray(item))) {
    return res.status(400).json({
     success: false,
     message: "Each status must be a JSON object.",
    });
   }

   const normalizedStatuses: NormalizedStatus[] = [];

   for (let i = 0; i < inputs.length; i++) {
    const result = validateAndNormalizeStatus(inputs[i], i);

    if (!result.success) {
     return res.status(400).json({
      success: false,
      message: result.message,
     });
    }

    normalizedStatuses.push(result.data);
   }

   // Validate unique codes within the request.
   const codes = normalizedStatuses.map((status) => status.code);
   const duplicateCodes = codes.filter((code, index, array) => array.indexOf(code) !== index);

   if (duplicateCodes.length > 0) {
    return res.status(409).json({
     success: false,
     message: `Duplicate status codes in request: ${duplicateCodes.filter((code, index, array) => array.indexOf(code) === index).join(", ")}.`,
    });
   }

   // Only one initial status is allowed in a request.
   const initialStatuses = normalizedStatuses.filter((status) => status.isInitial);

   if (initialStatuses.length > 1) {
    return res.status(400).json({
     success: false,
     message: "Only one status can be initial.",
    });
   }

   // Validate status codes against existing records.
   const existingStatuses = await OrderStatus.find({
    code: { $in: codes },
   })
    .select("code")
    .lean();

   if (existingStatuses.length > 0) {
    const existingCodes = existingStatuses.map((status) => status.code);

    return res.status(409).json({
     success: false,
     message: `These status codes already exist: ${existingCodes.join(", ")}.`,
    });
   }

   // Validate that all referenced next statuses exist.
   const referencedIds = normalizedStatuses.flatMap((status) => status.nextStatusIds);
   const uniqueReferencedIds = referencedIds.filter((id, index, array) => array.indexOf(id) === index);

   if (uniqueReferencedIds.length > 0) {
    const validIdCount = await OrderStatus.countDocuments({
     _id: {
      $in: uniqueReferencedIds.map((id) => new mongoose.Types.ObjectId(id)),
     },
    });

    if (validIdCount !== uniqueReferencedIds.length) {
     return res.status(400).json({
      success: false,
      message: "One or more nextStatusIds do not exist.",
     });
    }
   }

   // If this request defines an initial status, ensure it is active.
   // Insert first; update the existing initial status only after insertion succeeds.
   const createdStatuses = await OrderStatus.insertMany(
    normalizedStatuses.map((status) => ({
     ...status,
     nextStatusIds: status.nextStatusIds.map((id) => new mongoose.Types.ObjectId(id)),
    })),
    { ordered: true },
   );

   if (initialStatuses.length === 1) {
    const newInitialStatus = createdStatuses.find((status) => status.isInitial);

    if (newInitialStatus) {
     await OrderStatus.updateMany({ _id: { $ne: newInitialStatus._id }, isInitial: true }, { $set: { isInitial: false } });
    }
   }

   return res.status(201).json({
    success: true,
    message: isBulk ? `${createdStatuses.length} order statuses created successfully.` : "Order status created successfully.",
    data: isBulk ? createdStatuses : createdStatuses[0],
   });
  }

  res.setHeader("Allow", ["GET", "POST"]);

  return res.status(405).json({
   success: false,
   message: "Method not allowed.",
  });
 } catch (error) {
  console.error("GLOBAL ORDER STATUS API ERROR:", error);

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
    message: "One or more status codes already exist.",
   });
  }

  return res.status(500).json({
   success: false,
   message: "Internal server error.",
  });
 }
}
