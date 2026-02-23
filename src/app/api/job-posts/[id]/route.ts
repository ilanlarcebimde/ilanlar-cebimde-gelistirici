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
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error("[job-posts] SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing");
    return NextResponse.json(
      { error: "supabase_admin_not_configured", detail: "Server env missing" },
      { status: 503 }
    );
  }

  const raw = (await params).id;
  const id = typeof raw === "string" ? raw.trim() : "";
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  try {
    const supabase = getSupabaseAdmin();
    const cols = "id, title, position_text, location_text, source_name, source_url, snippet, published_at, analysis_status, analysis_json";

    const { data: dataPublished, error: errPublished } = await supabase
      .from("job_posts")
      .select(cols)
      .eq("id", id)
      .eq("status", "published")
      .maybeSingle();

    if (errPublished) {
      console.error("[job-posts] job_posts fetch error", id, errPublished);
      return NextResponse.json(
        { error: "job_posts_fetch_failed", detail: errPublished.message?.slice(0, 200) ?? "Unknown", requestedId: id },
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
      console.error("[job-posts] job_posts fetch (any) error", id, errAny);
      return NextResponse.json(
        { error: "job_posts_fetch_failed", detail: errAny.message?.slice(0, 200) ?? "Unknown", requestedId: id },
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
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[job-posts] unexpected error", id, msg, e);
    return NextResponse.json(
      { error: "internal_error", detail: msg.slice(0, 200), requestedId: id },
      { status: 500 }
    );
  }
}
