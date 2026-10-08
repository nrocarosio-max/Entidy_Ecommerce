import type { NextApiRequest, NextApiResponse } from "next";

import { connectDB } from "~/lib/mongodb";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
 try {
  await connectDB();

  return res.status(200).json({
   success: true,
   message: "MongoDB connected successfully",
  });
 } catch (error) {
  console.error("MongoDB connection error:", error);

  return res.status(500).json({
   success: false,
   message: error instanceof Error ? error.message : String(error),
  });
 }
}
