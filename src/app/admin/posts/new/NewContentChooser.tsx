"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { FreeAccessCodesPanel } from "@/components/admin/FreeAccessCodesPanel";
import { NewPostForm } from "./NewPostForm";
import { BlogPostForm } from "./BlogPostForm";
import { VisaNewsPostForm } from "./VisaNewsPostForm";

type ContentType = "job" | "blog" | "international_work_visa_news";

const CONTENT_TYPES: Array<{
  type: ContentType;
  title: string;
  description: string;
  emoji: string;
}> = [
  {
    type: "job",
    title: "Ilan / Basvuru Icerigi",
    description: "Ulke, sektor, son basvuru tarihi ve premium basvuru araclari.",
    emoji: "📋",
  },
  {
    type: "blog",
    title: "Blog Yazisi (Bilgilendirme)",
    description: "Genel bilgilendirme, rehber veya surec anlatimi.",
    emoji: "📝",
  },
  {
    type: "international_work_visa_news",
    title: "Yurtdisi Calisma ve Vize Duyurulari",
    description: "Vize, pasaport, calisma izni ve resmi duyuru/haber akisi.",
    emoji: "🌍",
  },
];

export function NewContentChooser() {
  const [selectedType, setSelectedType] = useState<ContentType>("international_work_visa_news");

  const selectedMeta = useMemo(
    () => CONTENT_TYPES.find((x) => x.type === selectedType),
    [selectedType]
  );

  return (
    <div className="space-y-6">
      <FreeAccessCodesPanel />

      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-900">Yeni içerik oluştur</h1>
        <Link href="/admin/posts" className="text-sm text-sky-600 hover:underline">
          ← İçerik listesi
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {CONTENT_TYPES.map((item) => {
          const active = selectedType === item.type;
          return (
            <button
              key={item.type}
              type="button"
              onClick={() => setSelectedType(item.type)}
              className={`group flex w-full flex-col rounded-2xl border bg-white p-5 text-left shadow-sm transition-all duration-200 hover:shadow-md ${
                active ? "border-slate-900 ring-2 ring-slate-200" : "border-slate-200 hover:border-slate-300"
              }`}
            >
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-2xl" aria-hidden>
                {item.emoji}
              </span>
              <h2 className="mt-4 font-semibold text-slate-900">{item.title}</h2>
              <p className="mt-2 text-sm text-slate-600">{item.description}</p>
              <span className="mt-3 text-xs font-medium text-slate-700">
                {active ? "Secili" : "Bu tipi sec"}
              </span>
            </button>
          );
        })}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
        <p className="font-medium text-slate-900">
          Secili icerik tipi: {selectedMeta?.title}
        </p>
        <p className="mt-1">{selectedMeta?.description}</p>
      </div>

      {selectedType === "job" && <NewPostForm embedded />}
      {selectedType === "blog" && <BlogPostForm embedded />}
      {selectedType === "international_work_visa_news" && <VisaNewsPostForm embedded />}
    </div>
  );
}
