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

  useEffect(() => {
    if (open && selectedMethod) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [open, selectedMethod]);

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
            className="relative w-[96vw] max-w-none sm:w-full sm:max-w-[540px] max-h-[80vh] h-[78vh] sm:max-h-[75vh] sm:h-[75vh] rounded-[18px] bg-white shadow-[0_4px_24px_rgba(0,0,0,0.08)] border border-slate-200/70 flex flex-col overflow-hidden"
          >
            <div className="shrink-0 flex justify-end items-center min-h-[44px] px-3 py-1.5 sm:px-4 border-b border-slate-100/80 bg-white">
              <button
                type="button"
                onClick={onClose}
                className="p-2.5 -m-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100/80 transition-colors touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center"
                aria-label="Kapat"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 min-h-0 overflow-hidden flex flex-col bg-slate-50/40">
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
