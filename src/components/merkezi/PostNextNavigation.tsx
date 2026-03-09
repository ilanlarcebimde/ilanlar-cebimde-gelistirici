import Link from "next/link";

interface PostNextNavigationProps {
  nextSlug: string | null;
}

export function PostNextNavigation({ nextSlug }: PostNextNavigationProps) {
  return (
    <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-4 text-center shadow-sm sm:p-5">
      <p className="text-sm font-semibold text-slate-900">
        {nextSlug
          ? "Bu ilanın sonuna geldiniz"
          : "Şu anda gösterilecek başka ilan bulunamadı"}
      </p>

      {nextSlug ? (
        <>
          <p className="mt-1 text-sm text-slate-600">
            Sonraki ilana geçmek için aşağıdaki butona dokunun.
          </p>
          <Link
            href={`/yurtdisi-is-ilanlari/${nextSlug}`}
            className="mt-4 inline-flex h-11 items-center justify-center rounded-xl bg-slate-900 px-5 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Sonraki ilanı getir
          </Link>
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
