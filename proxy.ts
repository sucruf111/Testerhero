import { jwtVerify } from "jose";
import { NextResponse, type NextRequest } from "next/server";
import { getAuthSecret } from "@/lib/secret";

/**
 * Schutz vor jedem Request (auch Client-Navigationen):
 * - /admin/*  nur mit gültiger Agentur-Session
 * - /konto/*  nur mit gültiger Tester-Session
 * Die Seiten und Server Actions prüfen zusätzlich selbst.
 */
async function hasValidToken(token: string | undefined, purpose: "admin" | "session") {
  if (!token) return false;
  try {
    const { payload } = await jwtVerify(token, getAuthSecret(), { algorithms: ["HS256"] });
    return payload.p === purpose;
  } catch {
    return false;
  }
}

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    if (!(await hasValidToken(request.cookies.get("th_admin")?.value, "admin"))) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
  }

  if (pathname.startsWith("/konto")) {
    if (!(await hasValidToken(request.cookies.get("th_session")?.value, "session"))) {
      const url = new URL("/anmelden", request.url);
      url.searchParams.set("weiter", pathname + search);
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/konto/:path*"],
};
