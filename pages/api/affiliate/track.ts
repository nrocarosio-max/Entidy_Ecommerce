import type { NextApiRequest, NextApiResponse } from "next";
import { createHash, randomBytes } from "crypto";

import { connectDB } from "~/lib/mongodb";
import { Affiliate } from "~/models/Affiliate";
import { AffiliateStore } from "~/models/AffiliateStore";
import { AffiliateAttribution } from "~/models/AffiliateAttribution";

const COOKIE_NAME = "affiliate_attribution";
const ATTRIBUTION_DAYS = 60;
const COOKIE_MAX_AGE = ATTRIBUTION_DAYS * 24 * 60 * 60;
const ATTRIBUTION_MS = COOKIE_MAX_AGE * 1000;

function hashToken(token: string): string {
 return createHash("sha256").update(token).digest("hex");
}

function getCookieValue(cookieHeader: string | undefined, name: string): string | null {
 if (!cookieHeader) return null;

 const cookies = cookieHeader.split(";");

 for (let i = 0; i < cookies.length; i++) {
  const separatorIndex = cookies[i].indexOf("=");

  if (separatorIndex === -1) continue;

  const key = cookies[i].slice(0, separatorIndex).trim();

  if (key === name) {
   return decodeURIComponent(cookies[i].slice(separatorIndex + 1).trim());
  }
 }

 return null;
}

function setAttributionCookie(res: NextApiResponse, token: string): void {
 const cookieParts = [`${COOKIE_NAME}=${encodeURIComponent(token)}`, "Path=/", `Max-Age=${COOKIE_MAX_AGE}`, "HttpOnly", "SameSite=Lax"];

 if (process.env.NODE_ENV === "production") {
  cookieParts.push("Secure");
 }

 res.setHeader("Set-Cookie", cookieParts.join("; "));
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
 if (req.method !== "GET" && req.method !== "POST") {
  res.setHeader("Allow", ["GET", "POST"]);
  return res.status(405).json({
   success: false,
   message: "Method not allowed.",
  });
 }

 try {
  await connectDB();

  const rawCode = req.method === "GET" ? req.query.ref : req.body?.ref;

  if (typeof rawCode !== "string" || !rawCode.trim()) {
   return res.status(400).json({
    success: false,
    message: "Affiliate code is required.",
   });
  }

  const affiliateCode = rawCode.trim().toUpperCase();

  // Validate the affiliate before replacing existing attribution.
  const affiliate = await Affiliate.findOne({
   code: affiliateCode,
   status: "ACTIVE",
  })
   .select("_id code")
   .lean();

  if (!affiliate) {
   return res.status(404).json({
    success: false,
    message: "Affiliate code is invalid or inactive.",
   });
  }

  // The affiliate must be active for at least one store.
  const activeStores = await AffiliateStore.find({
   affiliateId: affiliate._id,
   status: "ACTIVE",
  })
   .select("_id storeId")
   .lean();

  if (activeStores.length === 0) {
   return res.status(404).json({
    success: false,
    message: "This affiliate has no active stores.",
   });
  }
  // Increment the total affiliate click count atomically.
  await Affiliate.updateOne({ _id: affiliate._id }, { $inc: { totalClicks: 1 } });
  const now = new Date();
  const expiresAt = new Date(now.getTime() + ATTRIBUTION_MS);

  const existingToken = getCookieValue(req.headers.cookie, COOKIE_NAME);

  let token = existingToken;
  let attributionDocument: any = null;

  if (token && /^[a-f0-9]{64}$/i.test(token)) {
   attributionDocument = await AffiliateAttribution.findOne({
    tokenHash: hashToken(token),
    expiresAt: { $gt: now },
   });
  }

  if (!attributionDocument) {
   token = randomBytes(32).toString("hex");

   attributionDocument = new AffiliateAttribution({
    tokenHash: hashToken(token),
    attributions: [],
    expiresAt,
   });
  }

  // Last-click: replace the pending affiliate code and click time.
  // Keep resolved attribution for other stores.
  attributionDocument.pendingAffiliateCode = affiliate.code;
  attributionDocument.pendingClickedAt = now;
  attributionDocument.pendingExpiresAt = expiresAt;

  // TTL applies to the entire document, so keep it alive while either
  // pending attribution or a resolved store attribution remains valid.
  let latestExpiry = expiresAt;

  const entries = attributionDocument.attributions || [];

  for (let i = 0; i < entries.length; i++) {
   const entry = entries[i];

   if (entry.expiresAt && new Date(entry.expiresAt).getTime() > latestExpiry.getTime()) {
    latestExpiry = new Date(entry.expiresAt);
   }
  }

  attributionDocument.expiresAt = latestExpiry;

  await attributionDocument.save();

  setAttributionCookie(res, token as string);

  return res.status(200).json({
   success: true,
   message: "Affiliate referral recorded.",
   affiliateCode: affiliate.code,
   clickedAt: now,
   expiresAt,
  });
 } catch (error) {
  console.error("Affiliate tracking error:", error);

  return res.status(500).json({
   success: false,
   message: "Unable to record affiliate referral.",
  });
 }
}
