"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { ChevronDown, Search } from "lucide-react";
import { PROFESSION_AREAS, MARQUEE_TAGS } from "@/data/professions";

export function ProfessionsSection() {
  const [openId, setOpenId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const filteredAreas = useMemo(() => {
    if (!search.trim()) return PROFESSION_AREAS;
    const q = search.trim().toLowerCase();
    return PROFESSION_AREAS.map((area) => ({
      ...area,
      branches: area.branches.filter((b) => b.toLowerCase().includes(q)),
    })).filter((area) => area.branches.length > 0 || area.name.toLowerCase().includes(q));
  }, [search]);

  return (
    <section className="py-16 sm:py-20 bg-white">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {/* Marquee */}
        <div className="overflow-hidden border-y border-slate-200 py-3 mb-12">
          <div className="flex w-max">
            <div className="flex animate-marquee gap-6 pr-6 whitespace-nowrap">
              {[...MARQUEE_TAGS, ...MARQUEE_TAGS].map((tag, i) => (
                <span
                  key={`${tag}-${i}`}
                  className="text-sm font-medium text-slate-500"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>

        <motion.h2
          className="text-2xl font-bold text-slate-900 sm:text-3xl text-center mb-4"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          Meslek evreni
        </motion.h2>
        <motion.p
          className="text-slate-600 text-center max-w-2xl mx-auto mb-8"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          Alan ve dal seçerek kendinize en uygun mesleği bulun.
        </motion.p>

        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Meslek ara (örn: sıvacılık, pano montaj, kaynakçılık…)"
              className="w-full rounded-xl border border-slate-300 pl-10 pr-4 py-2.5 text-slate-800 placeholder:text-slate-400"
            />
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filteredAreas.map((area) => {
            const isOpen = openId === area.id;
            const branches = search.trim()
              ? area.branches
              : area.branches;
            return (
              <motion.div
                key={area.id}
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="rounded-xl border border-slate-200 bg-white shadow-soft overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => setOpenId(isOpen ? null : area.id)}
                  className="w-full flex items-center justify-between px-4 py-3 text-left font-medium text-slate-900 hover:bg-slate-50"
                >
                  {area.name}
                  <ChevronDown
                    className={`h-5 w-5 text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
                  />
                </button>
                {isOpen && (
                  <motion.ul
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="border-t border-slate-100 px-4 py-3 space-y-1.5 max-h-48 overflow-y-auto"
                  >
                    {branches.map((b) => (
                      <li key={b} className="text-sm text-slate-600">
                        {b}
                      </li>
                    ))}
                  </motion.ul>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
