import type { Metadata } from "next";
import { CerezPolicyClient } from "./CerezPolicyClient";

const SITE_URL = "https://www.ilanlarcebimde.com";

export const metadata: Metadata = {
  title: "Çerez Politikası | İlanlar Cebimde",
  description:
    "İlanlar Cebimde çerez politikası; çerez türleri, kullanım amaçları ve tercihlerin yönetimi hakkında bilgilendirme sunar.",
  alternates: {
    canonical: `${SITE_URL}/cerez-politikasi`,
  },
  openGraph: {
    title: "Çerez Politikası | İlanlar Cebimde",
    description:
      "İlanlar Cebimde çerez politikası; çerez türleri, kullanım amaçları ve tercihlerin yönetimi hakkında bilgilendirme sunar.",
    type: "website",
    url: `${SITE_URL}/cerez-politikasi`,
  },
};

export default function CerezPolitikasiPage() {
  return <CerezPolicyClient />;
}
