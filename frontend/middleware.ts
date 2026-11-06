import { NextRequest, NextResponse } from "next/server";

/**
 * Portal guard.
 *
 * - Not logged in  -> any portal page redirects to /login.
 * - Logged in      -> each account can only open its own portal:
 *     owner/staff  -> /owner
 *     tenant       -> /tenant
 *     super admin  -> /super-admin (super admins who also own an organization may open /owner too)
 *
 * This is a UX guard only. The real authorization is enforced by the Laravel API
 * (EnsureStaffRole, EnsureTenantRole, EnsureSuperAdmin), so even a forged cookie
 * cannot read another portal's data.
 */
const PORTAL_HOME: Record<string, string> = {
  owner: "/owner",
  tenant: "/tenant",
  "super-admin": "/super-admin",
};

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("ruko360_token")?.value;
  const portal = request.cookies.get("ruko360_portal")?.value || "owner";
  const isSuperAdmin = request.cookies.get("ruko360_super_admin")?.value === "1";

  if (!token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const home = PORTAL_HOME[portal] || "/owner";

  const allowed =
    (pathname.startsWith("/owner") && portal === "owner") ||
    (pathname.startsWith("/tenant") && portal === "tenant") ||
    (pathname.startsWith("/super-admin") && isSuperAdmin);

  if (!allowed) {
    return NextResponse.redirect(new URL(home, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/owner/:path*", "/tenant/:path*", "/super-admin/:path*"],
};
