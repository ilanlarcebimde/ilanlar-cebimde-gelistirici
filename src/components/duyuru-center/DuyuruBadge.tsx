type DuyuruBadgeProps = {
  text: string;
  tone?: "default" | "important" | "breaking" | "country" | "type";
};

export function DuyuruBadge({ text, tone = "default" }: DuyuruBadgeProps) {
  const toneClass =
    tone === "important"
      ? "border-amber-200 bg-amber-50 text-amber-800"
      : tone === "breaking"
        ? "border-rose-200 bg-rose-50 text-rose-800"
        : tone === "country"
          ? "border-sky-200 bg-sky-50 text-sky-800"
          : tone === "type"
            ? "border-indigo-200 bg-indigo-50 text-indigo-800"
            : "border-slate-200 bg-slate-50 text-slate-700";

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold tracking-wide ${toneClass}`}
    >
      {text}
    </span>
  );
}
