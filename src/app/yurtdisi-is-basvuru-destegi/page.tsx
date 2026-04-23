import type { Metadata } from "next";
import { Suspense } from "react";
import { YurtdisiIsBasvuruDestegiClient } from "@/components/yurtdisi-is-basvuru-destegi/YurtdisiIsBasvuruDestegiClient";
import { DEFAULT_OG_IMAGE, SITE_ORIGIN } from "@/lib/og";

const PATH = "/yurtdisi-is-basvuru-destegi";
const CANONICAL = `${SITE_ORIGIN}${PATH}`;
const TITLE = "Yurtdışı İş Başvuru Desteği | Başvuru & Süreç Yönetimi | İlanlar Cebimde";
const DESCRIPTION =
  "Yurtdışı başvurularınızda ilan odağı, başvuru süreç yönetimi ve işverenle ilk bağlantı organizasyonu için kontrollü, şeffaf ve profesyonel destek. İş sonucu garantisi yoktur; süreç yönetimi odağı.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: CANONICAL },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    type: "website",
    url: CANONICAL,
    siteName: "İlanlar Cebimde",
    images: [{ url: DEFAULT_OG_IMAGE, width: 1200, height: 630, alt: "Yurtdışı İş Başvuru Desteği" }],
    locale: "tr_TR",
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: [DEFAULT_OG_IMAGE],
  },
};

export default function YurtdisiIsBasvuruDestegiPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#F6F1E8] text-[#0f1a2c]">Yükleniyor…</div>
      }
    >
      <YurtdisiIsBasvuruDestegiClient />
    </Suspense>
  );
}
