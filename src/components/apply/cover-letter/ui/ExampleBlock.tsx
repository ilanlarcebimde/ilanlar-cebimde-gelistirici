"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";

export interface ExampleBlockProps {
  label?: string;
  children: React.ReactNode;
  /** When true, example fades to muted (e.g. after user filled a field) */
  muted?: boolean;
  defaultOpen?: boolean;
  className?: string;
}

export function ExampleBlock({
  label = "Örnek",
  children,
  muted = false,
  defaultOpen = true,
  className = "",
}: ExampleBlockProps) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div
      className={`rounded-xl border border-slate-200 bg-slate-50/80 p-3 transition-opacity ${
        muted ? "opacity-70" : ""
      } ${className}`}
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-2 text-left text-xs font-medium uppercase tracking-wide text-slate-500"
      >
        {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        {label}
      </button>
      {open && <div className="mt-2 text-sm italic text-slate-700">{children}</div>}
    </div>
  );
}
