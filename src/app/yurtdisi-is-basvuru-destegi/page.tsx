import type { Metadata } from "next";
import { Suspense } from "react";
import { YurtdisiIsBasvuruDestegiClient } from "@/components/yurtdisi-is-basvuru-destegi/YurtdisiIsBasvuruDestegiClient";
import { SITE_ORIGIN } from "@/lib/og";
import { buildPageMetadata } from "@/lib/seo/defaultMetadata";
import { YURTDISI_BASVURU_CANONICAL_PATH, YURTDISI_BASVURU_LEGACY_PATH } from "@/lib/yurtdisiIsBasvuruDestegi/paths";

const CANONICAL = `${SITE_ORIGIN}${YURTDISI_BASVURU_CANONICAL_PATH}`;
const TITLE = "Yurtdışı İş Başvuru Danışmanlığı | Başvuru & Süreç Yönetimi | İlanlar Cebimde";
const DESCRIPTION =
  "Yurtdışı başvurularınızda ilan odağı, başvuru süreç yönetimi ve işverenle ilk bağlantı organizasyonu için kontrollü, şeffaf ve profesyonel danışmanlık. İş sonucu garantisi yoktur; süreç yönetimi odağı.";

export const metadata: Metadata = buildPageMetadata({
  title: TITLE,
  description: DESCRIPTION,
  path: YURTDISI_BASVURU_LEGACY_PATH,
  canonicalUrl: CANONICAL,
  openGraphUrl: `${SITE_ORIGIN}${YURTDISI_BASVURU_LEGACY_PATH}`,
});

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
