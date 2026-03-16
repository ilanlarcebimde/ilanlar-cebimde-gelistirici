import type { Metadata } from "next";
import Link from "next/link";
import { getSupabasePublic } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Yurtdışı Çalışma & Vize Duyuruları | İlanlar Cebimde",
  description:
    "Vize, pasaport, çalışma izni ve resmi kurum kaynaklı yurtdışı çalışma duyurularını ülke ve tür bazlı takip edin.",
};

function nowIso() {
  return new Date().toISOString();
}

type PageProps = {
  searchParams: Promise<{ ulke?: string; tur?: string }>;
};

export default async function InternationalNewsHubPage({ searchParams }: PageProps) {
  const { ulke, tur } = await searchParams;
  const supabase = getSupabasePublic();

  let query = supabase
    .from("merkezi_posts")
    .select("id, title, slug, summary, country_slug, news_type, priority_level, news_badge, published_at, is_featured")
    .eq("content_type", "international_work_visa_news")
    .eq("status", "published")
    .or(`published_at.is.null,published_at.lte.${nowIso()}`)
    .order("is_featured", { ascending: false })
    .order("published_at", { ascending: false, nullsFirst: false })
    .limit(200);

  if (ulke) query = query.eq("country_slug", ulke);
  if (tur) query = query.eq("news_type", tur);

  const { data: rows } = await query;
  const posts = rows ?? [];

  const { data: countries } = await supabase
    .from("merkezi_countries")
    .select("slug, name")
    .eq("is_active", true)
    .order("name", { ascending: true });

  const countryMap = new Map<string, string>();
  for (const c of countries ?? []) {
    const slug = (c as { slug: string }).slug;
    const name = (c as { name: string }).name;
    if (slug) countryMap.set(slug, name || slug);
  }

  const newsTypes = [
    { value: "visa", label: "Vize" },
    { value: "passport", label: "Pasaport" },
    { value: "work_permit", label: "Calisma Izni" },
    { value: "international_employment", label: "Yurtdisi Istihdam" },
    { value: "official_announcement", label: "Resmi Duyuru" },
    { value: "country_update", label: "Ulke Guncellemesi" },
    { value: "consular_services", label: "Konsolosluk Islemleri" },
    { value: "migration_procedure", label: "Goc / Calisma Proseduru" },
  ];

  return (
    <div className="min-h-screen bg-slate-50 py-10">
      <div className="mx-auto max-w-5xl space-y-6 px-4">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-slate-900">Yurtdışı Çalışma &amp; Vize Duyuruları</h1>
          <p className="text-sm text-slate-600">
            Resmi kaynaklı güncellemeleri ülke ve duyuru türüne göre filtreleyerek takip edin.
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex flex-wrap gap-2 text-xs">
            <Link href="/yurtdisi-calisma-ve-vize-duyurulari" className="rounded-full border border-slate-200 px-3 py-1 hover:bg-slate-50">
              Tum ulkeler / tum turler
            </Link>
            {(countries ?? []).slice(0, 18).map((c) => {
              const slug = (c as { slug: string }).slug;
              const name = (c as { name: string }).name;
              return (
                <Link
                  key={slug}
                  href={`/yurtdisi-calisma-ve-vize-duyurulari?ulke=${slug}${tur ? `&tur=${tur}` : ""}`}
                  className="rounded-full border border-slate-200 px-3 py-1 hover:bg-slate-50"
                >
                  {name}
                </Link>
              );
            })}
          </div>
          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            {newsTypes.map((t) => (
              <Link
                key={t.value}
                href={`/yurtdisi-calisma-ve-vize-duyurulari?tur=${t.value}${ulke ? `&ulke=${ulke}` : ""}`}
                className="rounded-full border border-slate-200 px-3 py-1 hover:bg-slate-50"
              >
                {t.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          {posts.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
              Filtreye uygun duyuru bulunamadi.
            </div>
          ) : (
            posts.map((post) => {
              const countrySlug = (post as { country_slug?: string | null }).country_slug ?? null;
              const countryName = countrySlug ? countryMap.get(countrySlug) ?? countrySlug : "Ulke belirtilmedi";
              const priority = ((post as { priority_level?: string | null }).priority_level ?? "normal").toLowerCase();
              const badge = (post as { news_badge?: string | null }).news_badge;
              const priorityClass =
                priority === "critical"
                  ? "bg-red-100 text-red-700"
                  : priority === "important"
                    ? "bg-amber-100 text-amber-700"
                    : "bg-slate-100 text-slate-700";

              return (
                <article key={(post as { id: string }).id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="mb-2 flex flex-wrap items-center gap-2 text-xs">
                    <span className={`rounded-full px-2 py-0.5 ${priorityClass}`}>{priority}</span>
                    {badge ? <span className="rounded-full bg-violet-100 px-2 py-0.5 text-violet-700">{badge}</span> : null}
                    {(post as { is_featured?: boolean }).is_featured ? (
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-emerald-700">One Cikan</span>
                    ) : null}
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-700">{countryName}</span>
                  </div>
                  <h2 className="text-lg font-semibold text-slate-900">
                    <Link href={`/yurtdisi-calisma-ve-vize-duyurulari/${(post as { slug: string }).slug}`} className="hover:underline">
                      {(post as { title: string }).title}
                    </Link>
                  </h2>
                  {(post as { summary?: string | null }).summary ? (
                    <p className="mt-1 text-sm text-slate-600">{(post as { summary: string }).summary}</p>
                  ) : null}
                </article>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
