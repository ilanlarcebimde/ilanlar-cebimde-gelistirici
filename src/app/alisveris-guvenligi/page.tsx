import type { Metadata } from "next";
import { AlisverisGuvenligiClient } from "./AlisverisGuvenligiClient";

const SITE_URL = "https://www.ilanlarcebimde.com";

export const metadata: Metadata = {
  title: "Alışveriş Güvenliği | İlanlar Cebimde",
  description:
    "İlanlar Cebimde alışveriş güvenliği bilgilendirmesi; ödeme altyapısı, veri güvenliği ve işlem güvenliği yaklaşımını açıklar.",
  alternates: {
    canonical: `${SITE_URL}/alisveris-guvenligi`,
  },
  openGraph: {
    title: "Alışveriş Güvenliği | İlanlar Cebimde",
    description:
      "İlanlar Cebimde alışveriş güvenliği bilgilendirmesi; ödeme altyapısı, veri güvenliği ve işlem güvenliği yaklaşımını açıklar.",
    type: "website",
    url: `${SITE_URL}/alisveris-guvenligi`,
  },
};

export default function AlisverisGuvenligiPage() {
  return <AlisverisGuvenligiClient />;
}
