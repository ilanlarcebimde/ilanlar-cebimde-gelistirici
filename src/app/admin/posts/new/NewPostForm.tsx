"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

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
  };
  postId?: string;
};

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
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successId, setSuccessId] = useState<string | null>(null);

  const [slugTouched, setSlugTouched] = useState(false);
  const contentImageInputRef = useRef<HTMLInputElement>(null);
  const [contentImageUploading, setContentImageUploading] = useState(false);

  const [countries, setCountries] = useState<{ id: string; name: string; slug: string }[]>([]);
  const [sectors, setSectors] = useState<{ id: string; name: string; slug: string }[]>([]);

  const tagsArray = tags
    .split(",")
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean);

  useEffect(() => {
    if (!slugTouched) {
      const auto = title
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9\-]+/gi, "-")
        .replace(/^-+|-+$/g, "");
      if (auto) setSlug(auto);
    }
  }, [title, slugTouched]);

  const handleSlugBlur = () => {
    setSlugTouched(true);
  };

  useEffect(() => {
    const s = slug.trim().toLowerCase();
    if (!s) {
      setSlugStatus(null);
      return;
    }
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/admin/posts/slug-check?slug=${encodeURIComponent(s)}`, {
          credentials: "include",
          signal: controller.signal,
        });
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
  }, [slug]);

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

  const handleUploadCover = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    setError(null);
    try {
      const res = await fetch("/api/admin/uploads/cover", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Kapak yüklenemedi");
        return;
      }
      setCoverUrl(data.url);
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
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Resim yüklenemedi");
        return;
      }
      const alt = window.prompt("Resim için alt metni (SEO):") ?? "";
      const caption = window.prompt("İsteğe bağlı figcaption:") ?? "";
      const imgTag = `<img src="${data.url}" alt="${alt.replace(/"/g, "&quot;")}" loading="lazy" />`;
      const figureHtml = caption
        ? `<figure>${imgTag}<figcaption>${caption.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</figcaption></figure>`
        : `<figure>${imgTag}</figure>`;
      setContentHtml((prev) => (prev ? prev + "\n" + figureHtml : figureHtml));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Resim yüklenemedi");
    } finally {
      setContentImageUploading(false);
    }
  };

  const handleSubmit = async (targetStatus: Status) => {
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
        slug: slug || title,
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
          <Link href={`/yurtdisi-is-ilanlari/${slug || successId}`} className="underline">
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
            <h2 className="mb-3 text-sm font-semibold text-slate-900">İçerik (HTML)</h2>
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
            <textarea
              value={contentHtml}
              onChange={(e) => setContentHtml(e.target.value)}
              rows={10}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-mono"
              placeholder="<p>İçerik...</p>"
            />
            <p className="mt-1 text-xs text-slate-500">
              Editör çıktısını buraya HTML olarak yapıştırabilirsin. Yayınlarken sanitize edilecek.
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
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

