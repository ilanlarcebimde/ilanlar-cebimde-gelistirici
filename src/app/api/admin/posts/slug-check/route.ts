import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/ssr";

export const runtime = "nodejs";

const RESERVED_SEGMENTS = [
  "admin",
  "api",
  "premium",
  "ucretsiz-yurtdisi-is-ilanlari",
  "yurtdisi-is-ilanlari",
];

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const slug = (searchParams.get("slug") || "").trim().toLowerCase();
  const excludeId = searchParams.get("excludeId") || null;
  if (!slug) return NextResponse.json({ ok: false, reason: "Slug boş" }, { status: 400 });

  if (RESERVED_SEGMENTS.includes(slug)) {
    return NextResponse.json({ ok: false, reason: "Bu slug rezerve edilmiş" }, { status: 200 });
  }

  const supabase = await getSupabaseServerClient();
  const { data: existing } = await supabase
    .from("merkezi_posts")
    .select("id")
    .eq("slug", slug)
    .limit(1);

  if (existing && existing.length > 0 && existing[0].id !== excludeId) {
    return NextResponse.json({ ok: false, reason: "Bu slug başka bir içerik tarafından kullanılıyor" });
  }

  const { data: seoPages } = await supabase
    .from("merkezi_seo_pages")
    .select("type, sector_slug, country_slug");
  const dynamicReserved = new Set<string>();
  for (const row of seoPages ?? []) {
    const sectorSlug = (row.sector_slug as string | null)?.toLowerCase().trim();
    const countrySlug = (row.country_slug as string | null)?.toLowerCase().trim();
    if (sectorSlug) dynamicReserved.add(sectorSlug);
    if (row.type === "country_sector" && sectorSlug && countrySlug) {
      dynamicReserved.add(`${countrySlug}-${sectorSlug}`);
    }
  }
  if (dynamicReserved.has(slug)) {
    return NextResponse.json({ ok: false, reason: "Bu slug sektör veya ülke+sektör sayfası için kullanılıyor" });
  }

  return NextResponse.json({ ok: true });
}

