"use client";

import { useState } from "react";
import Image from "next/image";
import { RichContent } from "@/components/merkezi/RichContent";
import { CompanyCard } from "@/components/merkezi/CompanyCard";
import { ContactCard } from "@/components/merkezi/ContactCard";
import { TagChips } from "@/components/merkezi/TagChips";
import { LikeButton } from "@/components/merkezi/LikeButton";
import { ViewsCounter } from "@/components/merkezi/ViewsCounter";
import { PremiumUpsellModal } from "@/components/merkezi/PremiumUpsellModal";
import { ViewTracker } from "@/components/merkezi/ViewTracker";
import { FaydaliLinkler } from "@/components/merkezi/FaydaliLinkler";
import { LetterGeneratorModal } from "@/components/merkezi/LetterGeneratorModal";
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
  const [showLetterModal, setShowLetterModal] = useState(false);

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

  const handleLetterCta = () => {
    if (isPremium) setShowLetterModal(true);
    else setShowPremiumModal(true);
  };

  const handlePremiumCta = () => {
    setShowPremiumModal(false);
    window.location.href = "/odeme?next=" + encodeURIComponent(window.location.pathname);
  };

  return (
    <article className="mx-auto max-w-3xl">
      <ViewTracker postId={post.id} />
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 md:text-3xl">{post.title}</h1>
        {(post.country_slug || post.sector_slug) && (
          <p className="mt-2 text-sm text-slate-500">
            {[post.country_slug, post.sector_slug].filter(Boolean).join(" · ")}
          </p>
        )}
        <div className="mt-4 flex flex-wrap items-center gap-4">
          <LikeButton
            postId={post.id}
            initialCount={likeCount}
            initialLiked={userLiked}
          />
          <ViewsCounter count={viewCount} />
        </div>
      </header>

      {post.cover_image_url && (
        <div className="relative mb-6 aspect-video w-full overflow-hidden rounded-xl bg-slate-100">
          <Image
            src={post.cover_image_url}
            alt=""
            fill
            className="object-cover"
            priority
            sizes="(max-width: 768px) 100vw, 896px"
            unoptimized={post.cover_image_url.includes("supabase")}
          />
        </div>
      )}

      <RichContent html={post.content_html_sanitized ?? post.content} />

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
            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={handleContactUnlock}
                className="rounded-xl bg-slate-800 px-4 py-3 text-sm font-medium text-white hover:bg-slate-700"
              >
                Hızlı Başvur: Firma İletişim Bilgisi
              </button>
              <button
                type="button"
                onClick={handleLetterCta}
                className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Alınma İhtimalini Arttır: İş Başvuru Mektubu Oluştur
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
      <LetterGeneratorModal
        postId={post.id}
        open={showLetterModal}
        onClose={() => setShowLetterModal(false)}
        onPremiumRequired={() => {
          setShowLetterModal(false);
          setShowPremiumModal(true);
        }}
      />
    </article>
  );
}
