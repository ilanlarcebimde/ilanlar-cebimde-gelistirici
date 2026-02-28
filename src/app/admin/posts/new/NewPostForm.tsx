"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { RichHtmlEditor } from "@/components/admin/RichHtmlEditor";
import { supabase } from "@/lib/supabase";
import { slugifyTR } from "@/lib/slugify";

const COVER_BUCKET = "merkezi-covers";

type Status = "draft" | "published" | "scheduled";

type NewPostFormProps = {
  initial?: {
    title?: string | null;
    slug?: string | null;
    cover_image_url?: string | null;
    content_html_raw?: string | null;
    country_slug?: string | null;
    city?: string | null;
    sector_slug?: string | null;
    is_paid?: boolean | null;
    show_contact_when_free?: boolean | null;
    status?: string | null;
    scheduled_at?: string | null;
    tags?: string[];
    contact_email?: string;
    contact_phone?: string;
    apply_url?: string;
    application_deadline_date?: string | null;
    application_deadline_text?: string | null;
    summary?: string | null;
  };
  postId?: string;
};

const SUMMARY_MIN = 140;
const SUMMARY_MAX = 160;

export function NewPostForm({ initial, postId }: NewPostFormProps) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [slugStatus, setSlugStatus] = useState<string | null>(null);
  const [coverUrl, setCoverUrl] = useState(initial?.cover_image_url ?? "");
  const [contentHtml, setContentHtml] = useState(initial?.content_html_raw ?? "");
  const [country, setCountry] = useState(initial?.country_slug ?? "");
  const [city, setCity] = useState(initial?.city ?? "");
  const [sector, setSector] = useState(initial?.sector_slug ?? "");
  const [tags, setTags] = useState((initial?.tags ?? []).join(", "));
  const [isPaid, setIsPaid] = useState(initial?.is_paid ?? true);
  const [showContactWhenFree, setShowContactWhenFree] = useState(initial?.show_contact_when_free ?? false);
  const [contactEmail, setContactEmail] = useState(initial?.contact_email ?? "");
  const [contactPhone, setContactPhone] = useState(initial?.contact_phone ?? "");
  const [applyUrl, setApplyUrl] = useState(initial?.apply_url ?? "");
  const [status, setStatus] = useState<Status>((initial?.status as Status) || "draft");
  const [scheduledAt, setScheduledAt] = useState(initial?.scheduled_at ?? "");
  const [applicationDeadlineDate, setApplicationDeadlineDate] = useState(
    initial?.application_deadline_date ?? ""
  );
  const [applicationDeadlineText, setApplicationDeadlineText] = useState(
    (initial?.application_deadline_text ?? "").slice(0, 120)
  );
  const [summary, setSummary] = useState((initial?.summary ?? "").slice(0, SUMMARY_MAX));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successId, setSuccessId] = useState<string | null>(null);

  const [slugTouched, setSlugTouched] = useState(false);
  const contentImageInputRef = useRef<HTMLInputElement>(null);
  const [contentImageUploading, setContentImageUploading] = useState(false);

  const [countries, setCountries] = useState<{ id: string; name: string; slug: string }[]>([]);
  const [sectors, setSectors] = useState<{ id: string; name: string; slug: string }[]>([]);
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();

  const tagsArray = tags
    .split(",")
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean);

  useEffect(() => {
    if (!slugTouched && title.trim()) {
      setSlug(slugifyTR(title));
    }
  }, [title, slugTouched]);

  const handleSlugBlur = () => {
    setSlugTouched(true);
    setSlug((prev) => slugifyTR(prev || title));
  };

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
          setSlugStatus(data.reason || "Slug kontrolü başarısız");
          return;
        }
        setSlugStatus(data.ok ? "Uygun" : data.reason || "Kullanılamaz");
      } catch {
        setSlugStatus("Kontrol edilemedi");
      }
    }, 400);
    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [slugForCheck, postId]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/admin/taxonomy", { credentials: "include" });
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) {
          setCountries(data.countries || []);
          setSectors(data.sectors || []);
        }
      } catch {
        // ignore
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleAddTaxonomy = async (type: "country" | "sector") => {
    const name = window.prompt(type === "country" ? "Yeni ülke adı" : "Yeni sektör adı");
    if (!name) return;
    try {
      const res = await fetch("/api/admin/taxonomy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ type, name }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Kayıt eklenemedi");
        return;
      }
      if (type === "country") {
        setCountries((prev) => [...prev, data]);
        setCountry(data.slug);
      } else {
        setSectors((prev) => [...prev, data]);
        setSector(data.slug);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Kayıt eklenemedi");
    }
  };

  const handleSuggestTitle = () => {
    const pos = title.trim();
    if (!pos) return;
    const locParts = [country, city].map((v) => v.trim()).filter(Boolean);
    const loc = locParts.join(" / ");
    const year = new Date().getFullYear();
    const sectorPart = sector.trim();
    const suggested = `${pos}${loc ? ` – ${loc}` : ""}${sectorPart ? ` | ${sectorPart} İş İlanı ${year}` : ""}`;
    setTitle(suggested);
  };

  const parseUploadResponse = async (
    res: Response
  ): Promise<{ url?: string; error?: string }> => {
    const ct = res.headers.get("content-type") ?? "";
    const text = await res.text();
    if (!ct.includes("application/json")) {
      if (res.status === 413 || text.toLowerCase().includes("request entity") || text.toLowerCase().includes("too large")) {
        return { error: "Dosya çok büyük. Daha küçük bir dosya deneyin veya görseli sıkıştırın." };
      }
      return { error: "Sunucu beklenmeyen yanıt verdi. Lütfen tekrar deneyin." };
    }
    try {
      const data = JSON.parse(text) as { url?: string; error?: string };
      return data;
    } catch {
      return { error: "Yanıt işlenemedi. Lütfen tekrar deneyin." };
    }
  };

  const handleUploadCover = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Sadece resim dosyaları kabul edilir.");
      return;
    }
    setError(null);
    try {
      const signedRes = await fetch("/api/admin/uploads/cover/signed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: file.name }),
        credentials: "include",
      });
      const signedData = await signedRes.json();
      if (!signedRes.ok || !signedData.path || !signedData.token || !signedData.publicUrl) {
        setError(signedData.error || "İmzalı URL alınamadı.");
        return;
      }
      const { error: uploadErr } = await supabase.storage
        .from(COVER_BUCKET)
        .uploadToSignedUrl(signedData.path, signedData.token, file, { contentType: file.type });
      if (uploadErr) {
        setError(uploadErr.message || "Yükleme başarısız.");
        return;
      }
      setCoverUrl(signedData.publicUrl);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Kapak yüklenemedi");
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
      if (!res.ok) {
        setError(data.error || "Resim yüklenemedi");
        return;
      }
      if (!data.url) {
        setError(data.error || "Resim yüklenemedi");
        return;
      }
      let alt: string | null = null;
      do {
        alt = window.prompt("Resim için alt metni (zorunlu, erişilebilirlik + SEO):");
        if (alt === null) {
          setContentImageUploading(false);
          return;
        }
      } while (!alt.trim());
      const caption = window.prompt("İsteğe bağlı figcaption (boş bırakabilirsiniz):") ?? "";
      const safeAlt = alt.trim().replace(/"/g, "&quot;");
      const imgTag = `<img src="${data.url}" alt="${safeAlt}" loading="lazy" />`;
      const figureHtml = caption.trim()
        ? `<figure>${imgTag}<figcaption>${caption.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</figcaption></figure>`
        : `<figure>${imgTag}</figure>`;
      setContentHtml((prev) => (prev ? prev + "\n" + figureHtml + "\n" : figureHtml + "\n"));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Resim yüklenemedi");
    } finally {
      setContentImageUploading(false);
    }
  };

  const handleSubmit = async (targetStatus: Status) => {
    const summaryTrim = summary.trim();
    if (!summaryTrim) {
      setError("İlan özeti (SEO meta açıklama) zorunludur.");
      return;
    }
    if (summaryTrim.length < SUMMARY_MIN || summaryTrim.length > SUMMARY_MAX) {
      setError(`Özet ${SUMMARY_MIN}–${SUMMARY_MAX} karakter arasında olmalıdır.`);
      return;
    }
    if (targetStatus === "scheduled" && !scheduledAt.trim()) {
      setError("Zamanlama için tarih gerekli");
      return;
    }
    setSaving(true);
    setError(null);
    setSuccessId(null);
    try {
      const body = {
        title,
        slug: slugForCheck || slug || title,
        cover_image_url: coverUrl || null,
        content_html_raw: contentHtml,
        country_slug: country || null,
        city: city || null,
        sector_slug: sector,
        tags: tagsArray,
        is_paid: isPaid,
        show_contact_when_free: !isPaid ? showContactWhenFree : false,
        contact_email: contactEmail || null,
        contact_phone: contactPhone || null,
        apply_url: applyUrl || null,
        status: targetStatus,
        scheduled_at: targetStatus === "scheduled" ? scheduledAt || null : null,
        application_deadline_date: applicationDeadlineDate?.trim() || null,
        application_deadline_text: applicationDeadlineText?.trim().slice(0, 120) || null,
        summary: summaryTrim.slice(0, SUMMARY_MAX),
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
        setError(data.error || "Kaydetme başarısız");
        return;
      }
      setSuccessId((data.id as string) || postId || null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Kaydetme başarısız");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!postId) return;
    if (!window.confirm("Bu yazıyı kalıcı olarak silmek istediğinize emin misiniz? Bu işlem geri alınamaz.")) return;
    setDeleting(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/posts/${postId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError((data.error as string) || "Silme başarısız");
        return;
      }
      router.push("/admin/posts");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Silme başarısız");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-900">Yeni içerik</h1>
        <Link href="/admin/posts" className="text-sm text-sky-600 hover:underline">
          ← İçerik listesi
        </Link>
      </div>

      {error && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          {error}
        </div>
      )}
      {successId && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
          Kaydedildi.{" "}
          <Link href={`/yurtdisi-is-ilanlari/${slugForCheck || slug || successId}`} className="underline">
            İlanı görüntüle
          </Link>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-3">
        <div className="space-y-4 md:col-span-2">
          <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="mb-3 text-sm font-semibold text-slate-900">Temel Bilgiler</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-600">Başlık</label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onBlur={!slug ? handleSlugBlur : undefined}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
                <button
                  type="button"
                  onClick={handleSuggestTitle}
                  className="mt-1 text-xs text-sky-600 hover:underline"
                >
                  Başlığı Önerilen Formatta Doldur
                </button>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600">Slug</label>
                <input
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  onBlur={handleSlugBlur}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
                {slugStatus && (
                  <p className="mt-1 text-xs text-slate-500">{slugStatus}</p>
                )}
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="mb-3 text-sm font-semibold text-slate-900">Kapak Görseli</h2>
            <div className="space-y-3">
              <input type="file" accept="image/*" onChange={handleUploadCover} />
              {coverUrl && (
                <p className="text-xs text-slate-600 break-all">
                  Yüklendi: <span className="font-mono">{coverUrl}</span>
                </p>
              )}
              <p className="text-xs text-slate-500">
                Önerilen ölçü: 1200×630 (sosyal paylaşım kartı için).
              </p>
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="mb-3 text-sm font-semibold text-slate-900">İçerik</h2>
            <input
              ref={contentImageInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleUploadContentImage}
            />
            <div className="mb-2 flex items-center gap-2">
              <button
                type="button"
                onClick={() => contentImageInputRef.current?.click()}
                disabled={contentImageUploading}
                className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-50"
              >
                {contentImageUploading ? "Yükleniyor…" : "Resim Yükle"}
              </button>
              <span className="text-xs text-slate-500">
                Yüklenen resim içeriğin sonuna figure/img olarak eklenir.
              </span>
            </div>
            <RichHtmlEditor
              value={contentHtml}
              onChange={setContentHtml}
              placeholder="İçerik yazın… (H2/H3, kalın, italik, liste, link kullanabilirsiniz)"
            />
            <p className="mt-1 text-xs text-slate-500">
              Yayınlarken içerik güvenli hale getirilir (sanitize). H1 kullanılmaz.
            </p>
          </section>
        </div>

        <div className="space-y-4">
          <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="mb-3 text-sm font-semibold text-slate-900">Konum &amp; Sınıflandırma</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-600">Ülke</label>
                <div className="mt-1 flex gap-2">
                  <select
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  >
                    <option value="">Seçiniz</option>
                    {countries.map((c) => (
                      <option key={c.id} value={c.slug}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => handleAddTaxonomy("country")}
                    className="shrink-0 rounded-lg border border-slate-200 px-2 py-1 text-xs text-slate-700 hover:bg-slate-50"
                  >
                    + Ekle
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600">Şehir</label>
                <input
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600">Sektör</label>
                <div className="mt-1 flex gap-2">
                  <select
                    value={sector}
                    onChange={(e) => setSector(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  >
                    <option value="">Seçiniz</option>
                    {sectors.map((s) => (
                      <option key={s.id} value={s.slug}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => handleAddTaxonomy("sector")}
                    className="shrink-0 rounded-lg border border-slate-200 px-2 py-1 text-xs text-slate-700 hover:bg-slate-50"
                  >
                    + Ekle
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600">Etiketler (virgülle)</label>
                <input
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  placeholder="aşçı, katar, otel..."
                />
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="mb-3 text-sm font-semibold text-slate-900">İlan Özeti (SEO Meta Açıklama)</h2>
            <p className="mb-2 text-xs text-slate-500">
              Bu alan Google arama sonuçlarında meta açıklama olarak kullanılacaktır.
            </p>
            <textarea
              value={summary}
              onChange={(e) => setSummary(e.target.value.slice(0, SUMMARY_MAX))}
              rows={3}
              maxLength={SUMMARY_MAX}
              className={`w-full rounded-lg border px-3 py-2 text-sm ${
                summary.length > SUMMARY_MAX
                  ? "border-red-300 bg-red-50/50"
                  : summary.length > 0 && summary.length < SUMMARY_MIN
                    ? "border-amber-300 bg-amber-50/30"
                    : "border-slate-200"
              }`}
              placeholder="140–160 karakter arası özet"
            />
            <div className="mt-1 flex items-center justify-between">
              <p className={`text-xs ${
                summary.length > SUMMARY_MAX
                  ? "text-red-600 font-medium"
                  : summary.length > 0 && summary.length < SUMMARY_MIN
                    ? "text-amber-600"
                    : "text-slate-500"
              }`}>
                {summary.length > SUMMARY_MAX
                  ? `${SUMMARY_MAX} karakteri aşmayın.`
                  : summary.length > 0 && summary.length < SUMMARY_MIN
                    ? `En az ${SUMMARY_MIN} karakter girin.`
                    : null}
              </p>
              <span className={`text-xs tabular-nums ${
                summary.length > SUMMARY_MAX ? "text-red-600 font-semibold" : "text-slate-500"
              }`}>
                {summary.length} / {SUMMARY_MAX}
              </span>
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="mb-3 text-sm font-semibold text-slate-900">Başvuru ve Son Tarih</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-600">Son Başvuru Tarihi</label>
                <input
                  type="date"
                  value={applicationDeadlineDate}
                  onChange={(e) => setApplicationDeadlineDate(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  placeholder="YYYY-MM-DD"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600">Son Tarih Notu (opsiyonel)</label>
                <input
                  type="text"
                  value={applicationDeadlineText}
                  onChange={(e) => setApplicationDeadlineText(e.target.value.slice(0, 120))}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  placeholder="Örn: Başvurular dolana kadar, Acil alım"
                  maxLength={120}
                />
                <p className="mt-0.5 text-xs text-slate-500">En fazla 120 karakter.</p>
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="mb-3 text-sm font-semibold text-slate-900">Fiyatlama &amp; İletişim</h2>
            <div className="space-y-3">
              <div className="flex flex-col gap-2 text-sm text-slate-700">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="pricing"
                    value="free"
                    checked={!isPaid}
                    onChange={() => setIsPaid(false)}
                  />
                  Ücretsiz içerik
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="pricing"
                    value="paid"
                    checked={isPaid}
                    onChange={() => {
                      setIsPaid(true);
                      setShowContactWhenFree(false);
                    }}
                  />
                  Ücretli (Premium)
                </label>
              </div>
              {!isPaid && (
                <label className="flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={showContactWhenFree}
                    onChange={(e) => setShowContactWhenFree(e.target.checked)}
                  />
                  Ücretsiz içerikte firma iletişimini göster
                </label>
              )}
              {isPaid && (
                <div className="space-y-2">
                  <div>
                    <label className="block text-xs font-medium text-slate-600">İletişim e-posta</label>
                    <input
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600">Telefon</label>
                    <input
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600">Apply URL</label>
                    <input
                      value={applyUrl}
                      onChange={(e) => setApplyUrl(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    />
                  </div>
                </div>
              )}
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="mb-3 text-sm font-semibold text-slate-900">Yayınlama</h2>
            <div className="space-y-3">
              <div className="flex flex-col gap-2 text-sm text-slate-700">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="status"
                    value="draft"
                    checked={status === "draft"}
                    onChange={() => setStatus("draft")}
                  />
                  Taslak kaydet
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="status"
                    value="published"
                    checked={status === "published"}
                    onChange={() => setStatus("published")}
                  />
                  Hemen yayınla
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="status"
                    value="scheduled"
                    checked={status === "scheduled"}
                    onChange={() => setStatus("scheduled")}
                  />
                  Zamanla
                </label>
              </div>
              {status === "scheduled" && (
                <div>
                  <label className="block text-xs font-medium text-slate-600">
                    Yayın tarihi (ISO, örn. 2026-03-01T10:00:00Z)
                  </label>
                  <input
                    value={scheduledAt}
                    onChange={(e) => setScheduledAt(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  />
                </div>
              )}
              <button
                type="button"
                disabled={saving}
                onClick={() => handleSubmit(status)}
                className="mt-2 w-full rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
              >
                {saving ? "Kaydediliyor..." : "Kaydet"}
              </button>
              {postId && (
                <button
                  type="button"
                  disabled={saving || deleting}
                  onClick={handleDelete}
                  className="mt-3 w-full rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
                >
                  {deleting ? "Siliniyor…" : "Yazıyı Sil"}
                </button>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

