import type { Metadata } from "next";
import { IadeVeGeriOdemeClient } from "./IadeVeGeriOdemeClient";

const SITE_URL = "https://www.ilanlarcebimde.com";

export const metadata: Metadata = {
  title: "İade ve Geri Ödeme | İlanlar Cebimde",
  description:
    "İlanlar Cebimde iade ve geri ödeme politikası; iptal, iade şartları ve geri ödeme süreçleri hakkında bilgilendirme sunar.",
  alternates: {
    canonical: `${SITE_URL}/iade-ve-geri-odeme`,
  },
  openGraph: {
    title: "İade ve Geri Ödeme | İlanlar Cebimde",
    description:
      "İlanlar Cebimde iade ve geri ödeme politikası; iptal, iade şartları ve geri ödeme süreçleri hakkında bilgilendirme sunar.",
    type: "website",
    url: `${SITE_URL}/iade-ve-geri-odeme`,
  },
};

export default function IadeVeGeriOdemePage() {
  return <IadeVeGeriOdemeClient />;
}
