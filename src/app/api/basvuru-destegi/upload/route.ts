import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { getSupabaseForUser } from "@/lib/supabase/server";
import { DOC_CATEGORY_KEYS, type DocCategoryKey } from "@/lib/yurtdisiIsBasvuruDestegi/constants";
import { isAllowedUploadMime } from "@/lib/yurtdisiIsBasvuruDestegi/validateWizardForPaytr";

export const runtime = "nodejs";

const BUCKET = "basvuru-destegi-private";
const MAX_BYTES = 15 * 1024 * 1024;

function sanitizeFilename(name: string): string {
  const base = name.split(/[/\\]/).pop() || "file";
  return base.replace(/[^a-zA-Z0-9._-]+/g, "_").slice(0, 120) || "file";
}

export async function POST(request: NextRequest) {
  try {
    const auth = request.headers.get("authorization");
    if (!auth?.toLowerCase().startsWith("bearer ")) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    const token = auth.slice(7).trim();
    if (!token) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const supabaseUser = getSupabaseForUser(token);
    const { data: userRes, error: userErr } = await supabaseUser.auth.getUser();
    const user = userRes?.user;
    if (userErr || !user?.id) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const form = await request.formData();
    const file = form.get("file");
    const category = form.get("category");
    const draftId = form.get("draftId");

    if (!(file instanceof File) || !file.size) {
      return NextResponse.json({ error: "Dosya gerekli." }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: "Dosya 15 MB sınırını aşıyor." }, { status: 400 });
    }
    if (!isAllowedUploadMime(file.type || "", file.name)) {
      return NextResponse.json(
        { error: "Bu dosya türü kabul edilmiyor (PDF, Word, JPEG, PNG, WEBP)." },
        { status: 400 }
      );
    }
    if (typeof category !== "string" || !DOC_CATEGORY_KEYS.includes(category as DocCategoryKey)) {
      return NextResponse.json({ error: "Geçersiz belge türü." }, { status: 400 });
    }
    if (typeof draftId !== "string" || !draftId.trim() || !/^[a-zA-Z0-9_-]{8,64}$/.test(draftId.trim())) {
      return NextResponse.json({ error: "Geçersiz taslak referansı." }, { status: 400 });
    }

    const safeName = sanitizeFilename(file.name);
    const objectPath = `${user.id}/basvuru/${draftId.trim()}/${category}_${Date.now()}_${safeName}`;

    const buffer = Buffer.from(await file.arrayBuffer());
    const admin = getSupabaseAdmin();
    const { error: upErr } = await admin.storage.from(BUCKET).upload(objectPath, buffer, {
      contentType: file.type || "application/octet-stream",
      upsert: false,
    });

    if (upErr) {
      console.error("[basvuru-destegi upload]", upErr);
      return NextResponse.json({ error: "Yükleme başarısız." }, { status: 500 });
    }

    return NextResponse.json({
      path: objectPath,
      originalName: file.name,
      size: file.size,
      category: category as DocCategoryKey,
    });
  } catch (e) {
    console.error("[basvuru-destegi upload] exception", e);
    return NextResponse.json({ error: "Yükleme başarısız." }, { status: 500 });
  }
}
