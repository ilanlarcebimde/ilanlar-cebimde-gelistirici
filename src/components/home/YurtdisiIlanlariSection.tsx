"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { supabase } from "@/lib/supabase";

const FLAG_CDN = "https://flagcdn.com";
const FEED_PATH = "/ucretsiz-yurtdisi-is-ilanlari";

type ChannelRow = { slug: string; name: string; country_code: string; page_url: string | null };

export function YurtdisiIlanlariSection() {
  const [channels, setChannels] = useState<ChannelRow[]>([]);

  useEffect(() => {
    supabase
      .from("channels")
      .select("slug, name, country_code, page_url")
      .eq("is_active", true)
      .order("name")
      .then(({ data }) => setChannels((data ?? []) as ChannelRow[]));
  }, []);

  return (
    <section className="border-t border-slate-100 bg-slate-50/50 py-12 sm:py-16" aria-labelledby="yurtdisi-ilanlari-baslik">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <h2 id="yurtdisi-ilanlari-baslik" className="text-center text-2xl font-bold text-slate-900 sm:text-3xl">
          Yurtdışı İş İlanları
        </h2>
        <p className="mx-auto mt-2 max-w-xl text-center text-sm text-slate-600 sm:text-base">
          Biz sizin için araştırıyor, doğruluyor ve tek merkezde sunuyoruz.
        </p>
        <div className="mt-6 flex justify-center">
          <Link
            href={FEED_PATH}
            className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
          >
            Akışı Aç
          </Link>
        </div>

        <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {channels.map((c) => {
            const href = c.page_url || `${FEED_PATH}?c=${c.slug}`;
            const flagCode = (c.country_code || "xx").toLowerCase();
            return (
              <Link
                key={c.slug}
                href={href}
                className="group flex flex-col items-center rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:border-brand-200 hover:shadow-md"
              >
                <div className="relative h-10 w-14 shrink-0 overflow-hidden rounded-lg">
                  <Image
                    src={`${FLAG_CDN}/w160/${flagCode}.png`}
                    alt=""
                    width={56}
                    height={40}
                    className="object-cover transition-transform group-hover:scale-105"
                  />
                </div>
                <span className="mt-2 text-center text-sm font-medium text-slate-800 group-hover:text-brand-600">
                  {c.name}
                </span>
                <span className="mt-0.5 text-xs text-slate-500">Kanala Göz At</span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
