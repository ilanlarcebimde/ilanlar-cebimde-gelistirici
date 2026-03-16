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
    <div className="flex w-full items-center justify-between md:hidden">
      <Link href="/" className="flex min-w-0 items-center gap-2 text-slate-900" aria-label="İlanlar Cebimde - Ana Sayfa">
        <Image src="/logo.png" alt="" width={36} height={36} className="h-9 w-9 shrink-0 object-contain" priority />
        <span className="truncate text-[16px] font-bold tracking-tight">İlanlar Cebimde</span>
      </Link>

      <div className="ml-auto flex items-center gap-2.5">
        {!loggedIn ? (
          <button
            type="button"
            onClick={onLoginClick}
            className="inline-flex h-9 items-center rounded-[10px] bg-slate-900 px-[14px] text-[14px] font-semibold text-white transition-colors hover:bg-slate-800"
          >
            Giriş Yap
          </button>
        ) : (
          <Link
            href="/panel"
            className="inline-flex h-9 items-center rounded-[10px] border border-slate-200 px-[14px] text-[14px] font-semibold text-slate-700 transition-colors hover:bg-slate-50"
          >
            Hesabım
          </Link>
        )}

        <button
          type="button"
          onClick={onMenuClick}
          className="inline-flex items-center justify-center p-1 text-slate-700 transition-colors hover:text-slate-900"
          aria-label="Menüyü aç"
        >
          <Menu className="h-6 w-6" strokeWidth={2.3} />
        </button>
      </div>
    </div>
  );
}
