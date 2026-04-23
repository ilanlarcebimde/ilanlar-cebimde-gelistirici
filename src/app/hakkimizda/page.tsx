import type { Metadata } from "next";
import { SITE_ORIGIN } from "@/lib/og";
import { buildPageMetadata } from "@/lib/seo/defaultMetadata";
import { AboutPageClient } from "./AboutPageClient";

export const metadata: Metadata = buildPageMetadata({
  title: "İlanlar Cebimde Hakkımızda | Yurtdışı İş Platformu",
  description:
    "İlanlar Cebimde; yurtiçi ve yurtdışında çalışmak isteyen adaylara doğru ilan, doğru kaynak ve sistemli başvuru süreci sunan dijital ekosistemdir.",
  path: "/hakkimizda",
});

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "İlanlar Cebimde",
  url: SITE_ORIGIN,
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
