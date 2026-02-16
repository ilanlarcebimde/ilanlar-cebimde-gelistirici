import type { Metadata } from "next";
import { UluslararasiYasalUyumClient } from "./UluslararasiYasalUyumClient";

const SITE_URL = "https://www.ilanlarcebimde.com";

export const metadata: Metadata = {
  title: "Uluslararası Yasal Uyum | İlanlar Cebimde",
  description:
    "İlanlar Cebimde uluslararası yasal uyum ilkeleri; veri işleme, kullanıcı yönlendirme ve başvuru süreçlerinde hukuki çerçeveyi açıklar.",
  alternates: {
    canonical: `${SITE_URL}/uluslararasi-yasal-uyum`,
  },
  openGraph: {
    title: "Uluslararası Yasal Uyum | İlanlar Cebimde",
    description:
      "İlanlar Cebimde uluslararası yasal uyum ilkeleri; veri işleme, kullanıcı yönlendirme ve başvuru süreçlerinde hukuki çerçeveyi açıklar.",
    type: "website",
    url: `${SITE_URL}/uluslararasi-yasal-uyum`,
  },
};

export default function UluslararasiYasalUyumPage() {
  return <UluslararasiYasalUyumClient />;
}
