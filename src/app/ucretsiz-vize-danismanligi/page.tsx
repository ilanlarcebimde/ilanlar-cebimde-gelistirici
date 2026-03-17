import { UcretsizVizeDanismanligiClient } from "./UcretsizVizeDanismanligiClient";

export const metadata = {
  title: "Ücretsiz Vize Danışmanlığı | İlanlar Cebimde",
  description:
    "Vize türüne göre dinamik sorular, zorunlu dosya yükleme ve ön değerlendirme ile akıllı ücretsiz danışmanlık başvurusu.",
};

export default function UcretsizVizeDanismanligiPage() {
  return <UcretsizVizeDanismanligiClient />;
}
