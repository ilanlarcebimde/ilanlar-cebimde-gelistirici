"use client";

import { useCallback, useState } from "react";
import { motion } from "framer-motion";
import { Upload, X, Loader2 } from "lucide-react";
import { uploadCVPhoto } from "@/lib/storage";

const UPLOAD_STEPS = [
  "Fotoğraf yükleniyor…",
  "Işık ayarları yapılıyor…",
  "Uluslararası CV standartlarına göre optimize ediliyor…",
  "Arka plan düzenleniyor…",
];

export function PhotoUpload({
  photoUrl,
  photoFile,
  onPhotoChange,
  onClear,
  userId,
  onPhotoUploaded,
}: {
  photoUrl: string | null;
  photoFile: File | null;
  onPhotoChange: (file: File) => void;
  onClear: () => void;
  /** Varsa fotoğraf Supabase cv-photos bucket'ına yüklenir ve onPhotoUploaded ile URL döner */
  userId?: string;
  onPhotoUploaded?: (file: File, url: string) => void;
}) {
  const [dragOver, setDragOver] = useState(false);
  const [uploadPhase, setUploadPhase] = useState<number | null>(null);

  const handleFile = useCallback(
    async (file: File) => {
      if (!file.type.startsWith("image/")) return;
      setUploadPhase(0);
      const t1 = setTimeout(() => setUploadPhase(1), 500);
      const t2 = setTimeout(() => setUploadPhase(2), 1000);
      const t3 = setTimeout(() => setUploadPhase(3), 1500);
      const clearAll = () => {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
        setUploadPhase(null);
      };

      if (userId && onPhotoUploaded) {
        try {
          const url = await uploadCVPhoto(file, userId);
          onPhotoUploaded(file, url);
        } catch {
          onPhotoChange(file);
        }
        clearAll();
        return;
      }

      if (onPhotoUploaded) {
        try {
          const form = new FormData();
          form.append("file", file);
          const res = await fetch("/api/upload/cv-photo", { method: "POST", body: form });
          const data = await res.json().catch(() => ({}));
          if (res.ok && typeof data?.url === "string") {
            onPhotoUploaded(file, data.url);
          } else {
            onPhotoChange(file);
          }
        } catch {
          onPhotoChange(file);
        }
        clearAll();
        return;
      }

      const t4 = setTimeout(() => {
        onPhotoChange(file);
        clearAll();
      }, 2200);
      return () => clearTimeout(t4);
    },
    [onPhotoChange, userId, onPhotoUploaded]
  );

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  };

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) handleFile(f);
  };

  const hasPhoto = photoUrl || photoFile;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft">
      <h3 className="text-lg font-semibold text-slate-900 mb-4">Profil fotoğrafı</h3>
      <p className="text-sm text-slate-500 mb-4">
        CV ve yurtdışı başvurusu için uyumlu formata optimize edilecek. Yükle, Değiştir veya Sil. İstemezseniz atlayıp devam edebilirsiniz.
      </p>

      {uploadPhase !== null ? (
        <motion.div
          className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 py-12"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <Loader2 className="h-10 w-10 animate-spin text-slate-400 mb-4" />
          <p className="text-sm font-medium text-slate-600">{UPLOAD_STEPS[uploadPhase]}</p>
        </motion.div>
      ) : hasPhoto ? (
        <motion.div
          className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-100 aspect-square max-w-xs"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {photoUrl ? (
            <img src={photoUrl} alt="Profil" className="h-full w-full object-cover" />
          ) : photoFile ? (
            <img
              src={URL.createObjectURL(photoFile)}
              alt="Yüklenen"
              className="h-full w-full object-cover"
            />
          ) : null}
          <div className="absolute inset-x-0 bottom-0 flex gap-2 p-3 bg-gradient-to-t from-black/60 to-transparent">
            <label className="flex-1 rounded-lg bg-white/90 px-3 py-2 text-center text-sm font-medium text-slate-800 cursor-pointer hover:bg-white">
              Değiştir
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={onInputChange}
              />
            </label>
            <button
              type="button"
              onClick={onClear}
              className="rounded-lg bg-red-500/90 px-3 py-2 text-sm font-medium text-white hover:bg-red-600 flex items-center gap-1"
            >
              <X className="h-4 w-4" /> Sil
            </button>
          </div>
        </motion.div>
      ) : (
        <label
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed py-12 cursor-pointer transition-colors ${
            dragOver ? "border-slate-400 bg-slate-50" : "border-slate-200 hover:border-slate-300 hover:bg-slate-50/50"
          }`}
        >
          <Upload className="h-10 w-10 text-slate-400 mb-4" />
          <span className="text-sm font-medium text-slate-600">Fotoğrafını yükle</span>
          <span className="text-xs text-slate-500 mt-1">sürükle bırak veya tıkla</span>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={onInputChange}
          />
        </label>
      )}
    </div>
  );
}
