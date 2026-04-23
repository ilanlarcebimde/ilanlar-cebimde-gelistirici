import type { Metadata } from "next";
import { SITE_ORIGIN } from "@/lib/og";
import { buildPageMetadata } from "@/lib/seo/defaultMetadata";
import { ContactPageClient } from "./ContactPageClient";

export const metadata: Metadata = buildPageMetadata({
  title: "İletişim | İlanlar Cebimde",
  description:
    "İlanlar Cebimde iletişim kanalları: destek e-postaları ve WhatsApp hattı. Dilek, öneri, şikayet ve destek talepleriniz için bize ulaşın.",
  path: "/iletisim",
});

const contactPointJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "İlanlar Cebimde",
  url: SITE_ORIGIN,
  contactPoint: {
    "@type": "ContactPoint",
    email: "destek@ilanlarcebimde.com",
    contactType: "customer support",
    availableLanguage: "tr",
  },
};

export default function IletisimPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(contactPointJsonLd) }}
      />
      <ContactPageClient />
    </>
  );
}
