import type { NextApiRequest, NextApiResponse } from "next";

export const AFFILIATE_COOKIE_NAME = "affiliate_ref";
export const AFFILIATE_COOKIE_MAX_AGE = 60 * 24 * 60 * 60;

export interface AffiliateTrackingData {
 affiliateCode: string;
 capturedAt: number;
}

export function getAffiliateCookieOptions() {
 return ["Path=/", `Max-Age=${AFFILIATE_COOKIE_MAX_AGE}`, "HttpOnly", "SameSite=Lax", ...(process.env.NODE_ENV === "production" ? ["Secure"] : [])].join("; ");
}

export function setAffiliateCookie(res: NextApiResponse, data: AffiliateTrackingData) {
 const value = Buffer.from(JSON.stringify(data)).toString("base64url");

 res.setHeader("Set-Cookie", [`${AFFILIATE_COOKIE_NAME}=${value}; ${getAffiliateCookieOptions()}`]);
}

export function readAffiliateCookie(req: NextApiRequest): AffiliateTrackingData | null {
 const cookieHeader = req.headers.cookie || "";

 const cookie = cookieHeader
  .split(";")
  .map((part) => part.trim())
  .find((part) => part.startsWith(`${AFFILIATE_COOKIE_NAME}=`));

 if (!cookie) return null;

 try {
  const value = cookie.slice(AFFILIATE_COOKIE_NAME.length + 1);
  const parsed = JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as AffiliateTrackingData;

  if (typeof parsed.affiliateCode !== "string" || !parsed.affiliateCode.trim() || typeof parsed.capturedAt !== "number") {
   return null;
  }

  const age = Date.now() - parsed.capturedAt;
  const maxAgeMs = AFFILIATE_COOKIE_MAX_AGE * 1000;

  if (age < 0 || age > maxAgeMs) return null;

  return {
   affiliateCode: parsed.affiliateCode.trim().toUpperCase(),
   capturedAt: parsed.capturedAt,
  };
 } catch {
  return null;
 }
}
