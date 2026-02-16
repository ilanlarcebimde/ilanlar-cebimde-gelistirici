import type { Metadata } from "next";
import { ContactPageClient } from "./ContactPageClient";

const SITE_URL = "https://www.ilanlarcebimde.com";

export const metadata: Metadata = {
  title: "İletişim | İlanlar Cebimde",
  description:
    "İlanlar Cebimde iletişim kanalları: destek e-postaları ve WhatsApp hattı. Dilek, öneri, şikayet ve destek talepleriniz için bize ulaşın.",
  alternates: {
    canonical: `${SITE_URL}/iletisim`,
  },
  openGraph: {
    title: "İletişim | İlanlar Cebimde",
    description: "Destek, öneri ve şikayetleriniz için e-posta ve WhatsApp üzerinden bize ulaşın.",
    type: "website",
    url: `${SITE_URL}/iletisim`,
  },
};

const contactPointJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "İlanlar Cebimde",
  url: SITE_URL,
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
