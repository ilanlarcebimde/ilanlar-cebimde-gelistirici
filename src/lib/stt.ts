/**
 * STT (Speech-to-Text) abstraction.
 * MVP: Web Speech API (tarayıcı).
 * Prod: Server STT (Google STT / Deepgram) için transcribeAudio(blob) implementasyonu değiştirilir.
 */

export type STTResult = { text: string; isFinal: boolean };

/** Web Speech API result event shape (browser type not in TS lib) */
interface SpeechResultEvent {
  results: ArrayLike<{ readonly length: number; 0: { transcript: string }; isFinal: boolean }>;
}

export function isSpeechRecognitionSupported(): boolean {
  if (typeof window === "undefined") return false;
  return "webkitSpeechRecognition" in window || "SpeechRecognition" in window;
}

interface BrowserSpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onresult: ((e: SpeechResultEvent) => void) | null;
  onend: (() => void) | null;
  onerror: ((e: { error: string }) => void) | null;
}

/**
 * Tarayıcı Web Speech API ile canlı transkript.
 * continuous modda tüm segmentler birleştirilerek tam metin döner.
 */
export function createBrowserSTT(
  onResult: (r: STTResult) => void,
  onEnd: () => void,
  onError?: (error: string) => void
): { start: () => void; stop: () => void } {
  if (typeof window === "undefined") {
    return { start: () => {}, stop: () => {} };
  }
  const Win = window as unknown as {
    webkitSpeechRecognition?: new () => BrowserSpeechRecognition;
    SpeechRecognition?: new () => BrowserSpeechRecognition;
  };
  const Ctor = Win.webkitSpeechRecognition ?? Win.SpeechRecognition;
  if (!Ctor) {
    onError?.("Tarayıcı ses tanımayı desteklemiyor.");
    return { start: () => {}, stop: () => {} };
  }
  const recognition: BrowserSpeechRecognition = new Ctor();
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = "tr-TR";
  recognition.onresult = (e: SpeechResultEvent) => {
    // continuous modda kümülatif segmentler gelir: "22" → "22 Nisan" → "22 Nisan 1927". Önceki segment
    // yeni segmentin öneki ise yerine geçir (tekrarlı kelime/sayı yazılmasın).
    const segments: string[] = [];
    for (let i = 0; i < e.results.length; i++) {
      const segment = (e.results[i]?.[0]?.transcript ?? "").trim();
      if (!segment) continue;
      const last = segments[segments.length - 1];
      if (segment === last) continue;
      if (last && segment.startsWith(last)) {
        segments[segments.length - 1] = segment;
      } else if (last && last.startsWith(segment)) {
        continue;
      } else {
        segments.push(segment);
      }
    }
    const text = segments.join(" ").trim();
    const last = e.results[e.results.length - 1];
    onResult({ text, isFinal: last?.isFinal ?? false });
  };
  recognition.onend = onEnd;
  recognition.onerror = (e: { error?: string }) => {
    const msg = e?.error === "not-allowed"
      ? "Mikrofon izni verilmedi."
      : e?.error === "no-speech"
        ? "Ses algılanamadı."
        : e?.error
          ? String(e.error)
          : "Ses tanıma hatası.";
    onError?.(msg);
    onEnd();
  };
  return {
    start: () => {
      try {
        recognition.start();
      } catch (err) {
        onError?.(err instanceof Error ? err.message : "Mikrofon başlatılamadı.");
        onEnd();
      }
    },
    stop: () => recognition.stop(),
  };
}

/**
 * Prod: Sunucuya blob gönder, metin al.
 * Şimdilik kullanılmıyor; ileride /api/stt ile değiştirilebilir.
 */
export async function transcribeAudio(blob: Blob): Promise<string> {
  // TODO: POST blob to /api/stt (Google STT or Deepgram), return transcript
  return "";
}
