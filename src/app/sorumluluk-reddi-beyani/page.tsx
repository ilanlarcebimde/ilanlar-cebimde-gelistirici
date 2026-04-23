import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo/defaultMetadata";
import { SorumlulukReddiBeyaniClient } from "./SorumlulukReddiBeyaniClient";

export const metadata: Metadata = buildPageMetadata({
  title: "Sorumluluk Reddi Beyanı | İlanlar Cebimde",
  description:
    "İlanlar Cebimde sorumluluk reddi beyanı; içerik, ilan yönlendirme ve kullanıcı beyanlarına ilişkin hukuki bilgilendirme metnidir.",
  path: "/sorumluluk-reddi-beyani",
});

export default function SorumlulukReddiBeyaniPage() {
  return <SorumlulukReddiBeyaniClient />;
}
