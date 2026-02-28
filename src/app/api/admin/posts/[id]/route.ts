import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/ssr";
import { sanitizeContent } from "@/lib/merkezi/sanitize";
import { getSupabaseAdmin } from "@/lib/supabase/server";

export const runtime = "nodejs";

async function getAuth() {
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

/** PATCH: İçerik güncelle (admin). */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getAuth();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

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
    application_deadline_date?: string | null;
    application_deadline_text?: string | null;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const nowIso = new Date().toISOString();
  let status = body.status;
  let publishedAt: string | null | undefined = undefined;
  let scheduledAt: string | null | undefined = body.scheduled_at ?? undefined;

  if (status === "published") {
    publishedAt = nowIso;
    scheduledAt = null;
  } else if (status === "scheduled" && !scheduledAt) {
    return NextResponse.json({ error: "Zamanlama için tarih gerekli" }, { status: 400 });
  }

  const contentRaw = body.content_html_raw?.trim();
  const contentSanitized = contentRaw ? sanitizeContent(contentRaw) : undefined;

  const supabaseAdmin = getSupabaseAdmin();

  const { data: existingPost } = await supabaseAdmin
    .from("merkezi_posts")
    .select("is_paid")
    .eq("id", id)
    .maybeSingle();

  const { data: existingContact } = await supabaseAdmin
    .from("merkezi_post_contact")
    .select("contact_email, contact_phone, apply_url")
    .eq("post_id", id)
    .maybeSingle();

  const patch: Record<string, unknown> = {};
  if (body.title != null) patch.title = body.title;
  if (body.slug != null) patch.slug = body.slug;
  if (body.cover_image_url !== undefined) patch.cover_image_url = body.cover_image_url;
  if (contentRaw !== undefined) {
    patch.content_html_raw = contentRaw || null;
    patch.content = contentSanitized ?? null;
    patch.content_html_sanitized = contentSanitized ?? null;
  }
  if (body.country_slug !== undefined) patch.country_slug = body.country_slug;
  if (body.city !== undefined) patch.city = body.city;
  if (body.sector_slug !== undefined) patch.sector_slug = body.sector_slug;
  if (body.is_paid !== undefined) patch.is_paid = body.is_paid;
  if (body.show_contact_when_free !== undefined) patch.show_contact_when_free = body.show_contact_when_free;
  if (status) patch.status = status;
  if (publishedAt !== undefined) patch.published_at = publishedAt;
  if (scheduledAt !== undefined) patch.scheduled_at = scheduledAt;
  if (body.application_deadline_date !== undefined) {
    patch.application_deadline_date = body.application_deadline_date?.trim() || null;
  }
  if (body.application_deadline_text !== undefined) {
    patch.application_deadline_text = (body.application_deadline_text?.trim() ?? "").slice(0, 120) || null;
  }

  const newIsPaid = body.is_paid ?? existingPost?.is_paid ?? false;
  const newContactEmail =
    body.contact_email !== undefined ? body.contact_email : existingContact?.contact_email ?? null;
  const newContactPhone =
    body.contact_phone !== undefined ? body.contact_phone : existingContact?.contact_phone ?? null;
  const newApplyUrl =
    body.apply_url !== undefined ? body.apply_url : existingContact?.apply_url ?? null;

  if (newIsPaid) {
    const ce = (newContactEmail || "").trim();
    const cp = (newContactPhone || "").trim();
    const au = (newApplyUrl || "").trim();
    if (!ce && !cp && !au) {
      return NextResponse.json(
        { error: "Ücretli içerik için en az bir iletişim alanı (e-posta / telefon / apply url) zorunlu" },
        { status: 400 }
      );
    }
  }

  const { error } = await auth.supabase
    .from("merkezi_posts")
    .update(patch)
    .eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (Array.isArray(body.tags)) {
    const tagSlugs = body.tags.map((t) => String(t).trim().toLowerCase());
    const { data: tagRows } = await supabaseAdmin
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
      const { data: newTags } = await supabaseAdmin
        .from("merkezi_tags")
        .insert(toInsert)
        .select("id, slug");
      for (const t of newTags ?? []) {
        existing.set((t.slug as string).toLowerCase(), t.id as string);
      }
    }
    await supabaseAdmin.from("merkezi_post_tags").delete().eq("post_id", id);
    const postTags = tagSlugs
      .map((s) => existing.get(s))
      .filter(Boolean)
      .map((tagId) => ({ post_id: id, tag_id: tagId }));
    if (postTags.length > 0) {
      await supabaseAdmin.from("merkezi_post_tags").insert(postTags);
    }
  }

  if (body.contact_email !== undefined || body.contact_phone !== undefined || body.apply_url !== undefined) {
    await supabaseAdmin
      .from("merkezi_post_contact")
      .upsert(
        {
          post_id: id,
          contact_email: body.contact_email ?? null,
          contact_phone: body.contact_phone ?? null,
          apply_url: body.apply_url ?? null,
        },
        { onConflict: "post_id" }
      );
  }

  return NextResponse.json({ id });
}

/** DELETE: İçerik sil (admin). İlişkili kayıtlar (contact, tags, views, likes, letters) cascade ile silinir. */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getAuth();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  if (!id) return NextResponse.json({ error: "Bad request" }, { status: 400 });

  const supabaseAdmin = getSupabaseAdmin();
  const { error } = await supabaseAdmin.from("merkezi_posts").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

