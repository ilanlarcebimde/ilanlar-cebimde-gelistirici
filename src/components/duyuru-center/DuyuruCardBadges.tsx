import { DuyuruBadge } from "./DuyuruBadge";
import { isBreakingPost, isImportantPost, NEWS_TYPE_LABELS, toTurkishBadgeText } from "./helpers";
import { DuyuruPost } from "./types";

type DuyuruCardBadgesProps = {
  post: DuyuruPost;
  countryLabel: string | null;
  featured?: boolean;
};

export function DuyuruCardBadges({ post, countryLabel, featured = false }: DuyuruCardBadgesProps) {
  const typeLabel = post.news_type ? NEWS_TYPE_LABELS[post.news_type] ?? "Resmi Duyuru" : "Resmi Duyuru";
  const badgeLabel = toTurkishBadgeText(post.news_badge);

  return (
    <div className="flex flex-wrap gap-1.5">
      {featured ? <DuyuruBadge text="Öne Çıkan Duyuru" tone="default" /> : null}
      {isImportantPost(post) ? <DuyuruBadge text="Önemli" tone="important" /> : null}
      {isBreakingPost(post) ? <DuyuruBadge text="Son Dakika" tone="breaking" /> : null}
      <DuyuruBadge text={typeLabel} tone="type" />
      {countryLabel ? <DuyuruBadge text={countryLabel} tone="country" /> : null}
      {badgeLabel ? <DuyuruBadge text={badgeLabel} /> : null}
    </div>
  );
}
