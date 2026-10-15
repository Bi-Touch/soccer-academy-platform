import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

const ADMIN_ONLY_PREFIXES = ["/admin/teams", "/admin/coaches", "/admin/news", "/admin/enquiries", "/admin/gallery"];

const PLAYER_ONLY_PORTAL_PREFIXES = ["/portal/dashboard", "/portal/profile", "/portal/schedule", "/portal/videos", "/portal/leaderboard"];

function homeFor(role: string | undefined) {
  if (role === "ANALYST") return "/analytics";
  if (role === "PARENT") return "/portal/parent";
  if (role === "ADMIN" || role === "COACH") return "/admin/players";
  return "/portal/dashboard";
}

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const role = req.nextauth.token?.role as string | undefined;

    if (pathname.startsWith("/admin") && role !== "ADMIN" && role !== "COACH") {
      return NextResponse.redirect(new URL(homeFor(role), req.url));
    }

    if (pathname.startsWith("/analytics") && role !== "ADMIN" && role !== "COACH" && role !== "ANALYST") {
      return NextResponse.redirect(new URL(homeFor(role), req.url));
    }

    // Staff have no player record, so the player/parent portal is not for them.
    if (pathname.startsWith("/portal") && (role === "ADMIN" || role === "COACH")) {
      return NextResponse.redirect(new URL("/admin/players", req.url));
    }

    if (role === "ANALYST" && pathname.startsWith("/portal")) {
      return NextResponse.redirect(new URL("/analytics", req.url));
    }

    if (role === "COACH" && ADMIN_ONLY_PREFIXES.some((p) => pathname.startsWith(p))) {
      return NextResponse.redirect(new URL("/admin/players", req.url));
    }

    if (role === "PARENT" && PLAYER_ONLY_PORTAL_PREFIXES.some((p) => pathname.startsWith(p))) {
      return NextResponse.redirect(new URL("/portal/parent", req.url));
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
  matcher: ["/portal/:path*", "/admin/:path*", "/analytics/:path*"],
};