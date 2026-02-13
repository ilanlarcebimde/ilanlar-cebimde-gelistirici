"use client";

export function Footer() {
  const linkClass = "text-slate-600 hover:text-slate-900 transition-colors cursor-pointer";
  return (
    <footer className="border-t border-slate-200 bg-[#f1f3f5] py-10">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex flex-wrap justify-center gap-x-8 gap-y-4 text-sm">
          <button type="button" className={linkClass} onClick={(e) => e.preventDefault()}>
            Hakkımızda
          </button>
          <button type="button" className={linkClass} onClick={(e) => e.preventDefault()}>
            İletişim
          </button>
          <button type="button" className={linkClass} onClick={(e) => e.preventDefault()}>
            KVKK
          </button>
          <button type="button" className={linkClass} onClick={(e) => e.preventDefault()}>
            Gizlilik
          </button>
          <button type="button" className={linkClass} onClick={(e) => e.preventDefault()}>
            Çerez Politikası
          </button>
        </div>
        <p className="mt-8 text-center text-sm text-slate-500">
          © 2026 İlanlar Cebimde. Tüm hakları saklıdır.
        </p>
      </div>
    </footer>
  );
}
