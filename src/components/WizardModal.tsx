"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { WizardArea } from "@/components/wizard/WizardArea";
import type { WizardMethod } from "@/components/wizard/WizardTypes";

export function WizardModal({
  open,
  onClose,
  selectedMethod,
  onPaymentClick,
  userId,
}: {
  open: boolean;
  onClose: () => void;
  selectedMethod: WizardMethod | null;
  onPaymentClick: (payload: { email: string; user_name?: string; method: "form" | "voice" | "chat"; country: string; job_area: string; job_branch: string; answers: Record<string, unknown>; photo_url: string | null }) => void;
  userId?: string;
}) {
  useEffect(() => {
    if (!open) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && selectedMethod && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-2 sm:p-6"
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-label="CV bilgileri"
        >
          <motion.div
            initial={{ scale: 0.96, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.96, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-[96vw] max-w-none sm:w-full sm:max-w-[680px] h-[92vh] sm:h-auto sm:max-h-[85vh] rounded-2xl bg-white shadow-xl flex flex-col overflow-hidden"
          >
            <div className="shrink-0 flex justify-end p-3 sm:p-4 border-b border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                aria-label="Kapat"
              >
                <X className="h-5 w-5 sm:h-6 sm:w-6" />
              </button>
            </div>
            <div className="flex-1 min-h-0 overflow-hidden flex flex-col bg-slate-50/50">
              <WizardArea
                selectedMethod={selectedMethod}
                onPaymentClick={onPaymentClick}
                userId={userId}
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
