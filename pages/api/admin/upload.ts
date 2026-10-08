import type { NextApiRequest, NextApiResponse } from "next";
import formidable, { type File } from "formidable";
import fs from "fs/promises";

import { v2 as cloudinary } from "cloudinary";
import { getCurrentUser } from "~/lib/permissions";

export const config = {
 api: {
  bodyParser: false,
 },
};

type ApiResponse = {
 success: boolean;
 message?: string;
 url?: string;
 publicId?: string;
 resourceType?: "image" | "video";
};

function hasPermission(
 user: {
  permissions?: string[];
 },
 permission: string,
) {
 return (user.permissions ?? []).some((item) => {
  if (item === "*") return true;
  if (item === permission) return true;

  if (item.endsWith(".*")) {
   const prefix = item.slice(0, -2);

   return permission === prefix || permission.startsWith(`${prefix}.`);
  }

  return false;
 });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<ApiResponse>) {
 if (req.method !== "POST") {
  return res.status(405).json({
   success: false,
   message: "Method not allowed.",
  });
 }

 try {
  const user = await getCurrentUser(req);

  if (!user) {
   return res.status(401).json({
    success: false,
    message: "Unauthorized.",
   });
  }

  const canCreate = hasPermission(user, "products.create");
  const canUpdate = hasPermission(user, "products.update");

  if (!canCreate && !canUpdate) {
   return res.status(403).json({
    success: false,
    message: "You do not have permission to upload product media.",
   });
  }

  const form = formidable({
   multiples: false,
   maxFiles: 1,
   maxFileSize: 50 * 1024 * 1024,
  });

  const [, files] = await form.parse(req);

  const rawFile = files.file;

  const file = Array.isArray(rawFile) ? rawFile[0] : rawFile;

  if (!file) {
   return res.status(400).json({
    success: false,
    message: "No file uploaded.",
   });
  }

  const mimeType = file.mimetype || "";

  let resourceType: "image" | "video";

  if (mimeType.startsWith("image/")) {
   resourceType = "image";
  } else if (mimeType.startsWith("video/")) {
   resourceType = "video";
  } else {
   return res.status(400).json({
    success: false,
    message: "Only image and video files are allowed.",
   });
  }

  let result;

  try {
   result = await cloudinary.uploader.upload(file.filepath, {
    folder: "ecommerce/products",
    resource_type: resourceType,
   });
  } finally {
   try {
    await fs.unlink(file.filepath);
   } catch {
    // Ignore temporary file cleanup errors.
   }
  }

  return res.status(200).json({
   success: true,
   url: result.secure_url,
   publicId: result.public_id,
   resourceType,
  });
 } catch (error) {
  console.error("Product media upload error:", error);

  return res.status(500).json({
   success: false,
   message: "Failed to upload file.",
  });
 }
}
