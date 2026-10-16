
import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

const ADMIN_ONLY_PREFIXES = [
  "/admin/teams",
  "/admin/coaches",
  "/admin/news",
  "/admin/enquiries",
  "/admin/gallery",
  "/admin/audit",
];

const PLAYER_ONLY_PORTAL_PREFIXES = [
  "/portal/dashboard",
  "/portal/profile",
  "/portal/schedule",
  "/portal/videos",
  "/portal/leaderboard",
];

function homeFor(role: string | undefined) {
  if (role === "ANALYST") return "/analytics";
  if (role === "PARENT") return "/portal/parent";
  if (role === "ADMIN" || role === "COACH") return "/admin";

  return "/portal/dashboard";
}

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const role = req.nextauth.token?.role as string | undefined;

    // Only administrators and coaches can access the admin area.
    if (
      pathname.startsWith("/admin") &&
      role !== "ADMIN" &&
      role !== "COACH"
    ) {
      return NextResponse.redirect(
        new URL(homeFor(role), req.url)
      );
    }

    // Only administrators, coaches, and analysts can access analytics.
    if (
      pathname.startsWith("/analytics") &&
      role !== "ADMIN" &&
      role !== "COACH" &&
      role !== "ANALYST"
    ) {
      return NextResponse.redirect(
        new URL(homeFor(role), req.url)
      );
    }

    // Staff members should be redirected to the admin dashboard
    // instead of accessing the player/parent portal.
    if (
      pathname.startsWith("/portal") &&
      (role === "ADMIN" || role === "COACH")
    ) {
      return NextResponse.redirect(
        new URL("/admin", req.url)
      );
    }

    // Analysts should use the analytics area, not the portal.
    if (
      role === "ANALYST" &&
      pathname.startsWith("/portal")
    ) {
      return NextResponse.redirect(
        new URL("/analytics", req.url)
      );
    }

    // Coaches cannot access administrator-only sections.
    if (
      role === "COACH" &&
      ADMIN_ONLY_PREFIXES.some((prefix) =>
        pathname.startsWith(prefix)
      )
    ) {
      return NextResponse.redirect(
        new URL("/admin", req.url)
      );
    }

    // Parents cannot access player-only portal sections.
    if (
      role === "PARENT" &&
      PLAYER_ONLY_PORTAL_PREFIXES.some((prefix) =>
        pathname.startsWith(prefix)
      )
    ) {
      return NextResponse.redirect(
        new URL("/portal/parent", req.url)
      );
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
  matcher: [
    "/portal/:path*",
    "/admin/:path*",
    "/analytics/:path*",
  ],
};