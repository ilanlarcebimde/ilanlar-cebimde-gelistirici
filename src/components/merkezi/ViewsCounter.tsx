"use client";

interface ViewsCounterProps {
  count: number;
}

export function ViewsCounter({ count }: ViewsCounterProps) {
  return (
    <span className="inline-flex items-center gap-1.5 text-sm text-slate-500">
      <span aria-hidden>👁</span>
      <span>{count}</span> görüntülenme
    </span>
  );
}
