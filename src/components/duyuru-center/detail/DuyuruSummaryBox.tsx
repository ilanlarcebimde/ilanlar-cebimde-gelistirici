type DuyuruSummaryBoxProps = {
  items: string[];
};

export function DuyuruSummaryBox({ items }: DuyuruSummaryBoxProps) {
  if (items.length === 0) return null;

  return (
    <aside className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-900">Hızlı Özet</h3>
      <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-700">
        {items.map((item) => (
          <li key={item} className="flex gap-2">
            <span className="mt-2 h-1.5 w-1.5 rounded-full bg-slate-400" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </aside>
  );
}
