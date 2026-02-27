"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface PostRow {
  id: string;
  title: string;
  slug: string;
  status: string;
  sector_slug: string;
  country_slug: string | null;
  is_paid: boolean;
  published_at: string | null;
  created_at: string;
}

export default function AdminPostsPage() {
  const [posts, setPosts] = useState<PostRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/admin/posts", { credentials: "include" })
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
  }, []);

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
        <Link
          href="/admin/posts/new"
          className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
        >
          Yeni içerik
        </Link>
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
                      href={`/yurtdisi-is-ilanlari/${post.slug}`}
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
