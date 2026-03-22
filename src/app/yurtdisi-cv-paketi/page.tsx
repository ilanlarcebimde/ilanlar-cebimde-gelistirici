import type { Metadata } from "next";
import { YurtdisiCvPaketiClient } from "./YurtdisiCvPaketiClient";

const SITE_URL = "https://www.ilanlarcebimde.com";
const TITLE = "Yurtdışı CV Paketi | Türkçe & İngilizce CV + Başvuru Mektubu";
const DESCRIPTION =
  "Yurtdışı iş başvurusu için Türkçe CV, İngilizce CV ve başvuru mektubu tek pakette. Uluslararası standartlara uygun, form veya sohbet asistanı ile hazırla. 469 TL.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: {
    canonical: `${SITE_URL}/yurtdisi-cv-paketi`,
  },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    type: "website",
    url: `${SITE_URL}/yurtdisi-cv-paketi`,
    siteName: "İlanlar Cebimde",
    locale: "tr_TR",
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
  },
};

export default function YurtdisiCvPaketiPage() {
  return <YurtdisiCvPaketiClient />;
}
