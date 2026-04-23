import type { Metadata } from "next";
import { Suspense } from "react";
import { UcretsizPanelClient } from "./UcretsizPanelClient";
import { buildPageMetadata } from "@/lib/seo/defaultMetadata";

const CANONICAL = "https://www.ilanlarcebimde.com/ucretsiz-yurtdisi-is-ilanlari";
const TITLE = "Ücretsiz Yurtdışı İş İlanları | İlanlar Cebimde";
const DESCRIPTION = "En güncel ve ücretsiz yurtdışı iş ilanlarını keşfedin. Kariyer fırsatları cebinizde!";

// Ülke / kanal slug → OG görseli (önerilen boyut: 1200×630)
const COUNTRY_OG_IMAGES: Record<string, string> = {
  belcika: "https://ugvjqnhbkotvvljnseob.supabase.co/storage/v1/object/public/cv-photos/belcika%20kapak-%20fotografi.jpg",
  estonya: "https://ugvjqnhbkotvvljnseob.supabase.co/storage/v1/object/public/cv-photos/estonya_kanal_gorseli_ilanlar_cebimde.jpg",
  finlandiya: "https://ugvjqnhbkotvvljnseob.supabase.co/storage/v1/object/public/cv-photos/finlandiya_kapak_gorseli.jpg",
  malta: "https://ugvjqnhbkotvvljnseob.supabase.co/storage/v1/object/public/cv-photos/MALTA%20SOSYAL%20PAYLASIM.jpg",
  polonya: "https://ugvjqnhbkotvvljnseob.supabase.co/storage/v1/object/public/cv-photos/polonya%20kapak.jpg",
  dubai: "https://ugvjqnhbkotvvljnseob.supabase.co/storage/v1/object/public/cv-photos/dubai%20sosyal%20paylasim.jpg",
  yunanistan: "https://ugvjqnhbkotvvljnseob.supabase.co/storage/v1/object/public/cv-photos/yunanistan%20kapak%20gorsel.jpg",
};

interface PageProps {
  params: Promise<Record<string, never>>;
  searchParams: Promise<{ c?: string }>;
}

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const { c } = await searchParams;
  const slug = typeof c === "string" ? c.trim().toLowerCase() : "";
  const hasCountry = !!slug && Object.prototype.hasOwnProperty.call(COUNTRY_OG_IMAGES, slug);
  const imageUrl = hasCountry ? COUNTRY_OG_IMAGES[slug] : undefined;
  const url = slug ? `${CANONICAL}?c=${encodeURIComponent(slug)}` : CANONICAL;

  return buildPageMetadata({
    title: TITLE,
    description: DESCRIPTION,
    path: "/ucretsiz-yurtdisi-is-ilanlari",
    canonicalUrl: CANONICAL,
    openGraphUrl: url,
    imageUrl,
    imageAlt: hasCountry ? `Ücretsiz ${slug} iş ilanları` : "Ücretsiz Yurtdışı İş İlanları",
    imageWidth: hasCountry ? 1200 : 500,
    imageHeight: hasCountry ? 630 : 500,
  });
}

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
