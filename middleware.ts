import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export default auth((req) => {
  const isLoggedIn = Boolean(req.auth?.user);
  const role = req.auth?.user?.role;
  const pathname = req.nextUrl.pathname;

  if (pathname === "/") {
    return NextResponse.redirect(new URL(isLoggedIn ? "/app" : "/login", req.url));
  }

  if (["/app", "/admin"].includes(pathname) && !isLoggedIn) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (pathname === "/admin" && role !== "ADMIN") {
    return NextResponse.redirect(new URL("/app", req.url));
  }

  if (isLoggedIn && ["/login", "/register"].includes(pathname)) {
    return NextResponse.redirect(new URL("/app", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/", "/login", "/register", "/app", "/admin"]
};
