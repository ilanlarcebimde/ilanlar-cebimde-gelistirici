import { NextRequest, NextResponse } from "next/server";
import { getPreparedPostFlowItemBySlug } from "@/lib/merkezi/postFlow";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get("slug")?.trim();
  if (!slug) {
    return NextResponse.json({ error: "slug_required" }, { status: 400 });
  }

  const payload = await getPreparedPostFlowItemBySlug(slug);
  if (!payload) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  return NextResponse.json(payload, {
    headers: { "Cache-Control": "no-store" },
  });
}
