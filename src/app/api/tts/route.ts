import { NextResponse } from "next/server";

/**
 * TTS: Metni ElevenLabs ile sese çevirir.
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
    // eleven_turbo_v2_5: düşük gecikme; eleven_multilingual_v2: çok dilli (Türkçe)
    const modelId = process.env.ELEVENLABS_MODEL_ID || "eleven_turbo_v2_5";
    const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`;

    const r = await fetch(url, {
      method: "POST",
      headers: {
        Accept: "audio/mpeg",
        "Content-Type": "application/json",
        "xi-api-key": apiKey, // ElevenLabs Authorization değil, xi-api-key kullanır
      },
      body: JSON.stringify({
        text: text.trim(),
        model_id: modelId,
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.5,
        },
      }),
    });

    if (!r.ok) {
      const errText = await r.text();
      return NextResponse.json(
        {
          error: "elevenlabs_failed",
          status: r.status,
          detail: errText.slice(0, 500),
        },
        { status: 503 }
      );
    }

    const audioBuffer = await r.arrayBuffer();
    return new NextResponse(audioBuffer, {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "no-store",
      },
    });
  } catch (e: unknown) {
    console.error("TTS error", e);
    return NextResponse.json(
      {
        error: "internal_error",
        detail: String(e instanceof Error ? e.message : "unknown").slice(0, 200),
      },
      { status: 500 }
    );
  }
}
