"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { RichHtmlEditor } from "@/components/admin/RichHtmlEditor";

type Status = "draft" | "published" | "scheduled";

const SUMMARY_MIN = 140;
const SUMMARY_MAX = 160;

function parseUploadResponse(res: Response): Promise<{ url?: string; error?: string }> {
  return res.text().then((text) => {
    try {
      const data = JSON.parse(text) as { url?: string; error?: string };
      return data;
    } catch {
      return { error: "Yanıt işlenemedi." };
    }
  });
}

export function BlogPostForm() {
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [slugStatus, setSlugStatus] = useState<string | null>(null);
  const [summary, setSummary] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [contentHtml, setContentHtml] = useState("");
  const [tags, setTags] = useState("");
  const [status, setStatus] = useState<Status>("draft");
  const [scheduledAt, setScheduledAt] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successId, setSuccessId] = useState<string | null>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const contentImageInputRef = useRef<HTMLInputElement>(null);
  const [contentImageUploading, setContentImageUploading] = useState(false);
  const router = useRouter();

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
        if (!res.ok) setSlugStatus(data.reason || "Kontrol edilemedi");
        else setSlugStatus(data.ok ? "Uygun" : data.reason || "Kullanılamaz");
      } catch {
        setSlugStatus("Kontrol edilemedi");
      }
    }, 400);
    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [slug]);

  const handleUploadCover = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch("/api/admin/uploads/cover", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      const data = await parseUploadResponse(res);
      if (!res.ok) setError(data.error || "Kapak yüklenemedi");
      else if (data.url) setCoverUrl(data.url);
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
      const res = await fetch("/api/admin/uploads/content-image", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      const data = await parseUploadResponse(res);
      if (!res.ok || !data.url) {
        setError(data.error || "Resim yüklenemedi");
        return;
      }
      let alt: string | null = null;
      do {
        alt = window.prompt("Resim için alt metni (zorunlu):");
        if (alt === null) {
          setContentImageUploading(false);
          return;
        }
      } while (!alt?.trim());
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
      setError("Yazı özeti (SEO meta açıklama) zorunludur.");
      return;
    }
    if (summaryTrim.length < SUMMARY_MIN || summaryTrim.length > SUMMARY_MAX) {
      setError(`Özet ${SUMMARY_MIN}–${SUMMARY_MAX} karakter arasında olmalıdır (meta açıklama).`);
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
        content_type: "blog" as const,
        title: title.trim(),
        slug: (slug || title).trim().toLowerCase(),
        summary: summaryTrim.slice(0, SUMMARY_MAX),
        cover_image_url: coverUrl || null,
        content_html_raw: contentHtml,
        tags: tagsArray,
        status: targetStatus,
        scheduled_at: targetStatus === "scheduled" ? scheduledAt.trim() || null : null,
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
      setSuccessId((data.id as string) ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Kaydetme başarısız");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-900">Yeni blog yazısı</h1>
        <Link href="/admin/posts/new" className="text-sm text-sky-600 hover:underline">
          ← Yeni içerik seçimine dön
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
            Görüntüle
          </Link>
          {" · "}
          <Link href="/admin/posts" className="underline">Listeye dön</Link>
        </div>
      )}

      <div className="space-y-4">
        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold text-slate-900">Başlık &amp; Slug</h2>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-slate-600">Ana Başlık</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                placeholder="Yazı başlığı"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600">Slug (URL)</label>
              <input
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                onBlur={() => setSlugTouched(true)}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-mono"
                placeholder="url-slug"
              />
              {slugStatus && (
                <p className={`mt-0.5 text-xs ${slugStatus === "Uygun" ? "text-emerald-600" : "text-amber-600"}`}>
                  {slugStatus}
                </p>
              )}
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold text-slate-900">Yazı Özeti (SEO Meta Açıklama)</h2>
          <p className="mb-2 text-xs text-slate-500">
            Bu alan Google arama sonuçlarında meta açıklama olarak kullanılacaktır (140–160 karakter önerilir).
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
          <h2 className="mb-3 text-sm font-semibold text-slate-900">Kapak Fotoğrafı</h2>
          <input
            ref={coverInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleUploadCover}
          />
          <button
            type="button"
            onClick={() => coverInputRef.current?.click()}
            className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100"
          >
            Yükle
          </button>
          {coverUrl && (
            <p className="mt-2 text-xs text-slate-600 truncate max-w-full" title={coverUrl}>
              URL: {coverUrl}
            </p>
          )}
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold text-slate-900">Zengin İçerik</h2>
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
              {contentImageUploading ? "Yükleniyor…" : "Resim Ekle"}
            </button>
          </div>
          <RichHtmlEditor
            value={contentHtml}
            onChange={setContentHtml}
            placeholder="İçerik (H2/H3, kalın, liste, link, resim…)"
          />
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold text-slate-900">Etiketler</h2>
          <input
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            placeholder="virgülle ayırın: rehber, vize, ab"
          />
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold text-slate-900">Yayınlama</h2>
          <div className="space-y-3">
            <div className="flex flex-col gap-2 text-sm text-slate-700">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="blogStatus"
                  value="draft"
                  checked={status === "draft"}
                  onChange={() => setStatus("draft")}
                />
                Taslak kaydet
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="blogStatus"
                  value="published"
                  checked={status === "published"}
                  onChange={() => setStatus("published")}
                />
                Hemen yayınla
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="blogStatus"
                  value="scheduled"
                  checked={status === "scheduled"}
                  onChange={() => setStatus("scheduled")}
                />
                Zamanla
              </label>
            </div>
            {status === "scheduled" && (
              <div>
                <label className="block text-xs font-medium text-slate-600">Yayın tarihi (ISO)</label>
                <input
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  placeholder="2026-03-01T10:00:00Z"
                />
              </div>
            )}
            <button
              type="button"
              disabled={saving}
              onClick={() => handleSubmit(status)}
              className="mt-2 w-full rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
            >
              {saving ? "Kaydediliyor…" : "Kaydet"}
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
