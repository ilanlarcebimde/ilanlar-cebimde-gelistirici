import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";

export const runtime = "nodejs";

type Body = {
  id?: string;
  user_id?: string | null;
  method?: string;
  status?: string;
  country?: string | null;
  job_area?: string | null;
  job_branch?: string | null;
  answers?: Record<string, unknown>;
  photo_url?: string | null;
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Body;
    const {
      id,
      user_id = null,
      method = "form",
      status = "draft",
      country = null,
      job_area = null,
      job_branch = null,
      answers = {},
      photo_url = null,
    } = body;

    const supabase = getSupabaseAdmin();
    // Null dönmesin: opsiyonel metin alanları boş string, answers her zaman object
    const row = {
      user_id: user_id ?? null,
      method: method === "voice" || method === "chat" ? method : "form",
      status:
        status === "completed" ||
        status === "paid" ||
        status === "processing" ||
        status === "delivered" ||
        status === "checkout_started" ||
        status === "failed"
          ? status
          : "draft",
      country: (country != null && String(country).trim()) ? String(country).trim() : "",
      job_area: (job_area != null && String(job_area).trim()) ? String(job_area).trim() : "",
      job_branch: (job_branch != null && String(job_branch).trim()) ? String(job_branch).trim() : "",
      answers: answers && typeof answers === "object" && !Array.isArray(answers) ? answers : {},
      photo_url: (photo_url != null && String(photo_url).trim()) ? String(photo_url).trim() : "",
      updated_at: new Date().toISOString(),
    };

    if (id && typeof id === "string" && id.length > 0) {
      const { error } = await supabase.from("profiles").update(row).eq("id", id);
      if (error) {
        console.error("[profile/draft] update error", error);
        return NextResponse.json(
          { error: "update_failed", detail: error.message },
          { status: 500 }
        );
      }
      return NextResponse.json({ id }, { status: 200 });
    }

    const { data, error } = await supabase
      .from("profiles")
      .insert(row)
      .select("id")
      .single();

    if (error) {
      console.error("[profile/draft] insert error", error);
      return NextResponse.json(
        { error: "insert_failed", detail: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ id: data?.id ?? null }, { status: 200 });
  } catch (e) {
    console.error("[profile/draft] error", e);
    return NextResponse.json(
      { error: "internal_error", detail: String(e) },
      { status: 500 }
    );
  }
}
