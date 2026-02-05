"use client";

import { useCallback, useRef, useState } from "react";
import { createBrowserSTT, isSpeechRecognitionSupported } from "@/lib/stt";

type Phase = "idle" | "loading" | "playing" | "listening" | "converting";

export function useVoiceAssistant() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [transcript, setTranscript] = useState("");
  const transcriptRef = useRef("");
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const sttRef = useRef<ReturnType<typeof createBrowserSTT> | null>(null);
  transcriptRef.current = transcript;

  const playTTS = useCallback(async (text: string) => {
    setPhase("loading");
    try {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) throw new Error("TTS failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = () => {
        URL.revokeObjectURL(url);
        setPhase("idle");
      };
      audio.onerror = () => {
        URL.revokeObjectURL(url);
        setPhase("idle");
      };
      setPhase("playing");
      await audio.play();
    } catch {
      setPhase("idle");
    }
  }, []);

  const startSTT = useCallback(
    (onResult: (text: string) => void) => {
      if (!isSpeechRecognitionSupported()) {
        onResult("");
        return;
      }
      setTranscript("");
      setPhase("listening");
      sttRef.current = createBrowserSTT(
        (r) => {
          transcriptRef.current = r.text;
          setTranscript(r.text);
        },
        () => setPhase("idle")
      );
      sttRef.current.start();
    },
    []
  );

  const stopSTT = useCallback(() => {
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
