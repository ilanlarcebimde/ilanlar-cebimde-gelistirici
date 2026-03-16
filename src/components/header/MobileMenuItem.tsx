import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ChevronRight } from "lucide-react";

type MobileMenuItemProps = {
  href: string;
  label: string;
  icon: LucideIcon;
  onClick: () => void;
};

export function MobileMenuItem({ href, label, icon: Icon, onClick }: MobileMenuItemProps) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="flex items-center gap-3 rounded-xl border border-transparent px-3 py-3 transition-colors hover:border-slate-200 hover:bg-slate-50"
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
        <Icon className="h-4 w-4" />
      </span>
      <span className="min-w-0 flex-1 text-sm font-semibold text-slate-800">{label}</span>
      <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />
    </Link>
  );
}
