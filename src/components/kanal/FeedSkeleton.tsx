"use client";

export function FeedSkeleton() {
  return (
    <div className="rounded-[16px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex justify-between gap-2">
        <div className="h-5 w-3/4 animate-pulse rounded bg-slate-200" />
        <div className="h-4 w-16 animate-pulse rounded bg-slate-100" />
      </div>
      <div className="mt-3 flex gap-2">
        <div className="h-4 w-24 animate-pulse rounded bg-slate-100" />
        <div className="h-4 w-20 animate-pulse rounded bg-slate-100" />
      </div>
      <div className="mt-3 space-y-2">
        <div className="h-4 w-full animate-pulse rounded bg-slate-100" />
        <div className="h-4 w-4/5 animate-pulse rounded bg-slate-100" />
      </div>
      <div className="mt-4 flex justify-between">
        <div className="h-4 w-20 animate-pulse rounded bg-slate-100" />
        <div className="h-10 w-28 animate-pulse rounded-xl bg-slate-200" />
      </div>
    </div>
  );
}
