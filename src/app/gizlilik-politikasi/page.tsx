import type { Metadata } from "next";
import { GizlilikPolicyClient } from "./GizlilikPolicyClient";

const SITE_URL = "https://www.ilanlarcebimde.com";

export const metadata: Metadata = {
  title: "Gizlilik Politikası | İlanlar Cebimde",
  description:
    "İlanlar Cebimde gizlilik politikası; kişisel verilerin işlenmesi, saklanması ve kullanıcı hakları hakkında bilgilendirme sunar.",
  alternates: {
    canonical: `${SITE_URL}/gizlilik-politikasi`,
  },
  openGraph: {
    title: "Gizlilik Politikası | İlanlar Cebimde",
    description:
      "İlanlar Cebimde gizlilik politikası; kişisel verilerin işlenmesi, saklanması ve kullanıcı hakları hakkında bilgilendirme sunar.",
    type: "website",
    url: `${SITE_URL}/gizlilik-politikasi`,
  },
};

export default function GizlilikPolitikasiPage() {
  return <GizlilikPolicyClient />;
}
