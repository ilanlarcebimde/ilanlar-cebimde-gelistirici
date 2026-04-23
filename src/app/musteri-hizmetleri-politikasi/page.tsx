import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo/defaultMetadata";
import { MusteriHizmetleriPolitikasiClient } from "./MusteriHizmetleriPolitikasiClient";

export const metadata: Metadata = buildPageMetadata({
  title: "Müşteri Hizmetleri Politikası | İlanlar Cebimde",
  description:
    "İlanlar Cebimde müşteri hizmetleri politikası; destek kanalları, geri dönüş süreleri, şikayet/öneri süreçleri ve iletişim ilkelerini açıklar.",
  path: "/musteri-hizmetleri-politikasi",
});

export default function MusteriHizmetleriPolitikasiPage() {
  return <MusteriHizmetleriPolitikasiClient />;
}
