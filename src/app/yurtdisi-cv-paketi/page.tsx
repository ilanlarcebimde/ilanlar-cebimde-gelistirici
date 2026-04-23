import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo/defaultMetadata";
import { YurtdisiCvPaketiClient } from "./YurtdisiCvPaketiClient";

const TITLE = "Yurtdışı CV Paketi | Türkçe & İngilizce CV + Başvuru Mektubu";
const DESCRIPTION =
  "Yurtdışı iş başvurusu için Türkçe CV, İngilizce CV ve başvuru mektubu tek pakette. Uluslararası standartlara uygun, form veya sohbet asistanı ile hazırla. 279 TL.";

export const metadata: Metadata = buildPageMetadata({
  title: TITLE,
  description: DESCRIPTION,
  path: "/yurtdisi-cv-paketi",
});

export default function YurtdisiCvPaketiPage() {
  return <YurtdisiCvPaketiClient />;
}
