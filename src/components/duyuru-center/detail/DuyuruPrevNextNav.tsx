import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { PrevNextItem } from "./types";
import { formatDateTR } from "./helpers";
import { NEWS_TYPE_LABELS } from "../helpers";

type DuyuruPrevNextNavProps = {
  previous: PrevNextItem | null;
  next: PrevNextItem | null;
};

function NavCard({
  label,
  item,
  direction,
}: {
  label: string;
  item: PrevNextItem;
  direction: "left" | "right";
}) {
  return (
    <Link
      href={`/yurtdisi-calisma-ve-vize-duyurulari/${item.slug}`}
      className="group block rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
    >
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <div className="flex items-start gap-2">
        {direction === "left" ? (
          <ArrowLeft className="mt-0.5 h-4 w-4 text-slate-500" />
        ) : (
          <ArrowRight className="mt-0.5 h-4 w-4 text-slate-500" />
        )}
        <p className="line-clamp-2 text-sm font-medium leading-6 text-slate-800">{item.title}</p>
      </div>
      <p className="mt-2 text-xs text-slate-500">
        {formatDateTR(item.published_at)}{item.news_type ? ` · ${NEWS_TYPE_LABELS[item.news_type] ?? "Resmi Duyuru"}` : ""}
      </p>
    </Link>
  );
}

export function DuyuruPrevNextNav({ previous, next }: DuyuruPrevNextNavProps) {
  if (!previous && !next) return null;

  return (
    <section className={`grid gap-3 ${previous && next ? "md:grid-cols-2" : "md:grid-cols-1"}`}>
      {previous ? <NavCard label="Önceki Yazı" item={previous} direction="left" /> : null}
      {next ? <NavCard label="Sonraki Yazı" item={next} direction="right" /> : null}
    </section>
  );
}
