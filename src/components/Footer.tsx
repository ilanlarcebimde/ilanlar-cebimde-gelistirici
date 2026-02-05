"use client";

import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-[#f1f3f5] py-10">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex flex-wrap justify-center gap-x-8 gap-y-4 text-sm">
          <Link href="/hakkimizda" className="text-slate-600 hover:text-slate-900 transition-colors">
            Hakkımızda
          </Link>
          <Link href="/iletisim" className="text-slate-600 hover:text-slate-900 transition-colors">
            İletişim
          </Link>
          <Link href="/kvkk" className="text-slate-600 hover:text-slate-900 transition-colors">
            KVKK
          </Link>
          <Link href="/gizlilik" className="text-slate-600 hover:text-slate-900 transition-colors">
            Gizlilik
          </Link>
          <Link href="/cerez" className="text-slate-600 hover:text-slate-900 transition-colors">
            Çerez Politikası
          </Link>
        </div>
        <p className="mt-8 text-center text-sm text-slate-500">
          © 2026 İlanlar Cebimde. Tüm hakları saklıdır.
        </p>
      </div>
    </footer>
  );
}
