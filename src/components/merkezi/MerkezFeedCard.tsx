"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { JobActionsStack } from "./JobActionsStack";
import { PremiumUpsellModal } from "./PremiumUpsellModal";
import { LetterGeneratorModal } from "./LetterGeneratorModal";
import { humanizeSlug } from "@/lib/slugify";
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
  const [showLetterModal, setShowLetterModal] = useState(false);

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

  const handleLetterClick = () => {
    setShowLetterModal(true);
  };

  const handleLetterPremiumRequired = () => {
    setShowLetterModal(false);
    setShowPremiumModal(true);
  };

  const handlePremiumCta = () => {
    setShowPremiumModal(false);
    window.location.href = "/odeme?next=" + encodeURIComponent(window.location.pathname);
  };

  if (isJob) {
    return (
      <article className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm ring-1 ring-slate-200/80 transition-shadow hover:shadow-md">
        <div className="relative h-[160px] w-full shrink-0 overflow-hidden rounded-t-xl bg-slate-100 md:h-[180px]">
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
          <span
            className={`absolute right-3 top-3 rounded-full px-2 py-1 text-xs font-medium shadow-sm ${
              post.is_paid ? "bg-amber-500 text-white" : "bg-emerald-500 text-white"
            }`}
          >
            {post.is_paid ? "Premium" : "Ücretsiz"}
          </span>
        </div>

        <div className="grid gap-4 p-4 md:grid-cols-[1fr,220px] md:p-5">
          <div className="min-w-0">
            <h2 className="text-lg font-semibold leading-tight text-slate-900 md:text-xl">{post.title}</h2>
            <div className="mt-1 line-clamp-1 text-sm text-slate-600">
              {[location, sectorLabel].filter(Boolean).join(" · ")}
            </div>
            {(post.application_deadline_date || post.application_deadline_text) && (
              <div className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2 py-1 text-xs text-amber-800">
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
              <p className="mt-2 line-clamp-2 text-sm text-slate-700">{post.summary}</p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Link
              href={`${BASE}/${post.slug}`}
              className="flex h-10 w-full items-center justify-center gap-1.5 rounded-xl bg-slate-900 text-sm font-medium text-white transition hover:bg-slate-800"
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
        <LetterGeneratorModal
          postId={post.id}
          open={showLetterModal}
          onClose={() => setShowLetterModal(false)}
          onPremiumRequired={handleLetterPremiumRequired}
        />
      </article>
    );
  }

  // Bilgilendirme yazısı kartı (kompakt blog)
  return (
    <article className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm ring-1 ring-slate-200/80 transition-shadow hover:shadow-md">
      <div className="relative h-[160px] w-full overflow-hidden rounded-t-xl bg-slate-100 md:h-[180px]">
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
      <div className="p-4 md:p-5">
        <h2 className="text-lg font-semibold leading-tight text-slate-900 md:text-xl">{post.title}</h2>
        {post.summary && <p className="mt-2 line-clamp-2 text-sm text-slate-700">{post.summary}</p>}
        {displayTags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
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
          className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-sky-600 hover:text-sky-700"
        >
          Devamını Oku
          <span aria-hidden>→</span>
        </Link>
      </div>
    </article>
  );
}
