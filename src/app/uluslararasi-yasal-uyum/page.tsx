import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo/defaultMetadata";
import { UluslararasiYasalUyumClient } from "./UluslararasiYasalUyumClient";

export const metadata: Metadata = buildPageMetadata({
  title: "Uluslararası Yasal Uyum | İlanlar Cebimde",
  description:
    "İlanlar Cebimde uluslararası yasal uyum ilkeleri; veri işleme, kullanıcı yönlendirme ve başvuru süreçlerinde hukuki çerçeveyi açıklar.",
  path: "/uluslararasi-yasal-uyum",
});

export default function UluslararasiYasalUyumPage() {
  return <UluslararasiYasalUyumClient />;
}
