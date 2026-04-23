import type { Metadata } from "next";
import { Suspense } from "react";
import { buildPageMetadata } from "@/lib/seo/defaultMetadata";
import { YurtdisiPanelClient } from "./YurtdisiPanelClient";

export const metadata: Metadata = buildPageMetadata({
  title: "Yurtdışı İş İlanları | İlanlar Cebimde",
  description:
    "Biz sizin için araştırıyor, doğruluyor ve tek merkezde sunuyoruz. Güncel iş ilanları, resmi duyurular ve güvenli başvuru bağlantıları.",
  path: "/yurtdisi-is-ilanlari",
});

export default function YurtdisiIsIlanlariPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">Yükleniyor…</div>}>
      <YurtdisiPanelClient />
    </Suspense>
  );
}
