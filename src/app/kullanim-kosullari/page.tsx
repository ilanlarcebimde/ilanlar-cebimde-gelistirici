import type { Metadata } from "next";
import { KullanimKosullariClient } from "./KullanimKosullariClient";

const SITE_URL = "https://www.ilanlarcebimde.com";

export const metadata: Metadata = {
  title: "Kullanım Koşulları | İlanlar Cebimde",
  description:
    "İlanlar Cebimde kullanım koşulları; site ve hizmetlerin kullanımına ilişkin kuralları, sorumluluk sınırlarını ve kullanıcı yükümlülüklerini açıklar.",
  alternates: {
    canonical: `${SITE_URL}/kullanim-kosullari`,
  },
  openGraph: {
    title: "Kullanım Koşulları | İlanlar Cebimde",
    description:
      "İlanlar Cebimde kullanım koşulları; site ve hizmetlerin kullanımına ilişkin kuralları, sorumluluk sınırlarını ve kullanıcı yükümlülüklerini açıklar.",
    type: "website",
    url: `${SITE_URL}/kullanim-kosullari`,
  },
};

export default function KullanimKosullariPage() {
  return <KullanimKosullariClient />;
}
