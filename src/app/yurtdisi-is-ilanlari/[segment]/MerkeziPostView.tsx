"use client";

import { useState, useCallback, useEffect } from "react";
import { RichContent } from "@/components/merkezi/RichContent";
import { PostCover } from "@/components/merkezi/PostCover";
import { CompanyCard } from "@/components/merkezi/CompanyCard";
import { ContactCard } from "@/components/merkezi/ContactCard";
import { TagChips } from "@/components/merkezi/TagChips";
import { LikeButton } from "@/components/merkezi/LikeButton";
import { ViewsCounter } from "@/components/merkezi/ViewsCounter";
import { PremiumUpsellModal } from "@/components/merkezi/PremiumUpsellModal";
import { ViewTracker } from "@/components/merkezi/ViewTracker";
import { FaydaliLinkler } from "@/components/merkezi/FaydaliLinkler";
import { NasilBasvururum } from "@/components/merkezi/NasilBasvururum";
import { CoverLetterWizardModal } from "@/components/apply/cover-letter/CoverLetterWizardModal";
import { useAuth } from "@/hooks/useAuth";
import { useSubscriptionActive } from "@/hooks/useSubscriptionActive";
import { humanizeSlug } from "@/lib/slugify";
import { supabase } from "@/lib/supabase";
import type { MerkeziPost, MerkeziTag } from "@/lib/merkezi/types";
import type { MerkeziPostContact } from "@/lib/merkezi/types";

interface MerkeziPostViewProps {
  post: MerkeziPost;
  tags: MerkeziTag[];
  viewCount: number;
  likeCount: number;
  userLiked: boolean;
  etiket: string | null;
  isPremium: boolean;
  contact: MerkeziPostContact | null;
}

export function MerkeziPostView({
  post,
  tags,
  viewCount,
  likeCount,
  userLiked,
  etiket,
  isPremium,
  contact,
}: MerkeziPostViewProps) {
  const { user } = useAuth();
  const { active: subscriptionActive, refetch } = useSubscriptionActive(user?.id);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [contactUnlocked, setContactUnlocked] = useState(!!contact && (isPremium || subscriptionActive));
  const [contactData, setContactData] = useState<MerkeziPostContact | null>(contact);
  const [letterWizardState, setLetterWizardState] = useState<{ open: boolean; token: string } | null>(null);
  const [pendingPremiumAction, setPendingPremiumAction] = useState<null | "contact" | "letter">(null);
  const [contactLoading, setContactLoading] = useState(false);
  const effectivePremium = isPremium || subscriptionActive;

  const showContactCard = post.is_paid
    ? contactUnlocked && contactData
    : post.show_contact_when_free && contactData;

  const handleContactUnlock = async () => {
    if (effectivePremium) {
      if (!contactData) {
        const res = await fetch(`/api/merkezi/post/${post.id}/contact`, { credentials: "include" });
        if (res.ok) {
          const data = await res.json();
          setContactData(data);
          setContactUnlocked(true);
        } else if (res.status === 401 || res.status === 403) {
          setPendingPremiumAction("contact");
          setShowPremiumModal(true);
        }
      } else setContactUnlocked(true);
    } else {
      setPendingPremiumAction("contact");
      setShowPremiumModal(true);
    }
  };

  const handleLetterCta = useCallback(async () => {
    if (!effectivePremium) {
      setPendingPremiumAction("letter");
      setShowPremiumModal(true);
      return;
    }
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      setPendingPremiumAction("letter");
      setShowPremiumModal(true);
      return;
    }
    setLetterWizardState({ open: true, token: session.access_token });
  }, [effectivePremium]);

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

  const handlePremiumApplied = useCallback(async () => {
    const action = pendingPremiumAction;
    if (!action) return;
    setPendingPremiumAction(null);

    const delays = [0, 600, 1200];
    let lastOk = false;
    for (const waitMs of delays) {
      if (waitMs > 0) await new Promise((r) => setTimeout(r, waitMs));
      const ok = await refetch();
      lastOk = ok;
      if (ok) break;
    }

    if (!lastOk) return;

    if (action === "contact") {
      void handleContactUnlock();
      return;
    }

    if (letterWizardState) return;
    void handleLetterCta();
  }, [pendingPremiumAction, refetch, handleLetterCta, letterWizardState, handleContactUnlock]);

  const countryLabel = post.country_name ?? (post.country_slug ? humanizeSlug(post.country_slug) : null);
  const sectorLabel = post.sector_name ?? (post.sector_slug ? humanizeSlug(post.sector_slug) : null);
  const metaParts = [countryLabel, post.city, sectorLabel].filter(Boolean);

  // Premium aktifse iletişim kartını otomatik açmak için veriyi arkada çek.
  useEffect(() => {
    if (!post.is_paid) return;
    if (!effectivePremium) return;
    if (contactData) {
      setContactUnlocked(true);
      return;
    }
    let cancelled = false;
    setContactLoading(true);
    void (async () => {
      try {
        const res = await fetch(`/api/merkezi/post/${post.id}/contact`, { credentials: "include" });
        if (!res.ok) return;
        const data = (await res.json()) as MerkeziPostContact;
        if (cancelled) return;
        setContactData(data);
        setContactUnlocked(true);
      } finally {
        if (!cancelled) setContactLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [post.id, post.is_paid, effectivePremium, contactData]);

  return (
    <article className="mx-auto max-w-3xl">
      <ViewTracker postId={post.id} />
      <header className="mb-6">
        <h1 className="text-2xl font-bold leading-tight text-slate-900 md:text-3xl">{post.title}</h1>
        {metaParts.length > 0 && (
          <p className="mt-2 text-sm text-slate-600">
            {metaParts.join(" · ")}
          </p>
        )}
        <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
          <LikeButton
            postId={post.id}
            initialCount={likeCount}
            initialLiked={userLiked}
          />
          <ViewsCounter count={viewCount} />
        </div>
      </header>

      <div className="mb-6">
        <PostCover
          src={post.cover_image_url}
          alt={post.title}
          badge={post.is_paid ? "Premium" : null}
        />
      </div>

      <RichContent html={post.content_html_sanitized ?? post.content} />

      <TagChips tags={tags} currentEtiket={etiket ?? null} baseSegment={post.slug} />

      <div className="mt-6">
        <NasilBasvururum />
      </div>

      <aside className="mt-8 space-y-6">
        <CompanyCard post={post} />

        {post.is_paid ? (
          <>
            <section>
              <h2 className="mb-2 text-lg font-semibold text-slate-900">Firma iletişim</h2>
              <ContactCard
                contact={contactData}
                locked={!contactUnlocked}
                onUnlock={handleContactUnlock}
                isPaid={true}
              />
              {effectivePremium && !contactData && contactLoading && (
                <p className="mt-2 text-xs text-emerald-700">İletişim bilgileri yükleniyor...</p>
              )}
            </section>
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              {effectivePremium ? (
                <>
                  <button
                    type="button"
                    onClick={handleContactUnlock}
                    className="relative overflow-visible inline-flex h-10 min-w-0 items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-900 transition hover:bg-emerald-100 sm:w-auto"
                  >
                    <span className="flex h-full w-full items-center justify-center text-center break-normal whitespace-normal">
                      Hızlı Başvur: Firma İletişim Bilgisi
                    </span>
                    <span
                      className="absolute -left-2 -top-2 z-10 flex h-5 items-center justify-center rounded-full bg-slate-600/90 px-2 text-[11px] leading-5 font-medium text-white/95 shadow-sm whitespace-nowrap pointer-events-none"
                      aria-hidden
                    >
                      Aktif
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={handleLetterCta}
                    className="relative overflow-visible inline-flex h-10 min-w-0 items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-900 transition hover:bg-emerald-100 sm:w-auto"
                  >
                    <span className="flex h-full w-full items-center justify-center text-center break-normal whitespace-normal">
                      İş Başvuru Mektubu Oluştur
                    </span>
                    <span
                      className="absolute -left-2 -top-2 z-10 flex h-5 items-center justify-center rounded-full bg-slate-600/90 px-2 text-[11px] leading-5 font-medium text-white/95 shadow-sm whitespace-nowrap pointer-events-none"
                      aria-hidden
                    >
                      Aktif
                    </span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={handleContactUnlock}
                    className="h-10 w-full rounded-xl bg-slate-800 px-4 text-sm font-medium text-white hover:bg-slate-700 sm:w-auto"
                  >
                    Hızlı Başvur: Firma İletişim Bilgisi
                  </button>
                  <button
                    type="button"
                    onClick={handleLetterCta}
                    className="h-10 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 hover:bg-slate-50 sm:w-auto"
                  >
                    İş Başvuru Mektubu Oluştur
                  </button>
                </>
              )}
            </div>
          </>
        ) : (
          <>
            {showContactCard && (
              <section>
                <h2 className="mb-2 text-lg font-semibold text-slate-900">İletişim</h2>
                <ContactCard
                  contact={contactData}
                  locked={false}
                  isPaid={false}
                />
              </section>
            )}
            <FaydaliLinkler />
          </>
        )}
      </aside>

      <PremiumUpsellModal
        open={showPremiumModal}
        onClose={() => setShowPremiumModal(false)}
        onCta={handlePremiumCta}
        onPremiumApplied={handlePremiumApplied}
      />
      {letterWizardState && (
        <CoverLetterWizardModal
          open={letterWizardState.open}
          onClose={() => setLetterWizardState(null)}
          postId={post.id}
          accessToken={letterWizardState.token}
          onPremiumRequired={() => {
            setPendingPremiumAction("letter");
            setShowPremiumModal(true);
          }}
        />
      )}
    </article>
  );
}
