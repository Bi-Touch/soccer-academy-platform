import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

const ADMIN_ONLY_PREFIXES = ["/admin/teams", "/admin/coaches", "/admin/news", "/admin/enquiries", "/admin/gallery"];

const PLAYER_ONLY_PORTAL_PREFIXES = ["/portal/dashboard", "/portal/profile", "/portal/schedule", "/portal/videos", "/portal/leaderboard"];

function homeFor(role: string | undefined) {
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

    if (role === "COACH" && ADMIN_ONLY_PREFIXES.some((p) => pathname.startsWith(p))) {
      return NextResponse.redirect(new URL("/admin/players", req.url));
    }

    // A parent has no Player record of their own — keep them out of the
    // player-facing portal pages, which assume a 1:1 user-to-player link.
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
  matcher: ["/portal/:path*", "/admin/:path*"],
};