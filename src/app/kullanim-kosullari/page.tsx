import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo/defaultMetadata";
import { KullanimKosullariClient } from "./KullanimKosullariClient";

export const metadata: Metadata = buildPageMetadata({
  title: "Kullanım Koşulları | İlanlar Cebimde",
  description:
    "İlanlar Cebimde kullanım koşulları; site ve hizmetlerin kullanımına ilişkin kuralları, sorumluluk sınırlarını ve kullanıcı yükümlülüklerini açıklar.",
  path: "/kullanim-kosullari",
});

export default function KullanimKosullariPage() {
  return <KullanimKosullariClient />;
}
