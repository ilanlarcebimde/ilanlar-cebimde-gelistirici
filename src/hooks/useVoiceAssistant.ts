"use client";

import { useCallback, useRef, useState } from "react";
import { createBrowserSTT, isSpeechRecognitionSupported } from "@/lib/stt";

type Phase = "idle" | "loading" | "playing" | "listening" | "converting";

const STT_SILENCE_MS = 2500;

/** Soru sesi cache: aynı metin tekrar istenirse ElevenLabs çağrılmaz */
const ttsCache = new Map<string, Blob>();

async function getCachedOrFetch(text: string): Promise<Blob> {
  const key = text.trim();
  if (!key) throw new Error("empty");
  const cached = ttsCache.get(key);
  if (cached) return cached;

  const res = await fetch("/api/tts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: key }),
  });

  const ct = res.headers.get("content-type") ?? "";
  if (!res.ok) {
    const detail = ct.includes("application/json") ? await res.json() : await res.text();
    throw new Error(typeof detail === "string" ? detail : JSON.stringify(detail));
  }
  if (!ct.includes("audio")) {
    const maybeJson = await res.text();
    throw new Error("TTS audio dönmedi: " + maybeJson.slice(0, 200));
  }

  const blob = await res.blob();
  ttsCache.set(key, blob);
  return blob;
}

export function useVoiceAssistant() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [transcript, setTranscript] = useState("");
  const [lastError, setLastError] = useState<string | null>(null);
  const transcriptRef = useRef("");
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const objectUrlRef = useRef<string | null>(null);
  const sttRef = useRef<ReturnType<typeof createBrowserSTT> | null>(null);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  transcriptRef.current = transcript;

  const cancelCurrentTTS = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
      audioRef.current = null;
    }
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
  }, []);

  const playTTS = useCallback(async (text: string) => {
    if (!text?.trim()) return;
    setLastError(null);
    cancelCurrentTTS();
    setPhase("loading");
    try {
      const blob = await getCachedOrFetch(text);
      const url = URL.createObjectURL(blob);
      objectUrlRef.current = url;
      const audio = new Audio(url);
      audioRef.current = audio;

      audio.onended = () => {
        if (objectUrlRef.current === url) {
          URL.revokeObjectURL(url);
          objectUrlRef.current = null;
        }
        audioRef.current = null;
        setPhase("idle");
      };
      audio.onerror = () => {
        if (objectUrlRef.current === url) {
          URL.revokeObjectURL(url);
          objectUrlRef.current = null;
        }
        audioRef.current = null;
        setPhase("idle");
      };

      await audio.play().catch((err: unknown) => {
        URL.revokeObjectURL(url);
        objectUrlRef.current = null;
        audioRef.current = null;
        setPhase("idle");
        const isNotAllowed = err instanceof Error && err.name === "NotAllowedError";
        setLastError(
          isNotAllowed
            ? "Tarayıcı otomatik ses oynatmayı engelledi. 'Soruyu Tekrar Oku'ya tıklayın."
            : "Ses üretilemedi veya oynatılamadı."
        );
        throw err;
      });

      setPhase("playing");
    } catch (e) {
      setPhase("idle");
      if (e instanceof Error && e.name === "NotAllowedError") return; // zaten play().catch içinde setLastError yapıldı
      console.error("TTS_FAILED", e);
      const msg =
        e instanceof Error ? e.message : "Ses üretilemedi. Lütfen 'Soruyu Tekrar Oku'ya tıklayın.";
      setLastError(msg.length > 140 ? msg.slice(0, 140) + "…" : msg);
    }
  }, [cancelCurrentTTS]);

  const startSTT = useCallback(
    (_onResult?: (text: string) => void) => {
      if (!isSpeechRecognitionSupported()) {
        _onResult?.("");
        return;
      }
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = null;
      }
      setTranscript("");
      setPhase("listening");

      const scheduleSilenceStop = () => {
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = setTimeout(() => {
          silenceTimerRef.current = null;
          if (sttRef.current) {
            sttRef.current.stop();
            sttRef.current = null;
          }
          setPhase("converting");
        }, STT_SILENCE_MS);
      };

      sttRef.current = createBrowserSTT(
        (r) => {
          transcriptRef.current = r.text;
          setTranscript(r.text);
          scheduleSilenceStop();
        },
        () => setPhase("idle"),
        (err) => {
          setLastError(err);
          setPhase("idle");
        }
      );
      setLastError(null);
      sttRef.current.start();
      scheduleSilenceStop();
    },
    []
  );

  const stopSTT = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    if (sttRef.current) {
      sttRef.current.stop();
      sttRef.current = null;
    }
    setPhase("converting");
  }, []);

  const getTranscript = useCallback(() => transcriptRef.current, []);
  const setTranscriptManual = useCallback((t: string) => setTranscript(t), []);

  return {
    phase,
    transcript,
    lastError,
    playTTS,
    startSTT,
    stopSTT,
    getTranscript,
    setTranscript: setTranscriptManual,
    isSTTSupported: isSpeechRecognitionSupported(),
  };
}
