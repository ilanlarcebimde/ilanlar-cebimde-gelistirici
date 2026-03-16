"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { RichHtmlEditor } from "@/components/admin/RichHtmlEditor";
import { supabase } from "@/lib/supabase";
import { slugifyTR } from "@/lib/slugify";

const COVER_BUCKET = "merkezi-covers";

type PublishStatus = "draft" | "published" | "scheduled";
type EditorialStatus = "draft" | "in_review" | "published";
type PriorityLevel = "low" | "normal" | "important" | "critical";

const SEO_TITLE_MAX = 60;
const META_MAX = 160;
const META_MIN = 120;

const NEWS_TYPES = [
  { value: "visa", label: "Vize" },
  { value: "passport", label: "Pasaport" },
  { value: "work_permit", label: "Calisma Izni" },
  { value: "international_employment", label: "Yurtdisi Istihdam" },
  { value: "official_announcement", label: "Resmi Duyuru" },
  { value: "country_update", label: "Ulke Guncellemesi" },
  { value: "consular_services", label: "Konsolosluk Islemleri" },
  { value: "migration_procedure", label: "Goc / Calisma Proseduru" },
] as const;

const TARGET_AUDIENCE = [
  { value: "general_public", label: "Genel kullanici" },
  { value: "job_seekers_abroad", label: "Yurtdisinda is arayanlar" },
  { value: "specific_professions", label: "Belirli meslek gruplari" },
  { value: "students", label: "Ogrenciler" },
  { value: "employers", label: "Isverenler" },
] as const;

const NEWS_CATEGORIES = [
  { value: "visa_announcements", label: "Vize duyurulari" },
  { value: "work_permit_updates", label: "Calisma izni guncellemeleri" },
  { value: "country_labor_updates", label: "Ulke bazli is gucu gelismeleri" },
  { value: "official_process_changes", label: "Resmi prosedur degisiklikleri" },
  { value: "passport_processes", label: "Pasaport islemleri" },
  { value: "international_application_process", label: "Yurtdisi basvuru surecleri" },
] as const;

type InitialData = {
  title?: string | null;
  slug?: string | null;
  summary?: string | null;
  seo_title?: string | null;
  cover_image_url?: string | null;
  content_html_raw?: string | null;
  tags?: string[];
  country_slug?: string | null;
  city?: string | null;
  status?: string | null;
  scheduled_at?: string | null;
  editorial_status?: string | null;
  news_type?: string | null;
  source_name?: string | null;
  source_url?: string | null;
  effective_date?: string | null;
  priority_level?: string | null;
  is_featured?: boolean | null;
  show_on_news_hub?: boolean | null;
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
};

type Props = {
  postId?: string;
  initial?: InitialData;
  embedded?: boolean;
};

function normalizeStatus(v: string | null | undefined): PublishStatus {
  if (v === "published" || v === "scheduled") return v;
  return "draft";
}

function normalizeEditorialStatus(v: string | null | undefined): EditorialStatus {
  if (v === "in_review" || v === "published") return v;
  return "draft";
}

function buildTemplate() {
  return [
    "<h2>Kisa Duyuru Ozeti</h2>",
    "<p></p>",
    "<h2>Bu gelisme neyi degistiriyor?</h2>",
    "<p></p>",
    "<h2>Kimleri etkiliyor?</h2>",
    "<p></p>",
    "<h2>Is arayanlar icin anlami nedir?</h2>",
    "<p></p>",
    "<h2>Basvuru surecine etkisi</h2>",
    "<p></p>",
    "<h2>Dikkat edilmesi gerekenler</h2>",
    "<p></p>",
    "<h2>Resmi kaynak / baglanti bilgisi</h2>",
    "<p></p>",
  ].join("\n");
}

function readImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      const width = image.naturalWidth;
      const height = image.naturalHeight;
      URL.revokeObjectURL(objectUrl);
      resolve({ width, height });
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Gorsel boyutu okunamadi."));
    };

    image.src = objectUrl;
  });
}

export function VisaNewsPostForm({ postId, initial, embedded = false }: Props) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(false);
  const [slugStatus, setSlugStatus] = useState<string | null>(null);
  const [seoTitle, setSeoTitle] = useState(initial?.seo_title ?? "");
  const [summary, setSummary] = useState(initial?.summary ?? "");
  const [coverUrl, setCoverUrl] = useState(initial?.cover_image_url ?? "");
  const [contentHtml, setContentHtml] = useState(initial?.content_html_raw ?? "");
  const [tags, setTags] = useState((initial?.tags ?? []).join(", "));

  const [country, setCountry] = useState(initial?.country_slug ?? "");
  const [city, setCity] = useState(initial?.city ?? "");
  const [newsType, setNewsType] = useState(initial?.news_type ?? "");
  const [newsCategory, setNewsCategory] = useState(initial?.news_category ?? "");
  const [targetAudience, setTargetAudience] = useState(initial?.target_audience ?? "");
  const [sourceName, setSourceName] = useState(initial?.source_name ?? "");
  const [sourceUrl, setSourceUrl] = useState(initial?.source_url ?? "");
  const [effectiveDate, setEffectiveDate] = useState(initial?.effective_date ?? "");
  const [priorityLevel, setPriorityLevel] = useState<PriorityLevel>(
    (initial?.priority_level as PriorityLevel) || "normal"
  );
  const [status, setStatus] = useState<PublishStatus>(normalizeStatus(initial?.status));
  const [scheduledAt, setScheduledAt] = useState(initial?.scheduled_at ?? "");
  const [editorialStatus, setEditorialStatus] = useState<EditorialStatus>(
    normalizeEditorialStatus(initial?.editorial_status)
  );
  const [isFeatured, setIsFeatured] = useState(initial?.is_featured ?? false);
  const [showOnNewsHub, setShowOnNewsHub] = useState(initial?.show_on_news_hub ?? true);
  const [newsBadge, setNewsBadge] = useState(initial?.news_badge ?? "");
  const [contentLanguage, setContentLanguage] = useState(initial?.content_language ?? "tr");
  const [ogTitle, setOgTitle] = useState(initial?.og_title ?? "");
  const [ogDescription, setOgDescription] = useState(initial?.og_description ?? "");
  const [ogImage, setOgImage] = useState(initial?.og_image ?? "");
  const [canonicalUrl, setCanonicalUrl] = useState(initial?.canonical_url ?? "");
  const [structuredSummary, setStructuredSummary] = useState(initial?.structured_summary ?? "");
  const [userImpact, setUserImpact] = useState(initial?.user_impact ?? "");
  const [applicationImpact, setApplicationImpact] = useState(initial?.application_impact ?? "");

  const [countries, setCountries] = useState<{ id: string; name: string; slug: string }[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successId, setSuccessId] = useState<string | null>(null);
  const [contentImageUploading, setContentImageUploading] = useState(false);
  const contentImageInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const tagsArray = useMemo(
    () =>
      tags
        .split(",")
        .map((x) => x.trim().toLowerCase())
        .filter(Boolean),
    [tags]
  );

  useEffect(() => {
    if (!slugTouched && title.trim()) setSlug(slugifyTR(title));
  }, [title, slugTouched]);

  useEffect(() => {
    if (!seoTitle.trim() && title.trim()) {
      const suggestion = `${title.trim()} | Yurtdisi Calisma ve Vize Duyurulari`;
      setSeoTitle(suggestion.slice(0, SEO_TITLE_MAX));
    }
  }, [seoTitle, title]);

  useEffect(() => {
    if (!summary.trim() && title.trim()) {
      const typeLabel = NEWS_TYPES.find((t) => t.value === newsType)?.label ?? "Duyuru";
      const countryPart = country ? ` ${country}` : "";
      const generated = `${typeLabel}${countryPart} guncellemesi: ${title.trim()}. Is arayanlar ve basvuru surecleri icin resmi kaynaga dayali ozet ve etkiler.`;
      setSummary(generated.slice(0, META_MAX));
    }
  }, [title, newsType, country, summary]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/admin/taxonomy", { credentials: "include" });
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) setCountries(data.countries || []);
      } catch {
        // ignore
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const slugForCheck = slugifyTR(slug || title);
  useEffect(() => {
    if (!slugForCheck || slugForCheck === "icerik") {
      setSlugStatus(null);
      return;
    }
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const url = new URL("/api/admin/posts/slug-check", window.location.origin);
        url.searchParams.set("slug", slugForCheck);
        if (postId) url.searchParams.set("excludeId", postId);
        const res = await fetch(url.toString(), { credentials: "include", signal: controller.signal });
        const data = await res.json();
        if (!res.ok) {
          setSlugStatus(data.reason || "Slug kontrolu basarisiz");
          return;
        }
        setSlugStatus(data.ok ? "Uygun" : data.reason || "Kullanilamaz");
      } catch {
        setSlugStatus("Kontrol edilemedi");
      }
    }, 400);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [slugForCheck, postId]);

  const handleSlugBlur = () => {
    setSlugTouched(true);
    setSlug((prev) => slugifyTR(prev || title));
  };

  const handleApplyTemplate = () => {
    if (contentHtml.trim()) {
      const ok = window.confirm("Editor dolu. Sablon eklensin mi?");
      if (!ok) return;
      setContentHtml((prev) => `${prev}\n\n${buildTemplate()}`);
      return;
    }
    setContentHtml(buildTemplate());
  };

  const applyTagSuggestion = () => {
    const newsLabel = NEWS_TYPES.find((t) => t.value === newsType)?.label;
    const suggestions = [country, newsLabel, "resmi-duyuru", "yurtdisi-calisma", "vize-guncellemesi"]
      .map((x) => (x || "").trim().toLowerCase().replace(/\s+/g, "-"))
      .filter(Boolean);
    const merged = [...new Set([...tagsArray, ...suggestions])];
    setTags(merged.join(", "));
  };

  const handleUploadCover = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Sadece resim dosyalari kabul edilir.");
      return;
    }
    setError(null);
    try {
      const { width, height } = await readImageDimensions(file);
      if (width !== 1200 || height !== 630) {
        setError("Kapak gorseli tam olarak 1200x630 olmalidir (sosyal paylasim formati).");
        return;
      }

      const signedRes = await fetch("/api/admin/uploads/cover/signed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: file.name }),
        credentials: "include",
      });
      const signedData = await signedRes.json();
      if (!signedRes.ok || !signedData.path || !signedData.token || !signedData.publicUrl) {
        setError(signedData.error || "Imzali URL alinamadi.");
        return;
      }
      const { error: uploadErr } = await supabase.storage
        .from(COVER_BUCKET)
        .uploadToSignedUrl(signedData.path, signedData.token, file, { contentType: file.type });
      if (uploadErr) {
        setError(uploadErr.message || "Yukleme basarisiz.");
        return;
      }
      setCoverUrl(signedData.publicUrl);
      if (!ogImage) setOgImage(signedData.publicUrl);
    } catch (e2) {
      setError(e2 instanceof Error ? e2.message : "Kapak yuklenemedi");
    }
  };

  const parseUploadResponse = async (res: Response): Promise<{ url?: string; error?: string }> => {
    const text = await res.text();
    try {
      return JSON.parse(text) as { url?: string; error?: string };
    } catch {
      return { error: "Yanit islenemedi." };
    }
  };

  const handleUploadContentImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    setContentImageUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      if (postId) formData.append("postId", postId);
      const res = await fetch("/api/admin/uploads/content-image", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      const data = await parseUploadResponse(res);
      if (!res.ok || !data.url) {
        setError(data.error || "Resim yuklenemedi");
        return;
      }
      const alt = window.prompt("Resim alt metni (zorunlu):");
      if (!alt?.trim()) return;
      const safeAlt = alt.trim().replace(/"/g, "&quot;");
      const imgTag = `<figure><img src="${data.url}" alt="${safeAlt}" loading="lazy" /></figure>`;
      setContentHtml((prev) => (prev ? prev + "\n" + imgTag + "\n" : imgTag + "\n"));
    } catch (e2) {
      setError(e2 instanceof Error ? e2.message : "Resim yuklenemedi");
    } finally {
      setContentImageUploading(false);
    }
  };

  const warnings = useMemo(() => {
    const list: string[] = [];
    if (!sourceUrl.trim()) list.push("Kaynak linki girilmedi.");
    if ((priorityLevel === "important" || priorityLevel === "critical") && !summary.trim()) {
      list.push("Onem seviyesi yuksek ama kisa ozet bos.");
    }
    if (isFeatured && !coverUrl.trim()) {
      list.push("One cikan secildi ama kapak gorseli yok.");
    }
    if (contentHtml.trim().length < 220) {
      list.push("Icerik kisa gorunuyor. Daha aciklayici metin onerilir.");
    }
    if (!contentHtml.includes("<h2")) {
      list.push("Icerikte en az bir alt baslik (H2) bulunmuyor.");
    }
    return list;
  }, [sourceUrl, priorityLevel, summary, isFeatured, coverUrl, contentHtml]);

  const handleSubmit = async (targetStatus: PublishStatus) => {
    if (!title.trim()) {
      setError("Ana baslik zorunlu.");
      return;
    }
    if (!newsType) {
      setError("Duyuru turu zorunlu.");
      return;
    }
    if (summary.trim().length < META_MIN || summary.trim().length > META_MAX) {
      setError(`Meta aciklama ${META_MIN}-${META_MAX} karakter araliginda olmali.`);
      return;
    }
    if (targetStatus === "scheduled" && !scheduledAt.trim()) {
      setError("Zamanli yayin icin yayin tarihi gerekli.");
      return;
    }

    setSaving(true);
    setError(null);
    setSuccessId(null);
    try {
      const body = {
        content_type: "international_work_visa_news" as const,
        title: title.trim(),
        slug: slugForCheck || title,
        summary: summary.trim().slice(0, META_MAX),
        seo_title: seoTitle.trim().slice(0, 120) || null,
        cover_image_url: coverUrl || null,
        content_html_raw: contentHtml,
        tags: tagsArray,
        country_slug: country || null,
        city: city || null,
        status: targetStatus,
        scheduled_at: targetStatus === "scheduled" ? scheduledAt || null : null,
        editorial_status: editorialStatus,
        news_type: newsType || null,
        source_name: sourceName || null,
        source_url: sourceUrl || null,
        effective_date: effectiveDate || null,
        priority_level: priorityLevel,
        is_featured: isFeatured,
        show_on_news_hub: showOnNewsHub,
        news_badge: newsBadge || null,
        content_language: contentLanguage || "tr",
        target_audience: targetAudience || null,
        news_category: newsCategory || null,
        og_title: ogTitle || null,
        og_description: ogDescription || null,
        og_image: ogImage || null,
        canonical_url: canonicalUrl || null,
        structured_summary: structuredSummary || null,
        user_impact: userImpact || null,
        application_impact: applicationImpact || null,
      };

      const url = postId ? `/api/admin/posts/${postId}` : "/api/admin/posts";
      const method = postId ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Kaydetme basarisiz");
        return;
      }
      setSuccessId((data.id as string) || postId || null);
    } catch (e2) {
      setError(e2 instanceof Error ? e2.message : "Kaydetme basarisiz");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!postId) return;
    if (!window.confirm("Bu icerik kalici olarak silinecek. Emin misiniz?")) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/posts/${postId}`, { method: "DELETE", credentials: "include" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError((data.error as string) || "Silme basarisiz");
        return;
      }
      router.push("/admin/posts");
    } catch (e2) {
      setError(e2 instanceof Error ? e2.message : "Silme basarisiz");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {!embedded && (
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-slate-900">Yurtdisi Calisma ve Vize Duyurusu</h1>
          <Link href="/admin/posts/new" className="text-sm text-sky-600 hover:underline">
            ← Yeni icerik secimine don
          </Link>
        </div>
      )}

      {error && <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">{error}</div>}
      {successId && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
          Kaydedildi.{" "}
          <Link href={`/yurtdisi-calisma-ve-vize-duyurulari/${slugForCheck || successId}`} className="underline">
            Duyuruyu goruntule
          </Link>
        </div>
      )}

      {warnings.length > 0 && (
        <div className="rounded-xl border border-sky-200 bg-sky-50 p-3 text-xs text-sky-900">
          <p className="mb-1 font-semibold">Yayin oncesi kontrol onerileri</p>
          <ul className="list-disc space-y-0.5 pl-4">
            {warnings.map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-4 xl:col-span-2">
          <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="mb-3 text-sm font-semibold text-slate-900">Temel Bilgiler</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-600">Ana baslik</label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600">SEO basligi</label>
                <input
                  value={seoTitle}
                  onChange={(e) => setSeoTitle(e.target.value.slice(0, 120))}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
                <p className="mt-1 text-xs text-slate-500">{seoTitle.length} / {SEO_TITLE_MAX} onerilen</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600">Slug</label>
                <input
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  onBlur={handleSlugBlur}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-mono"
                />
                {slugStatus && <p className="mt-1 text-xs text-slate-500">{slugStatus}</p>}
                <p className="mt-1 text-xs text-slate-500">
                  Slug sadece latin URL formatiyla kaydedilir (Turkce karakterler otomatik donusturulur).
                </p>
                <p className="mt-1 text-xs text-slate-500">Onizleme: /yurtdisi-calisma-ve-vize-duyurulari/{slugForCheck || "slug"}</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600">Kisa ozet / meta aciklama</label>
                <textarea
                  value={summary}
                  onChange={(e) => setSummary(e.target.value.slice(0, META_MAX))}
                  rows={3}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
                <p className="mt-1 text-xs text-slate-500">{summary.length} / {META_MAX}</p>
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="mb-3 text-sm font-semibold text-slate-900">Duyuru Bilgileri</h2>
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label className="block text-xs font-medium text-slate-600">Duyuru turu</label>
                <select
                  value={newsType}
                  onChange={(e) => setNewsType(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                >
                  <option value="">Seciniz</option>
                  {NEWS_TYPES.map((x) => (
                    <option key={x.value} value={x.value}>{x.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600">Ulke</label>
                <input
                  list="duyuru-country-list"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  onBlur={(e) => setCountry(slugifyTR(e.target.value))}
                  placeholder="Ulke slug'i girin (ornek: almanya, belcika, ab-geneli)"
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                >
                </input>
                <datalist id="duyuru-country-list">
                  {countries.map((c) => (
                    <option key={c.id} value={c.slug} label={c.name} />
                  ))}
                </datalist>
                <p className="mt-1 text-xs text-slate-500">
                  Bu alan manuel girilebilir. Sistem kaydederken URL uyumlu slug formatina cevirir.
                </p>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600">Sehir (opsiyonel)</label>
                <input
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600">Yayin tarihi</label>
                <input
                  type="date"
                  value={effectiveDate}
                  onChange={(e) => setEffectiveDate(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600">Onem seviyesi</label>
                <select
                  value={priorityLevel}
                  onChange={(e) => setPriorityLevel(e.target.value as PriorityLevel)}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                >
                  <option value="low">Dusuk</option>
                  <option value="normal">Normal</option>
                  <option value="important">Onemli</option>
                  <option value="critical">Kritik</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600">Icerik dili</label>
                <input
                  value={contentLanguage}
                  onChange={(e) => setContentLanguage(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600">Hedef kitle</label>
                <select
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                >
                  <option value="">Seciniz</option>
                  {TARGET_AUDIENCE.map((x) => (
                    <option key={x.value} value={x.value}>{x.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600">Icerik kategorisi</label>
                <select
                  value={newsCategory}
                  onChange={(e) => setNewsCategory(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                >
                  <option value="">Seciniz</option>
                  {NEWS_CATEGORIES.map((x) => (
                    <option key={x.value} value={x.value}>{x.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="mb-3 text-sm font-semibold text-slate-900">Kaynak</h2>
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label className="block text-xs font-medium text-slate-600">Kaynak kurum</label>
                <input
                  value={sourceName}
                  onChange={(e) => setSourceName(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600">Kaynak link</label>
                <input
                  value={sourceUrl}
                  onChange={(e) => setSourceUrl(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  placeholder="https://"
                />
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="mb-3 text-sm font-semibold text-slate-900">Icerik Editoru</h2>
            <div className="mb-2 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleApplyTemplate}
                className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100"
              >
                Sablon Ekle
              </button>
              <button
                type="button"
                onClick={applyTagSuggestion}
                className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100"
              >
                Etiket Oner
              </button>
              <input
                ref={contentImageInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleUploadContentImage}
              />
              <button
                type="button"
                onClick={() => contentImageInputRef.current?.click()}
                disabled={contentImageUploading}
                className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-50"
              >
                {contentImageUploading ? "Yukleniyor..." : "Editor Resmi Ekle"}
              </button>
            </div>
            <RichHtmlEditor value={contentHtml} onChange={setContentHtml} placeholder="Duyuru icerigi..." />
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="mb-3 text-sm font-semibold text-slate-900">Editor Yardim Alanlari</h2>
            <div className="space-y-3">
              <textarea
                value={structuredSummary}
                onChange={(e) => setStructuredSummary(e.target.value)}
                rows={2}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                placeholder="Resmi kaynak ozeti"
              />
              <textarea
                value={userImpact}
                onChange={(e) => setUserImpact(e.target.value)}
                rows={2}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                placeholder="Kullaniciyi nasil etkiler?"
              />
              <textarea
                value={applicationImpact}
                onChange={(e) => setApplicationImpact(e.target.value)}
                rows={2}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                placeholder="Basvuru surecine etkisi"
              />
            </div>
          </section>
        </div>

        <div className="space-y-4">
          <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="mb-3 text-sm font-semibold text-slate-900">Kapak ve Etiketler</h2>
            <input type="file" accept="image/*" onChange={handleUploadCover} />
            <p className="mt-2 text-xs text-slate-500">
              Kapak gorseli 1200x630 olmali (sosyal medya paylasim karti). Baslik/icerikte Turkce karakter kullanabilirsiniz.
            </p>
            {coverUrl && <p className="mt-2 break-all text-xs text-slate-600">URL: {coverUrl}</p>}
            <div className="mt-3">
              <label className="block text-xs font-medium text-slate-600">Etiketler (virgulle)</label>
              <input
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="mb-3 text-sm font-semibold text-slate-900">SEO ve Sosyal</h2>
            <div className="space-y-3">
              <input
                value={ogTitle}
                onChange={(e) => setOgTitle(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                placeholder="OG basligi"
              />
              <textarea
                value={ogDescription}
                onChange={(e) => setOgDescription(e.target.value)}
                rows={2}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                placeholder="OG aciklamasi"
              />
              <input
                value={ogImage}
                onChange={(e) => setOgImage(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                placeholder="OG gorsel URL"
              />
              <input
                value={canonicalUrl}
                onChange={(e) => setCanonicalUrl(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                placeholder="Canonical URL (opsiyonel)"
              />
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="mb-3 text-sm font-semibold text-slate-900">Yayin Ayarlari</h2>
            <div className="space-y-3 text-sm">
              <div className="space-y-1">
                <label className="flex items-center gap-2"><input type="radio" checked={status === "draft"} onChange={() => setStatus("draft")} /> Taslak</label>
                <label className="flex items-center gap-2"><input type="radio" checked={status === "published"} onChange={() => setStatus("published")} /> Yayinda</label>
                <label className="flex items-center gap-2"><input type="radio" checked={status === "scheduled"} onChange={() => setStatus("scheduled")} /> Zamanla</label>
              </div>
              {status === "scheduled" && (
                <input
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  placeholder="2026-03-01T10:00:00Z"
                />
              )}
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">Icerik durumu</label>
                <select
                  value={editorialStatus}
                  onChange={(e) => setEditorialStatus(e.target.value as EditorialStatus)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                >
                  <option value="draft">Taslak</option>
                  <option value="in_review">Incelemede</option>
                  <option value="published">Yayinda</option>
                </select>
              </div>
              <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={isFeatured} onChange={(e) => setIsFeatured(e.target.checked)} /> One cikan icerik</label>
              <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={showOnNewsHub} onChange={(e) => setShowOnNewsHub(e.target.checked)} /> Ana vitrinde goster</label>
              <div>
                <label className="block text-xs font-medium text-slate-600">Rozet</label>
                <input
                  value={newsBadge}
                  onChange={(e) => setNewsBadge(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  placeholder="son-dakika"
                />
              </div>
              <button
                type="button"
                disabled={saving}
                onClick={() => handleSubmit(status)}
                className="w-full rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
              >
                {saving ? "Kaydediliyor..." : "Kaydet"}
              </button>
              {postId && (
                <button
                  type="button"
                  disabled={saving}
                  onClick={handleDelete}
                  className="w-full rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50"
                >
                  Yaziyi Sil
                </button>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
