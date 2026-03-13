import type { Metadata } from "next";
import { HomeClient } from "./HomeClient";

const SITE_URL = "https://www.ilanlarcebimde.com";
const TITLE = "Yurtdışı İş İlanları ve Başvuru Merkezi | İlanlar Cebimde";
const DESCRIPTION =
  "Yurtdışı iş ilanları, firma iletişim bilgileri, İngilizce CV hazırlama ve başvuru mektubu tek platformda. Almanya, Hollanda, Belçika, İrlanda ve daha fazlası için kariyer fırsatlarına hemen ulaşın.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: {
    canonical: SITE_URL,
  },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    type: "website",
    url: SITE_URL,
    siteName: "İlanlar Cebimde",
    locale: "tr_TR",
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
  },
};

export default function Home() {
  return <HomeClient />;
}
