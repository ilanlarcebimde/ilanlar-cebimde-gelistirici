"use client";

import { useState, useCallback } from "react";
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
import { CoverLetterWizardModal } from "@/components/apply/cover-letter/CoverLetterWizardModal";
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
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [contactUnlocked, setContactUnlocked] = useState(!!contact && isPremium);
  const [contactData, setContactData] = useState<MerkeziPostContact | null>(contact);
  const [letterWizardState, setLetterWizardState] = useState<{ open: boolean; token: string } | null>(null);

  const showContactCard = post.is_paid
    ? contactUnlocked && contactData
    : post.show_contact_when_free && contactData;

  const handleContactUnlock = async () => {
    if (isPremium) {
      if (!contactData) {
        const res = await fetch(`/api/merkezi/post/${post.id}/contact`, { credentials: "include" });
        if (res.ok) {
          const data = await res.json();
          setContactData(data);
          setContactUnlocked(true);
        } else if (res.status === 401 || res.status === 403) {
          setShowPremiumModal(true);
        }
      } else setContactUnlocked(true);
    } else setShowPremiumModal(true);
  };

  const handleLetterCta = useCallback(async () => {
    if (!isPremium) {
      setShowPremiumModal(true);
      return;
    }
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      setShowPremiumModal(true);
      return;
    }
    setLetterWizardState({ open: true, token: session.access_token });
  }, [isPremium]);

  const handlePremiumCta = () => {
    setShowPremiumModal(false);
    window.location.href = "/odeme?next=" + encodeURIComponent(window.location.pathname);
  };

  const countryLabel = post.country_name ?? (post.country_slug ? humanizeSlug(post.country_slug) : null);
  const sectorLabel = post.sector_name ?? (post.sector_slug ? humanizeSlug(post.sector_slug) : null);
  const metaParts = [countryLabel, post.city, sectorLabel].filter(Boolean);

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

      <div className="prose prose-slate max-w-none prose-headings:font-semibold prose-p:text-slate-700">
        <RichContent html={post.content_html_sanitized ?? post.content} />
      </div>

      <TagChips tags={tags} currentEtiket={etiket ?? null} baseSegment={post.slug} />

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
            </section>
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
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
      />
      {letterWizardState && (
        <CoverLetterWizardModal
          open={letterWizardState.open}
          onClose={() => setLetterWizardState(null)}
          postId={post.id}
          accessToken={letterWizardState.token}
        />
      )}
    </article>
  );
}
