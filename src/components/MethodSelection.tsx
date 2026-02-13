"use client";

import { motion } from "framer-motion";
import { Mic, MessageCircle, FileEdit, Check } from "lucide-react";

type MethodId = "voice" | "chat" | "form";

const METHODS: Array<{
  id: MethodId;
  title: string;
  badge?: string;
  desc: string;
  bullets: string[];
  ctaText: string;
  icon: typeof Mic;
}> = [
  {
    id: "voice",
    title: "Sesli Asistan ile",
    badge: "Önerilen",
    desc: "Sesli asistanınız size ne cevap vermeniz gerektiğini adım adım söyler. İsterseniz konuşarak, isterseniz yazarak CV'nizi hızlıca tamamlayabilirsiniz.",
    bullets: [
      "Kolay yönlendirme: Ne yazacağınızı söyler",
      "Konuşarak veya yazarak ilerleme",
      "Hızlı tamamla, otomatik kayıt",
    ],
    ctaText: "Sesli Asistan ile Başla",
    icon: Mic,
  },
  {
    id: "chat",
    title: "Sohbet ile",
    desc: "Soru–cevap sohbetiyle ilerleyin. Her soruda ipuçları vardır; yanıtlarınız anında kaydedilir. İsterseniz bazı soruları atlayabilirsiniz.",
    bullets: [
      "Tek tek soru: hızlı ilerleme",
      "İpuçlarıyla yönlendirme",
      "Otomatik kayıt, hata yok",
    ],
    ctaText: "Sohbet ile Başla",
    icon: MessageCircle,
  },
  {
    id: "form",
    title: "Form ile",
    desc: "Adım adım form ile düzenli ilerleyin. İlerleme çubuğu ile nerede olduğunuzu görürsünüz. İsterseniz kaydedip sonra devam edebilirsiniz.",
    bullets: [
      "Adım adım, düzenli akış",
      "İlerleme çubuğu",
      "Kaydet ve devam et",
    ],
    ctaText: "Form ile Devam Et",
    icon: FileEdit,
  },
];

export function MethodSelection({
  selectedMethod,
  onSelect,
}: {
  selectedMethod: MethodId | null;
  onSelect: (id: MethodId) => void;
}) {
  return (
    <section id="yontem-secimi" className="relative py-16 sm:py-20 bg-white">
      <span id="how-it-works" className="absolute left-0 block -top-20" aria-hidden />
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <motion.h2
          className="text-2xl font-bold text-slate-900 sm:text-3xl text-center mb-3"
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          CV Bilgilerini Nasıl Alacağız?
        </motion.h2>
        <motion.p
          className="text-slate-600 text-center max-w-xl mx-auto mb-12 text-base"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          Size en uygun yöntemi seçin. Sayfa değişmeden aynı yerde devam edersiniz.
        </motion.p>

        <div className="grid gap-6 grid-cols-1 sm:grid-cols-3">
          {METHODS.map((m, i) => {
            const Icon = m.icon;
            const isSelected = selectedMethod === m.id;
            return (
              <motion.article
                key={m.id}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
                className="relative flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-200 hover:border-slate-300 hover:shadow-md focus-within:ring-2 focus-within:ring-slate-400 focus-within:ring-offset-2"
                style={{
                  borderColor: isSelected ? "#0f172a" : undefined,
                  boxShadow: isSelected ? "0 4px 14px rgba(0,0,0,0.1)" : undefined,
                }}
              >
                {m.badge && (
                  <span className="absolute top-4 right-4 rounded-full bg-slate-900 px-2.5 py-0.5 text-xs font-medium text-white">
                    {m.badge}
                  </span>
                )}
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-600 shrink-0">
                  <Icon className="h-6 w-6" />
                </span>
                <h3 className="mt-4 text-lg font-semibold text-slate-900">{m.title}</h3>
                <p className="mt-2 text-sm text-slate-600 leading-snug">{m.desc}</p>
                <ul className="mt-4 space-y-2 flex-1">
                  {m.bullets.map((b) => (
                    <li key={b} className="flex items-start gap-2 text-sm text-slate-600">
                      <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  onClick={() => onSelect(m.id)}
                  className="mt-6 w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
                >
                  {m.ctaText}
                </button>
              </motion.article>
            );
          })}
        </div>

        <motion.p
          className="mt-10 text-center text-sm text-slate-500 max-w-xl mx-auto"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          Boş bıraktığınız alanlar CV&apos;de gösterilmez. Yanıtlarınız güvenle kaydedilir.
        </motion.p>
      </div>
    </section>
  );
}
