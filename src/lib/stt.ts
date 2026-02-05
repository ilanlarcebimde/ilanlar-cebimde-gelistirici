/**
 * STT (Speech-to-Text) abstraction.
 * MVP: Web Speech API (tarayıcı).
 * Prod: Server STT (Google STT / Deepgram) için transcribeAudio(blob) implementasyonu değiştirilir.
 */

export type STTResult = { text: string; isFinal: boolean };

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
  onresult: ((e: SpeechRecognitionEvent) => void) | null;
  onend: (() => void) | null;
}

/**
 * Tarayıcı Web Speech API ile canlı transkript.
 * MVP: sadece bu kullanılır.
 */
export function createBrowserSTT(
  onResult: (r: STTResult) => void,
  onEnd: () => void
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
    return { start: () => {}, stop: () => {} };
  }
  const recognition: BrowserSpeechRecognition = new Ctor();
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = "tr-TR";
  recognition.onresult = (e: SpeechRecognitionEvent) => {
    const last = e.results[e.results.length - 1];
    const text = last[0].transcript;
    onResult({ text, isFinal: last.isFinal });
  };
  recognition.onend = onEnd;
  return {
    start: () => recognition.start(),
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
