import type { Metadata } from "next";
import { Suspense } from "react";
import { UcretsizPanelClient } from "./UcretsizPanelClient";

const CANONICAL = "https://www.ilanlarcebimde.com/ucretsiz-yurtdisi-is-ilanlari";
const TITLE = "Ücretsiz Yurtdışı İş İlanları | İlanlar Cebimde";
const DESCRIPTION = "En güncel ve ücretsiz yurtdışı iş ilanlarını keşfedin. Kariyer fırsatları cebinizde!";
const TWITTER_DESCRIPTION = "En güncel ve ücretsiz yurtdışı iş ilanlarını keşfedin.";
const OG_IMAGE =
  "https://ugvjqnhbkotvvljnseob.supabase.co/storage/v1/object/public/cv-photos/9a241c36-8e88-41cf-9fb3-63ac9f798950/edited-f6244722-7466-402d-944f-bcd04e4d844e.png";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: CANONICAL },
  openGraph: {
    type: "website",
    url: CANONICAL,
    title: TITLE,
    description: DESCRIPTION,
    siteName: "İlanlar Cebimde",
    images: [{ url: OG_IMAGE, width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: TWITTER_DESCRIPTION,
    images: [OG_IMAGE],
  },
};

export default function UcretsizYurtdisiIsIlanlariPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#f8fafc] p-4">
          <p className="text-slate-600">Yükleniyor…</p>
        </div>
      }
    >
      <UcretsizPanelClient />
    </Suspense>
  );
}
