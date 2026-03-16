import { DuyuruPrevNextNav } from "./DuyuruPrevNextNav";
import { PrevNextItem } from "./types";

type DuyuruFooterActionsProps = {
  previous: PrevNextItem | null;
  next: PrevNextItem | null;
};

export function DuyuruFooterActions({ previous, next }: DuyuruFooterActionsProps) {
  const hasNav = Boolean(previous || next);

  if (!hasNav) return null;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-5">
      <div className="mb-3">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-900">Diğer Duyurular</h3>
      </div>
      <DuyuruPrevNextNav previous={previous} next={next} />
    </section>
  );
}
