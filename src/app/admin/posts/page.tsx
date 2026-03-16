"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface PostRow {
  id: string;
  title: string;
  slug: string;
  status: string;
  sector_slug: string | null;
  country_slug: string | null;
  is_paid: boolean;
  content_type: "job" | "blog" | "international_work_visa_news";
  news_type?: string | null;
  priority_level?: string | null;
  is_featured?: boolean;
  published_at: string | null;
  created_at: string;
}

export default function AdminPostsPage() {
  const [posts, setPosts] = useState<PostRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<"all" | PostRow["content_type"]>("all");

  useEffect(() => {
    let cancelled = false;
    const url = new URL("/api/admin/posts", window.location.origin);
    if (typeFilter !== "all") {
      url.searchParams.set("contentType", typeFilter);
    }
    fetch(url.toString(), { credentials: "include" })
      .then((r) => {
        if (!r.ok) throw new Error("İçerikler yüklenemedi");
        return r.json();
      })
      .then((data) => {
        if (!cancelled) setPosts(data);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Hata");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [typeFilter]);

  if (loading) {
    return <p className="text-slate-600">Yükleniyor…</p>;
  }

  if (error) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-800">
        {error}
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-900">İçerikler</h1>
        <div className="flex items-center gap-2">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as "all" | PostRow["content_type"])}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
          >
            <option value="all">Tum tipler</option>
            <option value="job">Ilan / Basvuru</option>
            <option value="blog">Blog</option>
            <option value="international_work_visa_news">Calisma ve Vize Duyurulari</option>
          </select>
          <Link
            href="/admin/posts/new"
            className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
          >
            Yeni içerik
          </Link>
        </div>
      </div>
      {posts.length === 0 ? (
        <p className="text-slate-600">Henüz içerik yok. Yeni içerik ekleyebilirsiniz.</p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50">
              <tr>
                <th className="px-4 py-3 font-semibold text-slate-900">Başlık</th>
                <th className="px-4 py-3 font-semibold text-slate-900">Slug</th>
                <th className="px-4 py-3 font-semibold text-slate-900">Durum</th>
                <th className="px-4 py-3 font-semibold text-slate-900">Tip</th>
                <th className="px-4 py-3 font-semibold text-slate-900">Sektör</th>
                <th className="px-4 py-3 font-semibold text-slate-900">Ücretli</th>
                <th className="px-4 py-3 font-semibold text-slate-900">İşlem</th>
              </tr>
            </thead>
            <tbody>
              {posts.map((post) => (
                <tr key={post.id} className="border-b border-slate-100">
                  <td className="px-4 py-3 font-medium text-slate-900">{post.title}</td>
                  <td className="px-4 py-3 text-slate-600">{post.slug}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        post.status === "published"
                          ? "bg-green-100 text-green-800"
                          : post.status === "draft"
                            ? "bg-slate-100 text-slate-700"
                            : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {post.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs">
                    {post.content_type === "job" ? "Ilan" : post.content_type === "blog" ? "Blog" : "Vize Duyurusu"}
                    {post.content_type === "international_work_visa_news" && post.priority_level ? (
                      <span className="ml-2 rounded-full bg-violet-100 px-2 py-0.5 text-[11px] text-violet-700">
                        {post.priority_level}
                      </span>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{post.sector_slug}</td>
                  <td className="px-4 py-3">{post.is_paid ? "Evet" : "Hayır"}</td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/posts/${post.id}`}
                      className="text-sky-600 hover:underline"
                    >
                      Düzenle
                    </Link>
                    {" · "}
                    <Link
                      href={
                        post.content_type === "international_work_visa_news"
                          ? `/yurtdisi-calisma-ve-vize-duyurulari/${post.slug}`
                          : `/yurtdisi-is-ilanlari/${post.slug}`
                      }
                      target="_blank"
                      rel="noreferrer"
                      className="text-sky-600 hover:underline"
                    >
                      Görüntüle
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
