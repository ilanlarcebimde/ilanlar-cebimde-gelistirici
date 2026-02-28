import type { Metadata } from "next";
import { getPublishedPostsForMerkeziLanding } from "@/lib/merkezi/server";
import { MerkezFeed } from "@/components/merkezi/MerkezFeed";

/** Yeni yayınlanan yazıların hemen listede görünmesi için önbellek kullanma. */
export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Yurtdışı İş Başvuru Merkezi | İlanlar Cebimde",
  description:
    "Yurtdışı iş ilanları, resmi duyurular ve başvuru rehberleri tek merkezde. Sektör ve ülke bazlı ilanları keşfedin, güvenli başvuru adımlarını öğrenin.",
};

export default async function YurtdisiIsBasvuruMerkeziPage() {
  const { posts, tagsByPostId } = await getPublishedPostsForMerkeziLanding();

  return <MerkezFeed posts={posts} tagsByPostId={tagsByPostId} />;
}
