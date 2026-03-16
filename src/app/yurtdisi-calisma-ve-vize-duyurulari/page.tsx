import type { Metadata } from "next";
import { getSupabasePublic } from "@/lib/supabase/server";
import { DuyuruCenterClient } from "@/components/duyuru-center/DuyuruCenterClient";
import { DuyuruCountry, DuyuruPost } from "@/components/duyuru-center/types";

export const metadata: Metadata = {
  title: "Yurtdışı Çalışma & Vize Duyuruları | İlanlar Cebimde",
  description:
    "Vize, pasaport, çalışma izni ve resmi kurum kaynaklı yurtdışı çalışma duyurularını ülke ve tür bazlı takip edin.",
};

function nowIso() {
  return new Date().toISOString();
}

export default async function InternationalNewsHubPage() {
  const supabase = getSupabasePublic();

  const query = supabase
    .from("merkezi_posts")
    .select("id, title, slug, summary, country_slug, news_type, priority_level, news_badge, published_at, is_featured, source_name, cover_image_url")
    .eq("content_type", "international_work_visa_news")
    .eq("status", "published")
    .or(`published_at.is.null,published_at.lte.${nowIso()}`)
    .order("is_featured", { ascending: false })
    .order("published_at", { ascending: false, nullsFirst: false })
    .limit(200);

  const { data: rows } = await query;
  const posts: DuyuruPost[] = (rows ?? []) as DuyuruPost[];

  const { data: countries } = await supabase
    .from("merkezi_countries")
    .select("slug, name")
    .eq("is_active", true)
    .order("name", { ascending: true });

  const countryList: DuyuruCountry[] = (countries ?? []) as DuyuruCountry[];

  return (
    <DuyuruCenterClient posts={posts} countries={countryList} />
  );
}
