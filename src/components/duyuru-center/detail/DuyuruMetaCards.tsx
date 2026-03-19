import { CalendarDays, Globe2, Landmark, MapPin } from "lucide-react";
import type { ReactNode } from "react";
import { DuyuruDetailData } from "./types";
import { formatDateTR, getCountryLabel } from "./helpers";
import { formatNewsTypeLabel } from "../helpers";

type DuyuruMetaCardsProps = {
  post: DuyuruDetailData;
  countryMap: Map<string, string>;
  compact?: boolean;
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

export function DuyuruMetaCards({ post, countryMap, compact = false }: DuyuruMetaCardsProps) {
  const country = getCountryLabel(post.country_slug, countryMap);
  const type = formatNewsTypeLabel(post.news_type);
  const source = post.source_name?.trim() || "Resmi kaynak";
  const dateLine = post.effective_date
    ? `${formatDateTR(post.published_at)} / ${formatDateTR(post.effective_date)}`
    : formatDateTR(post.published_at);
  const items = [
    { icon: <MapPin className="h-4 w-4" />, title: "Ülke / Bölge", value: country },
    { icon: <Globe2 className="h-4 w-4" />, title: "Duyuru Türü", value: type },
    { icon: <Landmark className="h-4 w-4" />, title: "Kaynak Kurum", value: source },
    { icon: <CalendarDays className="h-4 w-4" />, title: "Yayın / Geçerlilik", value: dateLine },
  ];

  if (compact) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Duyuru Bilgileri</h3>
        <div className="space-y-2.5">
          {items.map((item) => (
            <div key={item.title} className="flex items-start gap-2 text-sm text-slate-700">
              <span className="mt-0.5 text-slate-500">{item.icon}</span>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{item.title}</p>
                <p className="text-sm font-medium text-slate-800">{item.value}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <MetaCard key={item.title} icon={item.icon} title={item.title} value={item.value} />
      ))}
    </section>
  );
}
