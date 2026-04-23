import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo/defaultMetadata";
import { AlisverisGuvenligiClient } from "./AlisverisGuvenligiClient";

export const metadata: Metadata = buildPageMetadata({
  title: "Alışveriş Güvenliği | İlanlar Cebimde",
  description:
    "İlanlar Cebimde alışveriş güvenliği bilgilendirmesi; ödeme altyapısı, veri güvenliği ve işlem güvenliği yaklaşımını açıklar.",
  path: "/alisveris-guvenligi",
});

export default function AlisverisGuvenligiPage() {
  return <AlisverisGuvenligiClient />;
}
