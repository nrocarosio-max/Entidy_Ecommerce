import type { NextApiRequest, NextApiResponse } from "next";

import { connectDB } from "~/lib/mongodb";
import { requireSuperAdmin } from "~/lib/permissions";
import { Role } from "~/models/Role";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
 try {
  await connectDB();

  await requireSuperAdmin(req);

  if (req.method !== "GET") {
   res.setHeader("Allow", ["GET"]);

   return res.status(405).json({
    success: false,
    message: `Method ${req.method} not allowed.`,
   });
  }

  const roles = await Role.find({
   isActive: true,
   code: {
    $ne: "SUPER_ADMIN",
   },
  })
   .select("_id name code description permissions isActive")
   .sort({ name: 1 })
   .lean();

  return res.status(200).json({
   success: true,
   roles,
  });
 } catch (error: any) {
  console.error("Roles API error:", error);

  if (error?.message === "UNAUTHORIZED") {
   return res.status(401).json({
    success: false,
    message: "Unauthorized.",
   });
  }

  if (error?.message === "FORBIDDEN") {
   return res.status(403).json({
    success: false,
    message: "Only SUPER_ADMIN can manage roles.",
   });
  }

  return res.status(500).json({
   success: false,
   message: error?.message || "Internal server error.",
  });
 }
}
