"use client";

import { useState } from "react";
import Link from "next/link";

type Status = "draft" | "published" | "scheduled";

export function NewPostForm() {
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [slugStatus, setSlugStatus] = useState<string | null>(null);
  const [coverUrl, setCoverUrl] = useState("");
  const [contentHtml, setContentHtml] = useState("");
  const [country, setCountry] = useState("");
  const [city, setCity] = useState("");
  const [sector, setSector] = useState("");
  const [tags, setTags] = useState("");
  const [isPaid, setIsPaid] = useState(true);
  const [showContactWhenFree, setShowContactWhenFree] = useState(false);
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [applyUrl, setApplyUrl] = useState("");
  const [status, setStatus] = useState<Status>("draft");
  const [scheduledAt, setScheduledAt] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successId, setSuccessId] = useState<string | null>(null);

  const tagsArray = tags
    .split(",")
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean);

  const handleSlugBlur = async () => {
    const s = (slug || title)
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9\-]+/gi, "-")
      .replace(/^-+|-+$/g, "");
    if (!s) return;
    setSlug(s);
    try {
      const res = await fetch(`/api/admin/posts/slug-check?slug=${encodeURIComponent(s)}`, {
        credentials: "include",
      });
      const data = await res.json();
      if (!data.ok) {
        setSlugStatus(data.reason || "Slug kullanılamaz");
      } else {
        setSlugStatus("Uygun");
      }
    } catch {
      setSlugStatus("Kontrol edilemedi");
    }
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

  const handleSubmit = async (targetStatus: Status) => {
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
      const res = await fetch("/api/admin/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Kaydetme başarısız");
        return;
      }
      setSuccessId(data.id || null);
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
                <label className="block text-xs font-medium text-slate-600">Ülke (slug)</label>
                <input
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  placeholder="almanya, katar..."
                />
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
                <label className="block text-xs font-medium text-slate-600">Sektör (slug)</label>
                <input
                  value={sector}
                  onChange={(e) => setSector(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  placeholder="insaat, otelcilik..."
                />
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
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={isPaid}
                  onChange={(e) => setIsPaid(e.target.checked)}
                />
                Ücretli (Premium)
              </label>
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

