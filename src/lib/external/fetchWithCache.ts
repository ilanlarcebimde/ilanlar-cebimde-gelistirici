/**
 * RAG / Grounding: whitelist + Supabase cache + HTML temizleme.
 * Sadece external_whitelist_domains'te kayıtlı domain'lerden fetch; diğerleri BLOCKED.
 */

import crypto from "crypto";
import { getSupabaseAdmin } from "@/lib/supabase/server";

export type FetchKind = "job_html" | "visa" | "salary" | "other";

function normalizeDomain(u: string): string {
  try {
    return new URL(u).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return "";
  }
}

function makeKey(kind: FetchKind, url: string): string {
  const h = crypto.createHash("sha256").update(`${kind}|${url}`).digest("hex");
  return `${kind}:${h}`;
}

export async function isWhitelisted(
  domain: string,
  purpose: "visa" | "salary" | "job"
): Promise<boolean> {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from("external_whitelist_domains")
    .select("domain, is_active, purpose")
    .eq("domain", domain)
    .eq("purpose", purpose)
    .eq("is_active", true)
    .maybeSingle();

  if (error) return false;
  return !!data;
}

/** Basit HTML → text temizleme (script/style kaldır, tag'leri boşluk). */
export function htmlToCleanText(html: string): string {
  const noScript = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ");
  const noTags = noScript.replace(/<\/?[^>]+(>|$)/g, " ");
  const decoded = noTags
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
  return decoded.replace(/\s+/g, " ").trim();
}

export type FetchResult =
  | {
      ok: true;
      fromCache: boolean;
      domain: string;
      url: string;
      content_text: string;
      fetched_at?: string;
      expires_at?: string;
      http_status?: number;
      meta?: Record<string, unknown>;
    }
  | {
      ok: false;
      blocked: true;
      reason: string;
      domain: string;
    };

export async function fetchExternalWithCache(opts: {
  kind: FetchKind;
  url: string;
  ttlSeconds: number;
  purpose: "visa" | "salary" | "job";
  country?: string;
  sourceName?: string;
  timeoutMs?: number;
  maxContentChars?: number;
}): Promise<FetchResult> {
  const admin = getSupabaseAdmin();
  const domain = normalizeDomain(opts.url);
  if (!domain) {
    return { ok: false, blocked: true, reason: "BAD_URL", domain: "" };
  }

  const allowed = await isWhitelisted(domain, opts.purpose);
  if (!allowed) {
    return {
      ok: false,
      blocked: true,
      reason: `DOMAIN_NOT_WHITELISTED:${domain}`,
      domain,
    };
  }

  const cacheKey = makeKey(opts.kind, opts.url);
  const nowIso = new Date().toISOString();

  const { data: cached } = await admin
    .from("external_cache")
    .select("cache_key, content_text, content_md, expires_at, fetched_at, http_status, url, domain, meta")
    .eq("cache_key", cacheKey)
    .maybeSingle();

  if (
    cached?.expires_at &&
    cached.expires_at > nowIso &&
    (cached.content_text || cached.content_md)
  ) {
    const text = (cached.content_text || cached.content_md || "").slice(
      0,
      opts.maxContentChars ?? 12000
    );
    return {
      ok: true,
      fromCache: true,
      domain: cached.domain,
      url: cached.url ?? opts.url,
      content_text: text,
      fetched_at: cached.fetched_at ?? undefined,
      expires_at: cached.expires_at,
      http_status: cached.http_status ?? undefined,
      meta: (cached.meta as Record<string, unknown>) ?? undefined,
    };
  }

  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), opts.timeoutMs ?? 12000);

  let status = 0;
  let rawText = "";
  try {
    const res = await fetch(opts.url, {
      method: "GET",
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "User-Agent": "IlanlarCebimdeBot/1.0 (+https://ilanlarcebimde.com)",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
    });
    status = res.status;
    rawText = await res.text();
  } finally {
    clearTimeout(t);
  }

  const maxChars = opts.maxContentChars ?? 12000;
  const clean = htmlToCleanText(rawText).slice(0, maxChars);
  const expiresAt = new Date(
    Date.now() + opts.ttlSeconds * 1000
  ).toISOString();

  await admin.from("external_cache").upsert(
    {
      cache_key: cacheKey,
      kind: opts.kind,
      url: opts.url,
      domain,
      country: opts.country ?? null,
      source_name: opts.sourceName ?? null,
      fetched_at: new Date().toISOString(),
      expires_at: expiresAt,
      http_status: status,
      content_text: clean,
      meta: { purpose: opts.purpose },
    },
    { onConflict: "cache_key" }
  );

  return {
    ok: true,
    fromCache: false,
    domain,
    url: opts.url,
    content_text: clean,
    fetched_at: new Date().toISOString(),
    expires_at: expiresAt,
    http_status: status,
    meta: { purpose: opts.purpose },
  };
}
