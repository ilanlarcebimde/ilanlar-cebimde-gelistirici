import { NextResponse } from "next/server";

/**
 * TTS: Metni ElevenLabs ile sese çevirir.
 * ELEVENLABS_API_KEY server env'de olmalı.
 * Kontrat: 200 → audio/mpeg (binary) | 400 → text_required | 503 → tts_unavailable | 500 → internal_error
 */
export async function POST(req: Request) {
  try {
    const { text } = (await req.json()) as { text?: string };
    if (!text?.trim()) {
      return NextResponse.json({ error: "text_required" }, { status: 400 });
    }

    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "tts_unavailable" }, { status: 503 });
    }

    const voiceId = process.env.ELEVENLABS_VOICE_ID ?? "21m00Tcm4TlvDq8ikWAM";

    const res = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        method: "POST",
        headers: {
          "xi-api-key": apiKey,
          "Content-Type": "application/json",
          Accept: "audio/mpeg",
        },
        body: JSON.stringify({
          text: text.trim(),
          model_id: "eleven_multilingual_v2",
        }),
      }
    );

    if (!res.ok) {
      return NextResponse.json({ error: "tts_unavailable" }, { status: 503 });
    }

    const audioBuffer = await res.arrayBuffer();

    return new NextResponse(audioBuffer, {
      headers: { "Content-Type": "audio/mpeg" },
    });
  } catch (e) {
    console.error("TTS error", e);
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
