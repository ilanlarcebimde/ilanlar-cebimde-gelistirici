import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/ssr";
import { sanitizeContent } from "@/lib/merkezi/sanitize";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { normalizeSlugForPost } from "@/lib/slugify";

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
  const contentType = searchParams.get("contentType");

  let query = auth.supabase
    .from("merkezi_posts")
    .select("id, title, slug, status, sector_slug, country_slug, is_paid, published_at, created_at, content_type, news_type, priority_level, is_featured")
    .order("created_at", { ascending: false });

  if (status) query = query.eq("status", status);
  if (contentType && ["job", "blog", "international_work_visa_news"].includes(contentType)) {
    query = query.eq("content_type", contentType);
  }

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
    content_type?: "job" | "blog" | "international_work_visa_news";
    country_slug?: string | null;
    city?: string | null;
    sector_slug?: string | null;
    tags?: string[];
    summary?: string | null;
    seo_title?: string | null;
    editorial_status?: "draft" | "in_review" | "published";
    news_type?: string | null;
    source_name?: string | null;
    source_url?: string | null;
    effective_date?: string | null;
    priority_level?: "low" | "normal" | "important" | "critical" | null;
    is_featured?: boolean;
    show_on_news_hub?: boolean;
    news_badge?: string | null;
    content_language?: string | null;
    target_audience?: string | null;
    news_category?: string | null;
    og_title?: string | null;
    og_description?: string | null;
    og_image?: string | null;
    canonical_url?: string | null;
    structured_summary?: string | null;
    user_impact?: string | null;
    application_impact?: string | null;
    is_paid?: boolean;
    show_contact_when_free?: boolean;
    contact_email?: string | null;
    contact_phone?: string | null;
    apply_url?: string | null;
    status?: string;
    scheduled_at?: string | null;
    application_deadline_date?: string | null;
    application_deadline_text?: string | null;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const contentType =
    body.content_type === "blog"
      ? "blog"
      : body.content_type === "international_work_visa_news"
        ? "international_work_visa_news"
        : "job";
  const title = (body.title || "").trim();
  if (!title) {
    return NextResponse.json({ error: "Başlık zorunlu" }, { status: 400 });
  }
  const normalizedSlug = normalizeSlugForPost(body.slug || title, title);
  if (!normalizedSlug || normalizedSlug === "icerik") {
    return NextResponse.json({ error: "Geçerli bir slug türetilemedi" }, { status: 400 });
  }

  if (contentType === "blog") {
    const summaryTrim = (body.summary ?? "").trim();
    if (!summaryTrim) {
      return NextResponse.json({ error: "Blog için yazı özeti (SEO meta açıklama) zorunludur." }, { status: 400 });
    }
    if (summaryTrim.length < 140 || summaryTrim.length > 160) {
      return NextResponse.json({ error: "Özet 140–160 karakter arasında olmalıdır." }, { status: 400 });
    }
  } else if (contentType === "job") {
    if (!body.sector_slug?.trim()) {
      return NextResponse.json({ error: "Sektör zorunlu" }, { status: 400 });
    }
    const summaryTrim = (body.summary ?? "").trim();
    if (!summaryTrim) {
      return NextResponse.json({ error: "İlan özeti (SEO meta açıklama) zorunludur." }, { status: 400 });
    }
    if (summaryTrim.length < 140 || summaryTrim.length > 160) {
      return NextResponse.json({ error: "Özet 140–160 karakter arasında olmalıdır." }, { status: 400 });
    }
  } else {
    const summaryTrim = (body.summary ?? "").trim();
    if (!summaryTrim) {
      return NextResponse.json({ error: "Duyuru özeti (SEO meta açıklama) zorunludur." }, { status: 400 });
    }
    if (summaryTrim.length < 120 || summaryTrim.length > 160) {
      return NextResponse.json({ error: "Duyuru özeti 120–160 karakter arasında olmalıdır." }, { status: 400 });
    }
    if (!body.news_type?.trim()) {
      return NextResponse.json({ error: "Duyuru türü zorunludur." }, { status: 400 });
    }
    if (!body.country_slug?.trim()) {
      return NextResponse.json({ error: "Ülke zorunludur." }, { status: 400 });
    }
    if (body.priority_level && !["low", "normal", "important", "critical"].includes(body.priority_level)) {
      return NextResponse.json({ error: "Önem seviyesi geçersiz." }, { status: 400 });
    }
    if (body.editorial_status && !["draft", "in_review", "published"].includes(body.editorial_status)) {
      return NextResponse.json({ error: "İçerik durumu geçersiz." }, { status: 400 });
    }
  }

  const nowIso = new Date().toISOString();
  let status: string = body.status || "draft";
  let publishedAt: string | null = null;
  let scheduledAt: string | null = body.scheduled_at ?? null;
  const editorialStatus =
    body.editorial_status && ["draft", "in_review", "published"].includes(body.editorial_status)
      ? body.editorial_status
      : "draft";

  if (status === "published") {
    if (contentType === "international_work_visa_news" && editorialStatus === "draft") {
      return NextResponse.json(
        { error: "Duyuru doğrudan yayınlanacaksa içerik durumu en az 'in_review' olmalıdır." },
        { status: 400 }
      );
    }
    publishedAt = nowIso;
    scheduledAt = null;
  } else if (status === "scheduled" && !scheduledAt) {
    return NextResponse.json({ error: "Zamanlama için tarih gerekli" }, { status: 400 });
  }

  const isPaid = contentType === "job" ? (body.is_paid ?? true) : false;
  const showContactWhenFree = contentType === "job" ? (body.show_contact_when_free ?? false) : false;
  if (contentType === "job" && isPaid) {
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
  const deadlineDate = body.application_deadline_date?.trim();
  const deadlineText = (body.application_deadline_text?.trim() ?? "").slice(0, 120) || null;
  const summaryVal = (body.summary ?? "").trim().slice(0, 160);

  const { data: created, error } = await auth.supabase
    .from("merkezi_posts")
    .insert({
      title,
      slug: normalizedSlug,
      content_type: contentType,
      cover_image_url: body.cover_image_url ?? null,
      content: contentSanitized,
      content_html_raw: contentRaw || null,
      content_html_sanitized: contentSanitized || null,
      country_slug: contentType === "blog" ? null : (body.country_slug ?? null),
      city: contentType === "blog" ? null : (body.city ?? null),
      sector_slug: contentType === "job" ? (body.sector_slug ?? null) : null,
      is_paid: isPaid,
      show_contact_when_free: showContactWhenFree,
      status,
      published_at: publishedAt,
      scheduled_at: scheduledAt,
      company_name: null,
      company_logo_url: null,
      company_short_description: null,
      application_deadline_date: contentType === "job" ? (deadlineDate || null) : null,
      application_deadline_text: contentType === "job" ? deadlineText : null,
      summary: summaryVal || null,
      seo_title: body.seo_title?.trim() || null,
      editorial_status: status === "published" ? "published" : editorialStatus,
      news_type: contentType === "international_work_visa_news" ? (body.news_type?.trim() || null) : null,
      source_name: contentType === "international_work_visa_news" ? (body.source_name?.trim() || null) : null,
      source_url: contentType === "international_work_visa_news" ? (body.source_url?.trim() || null) : null,
      effective_date: contentType === "international_work_visa_news" ? (body.effective_date?.trim() || null) : null,
      priority_level: contentType === "international_work_visa_news" ? (body.priority_level ?? "normal") : null,
      is_featured: contentType === "international_work_visa_news" ? (body.is_featured ?? false) : false,
      show_on_news_hub: contentType === "international_work_visa_news" ? (body.show_on_news_hub ?? true) : false,
      news_badge: contentType === "international_work_visa_news" ? (body.news_badge?.trim() || null) : null,
      content_language: contentType === "international_work_visa_news" ? (body.content_language?.trim() || "tr") : null,
      target_audience: contentType === "international_work_visa_news" ? (body.target_audience?.trim() || null) : null,
      news_category: contentType === "international_work_visa_news" ? (body.news_category?.trim() || null) : null,
      og_title: contentType === "international_work_visa_news" ? (body.og_title?.trim() || null) : null,
      og_description: contentType === "international_work_visa_news" ? (body.og_description?.trim() || null) : null,
      og_image: contentType === "international_work_visa_news" ? (body.og_image?.trim() || null) : null,
      canonical_url: contentType === "international_work_visa_news" ? (body.canonical_url?.trim() || null) : null,
      structured_summary: contentType === "international_work_visa_news" ? (body.structured_summary?.trim() || null) : null,
      user_impact: contentType === "international_work_visa_news" ? (body.user_impact?.trim() || null) : null,
      application_impact: contentType === "international_work_visa_news" ? (body.application_impact?.trim() || null) : null,
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

  if (contentType === "job" && (body.contact_email || body.contact_phone || body.apply_url)) {
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

