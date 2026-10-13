import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const LOGIN_PAGE = "/admin/login";

export async function proxy(req: NextRequest) {
 const { pathname } = req.nextUrl;

 const isAdminRoute = pathname === "/admin" || pathname.startsWith("/admin/");
 const isPosRoute = pathname === "/pos" || pathname.startsWith("/pos/");
 const isAffiliateRoute = pathname === "/affiliate" || pathname.startsWith("/affiliate/");

 if (!isAdminRoute && !isPosRoute && !isAffiliateRoute) {
  return NextResponse.next();
 }

 // Keep the shared login page accessible.
 if (pathname === LOGIN_PAGE || pathname.startsWith(`${LOGIN_PAGE}/`)) {
  return NextResponse.next();
 }

 const token = await getToken({
  req,
  secret: process.env.AUTH_SECRET,
 });

 // All protected areas use the same login page.
 if (!token?.id) {
  const loginUrl = new URL(LOGIN_PAGE, req.url);

  loginUrl.searchParams.set("callbackUrl", `${pathname}${req.nextUrl.search}`);

  return NextResponse.redirect(loginUrl);
 }

 const role = token.role as string | undefined;

 // SUPER_ADMIN can only access /admin.
 if (isAdminRoute && role !== "SUPER_ADMIN") {
  return NextResponse.redirect(new URL(role === "AFFILIATE" ? "/affiliate" : "/pos", req.url));
 }

 // SUPER_ADMIN cannot access /pos.
 if (isPosRoute && role === "SUPER_ADMIN") {
  return NextResponse.redirect(new URL("/admin", req.url));
 }

 // AFFILIATE cannot access /pos.
 if (isPosRoute && role === "AFFILIATE") {
  return NextResponse.redirect(new URL("/affiliate", req.url));
 }

 // Only AFFILIATE can access /affiliate.
 if (isAffiliateRoute && role !== "AFFILIATE") {
  return NextResponse.redirect(new URL(role === "SUPER_ADMIN" ? "/admin" : "/pos", req.url));
 }

 return NextResponse.next();
}

export const config = {
 matcher: ["/admin/:path*", "/pos/:path*", "/affiliate/:path*"],
};
