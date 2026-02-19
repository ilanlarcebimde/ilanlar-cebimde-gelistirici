import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * PayTR callback URL'inin 308/redirect almaması için bu path'te doğrudan next() dönülür.
 * Auth veya başka redirect'ler /api/paytr/callback için uygulanmamalı.
 */
const UCRETSIZ_PATH = "/ucretsiz-yurtdisi-is-ilanlari";

export function middleware(request: NextRequest) {
  if (request.nextUrl.pathname === "/api/paytr/callback") {
    return NextResponse.next();
  }
  // 301: eski URL → yeni canonical URL
  if (request.nextUrl.pathname === "/yurtdisi-is-ilanlari") {
    const url = request.nextUrl.clone();
    url.pathname = UCRETSIZ_PATH;
    return NextResponse.redirect(url, 301);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/api/paytr/callback", "/yurtdisi-is-ilanlari"],
};
