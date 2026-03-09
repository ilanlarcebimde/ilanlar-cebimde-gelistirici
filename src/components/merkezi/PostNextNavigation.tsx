import Link from "next/link";

interface PostNextNavigationProps {
  previousSlug: string | null;
  nextSlug: string | null;
}

export function PostNextNavigation({
  previousSlug,
  nextSlug,
}: PostNextNavigationProps) {
  const hasAnyNavigation = Boolean(previousSlug || nextSlug);

  return (
    <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-4 text-center shadow-sm sm:p-5">
      <p className="text-sm font-semibold text-slate-900">
        {hasAnyNavigation
          ? "Bu ilanın sonuna geldiniz"
          : "Şu anda gösterilecek başka ilan bulunamadı"}
      </p>

      {hasAnyNavigation ? (
        <>
          <p className="mt-1 text-sm text-slate-600">
            Listedeki sıraya göre önceki veya sonraki ilana geçmek için aşağıdaki butonları kullanın.
          </p>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:justify-center">
            {previousSlug && (
              <Link
                href={`/yurtdisi-is-ilanlari/${previousSlug}`}
                className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Önceki ilan
              </Link>
            )}
            {nextSlug && (
              <Link
                href={`/yurtdisi-is-ilanlari/${nextSlug}`}
                className="inline-flex h-11 items-center justify-center rounded-xl bg-slate-900 px-5 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Sonraki ilan
              </Link>
            )}
          </div>
        </>
      ) : (
        <p className="mt-1 text-sm text-slate-500">
          Daha sonra yeni ilanlar eklendiğinde burada görünecek.
        </p>
      )}

      <div className="mt-4 flex items-center gap-3 text-xs text-slate-400">
        <span className="h-px flex-1 bg-slate-200" />
        <span>İlan sırası</span>
        <span className="h-px flex-1 bg-slate-200" />
      </div>
    </div>
  );
}
