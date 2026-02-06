"use client";

import { useMemo, useState } from "react";

type Props = {
  originalText: string;
  normalizedText?: string;
  hint?: string;
  onConfirm: (finalText: string) => void;
  onCancel?: () => void;
};

export function NormalizeConfirm({
  originalText,
  normalizedText,
  hint,
  onConfirm,
  onCancel,
}: Props) {
  const suggested = useMemo(() => {
    const s = (normalizedText ?? "").trim();
    return s.length > 0 ? s : "";
  }, [normalizedText]);

  const [mode, setMode] = useState<"suggest" | "edit">("suggest");
  const [editValue, setEditValue] = useState<string>(suggested || originalText || "");

  if (!suggested) return null;

  return (
    <div className="mt-3 rounded-xl border border-slate-200 p-3 bg-slate-50/50">
      <div className="text-sm font-semibold text-slate-800">Bunu şöyle yazdım, doğru mu?</div>

      {hint ? <div className="mt-1 text-xs text-slate-600 opacity-80">{hint}</div> : null}

      {mode === "suggest" ? (
        <>
          <div className="mt-2 rounded-lg bg-white border border-slate-200 p-2 text-sm whitespace-pre-wrap text-slate-800">
            {suggested}
          </div>

          <div className="mt-2 flex flex-wrap gap-2">
            <button
              className="rounded-lg bg-slate-800 px-3 py-2 text-sm text-white hover:bg-slate-700"
              onClick={() => onConfirm(suggested)}
              type="button"
            >
              Evet, doğru
            </button>

            <button
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
              onClick={() => {
                setEditValue(suggested);
                setMode("edit");
              }}
              type="button"
            >
              Düzenle
            </button>

            {onCancel ? (
              <button
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-600"
                onClick={onCancel}
                type="button"
              >
                Vazgeç
              </button>
            ) : null}
          </div>
        </>
      ) : (
        <>
          <textarea
            className="mt-2 w-full rounded-lg border border-slate-300 p-2 text-sm text-slate-800"
            rows={3}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
          />
          <div className="mt-2 flex flex-wrap gap-2">
            <button
              className="rounded-lg bg-slate-800 px-3 py-2 text-sm text-white hover:bg-slate-700"
              onClick={() => onConfirm(editValue.trim())}
              type="button"
            >
              Onayla
            </button>
            <button
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700"
              onClick={() => setMode("suggest")}
              type="button"
            >
              Geri
            </button>
          </div>
        </>
      )}
    </div>
  );
}
