import type { Metadata } from "next";
import { Suspense } from "react";
import { UcretsizPanelClient } from "./UcretsizPanelClient";

const CANONICAL = "https://www.ilanlarcebimde.com/ucretsiz-yurtdisi-is-ilanlari";
const TITLE = "Ücretsiz Yurtdışı İş İlanları | Güncel İlan Akışı – İlanlar Cebimde";
const DESCRIPTION =
  "Ücretsiz yurtdışı iş ilanları akışı: Katar, İrlanda, Alaska, Belçika ve daha fazlası. Güncel ilanlar, resmi duyurular ve güvenli yönlendirmeler tek sayfada.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: CANONICAL },
  openGraph: {
    url: CANONICAL,
    title: TITLE,
    description: DESCRIPTION,
    siteName: "İlanlar Cebimde",
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
  },
};

export default function UcretsizYurtdisiIsIlanlariPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#f8fafc] p-4">
          <p className="text-slate-600">Yükleniyor…</p>
        </div>
      }
    >
      <UcretsizPanelClient />
    </Suspense>
  );
}
