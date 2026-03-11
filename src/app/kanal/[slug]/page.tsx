import type { Metadata } from "next";
import { KanalFeedClient } from "./KanalFeedClient";

type Props = { params: Promise<{ slug: string }> };

const CHANNEL_OG_IMAGES: Record<string, string> = {
  belcika:
    "https://ugvjqnhbkotvvljnseob.supabase.co/storage/v1/object/public/cv-photos/belcika%20kapak-%20fotografi.jpg",
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const title = slug ? `${slug.charAt(0).toUpperCase() + slug.slice(1)} İş İlanları` : "Kanal";
  const ogImage = CHANNEL_OG_IMAGES[slug];

  return {
    title: `${title} | İlanlar Cebimde`,
    ...(ogImage && {
      openGraph: {
        images: [{ url: ogImage }],
      },
      twitter: {
        card: "summary_large_image",
        images: [ogImage],
      },
    }),
  };
}

export default async function KanalPage({ params }: Props) {
  const { slug } = await params;
  return <KanalFeedClient slug={slug} />;
}
