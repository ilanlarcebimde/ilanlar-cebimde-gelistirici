"use client";

import Link from "next/link";
import { Briefcase, CreditCard, Globe2, ListOrdered, Sparkles, ArrowUpRight } from "lucide-react";
import { LISTING_PACKAGES, targetDisplayWithFlag } from "@/lib/yurtdisiIsBasvuruDestegi/constants";

export type YurtdisiPanelApplicationRow = {
  id: string;
  status: string;
  profession_label: string | null;
  country_count: number | null;
  listing_package_id: number | null;
  amount_try: number | null;
  created_at: string;
  payment_id: string | null;
  full_payload?: Record<string, unknown> | null;
};

const APP_STATUS: Record<string, { label: string; tone: string; dot: string }> = {
  beklemede: {
    label: "Sırada",
    tone: "bg-amber-100 text-amber-950 ring-1 ring-amber-300/50",
    dot: "bg-amber-500",
  },
  hazirlaniyor: {
    label: "Hazırlanıyor",
    tone: "bg-sky-100 text-sky-950 ring-1 ring-sky-300/50",
    dot: "bg-sky-500",
  },
  islemde: {
    label: "İşlemde",
    tone: "bg-violet-100 text-violet-950 ring-1 ring-violet-300/50",
    dot: "bg-violet-500",
  },
  tamamlandi: {
    label: "Tamamlandı",
    tone: "bg-emerald-100 text-emerald-900 ring-1 ring-emerald-300/50",
    dot: "bg-emerald-500",
  },
  iptal: { label: "İptal", tone: "bg-slate-200 text-slate-800 ring-1 ring-slate-300/60", dot: "bg-slate-500" },
};

type Snapshotish = {
  profession_label?: string;
  pricing?: { country_keys?: string[]; listing_package_id?: number };
  form?: { fullName?: string };
  priceBreakdown?: { totalTry?: number };
};

function readSnapshot(row: YurtdisiPanelApplicationRow): {
  profession: string;
  countryLabels: string[];
  listingLabel: string;
  customerName: string | null;
} {
  const raw = row.full_payload;
  const snap: Snapshotish | null =
    raw && typeof raw === "object" && raw !== null && "pricing" in raw ? (raw as Snapshotish) : null;
  const profession =
    (typeof snap?.profession_label === "string" && snap.profession_label) ||
    row.profession_label ||
    "—";
  const keys = Array.isArray(snap?.pricing?.country_keys) ? snap.pricing!.country_keys! : [];
  const countryLabels =
    keys.length > 0
      ? keys.map((k) => (typeof k === "string" ? targetDisplayWithFlag(k) : String(k)))
      : row.country_count != null && row.country_count > 0
        ? [`${row.country_count} hedef (ülke / bölge)`]
        : [];
  const lpId = snap?.pricing?.listing_package_id ?? row.listing_package_id;
  const listingLabel =
    LISTING_PACKAGES.find((p) => p.id === lpId)?.label ?? (lpId != null ? `${lpId} ilanlı paket` : "—");
  const customerName =
    snap?.form && typeof snap.form.fullName === "string" && snap.form.fullName.trim()
      ? snap.form.fullName.trim()
      : null;
  return { profession, countryLabels, listingLabel, customerName };
}

function formatTry(n: number) {
  return new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 }).format(n);
}

function serviceStatusNarration(status: string): string {
  const m: Record<string, string> = {
    beklemede: "Ekibiniz sırada; başvurunuz önümüzdeki adımlar için değerlendirilecek.",
    hazirlaniyor: "Belgeler ve hedefe uygun ilan odağınız üzerinde çalışılıyor.",
    islemde: "Süreç yürüyor; ilerleme bu kart üzerinden güncellenir.",
    tamamlandi: "Bu sipariş kapsamındaki operasyonel adımlar tamamlandı.",
    iptal: "Bu kayıt iptal edildi.",
  };
  return m[status] ?? "Güncel operasyon durumunuz yukarıdaki rozetle gösterilir.";
}

export function YurtdisiBasvuruPurchaseCard({ row }: { row: YurtdisiPanelApplicationRow }) {
  const statusMeta = APP_STATUS[row.status] ?? {
    label: row.status,
    tone: "bg-slate-100 text-slate-800 ring-1 ring-slate-200",
    dot: "bg-slate-400",
  };
  const { profession, countryLabels, listingLabel, customerName } = readSnapshot(row);
  const amount =
    row.amount_try != null && Number.isFinite(row.amount_try) ? formatTry(row.amount_try) : "—";
  const orderDate = new Date(row.created_at);
  const dateStr = new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(orderDate);
  const timeStr = new Intl.DateTimeFormat("tr-TR", { hour: "2-digit", minute: "2-digit" }).format(orderDate);

  return (
    <article
      className="overflow-hidden rounded-2xl border border-[#0f1a2c]/10 bg-gradient-to-b from-[#FEFDFB] via-white to-[#F6F1E8]/80 text-[#0f1a2c] shadow-[0_20px_50px_-24px_rgba(15,26,44,0.35)] ring-1 ring-amber-500/20"
    >
      <div className="border-b border-[#0f1a2c]/6 bg-gradient-to-r from-[#0f1a2c] via-[#122032] to-[#152a3d] px-4 py-3 sm:px-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-amber-200/90">
              <Sparkles className="h-3.5 w-3.5 text-amber-300" aria-hidden />
              Premium satın alım
            </p>
            <h3 className="mt-0.5 font-serif text-base font-semibold text-[#FEFDFB] sm:text-lg">Yurtdışı İş Başvuru Danışmanlığı</h3>
            <p className="mt-0.5 text-[11px] font-medium text-amber-100/80">Hizmet tipi: Yurtdışı işe başvuru danışmanlığı</p>
            {customerName && <p className="mt-0.5 text-xs text-slate-300/95">Başvuru: {customerName}</p>}
          </div>
          <Link
            href="/yurtdisi-is-basvuru-danismanligi"
            className="group inline-flex shrink-0 items-center gap-1 rounded-full border border-amber-400/25 bg-white/5 px-2.5 py-1.5 text-[11px] font-medium text-amber-100 transition hover:border-amber-400/50 hover:text-white"
            title="Yurtdışı İş Başvuru Danışmanlığı sayfası"
          >
            Hizmet
            <ArrowUpRight className="h-3.5 w-3.5 opacity-80 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
        </div>
      </div>

      <div className="grid gap-4 p-4 sm:grid-cols-2 sm:gap-5 sm:px-5 sm:pb-4 sm:pt-4">
        <div className="rounded-xl border border-[#0f1a2c]/8 bg-white/90 p-3.5 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Hizmet durumu</p>
          <div className="mt-2 flex items-center gap-2">
            <span className={`h-2 w-2 shrink-0 rounded-full ${statusMeta.dot}`} aria-hidden />
            <span className={`inline-flex w-fit rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusMeta.tone}`}>
              {statusMeta.label}
            </span>
          </div>
          <p className="mt-2.5 text-xs leading-relaxed text-slate-600">{serviceStatusNarration(row.status)}</p>
        </div>

        <div className="rounded-xl border border-[#0f1a2c]/8 bg-gradient-to-b from-amber-50/80 to-white p-3.5 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Ödeme</p>
          <div className="mt-1.5 flex items-baseline gap-2">
            <span className="text-xl font-bold tabular-nums text-[#0f1a2c]">{amount}</span>
            <span className="text-xs font-medium text-emerald-800">Alındı</span>
          </div>
          <p className="mt-1.5 flex items-center gap-1.5 text-xs text-slate-600">
            <CreditCard className="h-3.5 w-3.5 shrink-0 text-amber-700/80" aria-hidden />
            {dateStr} · {timeStr}
          </p>
        </div>
      </div>

      <div className="border-t border-[#0f1a2c]/6 bg-[#F6F1E8]/50 px-4 py-3.5 sm:px-5 sm:py-4">
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Satın alım özeti</p>
        <dl className="mt-2.5 space-y-2.5 text-sm text-slate-800">
          <div className="flex gap-2.5 sm:items-start">
            <dt className="flex w-36 shrink-0 items-center gap-1.5 text-xs font-medium text-slate-500">
              <Briefcase className="h-3.5 w-3.5 text-amber-800/80" aria-hidden />
              Seçilen meslek
            </dt>
            <dd className="min-w-0 flex-1 text-sm font-medium leading-snug text-[#0f1a2c]">{profession}</dd>
          </div>
          <div className="flex gap-2.5 sm:items-start">
            <dt className="flex w-36 shrink-0 items-center gap-1.5 text-xs font-medium text-slate-500">
              <Globe2 className="h-3.5 w-3.5 text-amber-800/80" aria-hidden />
              Hedef (ülke / bölge)
            </dt>
            <dd className="min-w-0 flex-1">
              {countryLabels.length > 0 ? (
                <ul className="flex flex-wrap gap-1.5">
                  {countryLabels.map((c) => (
                    <li
                      key={c}
                      className="rounded-md border border-[#0f1a2c]/10 bg-white px-2 py-0.5 text-xs font-medium text-slate-800"
                    >
                      {c}
                    </li>
                  ))}
                </ul>
              ) : (
                <span className="text-sm text-slate-500">—</span>
              )}
            </dd>
          </div>
          <div className="flex gap-2.5 sm:items-center">
            <dt className="flex w-32 shrink-0 items-center gap-1.5 text-xs font-medium text-slate-500">
              <ListOrdered className="h-3.5 w-3.5 text-amber-800/80" aria-hidden />
              İlan paketi
            </dt>
            <dd className="min-w-0 flex-1 text-sm font-medium text-[#0f1a2c]">{listingLabel}</dd>
          </div>
        </dl>
        <p className="mt-3 border-t border-[#0f1a2c]/5 pt-2.5 text-[11px] text-slate-500">
          Detaylar operasyon ve fatura ekipleri tarafında <span className="font-medium text-slate-600">kayıt numarası</span>{" "}
          <code className="rounded bg-slate-200/80 px-1 py-0.5 font-mono text-[10px] text-slate-800">{row.id.slice(0, 8)}…</code>{" "}
          ile eşleştirilir.
        </p>
      </div>
    </article>
  );
}
