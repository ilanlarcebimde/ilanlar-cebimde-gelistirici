import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";

export const runtime = "nodejs";

/**
 * Tek ilan + rehber alanları. Sadece published ilanlar; analysis_json/analysis_status okuma.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const raw = (await params).id;
  const id = typeof raw === "string" ? raw.trim() : "";
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const cols = "id, title, position_text, location_text, source_name, source_url, snippet, published_at, analysis_status, analysis_json";

  const { data: dataPublished, error: errPublished } = await supabase
    .from("job_posts")
    .select(cols)
    .eq("id", id)
    .eq("status", "published")
    .maybeSingle();

  if (errPublished) {
    console.warn("[job-posts GET]", id, errPublished.message);
    return NextResponse.json(
      { error: errPublished.message, requestedId: id },
      { status: 500 }
    );
  }

  if (dataPublished) {
    return NextResponse.json(dataPublished);
  }

  const { data: dataAny, error: errAny } = await supabase
    .from("job_posts")
    .select(cols)
    .eq("id", id)
    .maybeSingle();

  if (errAny) {
    return NextResponse.json(
      { error: errAny.message, requestedId: id },
      { status: 500 }
    );
  }

  if (dataAny) {
    return NextResponse.json(dataAny);
  }

  return NextResponse.json(
    { error: "Not found", requestedId: id },
    { status: 404 }
  );
}
