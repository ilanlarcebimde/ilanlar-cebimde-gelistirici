"use client";

import Link from "next/link";
import { SafeExternalLink } from "@/components/common/SafeExternalLink";

const EXTERNAL_SERVICES_URL = "https://linktr.ee/yurtdisieleman.net";

const INTERNAL_LINKS = [
  { href: "/usta-basvuru-paketi", label: "Usta Başvuru Paketi" },
  { href: "/yurtdisi-cv-paketi", label: "Yurtdışı CV Paketi" },
  { href: "/ucretsiz-yurtdisi-is-ilanlari", label: "Ücretsiz Yurtdışı İş İlanları" },
];

const buttonClass =
  "inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 hover:border-slate-300 transition-colors";

/**
 * Ücretsiz içerikte (is_paid=false) gösterilir. 4 buton: 3 internal + 1 external (SafeExternalLink).
 */
export function FaydaliLinkler() {
  return (
    <aside className="rounded-xl border border-slate-200 bg-slate-50/80 p-5">
      <h2 className="mb-1 text-lg font-semibold text-slate-900">Faydalı Linkler</h2>
      <p className="mb-4 text-sm text-slate-600">
        Başvurunuzu güçlendirmek ve hizmetlerimizden yararlanmak için aşağıdaki linklere göz atın.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        {INTERNAL_LINKS.map(({ href, label }) => (
          <Link key={href} href={href} className={buttonClass}>
            {label}
          </Link>
        ))}
        <SafeExternalLink
          href={EXTERNAL_SERVICES_URL}
          className={buttonClass}
          aria-label="Tüm Hizmetleri Görüntüle (yeni sekmede açılır)"
        >
          Tüm Hizmetleri Görüntüle
          <span className="text-slate-400" aria-hidden>↗</span>
        </SafeExternalLink>
      </div>
    </aside>
  );
}
