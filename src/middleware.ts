import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * PayTR callback URL'inin 308/redirect almaması için bu path'te doğrudan next() dönülür.
 * Auth veya başka redirect'ler /api/paytr/callback için uygulanmamalı.
 */
export function middleware(request: NextRequest) {
  if (request.nextUrl.pathname === "/api/paytr/callback") {
    return NextResponse.next();
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/api/paytr/callback"],
};
