import { NextResponse } from "next/server";
import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";

/**
 * TTS: Metni ElevenLabs ile sese çevirir.
 * ELEVENLABS_API_KEY server env'de olmalı.
 * ELEVENLABS_VOICE_ID opsiyonel; yoksa veya 404 alınırsa API'den hesabınızdaki sesler alınır, ilki kullanılır.
 */
export const runtime = "nodejs";

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

/** Hesaptaki ilk sesin ID'sini GET /v1/voices ile al (legacy dahil). */
async function getFirstAvailableVoiceId(apiKey: string): Promise<string | null> {
  try {
    const res = await fetch("https://api.elevenlabs.io/v1/voices?show_legacy=true", {
      headers: { "xi-api-key": apiKey, Accept: "application/json" },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { voices?: { voice_id?: string; id?: string }[] };
    const first = data?.voices?.[0];
    const id = first?.voice_id ?? first?.id;
    return id && typeof id === "string" ? id : null;
  } catch {
    return null;
  }
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

    const envVoiceId = process.env.ELEVENLABS_VOICE_ID?.trim();
    const voiceIdsToTry: string[] = envVoiceId ? [envVoiceId] : [];

    let lastError: unknown = null;

    for (const voiceId of voiceIdsToTry) {
      try {
        const stream = await convertWithVoice(elevenlabs, voiceId, trimmedText);
        const audioBuffer = await streamToBuffer(stream);
        const body = new Uint8Array(audioBuffer);
        return new NextResponse(body, {
          status: 200,
          headers: { "Content-Type": "audio/mpeg", "Cache-Control": "no-store" },
        });
      } catch (e) {
        lastError = e;
        if (is404(e)) continue;
        throw e;
      }
    }

    const fromApi = await getFirstAvailableVoiceId(apiKey);
    if (fromApi) {
      try {
        const stream = await convertWithVoice(elevenlabs, fromApi, trimmedText);
        const audioBuffer = await streamToBuffer(stream);
        const body = new Uint8Array(audioBuffer);
        return new NextResponse(body, {
          status: 200,
          headers: { "Content-Type": "audio/mpeg", "Cache-Control": "no-store" },
        });
      } catch (e) {
        lastError = e;
      }
    }

    throw lastError ?? new Error("No voice available");
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
          hint: "ElevenLabs panelinde Default Voices sayfasından bir ses seçip ELEVENLABS_VOICE_ID olarak ekleyin.",
        }),
      },
      { status: 503 }
    );
  }
}

async function streamToBuffer(stream: ReadableStream<Uint8Array>): Promise<Buffer> {
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];
  let done = false;
  while (!done) {
    const result = await reader.read();
    done = result.done;
    if (result.value) chunks.push(result.value);
  }
  return Buffer.concat(chunks);
}
