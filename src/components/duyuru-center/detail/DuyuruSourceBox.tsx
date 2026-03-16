import Link from "next/link";
import { ExternalLink } from "lucide-react";

type DuyuruSourceBoxProps = {
  sourceName: string | null;
  sourceUrl: string | null;
};

export function DuyuruSourceBox({ sourceName, sourceUrl }: DuyuruSourceBoxProps) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-900">Resmi Kaynak</h3>
      <p className="mt-2 text-sm text-slate-600">{sourceName?.trim() || "Resmi kurum"}</p>

      {sourceUrl?.trim() ? (
        <a
          href={sourceUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-4 inline-flex items-center gap-1 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-slate-800"
        >
          Resmi Kaynağı Aç
          <ExternalLink className="h-4 w-4" />
        </a>
      ) : (
        <p className="mt-3 text-xs text-slate-500">Bu duyuru için kaynak bağlantısı eklenmemiş.</p>
      )}

      <div className="mt-4">
        <Link
          href="/yurtdisi-calisma-ve-vize-duyurulari"
          className="inline-flex rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Duyurulara Geri Dön
        </Link>
      </div>
    </section>
  );
}
