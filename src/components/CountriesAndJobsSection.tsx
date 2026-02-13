"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { COUNTRIES } from "@/data/countries";
import { PROFESSION_AREAS } from "@/data/professions";

const PROFESSION_DESCRIPTIONS: Record<string, string> = {
  insaat: "İnşaat ve şantiye işleri.",
  "metal-kaynak": "Metal işleri ve kaynak.",
  "makine-bakim": "Makine bakım ve montaj.",
  "nakliye-depo": "Nakliye ve depo işleri.",
  "temizlik-site": "Temizlik ve site hizmetleri.",
  "gida-uretim": "Gıda üretim.",
  "tekstil-uretim": "Tekstil üretim.",
  "konaklama-mutfak": "Konaklama ve mutfak.",
  "plastik-kaucuk": "Plastik ve kauçuk.",
  "kimya-uretim": "Kimya üretim.",
  "cam-seramik": "Cam ve seramik.",
  "ahsap-marangoz": "Ahşap ve marangoz.",
  "giyim-uretim": "Giyim üretim.",
  "kagit-ambalaj": "Kâğıt ve ambalaj.",
  madencilik: "Madencilik.",
  "madencilik-destek": "Madencilik destek.",
  "tarim-hayvancilik": "Tarım ve hayvancılık.",
  balikcilik: "Balıkçılık.",
  "orman-isleri": "Orman işleri.",
  "icecek-uretim": "İçecek üretim.",
  "tutun-uretim": "Tütün üretim.",
  "petrol-rafineri": "Petrol ve rafineri.",
  "deri-ayakkabi": "Deri ve ayakkabı.",
  matbaa: "Matbaa.",
  "tamir-onarim": "Tamir ve onarım.",
};

export function CountriesAndJobsSection() {
  const [search, setSearch] = useState("");
  const [marqueePaused, setMarqueePaused] = useState(false);

  const filteredAreas = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return PROFESSION_AREAS;
    return PROFESSION_AREAS.filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        a.branches.some((b) => b.toLowerCase().includes(q))
    );
  }, [search]);

  const countriesRow = useMemo(
    () => [...COUNTRIES, ...COUNTRIES],
    []
  );

  return (
    <section className="py-16 sm:py-20 bg-[#f8f9fa]">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <motion.p
          className="text-center text-sm font-medium uppercase tracking-wider text-slate-500 mb-3"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          Bu sistem bu pazarı biliyor
        </motion.p>
        <motion.h2
          className="text-2xl font-bold text-slate-900 sm:text-3xl text-center mb-12"
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          Ülkeler & Meslek Alanları
        </motion.h2>

        {/* Ülkeler: yatay marquee, hover'da durur */}
        <div
          className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white/80 py-4 shadow-[0_1px_3px_rgba(0,0,0,0.05)]"
          onMouseEnter={() => setMarqueePaused(true)}
          onMouseLeave={() => setMarqueePaused(false)}
        >
          <div
            className="flex w-max items-center gap-6"
            style={{
              animation: marqueePaused ? "none" : "countries-marquee 80s linear infinite",
            }}
          >
            {countriesRow.map((c, i) => (
              <div
                key={`${c.id}-${i}`}
                className="flex shrink-0 items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/50 px-5 py-2.5"
              >
                <img
                  src={`https://flagcdn.com/w80/${c.id}.png`}
                  alt=""
                  width={32}
                  height={24}
                  className="h-6 w-8 shrink-0 rounded object-cover"
                />
                <span className="text-sm font-medium text-slate-800 whitespace-nowrap">
                  {c.name}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Meslek alanları: arama + kartlar */}
        <div className="mt-14">
          <motion.div
            className="mb-6"
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <label htmlFor="job-search" className="sr-only">
              Meslek veya alan ara
            </label>
            <input
              id="job-search"
              type="search"
              placeholder="Meslek veya alan ara"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full max-w-md mx-auto block rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-800 placeholder:text-slate-400 shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-shadow focus:border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-200/60 focus:shadow-[0_2px_8px_rgba(0,0,0,0.06)]"
            />
          </motion.div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredAreas.map((area, i) => (
              <motion.div
                key={area.id}
                className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.05)] transition-all duration-300 hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] hover:-translate-y-0.5"
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: Math.min(i * 0.03, 0.24) }}
              >
                <h3 className="text-base font-semibold text-slate-900 mb-1.5">
                  {area.name}
                </h3>
                <p className="text-sm text-slate-600 leading-snug">
                  {PROFESSION_DESCRIPTIONS[area.id] ??
                    `${area.branches.slice(0, 3).join(", ")} ve diğerleri.`}
                </p>
              </motion.div>
            ))}
          </div>
          {filteredAreas.length === 0 && (
            <p className="text-center text-slate-500 text-sm py-8">
              Arama kriterine uygun alan bulunamadı.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
