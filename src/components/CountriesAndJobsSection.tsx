"use client";

import { useState } from "react";
import { motion } from "framer-motion";

const COUNTRY_CHIPS = [
  { id: "de", name: "Almanya", flag: "🇩🇪" },
  { id: "fr", name: "Fransa", flag: "🇫🇷" },
  { id: "nl", name: "Hollanda", flag: "🇳🇱" },
  { id: "at", name: "Avusturya", flag: "🇦🇹" },
  { id: "ch", name: "İsviçre", flag: "🇨🇭" },
  { id: "qa", name: "Katar", flag: "🇶🇦" },
  { id: "ae", name: "BAE", flag: "🇦🇪" },
  { id: "sa", name: "Suudi Arabistan", flag: "🇸🇦" },
  { id: "kw", name: "Kuveyt", flag: "🇰🇼" },
  { id: "iq", name: "Irak", flag: "🇮🇶" },
  { id: "ly", name: "Libya", flag: "🇱🇾" },
];

const JOB_UNIVERSE = [
  "Elektrik & Tesisat",
  "Seramik & Kaplama",
  "Boya & Yüzey",
  "Metal & Kaynak",
  "İnşaat & Saha",
  "Üretim & Montaj",
];

export function CountriesAndJobsSection() {
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);

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
          className="text-2xl font-bold text-slate-900 sm:text-3xl text-center mb-10"
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          Ülkeler & Meslek Alanları
        </motion.h2>

        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-100">
          {COUNTRY_CHIPS.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setSelectedCountry(selectedCountry === c.id ? null : c.id)}
              className={`shrink-0 flex items-center gap-2 rounded-full border-2 px-4 py-2.5 text-sm font-medium transition-all duration-200 ${
                selectedCountry === c.id
                  ? "border-slate-800 bg-slate-800 text-white"
                  : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:shadow-[0_2px_8px_rgba(0,0,0,0.06)]"
              }`}
            >
              <span className="text-lg">{c.flag}</span>
              {c.name}
            </button>
          ))}
        </div>

        <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {JOB_UNIVERSE.map((job, i) => (
            <motion.div
              key={job}
              className="rounded-xl border border-slate-200 bg-white px-4 py-4 text-center shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-shadow hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)]"
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.04 }}
            >
              <span className="text-sm font-medium text-slate-800">{job}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
