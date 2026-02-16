import type { Metadata } from "next";
import { SSSPageClient } from "./SSSPageClient";

const SITE_URL = "https://www.ilanlarcebimde.com";

export const metadata: Metadata = {
  title: "Sıkça Sorulan Sorular | İlanlar Cebimde",
  description:
    "İlanlar Cebimde CV sistemi, başvuru süreci, ilan eşleştirme ve destek hakkında en çok sorulan soruların yanıtları.",
  alternates: {
    canonical: `${SITE_URL}/sss`,
  },
  openGraph: {
    title: "Sıkça Sorulan Sorular | İlanlar Cebimde",
    description:
      "İlanlar Cebimde CV sistemi, başvuru süreci, ilan eşleştirme ve destek hakkında en çok sorulan soruların yanıtları.",
    type: "website",
    url: `${SITE_URL}/sss`,
  },
};

export default function SSSPage() {
  return <SSSPageClient />;
}
