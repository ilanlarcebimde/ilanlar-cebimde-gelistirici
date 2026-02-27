import { notFound } from "next/navigation";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { NewPostForm } from "../new/NewPostForm";
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
      "id, title, slug, cover_image_url, content_html_raw, country_slug, city, sector_slug, is_paid, show_contact_when_free, status, scheduled_at"
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
  };

  return <NewPostForm initial={initial} postId={id} />;
}

