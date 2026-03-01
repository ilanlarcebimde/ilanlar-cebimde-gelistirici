"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { JobActionsStack } from "./JobActionsStack";
import { PremiumUpsellModal } from "./PremiumUpsellModal";
import { CoverLetterWizardModal } from "@/components/apply/cover-letter/CoverLetterWizardModal";
import { humanizeSlug } from "@/lib/slugify";
import { supabase } from "@/lib/supabase";
import type { MerkeziPostLandingItem, MerkeziTag } from "@/lib/merkezi/types";

const BASE = "/yurtdisi-is-ilanlari";
const MAX_TAGS = 4;

interface MerkezFeedCardProps {
  post: MerkeziPostLandingItem;
  tags: MerkeziTag[];
}

/** İlan kartı: content_type === 'job'. Blog kartı: content_type === 'blog'. */
function isJobCard(post: MerkeziPostLandingItem): boolean {
  return (post.content_type ?? "job") === "job";
}

export function MerkezFeedCard({ post, tags }: MerkezFeedCardProps) {
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [letterWizardState, setLetterWizardState] = useState<{ open: boolean; token: string } | null>(null);

  const isJob = isJobCard(post);
  const countryLabel = post.country_name ?? (post.country_slug ? humanizeSlug(post.country_slug) : null);
  const sectorLabel = post.sector_name ?? (post.sector_slug ? humanizeSlug(post.sector_slug) : null);
  const location = [countryLabel, post.city].filter(Boolean).join(", ");
  const displayTags = tags.slice(0, MAX_TAGS);
  const extraTags = tags.length > MAX_TAGS ? tags.length - MAX_TAGS : 0;

  const handleContactClick = async () => {
    const res = await fetch(`/api/merkezi/post/${post.id}/contact`, { credentials: "include" });
    if (res.ok) {
      window.location.href = `${BASE}/${post.slug}`;
      return;
    }
    if (res.status === 401 || res.status === 403) setShowPremiumModal(true);
  };

  const handleLetterClick = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      setShowPremiumModal(true);
      return;
    }
    setLetterWizardState({ open: true, token: session.access_token });
  }, []);

  const handleLetterWizardClose = useCallback(() => {
    setLetterWizardState(null);
  }, []);

  const handlePremiumCta = () => {
    setShowPremiumModal(false);
    window.location.href = "/odeme?next=" + encodeURIComponent(window.location.pathname);
  };

  if (isJob) {
    return (
      <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md md:p-5">
        <div className="grid grid-cols-1 items-stretch gap-4 md:grid-cols-[360px,1fr,260px] md:gap-5">
          {/* Sol: Görsel — kırpma yok */}
          <div className="relative flex h-[200px] min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-100 md:h-full md:min-h-[220px]">
            {post.cover_image_url ? (
              <Image
                src={post.cover_image_url}
                alt={post.title}
                fill
                className="object-contain"
                sizes="(max-width: 768px) 100vw, 360px"
                unoptimized={post.cover_image_url.includes("supabase")}
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
                <span className="text-3xl text-slate-400" aria-hidden>📄</span>
              </div>
            )}
            <span
              className={`absolute right-3 top-3 rounded-full px-2 py-1 text-xs font-medium text-white shadow-sm ${
                post.is_paid ? "bg-amber-500" : "bg-emerald-500"
              }`}
            >
              {post.is_paid ? "Premium" : "Ücretsiz"}
            </span>
          </div>

          {/* Orta: Metin */}
          <div className="flex min-w-0 flex-col justify-center space-y-2">
            <h2 className="text-lg font-semibold leading-tight text-slate-900 md:text-xl">{post.title}</h2>
            <p className="line-clamp-1 text-sm text-slate-600">
              {[location, sectorLabel].filter(Boolean).join(" · ")}
            </p>
            {(post.application_deadline_date || post.application_deadline_text) && (
              <div className="inline-flex w-fit items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2 py-1 text-xs text-amber-800">
                <span className="shrink-0 font-medium">Son Başvuru</span>
                <span>
                  {post.application_deadline_date ? (
                    <time dateTime={post.application_deadline_date}>
                      {new Intl.DateTimeFormat("tr-TR", {
                        day: "2-digit",
                        month: "long",
                        year: "numeric",
                      }).format(new Date(post.application_deadline_date))}
                    </time>
                  ) : (
                    post.application_deadline_text
                  )}
                </span>
              </div>
            )}
            {post.summary && (
              <p className="line-clamp-2 text-sm text-slate-700">{post.summary}</p>
            )}
          </div>

          {/* Sağ: Butonlar — primary + gruplu CTA */}
          <div className="mt-2 flex flex-col gap-4 md:mt-0">
            <Link
              href={`${BASE}/${post.slug}`}
              className="flex h-12 w-full items-center justify-center gap-1.5 rounded-2xl bg-slate-900 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              İlan Bilgilerinin Tamamını Görüntüle
              <span aria-hidden>→</span>
            </Link>
            <JobActionsStack
              isPaid={post.is_paid}
              onContactClick={handleContactClick}
              onLetterClick={handleLetterClick}
            />
          </div>
        </div>

        <PremiumUpsellModal open={showPremiumModal} onClose={() => setShowPremiumModal(false)} onCta={handlePremiumCta} />
        {letterWizardState && (
          <CoverLetterWizardModal
            open={letterWizardState.open}
            onClose={handleLetterWizardClose}
            postId={post.id}
            accessToken={letterWizardState.token}
          />
        )}
      </article>
    );
  }

  // Bilgilendirme yazısı kartı (kompakt blog) — tek kolon
  return (
    <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md md:p-5">
      <div className="relative h-[200px] w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-100 md:h-[220px]">
        {post.cover_image_url ? (
          <Image
            src={post.cover_image_url}
            alt={post.title}
            fill
            className="object-contain"
            sizes="(max-width: 768px) 100vw, 1024px"
            unoptimized={post.cover_image_url.includes("supabase")}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
            <span className="text-3xl text-slate-400" aria-hidden>📄</span>
          </div>
        )}
        <span className="absolute right-3 top-3 rounded-full bg-slate-700/90 px-2 py-1 text-xs font-medium text-white shadow-sm">
          Yazı
        </span>
      </div>
      <div className="mt-4 space-y-2">
        <h2 className="text-lg font-semibold leading-tight text-slate-900 md:text-xl">{post.title}</h2>
        {post.summary && <p className="line-clamp-2 text-sm text-slate-700">{post.summary}</p>}
        {displayTags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {displayTags.map((t) => (
              <span key={t.id} className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                {t.name}
              </span>
            ))}
            {extraTags > 0 && (
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">+{extraTags}</span>
            )}
          </div>
        )}
        <Link
          href={`${BASE}/${post.slug}`}
          className="inline-flex items-center gap-1 text-sm font-medium text-sky-600 hover:text-sky-700"
        >
          Devamını Oku
          <span aria-hidden>→</span>
        </Link>
      </div>
    </article>
  );
}
