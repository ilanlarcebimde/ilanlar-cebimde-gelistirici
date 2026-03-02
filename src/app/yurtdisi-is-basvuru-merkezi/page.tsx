import type { Metadata } from "next";
import { getPublishedPostsForMerkeziLanding } from "@/lib/merkezi/server";
import { MerkezFeed } from "@/components/merkezi/MerkezFeed";
import { DEFAULT_OG_IMAGE } from "@/lib/og";

/** Yeni yayınlanan yazıların hemen listede görünmesi için önbellek kullanma. */
export const dynamic = "force-dynamic";
export const revalidate = 0;

const TITLE = "Yurtdışı İş Başvuru Merkezi | İlanlar Cebimde";
const DESCRIPTION =
  "Yurtdışı iş ilanları, resmi duyurular ve başvuru rehberleri tek merkezde. Sektör ve ülke bazlı ilanları keşfedin, güvenli başvuru adımlarını öğrenin.";
const LIST_URL = "https://www.ilanlarcebimde.com/yurtdisi-is-basvuru-merkezi";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: LIST_URL,
    siteName: "İlanlar Cebimde",
    images: [{ url: DEFAULT_OG_IMAGE, width: 1200, height: 630, alt: "Yurtdışı İş Başvuru Merkezi" }],
    locale: "tr_TR",
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: [DEFAULT_OG_IMAGE],
  },
};

export default async function YurtdisiIsBasvuruMerkeziPage() {
  try {
    const { posts, tagsByPostId } = await getPublishedPostsForMerkeziLanding();
    return <MerkezFeed posts={posts} tagsByPostId={tagsByPostId} />;
  } catch {
    return <MerkezFeed posts={[]} tagsByPostId={{}} />;
  }
}
