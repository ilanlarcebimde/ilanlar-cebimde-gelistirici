import type { Metadata } from "next";
import { Suspense } from "react";
import { buildPageMetadata } from "@/lib/seo/defaultMetadata";
import { LetterPanelPageClient } from "@/components/letter-panel/LetterPanelPageClient";

const TITLE = "İş Başvuru Mektubu Oluştur | İlanlar Cebimde";
const DESCRIPTION =
  "Yurtdışı iş başvurularınız için maaş, vize, konaklama ve çalışma şartlarını profesyonel şekilde iletebileceğiniz iş başvuru mektubu oluşturma paneli.";

export const metadata: Metadata = buildPageMetadata({
  title: TITLE,
  description: DESCRIPTION,
  path: "/is-basvuru-mektubu-olustur",
});

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
