import type { Metadata } from "next";
import { HizmetSozlesmesiClient } from "./HizmetSozlesmesiClient";

const SITE_URL = "https://www.ilanlarcebimde.com";

export const metadata: Metadata = {
  title: "Hizmet Sözleşmesi | İlanlar Cebimde",
  description:
    "İlanlar Cebimde hizmet sözleşmesi; hizmet kapsamı, kullanım şartları ve tarafların hak ve yükümlülükleri hakkında bilgilendirme sunar.",
  alternates: {
    canonical: `${SITE_URL}/hizmet-sozlesmesi`,
  },
  openGraph: {
    title: "Hizmet Sözleşmesi | İlanlar Cebimde",
    description:
      "İlanlar Cebimde hizmet sözleşmesi; hizmet kapsamı, kullanım şartları ve tarafların hak ve yükümlülükleri hakkında bilgilendirme sunar.",
    type: "website",
    url: `${SITE_URL}/hizmet-sozlesmesi`,
  },
};

export default function HizmetSozlesmesiPage() {
  return <HizmetSozlesmesiClient />;
}
