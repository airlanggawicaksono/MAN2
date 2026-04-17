import { NextRequest, NextResponse } from "next/server";

const PROTECTED_PREFIXES: Record<string, string> = {
  "/admin": "Admin",
  "/guru": "Guru",
  "/siswa": "Siswa",
};

const HOME_BY_ROLE: Record<string, string> = {
  Admin: "/admin",
  Guru: "/guru",
  Siswa: "/siswa",
};

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const userType = request.cookies.get("user_type")?.value;

  for (const [prefix, requiredRole] of Object.entries(PROTECTED_PREFIXES)) {
    if (!path.startsWith(prefix)) {
      continue;
    }

    if (!userType) {
      return NextResponse.redirect(new URL("/general", request.url));
    }

    if (userType !== requiredRole) {
      const roleHome = HOME_BY_ROLE[userType] ?? "/general";
      return NextResponse.redirect(new URL(roleHome, request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/guru/:path*", "/siswa/:path*"],
};
