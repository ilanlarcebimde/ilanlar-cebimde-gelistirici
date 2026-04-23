import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo/defaultMetadata";
import { SSSPageClient } from "./SSSPageClient";

export const metadata: Metadata = buildPageMetadata({
  title: "Sıkça Sorulan Sorular | İlanlar Cebimde",
  description:
    "İlanlar Cebimde CV sistemi, başvuru süreci, ilan eşleştirme ve destek hakkında en çok sorulan soruların yanıtları.",
  path: "/sss",
});

export default function SSSPage() {
  return <SSSPageClient />;
}
