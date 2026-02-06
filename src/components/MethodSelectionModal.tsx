"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Mic, MessageCircle, FileEdit } from "lucide-react";

export type MethodId = "voice" | "chat" | "form";

const METHODS: { id: MethodId; title: string; desc: string; icon: typeof Mic; buttonLabel: string }[] = [
  {
    id: "voice",
    title: "Sesli Asistan ile",
    desc: "Sesli sorular, sesli yanıt. Metne dönüştürülür, otomatik kaydedilir.",
    icon: Mic,
    buttonLabel: "Sesli Asistan ile Başla",
  },
  {
    id: "chat",
    title: "Sohbet ile",
    desc: "Soru-cevap sohbeti. Öneri chip'leri ve otomatik kayıt.",
    icon: MessageCircle,
    buttonLabel: "Sohbet ile Başla",
  },
  {
    id: "form",
    title: "Form ile",
    desc: "Adım adım form. İlerleme çubuğu, kaydet ve devam et.",
    icon: FileEdit,
    buttonLabel: "Form ile Devam Et",
  },
];

export function MethodSelectionModal({
  open,
  onClose,
  onSelect,
  selectedMethod,
}: {
  open: boolean;
  onClose: () => void;
  onSelect: (id: MethodId) => void;
  selectedMethod: MethodId | null;
}) {
  useEffect(() => {
    if (!open) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [open, onClose]);

  const handleSelect = (id: MethodId) => {
    onSelect(id);
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        role="dialog"
        aria-modal="true"
        aria-labelledby="method-modal-title"
      >
        <motion.div
          initial={{ scale: 0.96, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.96, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-lg sm:max-w-2xl bg-white rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] sm:max-h-[85vh] min-h-0"
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-4 p-5 sm:p-6 pb-4 shrink-0 border-b border-slate-100">
            <div>
              <h2 id="method-modal-title" className="text-xl sm:text-2xl font-bold text-slate-900">
                CV Bilgilerini Nasıl Alacağız?
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Size en uygun yöntemi seçin. Sayfa değişmeden aynı yerde devam edersiniz.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="shrink-0 p-2 rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
              aria-label="Kapat"
            >
              <X className="h-5 w-5 sm:h-6 sm:w-6" />
            </button>
          </div>

          {/* Cards - scrollable on small screens */}
          <div className="overflow-y-auto overscroll-contain p-5 sm:p-6">
            <div className="grid gap-4 sm:grid-cols-3 sm:gap-5">
              {METHODS.map((m, i) => {
                const Icon = m.icon;
                const isSelected = selectedMethod === m.id;
                return (
                  <motion.button
                    key={m.id}
                    type="button"
                    onClick={() => handleSelect(m.id)}
                    className="group relative flex flex-col items-center rounded-xl sm:rounded-2xl border-2 bg-white p-5 sm:p-6 text-center shadow-[0_1px_3px_rgba(0,0,0,0.06)] transition-all duration-200 hover:border-slate-300 hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    style={{
                      borderColor: isSelected ? "#0f172a" : undefined,
                      boxShadow: isSelected ? "0 8px 24px rgba(0,0,0,0.08)" : undefined,
                    }}
                  >
                    <span className="flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-600 group-hover:bg-slate-200 transition-colors">
                      <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
                    </span>
                    <h3 className="mt-3 sm:mt-4 text-base sm:text-lg font-semibold text-slate-900">{m.title}</h3>
                    <p className="mt-1.5 sm:mt-2 text-xs sm:text-sm text-slate-500 leading-snug">{m.desc}</p>
                    <span className="mt-4 sm:mt-6 rounded-lg bg-slate-900 px-3 py-2 sm:px-4 sm:py-2.5 text-xs sm:text-sm font-medium text-white transition-colors group-hover:bg-slate-800">
                      {m.buttonLabel}
                    </span>
                  </motion.button>
                );
              })}
            </div>
          </div>
        </motion.div>
      </motion.div>
      )}
    </AnimatePresence>
  );
}
