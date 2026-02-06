"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { Upload, Check, Trash2, Sparkles } from "lucide-react";
import { uploadCVPhoto } from "@/lib/storage";

type FlowState = "idle" | "processing" | "preview" | "generating";
type FlowType = "voice" | "chat" | "form";

const PROCESSING_STEPS = [
  "Sistemimiz orijinalliğinizi koruyarak size en uygun açıyı oluşturuyor...",
  "2K Çözünürlük teknolojisi uygulanıyor...",
  "Arkaplan net ve temiz hale getiriliyor...",
  "Işıklandırma, kamera açısı ve en-boy oranı çözümleniyor...",
];

const GENERATING_ITEMS = [
  "Türkçe Profesyonel CV",
  "İngilizce CV (Uluslararası Standart)",
  "Kişiselleştirilmiş İş Başvuru Mektubu",
  "Gelişmiş Profil Fotoğrafı Düzenleme",
  "Seçilen ülke ve meslek için 1 haftalık iş ilanları",
];

interface PhotoUploadFlowProps {
  userId: string;
  flowType: FlowType;
  onComplete?: () => void;
  /** Tamamlandıktan sonra yönlendirilecek path (varsayılan: /odeme) */
  redirectPath?: string;
}

export function PhotoUploadFlow({ userId, flowType, onComplete, redirectPath = "/odeme" }: PhotoUploadFlowProps) {
  const router = useRouter();
  const [state, setState] = useState<FlowState>("idle");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [processingStep, setProcessingStep] = useState(0);
  const [generatingIndex, setGeneratingIndex] = useState(-1);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || !file.type.startsWith("image/")) return;
      e.target.value = "";
      setState("processing");
      setProcessingStep(0);

      const steps = PROCESSING_STEPS.length;
      const stepInterval = 800;
      const timers: ReturnType<typeof setTimeout>[] = [];
      for (let i = 0; i < steps; i++) {
        timers.push(
          setTimeout(() => setProcessingStep(i), i * stepInterval)
        );
      }

      try {
        const url = await uploadCVPhoto(file, userId);
        timers.forEach(clearTimeout);
        setProcessingStep(steps - 1);
        setTimeout(() => {
          setPhotoUrl(url);
          setState("preview");
        }, 400);
      } catch {
        timers.forEach(clearTimeout);
        setState("idle");
      }
    },
    [userId]
  );

  const handleRemoveAndReupload = useCallback(() => {
    setPhotoUrl(null);
    setState("idle");
  }, []);

  const handleCvCreate = useCallback(() => {
    setState("generating");
    setGeneratingIndex(-1);
  }, []);

  useEffect(() => {
    if (state !== "generating") return;
    const total = GENERATING_ITEMS.length;
    const delay = 500;
    const timeouts: ReturnType<typeof setTimeout>[] = [];
    for (let i = 0; i < total; i++) {
      timeouts.push(setTimeout(() => setGeneratingIndex(i), (i + 1) * delay));
    }
    const redirectTimer = setTimeout(() => {
      onComplete?.();
      router.push("/odeme");
    }, total * delay + 800);
    return () => {
      timeouts.forEach(clearTimeout);
      clearTimeout(redirectTimer);
    };
  }, [state, onComplete, router, redirectPath]);

  return (
    <div className="mx-auto max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-xl sm:p-8">
      <AnimatePresence mode="wait">
        {state === "idle" && (
          <motion.div
            key="idle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            {flowType === "voice" ? (
              <p className="text-center text-lg font-medium text-slate-800">
                İşe alım sürecinde daha başarılı bir yol çizmemiz için yüzünüzün net görüldüğü bir fotoğraf yükleyin.
              </p>
            ) : (
              <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4">
                <p className="mb-3 text-sm font-semibold text-slate-700">Fotoğraf ipuçları</p>
                <ul className="space-y-2 text-sm text-slate-600">
                  <li>• Yüzünüz net gözükmeli</li>
                  <li>• Aydınlık bir ortamda çekilmeli</li>
                  <li>• Göz teması kurun</li>
                </ul>
              </div>
            )}
            <label className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-slate-300 bg-gradient-to-br from-slate-50 to-blue-50/30 py-10 transition hover:border-blue-400 hover:from-blue-50/50 hover:to-indigo-50/30">
              <span className="flex items-center gap-2 rounded-full bg-slate-800 px-5 py-3 text-sm font-medium text-white shadow-md">
                <Upload className="h-4 w-4" />
                Fotoğraf Yükle / Çek
              </span>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg"
                className="hidden"
                onChange={handleFileSelect}
              />
            </label>
          </motion.div>
        )}

        {state === "processing" && (
          <motion.div
            key="processing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="relative overflow-hidden rounded-xl border border-slate-200 bg-gradient-to-br from-slate-50 via-blue-50/20 to-indigo-50/20 py-8 px-6"
          >
            <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-transparent via-white/20 to-transparent" />
            <div className="relative space-y-4">
              {PROCESSING_STEPS.map((text, i) => (
                <motion.div
                  key={text}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{
                    opacity: processingStep >= i ? 1 : 0.4,
                    x: 0,
                  }}
                  transition={{ duration: 0.3 }}
                  className="flex items-start gap-3"
                >
                  <span
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 ${
                      processingStep >= i
                        ? "border-green-500 bg-green-500 text-white"
                        : "border-slate-300 bg-slate-100"
                    }`}
                  >
                    {processingStep > i ? <Check className="h-3.5 w-3.5" /> : null}
                  </span>
                  <p className="text-sm font-medium text-slate-700">{text}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {state === "preview" && photoUrl && (
          <motion.div
            key="preview"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            <div className="relative aspect-square max-w-sm overflow-hidden rounded-xl border border-slate-200 bg-slate-100 mx-auto">
              <img
                src={photoUrl}
                alt="Yüklenen fotoğraf"
                className="h-full w-full object-cover"
              />
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
              <button
                type="button"
                onClick={handleRemoveAndReupload}
                className="flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-slate-100 px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-200"
              >
                <Trash2 className="h-4 w-4" />
                Fotoğrafı Sil ve Tekrar Yükle
              </button>
              <button
                type="button"
                onClick={handleCvCreate}
                className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-md transition hover:from-blue-700 hover:to-indigo-700"
              >
                <Sparkles className="h-4 w-4" />
                CV Oluştur
              </button>
            </div>
          </motion.div>
        )}

        {state === "generating" && (
          <motion.div
            key="generating"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-6 py-4"
          >
            <p className="text-center text-lg font-semibold text-slate-800">
              Gelişmiş sistemimiz sizin için çalışıyor, süreçte sizinleyiz...
            </p>
            <ul className="space-y-3">
              {GENERATING_ITEMS.map((label, i) => (
                <motion.li
                  key={label}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{
                    opacity: generatingIndex >= i ? 1 : 0.5,
                    x: 0,
                  }}
                  transition={{ duration: 0.25 }}
                  className="flex items-center gap-3"
                >
                  <span
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
                      generatingIndex >= i ? "bg-green-500 text-white" : "bg-slate-200"
                    }`}
                  >
                    {generatingIndex >= i ? <Check className="h-4 w-4" /> : null}
                  </span>
                  <span className="text-sm font-medium text-slate-700">{label}</span>
                </motion.li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
