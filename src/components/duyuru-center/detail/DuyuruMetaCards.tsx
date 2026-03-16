import { CalendarDays, Globe2, Landmark, MapPin } from "lucide-react";
import type { ReactNode } from "react";
import { DuyuruDetailData } from "./types";
import { formatDateTR, getCountryLabel } from "./helpers";
import { NEWS_TYPE_LABELS } from "../helpers";

type DuyuruMetaCardsProps = {
  post: DuyuruDetailData;
  countryMap: Map<string, string>;
};

function MetaCard({
  icon,
  title,
  value,
}: {
  icon: ReactNode;
  title: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-2 flex items-center gap-2 text-slate-500">
        {icon}
        <p className="text-xs font-semibold uppercase tracking-wide">{title}</p>
      </div>
      <p className="text-sm font-medium text-slate-800">{value}</p>
    </div>
  );
}

export function DuyuruMetaCards({ post, countryMap }: DuyuruMetaCardsProps) {
  const country = getCountryLabel(post.country_slug, countryMap);
  const type = post.news_type ? NEWS_TYPE_LABELS[post.news_type] ?? "Resmi Duyuru" : "Resmi Duyuru";
  const source = post.source_name?.trim() || "Resmi kaynak";
  const dateLine = post.effective_date
    ? `${formatDateTR(post.published_at)} / ${formatDateTR(post.effective_date)}`
    : formatDateTR(post.published_at);

  return (
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <MetaCard icon={<MapPin className="h-4 w-4" />} title="Ülke / Bölge" value={country} />
      <MetaCard icon={<Globe2 className="h-4 w-4" />} title="Duyuru Türü" value={type} />
      <MetaCard icon={<Landmark className="h-4 w-4" />} title="Kaynak Kurum" value={source} />
      <MetaCard icon={<CalendarDays className="h-4 w-4" />} title="Yayın / Geçerlilik" value={dateLine} />
    </section>
  );
}
