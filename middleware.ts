import { NextRequest, NextResponse } from "next/server";

type UserRole = "USER_PERSONAL" | "PATIENT" | "CAREGIVER" | "DOCTOR";

const ROLE_ROUTES: Record<UserRole, string> = {
  USER_PERSONAL: "/dashboard/personal",
  PATIENT: "/dashboard/patient",
  CAREGIVER: "/dashboard/caregiver",
  DOCTOR: "/dashboard/doctor",
};

const VALID_ROLES = new Set<string>([
  "USER_PERSONAL",
  "PATIENT",
  "CAREGIVER",
  "DOCTOR",
]);

function isValidRole(value: string | null | undefined): value is UserRole {
  return value != null && VALID_ROLES.has(value);
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const token = request.cookies.get("nl_token")?.value;
  const role = request.cookies.get("nl_role")?.value;

  const isAuthenticated = Boolean(token) && isValidRole(role);

  // Root path → /login if not authenticated, else role dashboard
  if (pathname === "/") {
    if (!isAuthenticated) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    return NextResponse.redirect(new URL(ROLE_ROUTES[role as UserRole], request.url));
  }

  // /login and /register → redirect authenticated users to their dashboard
  if (pathname === "/login" || pathname === "/register") {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL(ROLE_ROUTES[role as UserRole], request.url));
    }
    return NextResponse.next();
  }

  // /dashboard/* → require authentication
  if (pathname.startsWith("/dashboard")) {
    if (!isAuthenticated) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/login", "/register", "/dashboard/:path*"],
};
