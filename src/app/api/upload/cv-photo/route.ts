import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";

const BUCKET = "cv-photos";
const MAX_SIZE_MB = 6;

/**
 * Giriş yapmamış kullanıcılar için profil fotoğrafı yükler.
 * Service role ile cv-photos bucket'a yazar, public URL döner.
 */
export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");
    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "Dosya gerekli" }, { status: 400 });
    }
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "Sadece resim dosyaları kabul edilir" }, { status: 400 });
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      return NextResponse.json({ error: `Dosya boyutu ${MAX_SIZE_MB}MB'dan küçük olmalı` }, { status: 400 });
    }

    const ext = (file.name.split(".").pop() || "jpg").replace(/[^a-z0-9]/gi, "").toLowerCase() || "jpg";
    const path = `draft/${crypto.randomUUID()}.${ext}`;

    const supabase = getSupabaseAdmin();
    const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
      upsert: false,
      contentType: file.type,
    });

    if (error) {
      console.error("[upload/cv-photo]", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
    return NextResponse.json({ url: data.publicUrl });
  } catch (e) {
    console.error("[upload/cv-photo]", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
