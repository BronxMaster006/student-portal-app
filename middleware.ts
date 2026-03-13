import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export default auth((req) => {
  const isLoggedIn = Boolean(req.auth?.user);
  const role = req.auth?.user?.role;
  const pathname = req.nextUrl.pathname;

  if (pathname === "/") {
    return NextResponse.redirect(new URL(isLoggedIn ? "/app" : "/login", req.url));
  }

<<<<<<< HEAD
  if (["/app", "/admin"].includes(pathname) && !isLoggedIn) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (pathname === "/admin" && role !== "ADMIN") {
=======
  const isAppRoute = pathname === "/app" || pathname.startsWith("/app/");
  const isAdminRoute = pathname === "/admin" || pathname.startsWith("/admin/");

  if ((isAppRoute || isAdminRoute) && !isLoggedIn) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (isAdminRoute && role !== "ADMIN") {
>>>>>>> codex-new
    return NextResponse.redirect(new URL("/app", req.url));
  }

  if (isLoggedIn && ["/login", "/register"].includes(pathname)) {
    return NextResponse.redirect(new URL("/app", req.url));
  }

  return NextResponse.next();
});

export const config = {
<<<<<<< HEAD
  matcher: ["/", "/login", "/register", "/app", "/admin"]
=======
  matcher: ["/", "/login", "/register", "/app/:path*", "/admin/:path*"]
>>>>>>> codex-new
};
