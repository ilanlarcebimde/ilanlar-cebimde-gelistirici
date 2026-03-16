import Link from "next/link";
import { ExternalLink, Landmark } from "lucide-react";

type DuyuruSourceCardProps = {
  sourceName: string;
  sourceUrl: string | null;
};

export function DuyuruSourceCard({ sourceName, sourceUrl }: DuyuruSourceCardProps) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2 text-slate-700">
        <Landmark className="h-4 w-4" />
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-900">Resmi Kaynak</h3>
      </div>

      <p className="mt-3 text-base font-semibold text-slate-900">{sourceName}</p>
      <p className="mt-1 text-sm text-slate-600">
        Bu içerik resmi kurum duyurusuna dayalı olarak hazırlanmıştır.
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        {sourceUrl ? (
          <a
            href={sourceUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-slate-800"
          >
            Resmi Kaynağı Aç
            <ExternalLink className="h-4 w-4" />
          </a>
        ) : null}
        <Link
          href="/yurtdisi-calisma-ve-vize-duyurulari"
          className="inline-flex items-center rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
        >
          Duyurulara Geri Dön
        </Link>
      </div>
    </section>
  );
}
