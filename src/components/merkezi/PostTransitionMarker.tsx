"use client";

interface PostTransitionMarkerProps {
  loading?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
}

export function PostTransitionMarker({
  loading = false,
  hasMore = true,
  onLoadMore,
}: PostTransitionMarkerProps) {
  return (
    <div className="my-8 rounded-2xl border border-slate-200 bg-white p-4 text-center shadow-sm sm:p-5">
      <p className="text-sm font-semibold text-slate-900">
        {hasMore ? "Bu ilanın sonuna geldiniz" : "Şu anda gösterilecek başka ilan bulunamadı"}
      </p>
      {hasMore ? (
        <>
          <p className="mt-1 text-sm text-slate-600">
            Benzer ilanlara devam etmek için aşağıdaki butona dokunun.
          </p>
          <button
            type="button"
            onClick={onLoadMore}
            disabled={loading}
            className="mt-4 inline-flex h-11 items-center justify-center rounded-xl bg-slate-900 px-5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Sıradaki ilan getiriliyor..." : "Sonraki ilanı getir"}
          </button>
        </>
      ) : (
        <p className="mt-1 text-sm text-slate-500">
          Daha sonra yeni ilanlar eklendiğinde burada görünecek.
        </p>
      )}
      <div className="mt-4 flex items-center gap-3 text-xs text-slate-400">
        <span className="h-px flex-1 bg-slate-200" />
        <span>İlan akışı</span>
        <span className="h-px flex-1 bg-slate-200" />
      </div>
    </div>
  );
}
