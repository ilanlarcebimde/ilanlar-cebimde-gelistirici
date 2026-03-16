import Link from "next/link";
import Image from "next/image";
import { Menu } from "lucide-react";

type MobileHeaderProps = {
  loggedIn: boolean;
  onLoginClick: () => void;
  onMenuClick: () => void;
};

export function MobileHeader({ loggedIn, onLoginClick, onMenuClick }: MobileHeaderProps) {
  return (
    <div className="flex items-center justify-between gap-2 md:hidden">
      <Link href="/" className="flex min-w-0 items-center gap-2 text-slate-900" aria-label="İlanlar Cebimde - Ana Sayfa">
        <Image src="/logo.png" alt="" width={34} height={34} className="h-8 w-8 shrink-0 object-contain" priority />
        <span className="truncate text-[15px] font-bold tracking-tight">İlanlar Cebimde</span>
      </Link>

      <div className="flex items-center gap-2">
        {!loggedIn ? (
          <button
            type="button"
            onClick={onLoginClick}
            className="inline-flex h-10 items-center rounded-xl bg-slate-900 px-3.5 text-sm font-semibold text-white transition-colors hover:bg-slate-800"
          >
            Giriş Yap
          </button>
        ) : (
          <Link
            href="/panel"
            className="inline-flex h-10 items-center rounded-xl border border-slate-200 px-3.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
          >
            Hesabım
          </Link>
        )}

        <button
          type="button"
          onClick={onMenuClick}
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-700 transition-colors hover:bg-slate-50"
          aria-label="Menüyü aç"
        >
          <Menu className="h-5 w-5" strokeWidth={2.2} />
        </button>
      </div>
    </div>
  );
}
