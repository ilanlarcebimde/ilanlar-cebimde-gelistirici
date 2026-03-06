import { NextResponse } from "next/server";
import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";

/**
 * TTS: Metni ElevenLabs ile sese çevirir (resmi SDK ile; header/401 sorunları önlenir).
 * ELEVENLABS_API_KEY server env'de olmalı.
 * ELEVENLABS_VOICE_ID opsiyonel; yoksa sırayla default/fallback sesler denenir.
 * Kontrat: 200 → audio/mpeg (binary) | 400 → text_required | 503 → tts_unavailable | 500 → internal_error
 */
export const runtime = "nodejs";

/** Eski varsayılan (Rachel — legacy, bazı hesaplarda 404 verebiliyor). */
const LEGACY_VOICE_ID = "21m00Tcm4TlvDq8ikWAM";
/** Dokümantasyon örneğinde kullanılan ses; 404 durumunda fallback. */
const FALLBACK_VOICE_ID = "JBFqnCBsd6RMkjVDRZzb";
/** Varsayılan model: API default, çok dilli ve uyumlu. */
const DEFAULT_MODEL_ID = "eleven_multilingual_v2";

async function convertWithVoice(
  client: ElevenLabsClient,
  voiceId: string,
  text: string
): Promise<ReadableStream<Uint8Array>> {
  return client.textToSpeech.convert(voiceId, {
    text,
    modelId: process.env.ELEVENLABS_MODEL_ID || DEFAULT_MODEL_ID,
    outputFormat: "mp3_44100_128",
    voiceSettings: {
      stability: 0.5,
      similarityBoost: 0.5,
    },
  });
}

function is404(e: unknown): boolean {
  if (e && typeof e === "object" && "status" in e) return (e as { status: number }).status === 404;
  const msg = e && typeof e === "object" && "message" in e ? String((e as { message: unknown }).message) : "";
  return msg.includes("404") || msg.includes("not_found");
}

export async function POST(req: Request) {
  try {
    const { text } = (await req.json()) as { text?: string };
    if (!text || typeof text !== "string" || !text.trim()) {
      return NextResponse.json({ error: "text_required" }, { status: 400 });
    }

    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "ELEVENLABS_API_KEY_missing" }, { status: 503 });
    }

    const elevenlabs = new ElevenLabsClient({ apiKey });
    const trimmedText = text.trim();

    const voiceIdsToTry: string[] = process.env.ELEVENLABS_VOICE_ID
      ? [process.env.ELEVENLABS_VOICE_ID]
      : [LEGACY_VOICE_ID, FALLBACK_VOICE_ID];

    let lastError: unknown = null;
    for (const voiceId of voiceIdsToTry) {
      try {
        const stream = await convertWithVoice(elevenlabs, voiceId, trimmedText);
        const reader = stream.getReader();
        const chunks: Uint8Array[] = [];
        let done = false;
        while (!done) {
          const result = await reader.read();
          done = result.done;
          if (result.value) chunks.push(result.value);
        }
        const audioBuffer = Buffer.concat(chunks);
        return new NextResponse(audioBuffer, {
          status: 200,
          headers: {
            "Content-Type": "audio/mpeg",
            "Cache-Control": "no-store",
          },
        });
      } catch (e) {
        lastError = e;
        if (is404(e) && voiceIdsToTry.length > 1) continue;
        throw e;
      }
    }

    throw lastError;
  } catch (e: unknown) {
    console.error("TTS error", e);
    const status = e && typeof e === "object" && "status" in e ? (e as { status: number }).status : 503;
    const detail =
      e && typeof e === "object" && "message" in e
        ? String((e as { message: unknown }).message)
        : String(e instanceof Error ? e.message : "unknown");
    const isVoice404 = is404(e);
    return NextResponse.json(
      {
        error: "elevenlabs_failed",
        status: status || 503,
        detail: detail.slice(0, 500),
        ...(isVoice404 && {
          hint: "ELEVENLABS_VOICE_ID ortam değişkenine ElevenLabs panelinden (Default Voices) kopyaladığınız bir ses ID'si atayın.",
        }),
      },
      { status: 503 }
    );
  }
}
