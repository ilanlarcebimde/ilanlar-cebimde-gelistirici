import type { ReactNode } from "react";

type MobileMenuSectionProps = {
  title: string;
  children: ReactNode;
};

export function MobileMenuSection({ title, children }: MobileMenuSectionProps) {
  return (
    <section>
      <h3 className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</h3>
      <div className="space-y-1">{children}</div>
    </section>
  );
}
