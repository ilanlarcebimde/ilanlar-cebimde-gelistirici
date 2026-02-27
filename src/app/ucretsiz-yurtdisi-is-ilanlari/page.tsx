import type { Metadata } from "next";
import { Suspense } from "react";
import { UcretsizPanelClient } from "./UcretsizPanelClient";

const CANONICAL = "https://www.ilanlarcebimde.com/ucretsiz-yurtdisi-is-ilanlari";
const TITLE = "Ücretsiz Yurtdışı İş İlanları | İlanlar Cebimde";
const DESCRIPTION = "En güncel ve ücretsiz yurtdışı iş ilanlarını keşfedin. Kariyer fırsatları cebinizde!";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: CANONICAL },
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
