"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { JobActionsStack } from "./JobActionsStack";
import { PremiumUpsellModal } from "./PremiumUpsellModal";
import { LetterGeneratorModal } from "./LetterGeneratorModal";
import type { MerkeziPostLandingItem, MerkeziTag } from "@/lib/merkezi/types";

const BASE = "/yurtdisi-is-ilanlari";
const MAX_TAGS = 4;

interface MerkezFeedCardProps {
  post: MerkeziPostLandingItem;
  tags: MerkeziTag[];
}

/** İlan = country_slug ve sector_slug ikisi de dolu. Değilse bilgilendirme yazısı. */
function isJobPost(post: MerkeziPostLandingItem): boolean {
  return !!(post.country_slug?.trim() && post.sector_slug?.trim());
}

export function MerkezFeedCard({ post, tags }: MerkezFeedCardProps) {
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [showLetterModal, setShowLetterModal] = useState(false);

  const isJob = isJobPost(post);
  const location = [post.country_slug, post.city].filter(Boolean).join(", ");
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
      <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm ring-1 ring-slate-200/80 transition-shadow hover:shadow-md">
        <div className="relative aspect-[3/1] w-full shrink-0 overflow-hidden bg-slate-100 sm:aspect-video">
          {post.cover_image_url ? (
            <Image
              src={post.cover_image_url}
              alt={post.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 896px"
              unoptimized={post.cover_image_url.includes("supabase")}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
              <span className="text-4xl text-slate-400" aria-hidden>📄</span>
            </div>
          )}
          <span
            className={`absolute right-3 top-3 rounded-lg px-2.5 py-1 text-xs font-semibold shadow ${
              post.is_paid ? "bg-gradient-to-r from-amber-500 to-amber-600 text-white" : "bg-emerald-500/90 text-white"
            }`}
          >
            {post.is_paid ? "Premium" : "Ücretsiz"}
          </span>
        </div>

        <div className="p-5">
          <h2 className="text-xl font-bold text-slate-900 md:text-2xl">{post.title}</h2>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500">
            {location && <span>📍 {location}</span>}
            {post.sector_slug && <span>🏷 {post.sector_slug}</span>}
          </div>
          {(post.application_deadline_date || post.application_deadline_text) && (
            <div className="mt-3 inline-flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50/80 px-3 py-2 text-sm text-amber-800">
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
            <p className="mt-3 line-clamp-3 text-sm text-slate-600">{post.summary}</p>
          )}
          <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 flex-1">
              <Link
                href={`${BASE}/${post.slug}`}
                className="inline-flex items-center gap-1 rounded-xl bg-slate-800 px-4 py-3 text-sm font-medium text-white hover:bg-slate-700"
              >
                İlan Bilgilerinin Tamamını Görüntüle
                <span aria-hidden>→</span>
              </Link>
            </div>
            <div className="w-full sm:w-56 shrink-0">
              <JobActionsStack
                postId={post.id}
                slug={post.slug}
                isPaid={post.is_paid}
                onContactClick={handleContactClick}
                onLetterClick={handleLetterClick}
              />
            </div>
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

  // Bilgilendirme yazısı kartı (blog hissi)
  return (
    <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm ring-1 ring-slate-200/80 transition-shadow hover:shadow-md">
      <div className="relative aspect-video w-full overflow-hidden bg-slate-100">
        {post.cover_image_url ? (
          <Image
            src={post.cover_image_url}
            alt={post.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 896px"
            unoptimized={post.cover_image_url.includes("supabase")}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
            <span className="text-4xl text-slate-400" aria-hidden>📄</span>
          </div>
        )}
        <span className="absolute right-3 top-3 rounded-lg bg-slate-700/90 px-2.5 py-1 text-xs font-medium text-white shadow">
          Yazı
        </span>
      </div>
      <div className="p-5">
        <h2 className="text-xl font-bold text-slate-900 md:text-2xl">{post.title}</h2>
        {post.summary && <p className="mt-3 line-clamp-3 text-sm text-slate-600">{post.summary}</p>}
        {displayTags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {displayTags.map((t) => (
              <span key={t.id} className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs text-slate-600">
                {t.name}
              </span>
            ))}
            {extraTags > 0 && (
              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs text-slate-500">+{extraTags}</span>
            )}
          </div>
        )}
        <Link
          href={`${BASE}/${post.slug}`}
          className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-sky-600 hover:text-sky-700"
        >
          Devamını Oku
          <span aria-hidden>→</span>
        </Link>
      </div>
    </article>
  );
}
