import { NextResponse } from "next/server";
import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";

/**
 * TTS: Metni ElevenLabs ile sese çevirir (resmi SDK ile; header/401 sorunları önlenir).
 * ELEVENLABS_API_KEY server env'de olmalı.
 * Kontrat: 200 → audio/mpeg (binary) | 400 → text_required | 503 → tts_unavailable | 500 → internal_error
 */
export const runtime = "nodejs";

const DEFAULT_VOICE_ID = "21m00Tcm4TlvDq8ikWAM"; // Rachel

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

    const voiceId = process.env.ELEVENLABS_VOICE_ID || DEFAULT_VOICE_ID;
    const modelId = process.env.ELEVENLABS_MODEL_ID || "eleven_turbo_v2_5";

    const elevenlabs = new ElevenLabsClient({ apiKey });

    const stream = await elevenlabs.textToSpeech.convert(voiceId, {
      text: text.trim(),
      modelId,
      outputFormat: "mp3_44100_128",
      voiceSettings: {
        stability: 0.5,
        similarityBoost: 0.5,
      },
    });

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
  } catch (e: unknown) {
    console.error("TTS error", e);
    const status = e && typeof e === "object" && "status" in e ? (e as { status: number }).status : 503;
    const detail =
      e && typeof e === "object" && "message" in e
        ? String((e as { message: unknown }).message)
        : String(e instanceof Error ? e.message : "unknown");
    return NextResponse.json(
      {
        error: "elevenlabs_failed",
        status: status || 503,
        detail: detail.slice(0, 500),
      },
      { status: 503 }
    );
  }
}
