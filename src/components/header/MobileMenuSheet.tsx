import Link from "next/link";
import {
  BriefcaseBusiness,
  Compass,
  FileText,
  Newspaper,
  UserCircle2,
  X,
} from "lucide-react";
import { MobileMenuItem } from "./MobileMenuItem";
import { MobileMenuSection } from "./MobileMenuSection";

type MobileMenuSheetProps = {
  open: boolean;
  loggedIn: boolean;
  feedPath: string;
  newsHubPath: string;
  onClose: () => void;
  onLoginClick: () => void;
  onSignOut: () => void;
};

export function MobileMenuSheet({
  open,
  loggedIn,
  feedPath,
  newsHubPath,
  onClose,
  onLoginClick,
  onSignOut,
}: MobileMenuSheetProps) {
  return (
    <div
      className={`fixed inset-0 z-[1200] transition-opacity duration-300 md:hidden ${
        open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
      }`}
      aria-hidden={!open}
    >
      <button
        type="button"
        aria-label="Menüyü kapat"
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/45 backdrop-blur-[1px]"
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Mobil menü"
        className={`absolute right-0 top-0 h-full w-[88vw] max-w-[380px] transform border-l border-slate-200 bg-white shadow-2xl transition-transform duration-300 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col pt-[calc(env(safe-area-inset-top)+0.75rem)]">
          <div className="flex items-center justify-between px-4 pb-4">
            <h2 className="text-base font-bold text-slate-900">Menü</h2>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition-colors hover:bg-slate-50"
              aria-label="Kapat"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="border-y border-slate-100 px-4 py-3">
            {loggedIn ? (
              <div className="flex items-center justify-between gap-2">
                <Link
                  href="/panel"
                  onClick={onClose}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700"
                >
                  <UserCircle2 className="h-4 w-4" />
                  Hesabım
                </Link>
                <button
                  type="button"
                  onClick={onSignOut}
                  className="rounded-xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white"
                >
                  Çıkış Yap
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onLoginClick();
                }}
                className="w-full rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white"
              >
                Giriş Yap
              </button>
            )}
          </div>

          <div className="flex-1 space-y-6 overflow-y-auto px-4 py-4">
            <MobileMenuSection title="Başvuru Hizmetleri">
              <MobileMenuItem href="/" label="Ana Sayfa" icon={BriefcaseBusiness} onClick={onClose} />
              <MobileMenuItem href="/yurtdisi-cv-paketi" label="Yurtdışı CV Paketi" icon={FileText} onClick={onClose} />
              <MobileMenuItem
                href="/yurtdisi-is-basvuru-merkezi"
                label="Yurtdışı İş Başvuru Merkezi"
                icon={Compass}
                onClick={onClose}
              />
            </MobileMenuSection>

            <MobileMenuSection title="İlan ve Duyurular">
              <MobileMenuItem
                href={feedPath}
                label="Ücretsiz Yurtdışı İş İlanları"
                icon={BriefcaseBusiness}
                onClick={onClose}
              />
              <MobileMenuItem
                href={newsHubPath}
                label="Yurtdışı Çalışma & Vize Duyuruları"
                icon={Newspaper}
                onClick={onClose}
              />
            </MobileMenuSection>
          </div>

          <div className="border-t border-slate-100 px-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-4">
            <Link
              href="/yurtdisi-is-basvuru-merkezi"
              onClick={onClose}
              className="block w-full rounded-xl bg-brand-600 px-4 py-3 text-center text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-700"
            >
              Ücretsiz Vize Danışmanlığı Al
            </Link>
          </div>
        </div>
      </aside>
    </div>
  );
}
