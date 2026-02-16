import type { Metadata } from "next";
import { SorumlulukReddiBeyaniClient } from "./SorumlulukReddiBeyaniClient";

const SITE_URL = "https://www.ilanlarcebimde.com";

export const metadata: Metadata = {
  title: "Sorumluluk Reddi Beyanı | İlanlar Cebimde",
  description:
    "İlanlar Cebimde sorumluluk reddi beyanı; içerik, ilan yönlendirme ve kullanıcı beyanlarına ilişkin hukuki bilgilendirme metnidir.",
  alternates: {
    canonical: `${SITE_URL}/sorumluluk-reddi-beyani`,
  },
  openGraph: {
    title: "Sorumluluk Reddi Beyanı | İlanlar Cebimde",
    description:
      "İlanlar Cebimde sorumluluk reddi beyanı; içerik, ilan yönlendirme ve kullanıcı beyanlarına ilişkin hukuki bilgilendirme metnidir.",
    type: "website",
    url: `${SITE_URL}/sorumluluk-reddi-beyani`,
  },
};

export default function SorumlulukReddiBeyaniPage() {
  return <SorumlulukReddiBeyaniClient />;
}
