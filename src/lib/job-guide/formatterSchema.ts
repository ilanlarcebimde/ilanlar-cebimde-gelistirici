/**
 * Gemini formatter çıktı şeması: veri sabit, sadece sunum.
 * Doğrulama: çıktı yalnızca girdiden türemiş olmalı; yeni bilgi/link uydurulmamalı.
 */

export type FormatterSection = {
  title: string;
  bullets: string[];
  note?: string;
};

export type FormatterOutput = {
  ui: {
    header: { title: string; meta: string[] };
    sections: FormatterSection[];
    cta?: { label: string; url: string };
  };
  strict_check?: {
    used_fields: string[];
    no_new_claims: boolean;
  };
};

export type JobInput = {
  title: string | null;
  location_text: string | null;
  source_name: string | null;
  source_url: string | null;
  snippet: string | null;
  published_at: string | null;
};

const URL_REGEX = /https?:\/\/[^\s\u00A0]+/gi;

/** İzin verilen URL'ler: sadece job.source_url ve sabit alan adımız. */
function getAllowedUrls(job: JobInput): string[] {
  const list: string[] = [];
  const su = job.source_url?.trim();
  if (su) list.push(su);
  try {
    if (su) list.push(new URL(su).origin);
  } catch {
    // ignore
  }
  list.push("https://www.ilanlarcebimde.com");
  return list;
}

/** Metinde geçen tüm URL'leri bul. */
function extractUrls(text: string): string[] {
  const matches = text.match(URL_REGEX) ?? [];
  return [...new Set(matches)];
}

/** Normalize: karşılaştırma için boşluk ve büyük/küçük harf. */
function normalizeForCompare(s: string | null | undefined): string {
  if (s == null) return "";
  return String(s)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

/** Gemini çıktısını girdiyle karşılaştır. Uymazsa hata mesajı döner. */
export function validateFormatterOutput(
  output: unknown,
  job: JobInput
): { ok: true; data: FormatterOutput } | { ok: false; reason: string } {
  if (!output || typeof output !== "object") {
    return { ok: false, reason: "invalid_output" };
  }

  const o = output as Record<string, unknown>;
  const ui = o.ui as Record<string, unknown> | undefined;
  if (!ui || typeof ui !== "object") {
    return { ok: false, reason: "missing_ui" };
  }

  const header = ui.header as Record<string, unknown> | undefined;
  if (!header || typeof header !== "object") {
    return { ok: false, reason: "missing_header" };
  }

  const jobTitle = normalizeForCompare(job.title);
  const outTitle = normalizeForCompare(header.title as string);
  if (jobTitle && outTitle && jobTitle !== outTitle) {
    return { ok: false, reason: "title_mismatch" };
  }

  const allowedUrls = getAllowedUrls(job);
  const cta = ui.cta as { label?: string; url?: string } | undefined;
  if (cta?.url && typeof cta.url === "string") {
    const ctaUrl = cta.url.trim();
    const allowed = allowedUrls.some(
      (a) => ctaUrl === a || ctaUrl.startsWith(a + "/") || ctaUrl.startsWith(a + "?")
    );
    if (!allowed) {
      return { ok: false, reason: "cta_url_not_allowed" };
    }
  }

  const sections = (ui.sections as FormatterSection[] | undefined) ?? [];
  const allText = sections
    .map((s) => [s.title, ...(s.bullets ?? []), s.note].filter(Boolean).join(" "))
    .join(" ");
  const urlsInOutput = extractUrls(allText);
  for (const url of urlsInOutput) {
    const allowed = allowedUrls.some(
      (a) => url === a || url.startsWith(a + "/") || url.startsWith(a + "?")
    );
    if (!allowed) {
      return { ok: false, reason: "new_url_in_content" };
    }
  }

  const meta = Array.isArray(header.meta) ? header.meta : [];
  const data: FormatterOutput = {
    ui: {
      header: {
        title: (header.title as string) ?? job.title ?? "",
        meta: meta.map(String),
      },
      sections: sections.map((s) => ({
        title: String(s?.title ?? ""),
        bullets: Array.isArray(s?.bullets) ? s.bullets.map(String) : [],
        note: s?.note != null ? String(s.note) : undefined,
      })),
      cta:
        cta?.label != null && cta?.url != null
          ? { label: String(cta.label), url: String(cta.url) }
          : undefined,
    },
    strict_check: o.strict_check as FormatterOutput["strict_check"],
  };

  return { ok: true, data };
}

/** Girdiden fallback template üret (Gemini yok veya doğrulama başarısız). */
export function buildFallbackFormat(job: JobInput, answers?: Record<string, unknown>): FormatterOutput {
  const meta: string[] = [];
  if (job.location_text?.trim()) meta.push(job.location_text.trim());
  if (job.source_name?.trim()) meta.push(job.source_name.trim());
  if (job.published_at) {
    try {
      const d = new Date(job.published_at);
      if (!Number.isNaN(d.getTime())) meta.push(d.toLocaleDateString("tr-TR"));
    } catch {
      meta.push(String(job.published_at));
    }
  }

  const sections: FormatterSection[] = [];
  if (job.snippet?.trim()) {
    const lines = job.snippet
      .trim()
      .split(/\n+/)
      .map((l) => l.trim())
      .filter(Boolean);
    sections.push({
      title: "Özet",
      bullets: lines.length > 0 ? lines : [job.snippet.trim().slice(0, 500)],
      note: "İlan metninden alınmıştır. Veri değiştirilmemiştir.",
    });
  }

  return {
    ui: {
      header: {
        title: job.title?.trim() ?? "İlan",
        meta,
      },
      sections,
      cta:
        job.source_url?.trim()
          ? { label: "İlanı aç", url: job.source_url.trim() }
          : undefined,
    },
    strict_check: {
      used_fields: ["title", "location_text", "source_name", "source_url", "snippet", "published_at"],
      no_new_claims: true,
    },
  };
}
