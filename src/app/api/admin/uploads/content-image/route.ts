import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { getSupabaseServerClient } from "@/lib/supabase/ssr";

export const runtime = "nodejs";

const BUCKET = "merkezi-covers";
const MAX_SIZE_MB = 6;

/** MIME type'dan güvenli uzantı (client dosya adı kullanılmaz). */
const MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

/** Admin: içerik editörüne eklenecek resim upload. Path: content/{postId|temp}/{timestamp}.{ext}
 * Not: content/temp/ altındaki dosyalar için haftalık cleanup (n8n/cron) önerilir. */
export async function POST(req: NextRequest) {
  const supabaseUser = await getSupabaseServerClient();
  const { data: { user } } = await supabaseUser.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: adminRow } = await supabaseUser
    .from("app_admin")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!adminRow) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("file");
  const postId = (formData.get("postId") as string)?.trim() || "temp";
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "Dosya gerekli" }, { status: 400 });
  }
  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ error: "Sadece resim dosyaları kabul edilir" }, { status: 400 });
  }
  if (file.size > MAX_SIZE_MB * 1024 * 1024) {
    return NextResponse.json({ error: `Dosya boyutu ${MAX_SIZE_MB}MB'dan küçük olmalı` }, { status: 400 });
  }

  const ext = MIME_TO_EXT[file.type] ?? "jpg";
  const path = `content/${postId}/${Date.now()}.${ext}`;

  const supabase = getSupabaseAdmin();
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    upsert: false,
    contentType: file.type,
  });
  if (error) {
    console.error("[admin/uploads/content-image]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return NextResponse.json({ url: data.publicUrl });
}
