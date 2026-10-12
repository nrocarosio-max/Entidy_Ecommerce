import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function proxy(req: NextRequest) {
 const { pathname } = req.nextUrl;

 // Keep the login page accessible without authentication.
 if (pathname === "/admin/login" || pathname.startsWith("/admin/login/")) {
  return NextResponse.next();
 }

 const token = await getToken({
  req,
  secret: process.env.AUTH_SECRET,
 });

 // Redirect unauthenticated visitors to the admin login page.
 if (!token?.id) {
  const loginUrl = new URL("/admin/login", req.url);
  loginUrl.searchParams.set("callbackUrl", req.url);

  return NextResponse.redirect(loginUrl);
 }

 // Only SUPER_ADMIN can access the admin area.
 if (token.role !== "SUPER_ADMIN") {
  return NextResponse.redirect(new URL("/", req.url));
 }

 return NextResponse.next();
}

export const config = {
 matcher: ["/admin/:path*"],
};
