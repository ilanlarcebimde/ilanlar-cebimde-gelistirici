import type { Metadata } from "next";
import { Suspense } from "react";
import { LetterPanelPageClient } from "@/components/letter-panel/LetterPanelPageClient";
import { DEFAULT_OG_IMAGE } from "@/lib/og";

const CANONICAL = "https://www.ilanlarcebimde.com/is-basvuru-mektubu-olustur";
const TITLE = "İş Başvuru Mektubu Oluştur | İlanlar Cebimde";
const DESCRIPTION =
  "Yurtdışı iş başvurularınız için maaş, vize, konaklama ve çalışma şartlarını profesyonel şekilde iletebileceğiniz iş başvuru mektubu oluşturma paneli.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: CANONICAL },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: CANONICAL,
    siteName: "İlanlar Cebimde",
    images: [{ url: DEFAULT_OG_IMAGE, width: 1200, height: 630, alt: "İş Başvuru Mektubu Oluştur" }],
    locale: "tr_TR",
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: [DEFAULT_OG_IMAGE],
  },
};

function LetterPanelFallback() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center bg-slate-50 text-slate-600">
      Yükleniyor…
    </div>
  );
}

export default function IsBasvuruMektubuOlusturPage() {
  return (
    <Suspense fallback={<LetterPanelFallback />}>
      <LetterPanelPageClient />
    </Suspense>
  );
}
