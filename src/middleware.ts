import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

const ADMIN_ONLY_PREFIXES = ["/admin/teams", "/admin/coaches", "/admin/news", "/admin/enquiries", "/admin/gallery"];

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const role = req.nextauth.token?.role;

    if (pathname.startsWith("/admin") && role !== "ADMIN" && role !== "COACH") {
      return NextResponse.redirect(new URL("/portal/dashboard", req.url));
    }

    if (role === "COACH" && ADMIN_ONLY_PREFIXES.some((p) => pathname.startsWith(p))) {
      return NextResponse.redirect(new URL("/admin/players", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: ["/portal/:path*", "/admin/:path*"],
};