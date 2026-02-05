"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { COUNTRIES, POPULAR_JOBS_BY_COUNTRY } from "@/data/countries";

export function CountriesSection() {
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const popularJobs = selectedCountry ? POPULAR_JOBS_BY_COUNTRY[selectedCountry] ?? [] : [];

  return (
    <section className="py-16 sm:py-20 bg-slate-50/80">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <motion.h2
          className="text-2xl font-bold text-slate-900 sm:text-3xl text-center mb-4"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          Ülkeler
        </motion.h2>
        <motion.p
          className="text-slate-600 text-center max-w-2xl mx-auto mb-10"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          Hedef ülkenizi seçin; en çok aranan alanlar aşağıda listelenir.
        </motion.p>

        <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-100">
          {COUNTRIES.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setSelectedCountry(selectedCountry === c.id ? null : c.id)}
              className={`shrink-0 flex items-center gap-2 rounded-full border-2 px-4 py-2.5 text-sm font-medium transition-all ${
                selectedCountry === c.id
                  ? "border-slate-700 bg-slate-800 text-white"
                  : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:shadow-soft"
              }`}
            >
              <span className="text-lg">{c.flag}</span>
              {c.name}
            </button>
          ))}
        </div>

        {selectedCountry && popularJobs.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 rounded-xl border border-slate-200 bg-white p-4 shadow-soft"
          >
            <p className="text-sm font-medium text-slate-500 mb-2">Bu ülkede en çok aranan alanlar</p>
            <ul className="flex flex-wrap gap-2">
              {popularJobs.map((job) => (
                <li
                  key={job}
                  className="rounded-lg bg-slate-100 px-3 py-1.5 text-sm text-slate-700"
                >
                  {job}
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </div>
    </section>
  );
}
