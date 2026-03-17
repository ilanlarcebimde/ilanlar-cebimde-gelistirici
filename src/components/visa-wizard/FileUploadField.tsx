"use client";

import { useRef, useState } from "react";

interface FileUploadFieldProps {
  label: string;
  helper?: string;
  accept?: string;
  multiple?: boolean;
  files: File[];
  onChange: (files: File[]) => void;
}

export function FileUploadField({
  label,
  helper,
  accept = ".pdf,.jpg,.jpeg,.png",
  multiple = false,
  files,
  onChange,
}: FileUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const applyFiles = (incoming: FileList | null) => {
    if (!incoming) return;
    const list = Array.from(incoming);
    onChange(multiple ? [...files, ...list] : list.slice(0, 1));
  };

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-slate-700">{label}</p>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          applyFiles(e.dataTransfer.files);
        }}
        className={`w-full rounded-xl border-2 border-dashed px-4 py-6 text-left transition ${
          dragOver ? "border-sky-400 bg-sky-50" : "border-slate-300 bg-white hover:border-sky-300"
        }`}
      >
        <p className="text-sm font-medium text-slate-800">Sürükle bırak veya dosya seç</p>
        <p className="mt-1 text-xs text-slate-500">{helper ?? "PDF, JPG, JPEG, PNG desteklenir."}</p>
      </button>

      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept={accept}
        multiple={multiple}
        onChange={(e) => applyFiles(e.target.files)}
      />

      {files.length > 0 && (
        <ul className="space-y-1">
          {files.map((file, index) => (
            <li key={`${file.name}-${index}`} className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs">
              <span className="truncate pr-3 text-slate-700">{file.name}</span>
              <button
                type="button"
                className="font-medium text-red-600 hover:text-red-700"
                onClick={() => {
                  const next = files.filter((_, i) => i !== index);
                  onChange(next);
                }}
              >
                Sil
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
