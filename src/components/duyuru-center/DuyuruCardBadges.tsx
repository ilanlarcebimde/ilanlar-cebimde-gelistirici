import { DuyuruBadge } from "./DuyuruBadge";
import { formatNewsTypeLabel, isBreakingPost, isImportantPost, toTurkishBadgeText } from "./helpers";
import { DuyuruPost } from "./types";

type DuyuruCardBadgesProps = {
  post: DuyuruPost;
  countryLabel: string | null;
  featured?: boolean;
};

export function DuyuruCardBadges({ post, countryLabel, featured = false }: DuyuruCardBadgesProps) {
  const typeLabel = formatNewsTypeLabel(post.news_type);
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
