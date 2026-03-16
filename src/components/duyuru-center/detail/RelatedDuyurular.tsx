import Link from "next/link";
import { formatDateTR } from "./helpers";
import { NEWS_TYPE_LABELS } from "../helpers";
import { RelatedDuyuruItem } from "./types";

type RelatedDuyurularProps = {
  items: RelatedDuyuruItem[];
  countryMap: Map<string, string>;
};

export function RelatedDuyurular({ items, countryMap }: RelatedDuyurularProps) {
  if (items.length === 0) return null;

  return (
    <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="text-base font-semibold text-slate-900">Benzer Duyurular</h3>
      <div className="space-y-2">
        {items.map((item) => {
          const country = item.country_slug ? countryMap.get(item.country_slug) ?? item.country_slug : "AB Geneli";
          const type = item.news_type ? NEWS_TYPE_LABELS[item.news_type] ?? "Resmi Duyuru" : "Resmi Duyuru";
          return (
            <Link
              key={item.id}
              href={`/yurtdisi-calisma-ve-vize-duyurulari/${item.slug}`}
              className="block rounded-xl border border-slate-200 p-3 transition-colors hover:bg-slate-50"
            >
              <p className="line-clamp-2 text-sm font-medium text-slate-800">{item.title}</p>
              <p className="mt-1 text-xs text-slate-500">
                {formatDateTR(item.published_at)} · {type} · {country}
              </p>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
