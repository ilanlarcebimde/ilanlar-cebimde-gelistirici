"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { PremiumUpsellModal } from "./PremiumUpsellModal";
import { CoverLetterWizardModal } from "@/components/apply/cover-letter/CoverLetterWizardModal";
import { useAuth } from "@/hooks/useAuth";
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
  const { user } = useAuth();
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

  const handlePremiumCta = async () => {
    setShowPremiumModal(false);
    const currentPath = typeof window !== "undefined" ? window.location.pathname + window.location.search : "/yurtdisi-is-basvuru-merkezi";
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
    const email = user?.email?.trim();
    if (!email) {
      window.location.href = "/giris?next=" + encodeURIComponent(currentPath);
      return;
    }
    const paytrPending = {
      email,
      user_name: (user?.user_metadata?.full_name as string)?.trim() || email.split("@")[0] || "Müşteri",
      plan: "weekly" as const,
      ...(user?.id && { user_id: user.id }),
    };
    sessionStorage.setItem("paytr_pending", JSON.stringify(paytrPending));
    window.location.href = "/odeme?next=" + encodeURIComponent(currentPath);
  };

  if (isJob) {
    return (
      <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md md:p-5">
        <div className="grid grid-cols-1 items-start gap-3 md:grid-cols-[360px_minmax(0,1fr)_380px] md:gap-x-2 md:gap-y-4">
          {/* Sol: kapak görseli */}
          <div className="relative self-start min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
            <div className="relative aspect-[1200/630] w-full">
              {post.cover_image_url ? (
                <Image
                  src={post.cover_image_url}
                  alt={post.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 380px"
                  unoptimized={post.cover_image_url.includes("supabase")}
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
                  <span className="text-3xl text-slate-400" aria-hidden>📄</span>
                </div>
              )}
            </div>
            <span
              className={`absolute right-3 top-3 rounded-full px-2 py-1 text-xs font-medium text-white shadow-sm ${
                post.is_paid ? "bg-amber-500" : "bg-emerald-500"
              }`}
            >
              {post.is_paid ? "Premium" : "Ücretsiz"}
            </span>
          </div>

          {/* Orta: metin içeriği */}
          <div className="flex min-w-0 max-w-full flex-col justify-center space-y-2">
            <div className="flex items-start justify-between gap-3">
              <h2 className="flex-1 text-lg font-semibold leading-tight text-slate-900 md:text-xl">{post.title}</h2>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600">
              <span>{[location, sectorLabel].filter(Boolean).join(" · ")}</span>
              {(post.application_deadline_date || post.application_deadline_text) && (
                <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-800">
                  Son Başvuru{" "}
                  {post.application_deadline_date ? (
                    <time className="ml-1" dateTime={post.application_deadline_date}>
                      {new Intl.DateTimeFormat("tr-TR", {
                        day: "2-digit",
                        month: "long",
                        year: "numeric",
                      }).format(new Date(post.application_deadline_date))}
                    </time>
                  ) : (
                    <span className="ml-1">{post.application_deadline_text}</span>
                  )}
                </span>
              )}
            </div>
            {post.summary && <p className="text-sm leading-6 text-slate-700">{post.summary}</p>}
            <Link
              href={`${BASE}/${post.slug}`}
              className="mt-1 inline-flex h-10 w-fit items-center justify-center gap-1.5 whitespace-nowrap rounded-xl bg-slate-900 px-3.5 text-xs font-semibold text-white transition hover:bg-slate-800 md:text-sm"
            >
              İlan Bilgilerini Gör
              <span aria-hidden>→</span>
            </Link>
          </div>

          {/* Sağ: kompakt aksiyon paneli */}
          <div className="flex min-w-0 flex-col gap-2 rounded-xl border border-slate-200 bg-slate-50 p-2.5">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Hızlı Başvuru Araçları</p>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={handleContactClick}
                className="flex h-[64px] items-start justify-center rounded-xl border border-slate-200 bg-white px-3 py-2 text-left leading-tight transition hover:border-slate-300 hover:bg-slate-50"
              >
                <span className="flex w-full flex-col">
                  <span className="text-[11px] font-semibold leading-4 text-slate-900">İşe Hemen Başvur</span>
                  <span className="text-[11px] leading-4 text-slate-600">Firma İletişim Bilgileri</span>
                </span>
              </button>
              <button
                type="button"
                onClick={handleLetterClick}
                className="flex h-[64px] items-start justify-center rounded-xl border border-slate-200 bg-white px-3 py-2 text-left leading-tight transition hover:border-slate-300 hover:bg-slate-50"
              >
                <span className="flex w-full flex-col">
                  <span className="text-[11px] font-semibold leading-4 text-slate-900">İş Başvuru Mektubu</span>
                  <span className="text-[11px] leading-4 text-slate-600">Oluştur</span>
                </span>
              </button>
            </div>

            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Hizmetlerimiz</p>
            <div className="grid grid-cols-2 gap-1.5">
              <Link
                href="/yurtdisi-cv-paketi"
                className="flex h-[64px] items-start justify-center rounded-xl border border-slate-200 bg-white px-3 py-2 text-left leading-tight transition hover:border-slate-300 hover:bg-slate-50"
              >
                <span className="flex w-full flex-col">
                  <span className="text-[11px] font-semibold leading-4 text-slate-900">Yurtdışı CV Paketi</span>
                  <span className="text-[11px] leading-4 text-slate-600">İngilizce CV</span>
                </span>
              </Link>
              <Link
                href="/"
                className="flex h-[64px] items-start justify-center rounded-xl border border-orange-200 bg-orange-50 px-3 py-2 text-left leading-tight transition hover:border-orange-300 hover:bg-orange-100/70"
              >
                <span className="flex w-full flex-col">
                  <span className="text-[11px] font-semibold leading-4 text-slate-900">Ücretsiz Vize Danışmanlığı</span>
                  <span className="text-[11px] leading-4 text-slate-700">24 Saatte Danışman Atanır</span>
                </span>
              </Link>
            </div>
          </div>
        </div>

        <PremiumUpsellModal open={showPremiumModal} onClose={() => setShowPremiumModal(false)} onCta={handlePremiumCta} />
        {letterWizardState && (
          <CoverLetterWizardModal
            open={letterWizardState.open}
            onClose={handleLetterWizardClose}
            postId={post.id}
            accessToken={letterWizardState.token}
            onPremiumRequired={() => {
              setLetterWizardState(null);
              setShowPremiumModal(true);
            }}
          />
        )}
      </article>
    );
  }

  // Bilgilendirme yazısı kartı (blog) — mobil: tek kolon; masaüstü: iki kolon (görsel sol, içerik sağ)
  return (
    <article className="group overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:shadow-md md:p-5">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-[420px_1fr] md:gap-6 md:items-center">
        {/* Sol: kapak görseli — masaüstünde sabit genişlik, mobilde üstte */}
        <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-100 md:min-h-0">
          {post.cover_image_url ? (
            <Image
              src={post.cover_image_url}
              alt={post.title}
              fill
              className="object-cover transition duration-300 group-hover:scale-[1.02]"
              sizes="(max-width: 768px) 100vw, 420px"
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
        {/* Sağ: başlık, açıklama, etiketler, Devamını Oku */}
        <div className="flex min-w-0 flex-col justify-center space-y-3">
          <h2 className="text-xl font-semibold leading-tight text-slate-900">{post.title}</h2>
          {post.summary && (
            <p className="text-sm text-slate-600 line-clamp-2">{post.summary}</p>
          )}
          {displayTags.length > 0 && (
            <div className="flex flex-wrap gap-2">
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
            className="inline-flex w-fit items-center gap-1 text-sm font-medium text-sky-600 hover:text-sky-700"
          >
            Devamını Oku
            <span aria-hidden>→</span>
          </Link>
        </div>
      </div>
    </article>
  );
}
