import { DuyuruGridCard } from "./DuyuruGridCard";
import { DuyuruPost } from "./types";

type DuyuruFeaturedCardProps = {
  post: DuyuruPost;
  countryLabel: string | null;
};

export function DuyuruFeaturedCard({ post, countryLabel }: DuyuruFeaturedCardProps) {
  return <DuyuruGridCard post={post} countryLabel={countryLabel} featured />;
}
