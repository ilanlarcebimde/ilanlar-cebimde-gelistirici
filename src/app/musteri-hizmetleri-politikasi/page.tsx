import type { Metadata } from "next";
import { MusteriHizmetleriPolitikasiClient } from "./MusteriHizmetleriPolitikasiClient";

const SITE_URL = "https://www.ilanlarcebimde.com";

export const metadata: Metadata = {
  title: "Müşteri Hizmetleri Politikası | İlanlar Cebimde",
  description:
    "İlanlar Cebimde müşteri hizmetleri politikası; destek kanalları, geri dönüş süreleri, şikayet/öneri süreçleri ve iletişim ilkelerini açıklar.",
  alternates: {
    canonical: `${SITE_URL}/musteri-hizmetleri-politikasi`,
  },
  openGraph: {
    title: "Müşteri Hizmetleri Politikası | İlanlar Cebimde",
    description:
      "İlanlar Cebimde müşteri hizmetleri politikası; destek kanalları, geri dönüş süreleri, şikayet/öneri süreçleri ve iletişim ilkelerini açıklar.",
    type: "website",
    url: `${SITE_URL}/musteri-hizmetleri-politikasi`,
  },
};

export default function MusteriHizmetleriPolitikasiPage() {
  return <MusteriHizmetleriPolitikasiClient />;
}
