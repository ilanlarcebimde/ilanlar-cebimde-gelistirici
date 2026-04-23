import type { Metadata } from "next";
import { KanalFeedClient } from "./KanalFeedClient";
import { buildPageMetadata, SEO_SITE_NAME } from "@/lib/seo/defaultMetadata";

type Props = { params: Promise<{ slug: string }> };

const CHANNEL_OG_IMAGES: Record<string, string> = {
  belcika:
    "https://ugvjqnhbkotvvljnseob.supabase.co/storage/v1/object/public/cv-photos/belcika%20kapak-%20fotografi.jpg",
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const label = slug ? `${slug.charAt(0).toUpperCase() + slug.slice(1)} İş İlanları` : "Kanal";
  const title = `${label} | ${SEO_SITE_NAME}`;
  const imageUrl = CHANNEL_OG_IMAGES[slug];
  return buildPageMetadata({
    title,
    description: `${label} kanalındaki yurtdışı iş ilanlarını ${SEO_SITE_NAME} üzerinde keşfedin ve takip edin.`,
    path: `/kanal/${encodeURIComponent(slug)}`,
    imageUrl,
    imageAlt: title,
  });
}

export default async function KanalPage({ params }: Props) {
  const { slug } = await params;
  return <KanalFeedClient slug={slug} />;
}
