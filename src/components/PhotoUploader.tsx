"use client";

import { useState } from "react";
import { uploadCVPhoto } from "@/lib/storage";

interface PhotoUploaderProps {
  userId: string;
  onUploadComplete: (url: string) => void;
}

export function PhotoUploader({ userId, onUploadComplete }: PhotoUploaderProps) {
  const [uploading, setUploading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    const file = e.target.files[0];
    if (!file.type.startsWith("image/")) return;

    setUploading(true);
    try {
      const url = await uploadCVPhoto(file, userId);
      onUploadComplete(url);
    } catch {
      alert("Yükleme başarısız oldu.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-sm font-medium text-slate-600">Profil Fotoğrafı Yükle</p>
      <label className="flex cursor-pointer items-center gap-2 rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 disabled:opacity-50">
        {uploading ? (
          <span>Yükleniyor…</span>
        ) : (
          <>
            <span>Fotoğraf Seç</span>
            <input
              type="file"
              accept="image/png,image/jpeg,image/jpg"
              className="hidden"
              onChange={handleFileChange}
              disabled={uploading}
            />
          </>
        )}
      </label>
      <p className="text-xs text-slate-400">PNG veya JPG (max 50MB)</p>
    </div>
  );
}
