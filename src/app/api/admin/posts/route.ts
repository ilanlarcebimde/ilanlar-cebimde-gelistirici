import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/ssr";
import { sanitizeContent } from "@/lib/merkezi/sanitize";
import { getSupabaseAdmin } from "@/lib/supabase/server";

export const runtime = "nodejs";

async function getAuth(req: NextRequest) {
  void req;
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: adminRow } = await supabase
    .from("app_admin")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!adminRow) return null;
  return { user, supabase };
}

/** GET: Tüm merkezi_posts (sadece admin). */
export async function GET(req: NextRequest) {
  const auth = await getAuth(req);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");

  let query = auth.supabase
    .from("merkezi_posts")
    .select("id, title, slug, status, sector_slug, country_slug, is_paid, published_at, created_at")
    .order("created_at", { ascending: false });

  if (status) query = query.eq("status", status);

  const { data, error } = await query;

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

/** POST: Yeni içerik oluştur (admin). */
export async function POST(req: NextRequest) {
  const auth = await getAuth(req);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: {
    title?: string;
    slug?: string;
    cover_image_url?: string | null;
    content_html_raw?: string;
    country_slug?: string | null;
    city?: string | null;
    sector_slug?: string;
    tags?: string[];
    is_paid?: boolean;
    show_contact_when_free?: boolean;
    contact_email?: string | null;
    contact_phone?: string | null;
    apply_url?: string | null;
    status?: string;
    scheduled_at?: string | null;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const title = (body.title || "").trim();
  const slug = (body.slug || "").trim().toLowerCase();
  if (!title || !slug) {
    return NextResponse.json({ error: "Başlık ve slug zorunlu" }, { status: 400 });
  }
  if (!body.sector_slug) {
    return NextResponse.json({ error: "Sektör zorunlu" }, { status: 400 });
  }

  const nowIso = new Date().toISOString();
  let status: string = body.status || "draft";
  let publishedAt: string | null = null;
  let scheduledAt: string | null = body.scheduled_at ?? null;

  if (status === "published") {
    publishedAt = nowIso;
    scheduledAt = null;
  } else if (status === "scheduled" && !scheduledAt) {
    return NextResponse.json({ error: "Zamanlama için tarih gerekli" }, { status: 400 });
  }

  const isPaid = body.is_paid ?? true;
  if (isPaid) {
    const ce = (body.contact_email || "").trim();
    const cp = (body.contact_phone || "").trim();
    const au = (body.apply_url || "").trim();
    if (!ce && !cp && !au) {
      return NextResponse.json(
        { error: "Ücretli içerik için en az bir iletişim alanı (e-posta / telefon / apply url) zorunlu" },
        { status: 400 }
      );
    }
  }

  const contentRaw = body.content_html_raw?.trim() || "";
  const contentSanitized = contentRaw ? sanitizeContent(contentRaw) : "";

  const { data: created, error } = await auth.supabase
    .from("merkezi_posts")
    .insert({
      title,
      slug,
      cover_image_url: body.cover_image_url ?? null,
      content: contentSanitized,
      content_html_raw: contentRaw || null,
      content_html_sanitized: contentSanitized || null,
      country_slug: body.country_slug ?? null,
      city: body.city ?? null,
      sector_slug: body.sector_slug,
      is_paid: isPaid,
      show_contact_when_free: body.show_contact_when_free ?? false,
      status,
      published_at: publishedAt,
      scheduled_at: scheduledAt,
      company_name: null,
      company_logo_url: null,
      company_short_description: null,
    })
    .select("id")
    .single();

  if (error || !created) {
    return NextResponse.json({ error: error?.message || "Oluşturma başarısız" }, { status: 500 });
  }

  const postId = created.id as string;

  if (Array.isArray(body.tags) && body.tags.length > 0) {
    const tagSlugs = body.tags.map((t) => String(t).trim().toLowerCase());
    const { data: tagRows } = await auth.supabase
      .from("merkezi_tags")
      .select("id, slug");
    const existing = new Map<string, string>();
    for (const t of tagRows ?? []) {
      existing.set((t.slug as string).toLowerCase(), t.id as string);
    }
    const toInsert: { name: string; slug: string }[] = [];
    for (const s of tagSlugs) {
      if (!existing.has(s)) toInsert.push({ name: s, slug: s });
    }
    if (toInsert.length > 0) {
      const { data: newTags } = await auth.supabase
        .from("merkezi_tags")
        .insert(toInsert)
        .select("id, slug");
      for (const t of newTags ?? []) {
        existing.set((t.slug as string).toLowerCase(), t.id as string);
      }
    }
    const postTags = tagSlugs
      .map((s) => existing.get(s))
      .filter(Boolean)
      .map((id) => ({ post_id: postId, tag_id: id }));
    if (postTags.length > 0) {
      await auth.supabase.from("merkezi_post_tags").insert(postTags);
    }
  }

  if (body.contact_email || body.contact_phone || body.apply_url) {
    const supabaseAdmin = getSupabaseAdmin();
    await supabaseAdmin
      .from("merkezi_post_contact")
      .upsert(
        {
          post_id: postId,
          contact_email: body.contact_email ?? null,
          contact_phone: body.contact_phone ?? null,
          apply_url: body.apply_url ?? null,
        },
        { onConflict: "post_id" }
      );
  }

  return NextResponse.json({ id: postId }, { status: 201 });
}

