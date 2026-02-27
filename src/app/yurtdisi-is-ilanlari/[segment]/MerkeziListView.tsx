"use client";

import { RichContent } from "@/components/merkezi/RichContent";
import { PostCard } from "@/components/merkezi/PostCard";
import type { MerkeziPost, MerkeziTag } from "@/lib/merkezi/types";
import type { MerkeziPage } from "@/lib/merkezi/types";

interface MerkeziListViewProps {
  title: string;
  seoPage: MerkeziPage | null;
  posts: MerkeziPost[];
  postTags: Record<string, MerkeziTag[]>;
}

export function MerkeziListView({ title, seoPage, posts, postTags }: MerkeziListViewProps) {
  return (
    <div className="mx-auto max-w-4xl">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 md:text-3xl">
          {seoPage?.title ?? title}
        </h1>
        {seoPage?.meta_description && (
          <p className="mt-2 text-slate-600">{seoPage.meta_description}</p>
        )}
      </header>

      {seoPage?.content && (
        <div className="mb-8 rounded-xl border border-slate-200 bg-white p-6">
          <RichContent html={seoPage.content} />
        </div>
      )}

      <section>
        <h2 className="mb-4 text-lg font-semibold text-slate-900">İlanlar</h2>
        {posts.length === 0 ? (
          <p className="text-slate-600">Henüz bu kategoride yayınlanmış ilan yok.</p>
        ) : (
          <ul className="grid gap-6 sm:grid-cols-2">
            {posts.map((post) => (
              <li key={post.id}>
                <PostCard post={post} tags={postTags[post.id] ?? []} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
