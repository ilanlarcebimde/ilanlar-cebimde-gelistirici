import { DuyuruTag } from "./types";

type DuyuruTagsProps = {
  tags: DuyuruTag[];
};

export function DuyuruTags({ tags }: DuyuruTagsProps) {
  if (tags.length === 0) return null;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-900">Etiketler</h3>
      <div className="mt-3 flex flex-wrap gap-2">
        {tags.map((tag) => (
          <span
            key={tag.id}
            className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700"
          >
            {tag.name}
          </span>
        ))}
      </div>
    </section>
  );
}
