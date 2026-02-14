"use client";

/**
 * Wizard adımı için standart layout: scroll edilebilir body + her zaman görünen sticky footer.
 * Mobilde CTA'ya her zaman ulaşılabilir; içerik uzun olsa bile footer overlap etmez.
 */

export function StepShell({
  title,
  children,
  footer,
  className = "",
}: {
  title?: string;
  children: React.ReactNode;
  footer: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex flex-col min-h-0 flex-1 ${className}`}>
      <div className="flex-1 min-h-0 overflow-y-auto px-4 pb-4">
        {title && (
          <h3 className="text-lg font-semibold text-slate-900 mb-4 sticky top-0 bg-white/95 backdrop-blur py-1 z-10">
            {title}
          </h3>
        )}
        {children}
      </div>
      <div
        className="shrink-0 sticky bottom-0 left-0 right-0 border-t border-slate-200 bg-white/95 backdrop-blur p-4 mt-auto"
        style={{ paddingBottom: "calc(1rem + env(safe-area-inset-bottom))" }}
      >
        {footer}
      </div>
    </div>
  );
}
