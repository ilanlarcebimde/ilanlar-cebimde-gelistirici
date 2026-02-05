"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";

const ITEMS = [
  {
    title: "İlan araştırma yükünü azaltır",
    desc: "Araştırır, analiz eder, sizin için önceliklendirir.",
  },
  {
    title: "Uygun ilanları filtreler ve önceliklendirir",
    desc: "Hedef ülke ve mesleğe göre ilanları süzerek sunar.",
  },
  {
    title: "Başvuru metnini mesleğine göre hazırlar",
    desc: "Kişiselleştirilmiş, profesyonel başvuru mektubu.",
  },
  {
    title: "CV ve fotoğrafı uluslararası düzene sokar",
    desc: "Standartlara uygun CV ve profil fotoğrafı formatı.",
  },
];

export function NeyiCozuyoruz() {
  return (
    <section className="py-16 sm:py-20 bg-slate-50/80">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <motion.h2
          className="text-2xl font-bold text-slate-900 sm:text-3xl text-center mb-4"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          Neyi çözüyoruz?
        </motion.h2>
        <motion.p
          className="text-slate-600 text-center max-w-2xl mx-auto mb-12"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          Güven veren, net çözümler. Garanti değil; süreci kolaylaştırıyoruz.
        </motion.p>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {ITEMS.map((item, i) => (
            <motion.div
              key={item.title}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft hover:shadow-hover transition-shadow"
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 mb-4">
                <Check className="h-5 w-5" />
              </span>
              <h3 className="font-semibold text-slate-900 mb-2">{item.title}</h3>
              <p className="text-sm text-slate-600">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
