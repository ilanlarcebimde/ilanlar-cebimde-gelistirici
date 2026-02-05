"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";

export function Header({ onLoginClick }: { onLoginClick: () => void }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur-md transition-shadow duration-200 ${
        scrolled ? "border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.06)]" : "border-transparent"
      }`}
    >
      <div className="mx-auto flex h-14 sm:h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 text-slate-900" aria-label="İlanlar Cebimde - Ana Sayfa">
          <Image
            src="/logo.png"
            alt="İlanlar Cebimde"
            width={36}
            height={36}
            className="h-9 w-9 sm:h-10 sm:w-10 object-contain"
            priority
          />
          <span className="text-lg sm:text-xl font-bold tracking-tight">İlanlar Cebimde</span>
        </Link>

        <div className="hidden sm:block">
          <button
            type="button"
            onClick={onLoginClick}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-800"
          >
            Giriş Yap
          </button>
        </div>

        <button
          type="button"
          className="sm:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          onClick={() => setMobileOpen((o) => !o)}
          aria-label="Menü"
        >
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="sm:hidden border-t border-slate-200 bg-white"
          >
            <div className="px-4 py-3">
              <button
                type="button"
                onClick={() => {
                  onLoginClick();
                  setMobileOpen(false);
                }}
                className="w-full rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white text-left"
              >
                Giriş Yap
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
