import type { Metadata } from "next";
import { KanalFeedClient } from "./KanalFeedClient";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const title = slug ? `${slug.charAt(0).toUpperCase() + slug.slice(1)} İş İlanları` : "Kanal";
  return { title: `${title} | İlanlar Cebimde` };
}

export default async function KanalPage({ params }: Props) {
  const { slug } = await params;
  return <KanalFeedClient slug={slug} />;
}
