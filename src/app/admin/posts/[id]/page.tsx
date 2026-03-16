import { notFound } from "next/navigation";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { NewPostForm } from "../new/NewPostForm";
import { VisaNewsPostForm } from "../new/VisaNewsPostForm";
import type { MerkeziPost } from "@/lib/merkezi/types";

export default async function AdminPostEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = getSupabaseAdmin();
  const { data: post, error } = await supabase
    .from("merkezi_posts")
    .select(
      "id, title, slug, cover_image_url, content_html_raw, country_slug, city, sector_slug, is_paid, show_contact_when_free, status, scheduled_at, application_deadline_date, application_deadline_text, summary, content_type, seo_title, editorial_status, news_type, source_name, source_url, effective_date, priority_level, is_featured, show_on_news_hub, news_badge, content_language, target_audience, news_category, og_title, og_description, og_image, canonical_url, structured_summary, user_impact, application_impact"
    )
    .eq("id", id)
    .maybeSingle();

  if (error || !post) notFound();

  const { data: tagRows } = await supabase
    .from("merkezi_post_tags")
    .select("tag_id")
    .eq("post_id", id);
  let tags: string[] = [];
  if (tagRows && tagRows.length > 0) {
    const tagIds = tagRows.map((r: { tag_id: string }) => r.tag_id);
    const { data: tagDetails } = await supabase
      .from("merkezi_tags")
      .select("id, slug")
      .in("id", tagIds);
    tags =
      tagDetails?.map((t: { slug: string }) => t.slug).filter(Boolean) ?? [];
  }

  const { data: contactRow } = await supabase
    .from("merkezi_post_contact")
    .select("contact_email, contact_phone, apply_url")
    .eq("post_id", id)
    .maybeSingle();

  const initial = {
    ...(post as unknown as Partial<MerkeziPost>),
    tags,
    contact_email: contactRow?.contact_email ?? "",
    contact_phone: contactRow?.contact_phone ?? "",
    apply_url: contactRow?.apply_url ?? "",
    application_deadline_date: (post as { application_deadline_date?: string | null })?.application_deadline_date ?? null,
    application_deadline_text: (post as { application_deadline_text?: string | null })?.application_deadline_text ?? null,
    summary: (post as { summary?: string | null })?.summary ?? null,
  };

  if ((post as { content_type?: string | null }).content_type === "international_work_visa_news") {
    return <VisaNewsPostForm initial={initial} postId={id} />;
  }

  return <NewPostForm initial={initial} postId={id} />;
}

