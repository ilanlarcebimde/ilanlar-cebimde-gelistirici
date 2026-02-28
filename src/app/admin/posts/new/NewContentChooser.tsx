"use client";

import Link from "next/link";

export function NewContentChooser() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-900">Yeni içerik oluştur</h1>
        <Link href="/admin/posts" className="text-sm text-sky-600 hover:underline">
          ← İçerik listesi
        </Link>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <Link
          href="/admin/posts/new/job"
          className="group flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-200 hover:shadow-md hover:border-slate-300"
        >
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-sky-100 text-2xl text-sky-600 group-hover:bg-sky-200" aria-hidden>
            📋
          </span>
          <h2 className="mt-4 font-semibold text-slate-900">İlan / Başvuru İçeriği</h2>
          <p className="mt-2 text-sm text-slate-600">
            Ülke, sektör, son başvuru tarihi, premium başvuru araçları ile ilan veya başvuru rehberi.
          </p>
          <span className="mt-auto pt-4 inline-flex items-center gap-1 text-sm font-medium text-sky-600 group-hover:text-sky-700">
            Devam <span aria-hidden>→</span>
          </span>
        </Link>

        <Link
          href="/admin/posts/new/blog"
          className="group flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-200 hover:shadow-md hover:border-slate-300"
        >
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-2xl text-emerald-600 group-hover:bg-emerald-200" aria-hidden>
            📝
          </span>
          <h2 className="mt-4 font-semibold text-slate-900">Blog Yazısı (Bilgilendirme)</h2>
          <p className="mt-2 text-sm text-slate-600">
            Genel bilgilendirme, rehber veya süreç anlatımı. Feed’de blog kartı olarak görünür.
          </p>
          <span className="mt-auto pt-4 inline-flex items-center gap-1 text-sm font-medium text-emerald-600 group-hover:text-emerald-700">
            Devam <span aria-hidden>→</span>
          </span>
        </Link>
      </div>
    </div>
  );
}
