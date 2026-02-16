"use client";

import { motion } from "framer-motion";

const CARDS = [
  {
    title: "İyi CV neden hızlı fark edilir?",
    body: "İşe alım uzmanları yüzlerce başvuru arasından saniyeler içinde eleme yapar. Düzenli, okunaklı ve hedefe uygun bir CV, sizi “devam” yığınına taşır; eksik veya dağınık olanlar elenir.",
  },
  {
    title: "Dil ve anlatım neden kritik?",
    body: "Yurtdışı ilanları çoğunlukla İngilizce veya hedef ülkenin dilinde. Doğru terimler ve net cümleler, yeteneklerinizi olduğu gibi yansıtır; ifade hataları ise yanlış anlaşılmalara yol açar.",
  },
  {
    title: "Şirketle doğru iletişim neden önemli?",
    body: "İlan metninde vurgulanan becerileri CV ve başvuru mektubunda karşılık bulduğunuzda, “bu aday tam aradığımız profil” hissi oluşur. Genel ve ilana özel olmayan metinler daha az dikkat çeker.",
  },
];

export function CvWhySection() {
  return (
    <section className="py-10 sm:py-20 bg-white">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <motion.p
          className="text-center text-sm font-medium uppercase tracking-wider text-slate-500 mb-3"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          Bilmeniz gerekenler
        </motion.p>
        <motion.h2
          className="text-2xl font-bold text-slate-900 sm:text-3xl text-center mb-4"
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          CV nedir, neden önemli?
        </motion.h2>
        <motion.p
          className="text-slate-600 text-center max-w-xl mx-auto mb-12 text-base"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          Kısa ve net: iş başvurusunda fark yaratan üç nokta.
        </motion.p>

        <div className="grid gap-6 sm:grid-cols-3">
          {CARDS.map((card, i) => (
            <motion.div
              key={card.title}
              className="rounded-2xl border border-slate-200 bg-slate-50/50 p-6 shadow-[0_1px_3px_rgba(0,0,0,0.05)] transition-all duration-300 hover:shadow-[0_6px_20px_rgba(0,0,0,0.07)] hover:border-slate-200"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ delay: i * 0.1, duration: 0.4 }}
              whileHover={{ y: -2 }}
            >
              <h3 className="text-lg font-semibold text-slate-900 mb-3">
                {card.title}
              </h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                {card.body}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
