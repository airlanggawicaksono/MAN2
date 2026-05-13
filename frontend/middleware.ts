import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const userType = request.cookies.get("user_type")?.value;

  if (path.startsWith("/admin")) {
    if (!userType || userType !== "Admin") {
      return NextResponse.redirect(new URL("/general", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};
