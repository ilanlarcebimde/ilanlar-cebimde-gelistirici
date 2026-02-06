"use client";

import { useCallback, useRef, useState } from "react";
import { createBrowserSTT, isSpeechRecognitionSupported } from "@/lib/stt";

type Phase = "idle" | "loading" | "playing" | "listening" | "converting";

const STT_SILENCE_MS = 2500;

/** Soru sesi cache: aynı metin tekrar istenirse ElevenLabs çağrılmaz */
const ttsCache = new Map<string, Blob>();

function getCachedOrFetch(text: string): Promise<Blob> {
  const key = text.trim();
  if (!key) return Promise.reject(new Error("empty"));
  const cached = ttsCache.get(key);
  if (cached) return Promise.resolve(cached);
  return fetch("/api/tts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: key }),
  }).then((res) => {
    if (!res.ok) throw new Error("TTS failed");
    return res.blob();
  }).then((blob) => {
    ttsCache.set(key, blob);
    return blob;
  });
}

export function useVoiceAssistant() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [transcript, setTranscript] = useState("");
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
      setPhase("playing");
      await audio.play();
    } catch {
      setPhase("idle");
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
        () => setPhase("idle")
      );
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
    playTTS,
    startSTT,
    stopSTT,
    getTranscript,
    setTranscript: setTranscriptManual,
    isSTTSupported: isSpeechRecognitionSupported(),
  };
}
