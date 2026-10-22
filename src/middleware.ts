
import { withAuth } from "next-auth/middleware";
import { NextResponse, type NextRequest } from "next/server";

const ADMIN_ONLY_PREFIXES = [
  "/admin/teams",
  "/admin/coaches",
  "/admin/news",
  "/admin/enquiries",
  "/admin/gallery",
  "/admin/audit",
  "/admin/registrations",
  "/admin/consent",
  "/admin/staff",
];

const PLAYER_ONLY_PORTAL_PREFIXES = [
  "/portal/dashboard",
  "/portal/profile",
  "/portal/schedule",
  "/portal/videos",
  "/portal/leaderboard",
];

const ADMIN_ROLES = ["ADMIN", "COACH"];
const STAFF_ROLES = [
  "ADMIN",
  "COACH",
  "ANALYST",
  "SAFEGUARDING_LEAD",
  "MEDICAL_OFFICER",
];

function homeFor(role: string | undefined): string {
  switch (role) {
    case "ADMIN":
    case "COACH":
      return "/admin";

    case "ANALYST":
      return "/analytics";

    case "SAFEGUARDING_LEAD":
      return "/admin/safeguarding";

    case "MEDICAL_OFFICER":
      return "/admin/health";

    case "PARENT":
      return "/portal/parent";

    case "PLAYER":
    default:
      return "/portal/dashboard";
  }
}

function isPathOrChild(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

function redirectHome(
  req: NextRequest,
  role: string | undefined
) {
  return NextResponse.redirect(
    new URL(homeFor(role), req.url)
  );
}

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const role = req.nextauth.token?.role as string | undefined;

    /*
     * ADMIN AREA
     *
     * Administrators and coaches can enter the staff area.
     * Safeguarding leads and medical officers can enter only
     * the areas assigned to their roles.
     */
    if (pathname.startsWith("/admin")) {
      if (!role || !STAFF_ROLES.includes(role)) {
        return redirectHome(req, role);
      }

      if (role === "SAFEGUARDING_LEAD") {
        const allowed =
          isPathOrChild(pathname, "/admin/safeguarding");

        if (!allowed) {
          return redirectHome(req, role);
        }
      }

      if (role === "MEDICAL_OFFICER") {
        const allowed =
          isPathOrChild(pathname, "/admin/health") ||
          pathname === "/admin/safeguarding/report";

        if (!allowed) {
          return redirectHome(req, role);
        }
      }

      // Coaches cannot access administrator-only sections.
      if (
        role === "COACH" &&
        ADMIN_ONLY_PREFIXES.some((prefix) =>
          isPathOrChild(pathname, prefix)
        )
      ) {
        return redirectHome(req, role);
      }

      return NextResponse.next();
    }

    /*
     * ANALYTICS AREA
     *
     * Only administrators, coaches, and analysts may enter.
     */
    if (pathname.startsWith("/analytics")) {
      if (
        !["ADMIN", "COACH", "ANALYST"].includes(role ?? "")
      ) {
        return redirectHome(req, role);
      }

      return NextResponse.next();
    }

    /*
     * PORTAL AREA
     *
     * Staff must use their assigned staff dashboard.
     */
    if (pathname.startsWith("/portal")) {
      if (STAFF_ROLES.includes(role ?? "")) {
        return redirectHome(req, role);
      }

      // Parents use the parent portal, not player-only pages.
      if (
        role === "PARENT" &&
        PLAYER_ONLY_PORTAL_PREFIXES.some((prefix) =>
          isPathOrChild(pathname, prefix)
        )
      ) {
        return redirectHome(req, role);
      }

      return NextResponse.next();
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