import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo/defaultMetadata";
import { UcretsizVizeDanismanligiClient } from "./UcretsizVizeDanismanligiClient";

export const metadata: Metadata = buildPageMetadata({
  title: "Ücretsiz Vize Danışmanlığı | İlanlar Cebimde",
  description:
    "Vize türüne göre dinamik sorular, zorunlu dosya yükleme ve ön değerlendirme ile akıllı ücretsiz danışmanlık başvurusu.",
  path: "/ucretsiz-vize-danismanligi",
});

export default function UcretsizVizeDanismanligiPage() {
  return <UcretsizVizeDanismanligiClient />;
}
