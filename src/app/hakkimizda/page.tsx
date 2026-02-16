import type { Metadata } from "next";
import { AboutPageClient } from "./AboutPageClient";

const SITE_URL = "https://www.ilanlarcebimde.com";

export const metadata: Metadata = {
  title: "İlanlar Cebimde Hakkımızda | Yurtdışı İş Platformu",
  description:
    "İlanlar Cebimde; yurtiçi ve yurtdışında çalışmak isteyen adaylara doğru ilan, doğru kaynak ve sistemli başvuru süreci sunan dijital ekosistemdir.",
  alternates: {
    canonical: `${SITE_URL}/hakkimizda`,
  },
  openGraph: {
    title: "İlanlar Cebimde Hakkımızda",
    description: "Yurtdışında iş arayanlar için güvenilir ilan ve başvuru ekosistemi.",
    type: "website",
    url: `${SITE_URL}/hakkimizda`,
  },
};

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "İlanlar Cebimde",
  url: SITE_URL,
  sameAs: ["https://www.yurtdisieleman.net"],
  description:
    "Yurtdışı iş arayanlara yönelik dijital ilan ve başvuru ekosistemi.",
};

export default function HakkımızdaPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
      />
      <AboutPageClient />
    </>
  );
}
