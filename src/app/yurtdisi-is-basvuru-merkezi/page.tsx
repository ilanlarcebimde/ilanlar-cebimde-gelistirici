import type { Metadata } from "next";
import { getPublishedPostsForMerkeziLanding } from "@/lib/merkezi/server";
import { MerkezFeed } from "@/components/merkezi/MerkezFeed";
import { buildPageMetadata } from "@/lib/seo/defaultMetadata";

/** Yeni yayınlanan yazıların hemen listede görünmesi için önbellek kullanma. */
export const dynamic = "force-dynamic";
export const revalidate = 0;

const TITLE = "Yurtdışı İş Başvuru Merkezi | İlanlar Cebimde";
const DESCRIPTION =
  "Yurtdışı iş ilanları, resmi duyurular ve başvuru rehberleri tek merkezde. Sektör ve ülke bazlı ilanları keşfedin, güvenli başvuru adımlarını öğrenin.";

export const metadata: Metadata = buildPageMetadata({
  title: TITLE,
  description: DESCRIPTION,
  path: "/yurtdisi-is-basvuru-merkezi",
});

export default async function YurtdisiIsBasvuruMerkeziPage() {
  try {
    const { posts, tagsByPostId } = await getPublishedPostsForMerkeziLanding();
    return <MerkezFeed posts={posts} tagsByPostId={tagsByPostId} />;
  } catch {
    return <MerkezFeed posts={[]} tagsByPostId={{}} />;
  }
}
