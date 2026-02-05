import { NextRequest, NextResponse } from "next/server";

/**
 * TTS: Metni ElevenLabs ile sese çevirir.
 * ELEVENLABS_API_KEY server env'de olmalı.
 */
export async function POST(request: NextRequest) {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "TTS yapılandırılmamış" }, { status: 503 });
  }
  try {
    const { text } = (await request.json()) as { text?: string };
    if (!text?.trim()) {
      return NextResponse.json({ error: "text gerekli" }, { status: 400 });
    }
    // ElevenLabs voice_id: varsayılan kadın ses (Rachel örnek)
    const voiceId = process.env.ELEVENLABS_VOICE_ID || "21m00Tcm4TlvDq8ikWAM";
    const res = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "xi-api-key": apiKey,
          Accept: "audio/mpeg",
        },
        body: JSON.stringify({
          text: text.trim(),
          model_id: "eleven_multilingual_v2",
        }),
      }
    );
    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json({ error: err || "TTS hatası" }, { status: res.status });
    }
    const audio = await res.arrayBuffer();
    return new NextResponse(audio, {
      headers: { "Content-Type": "audio/mpeg" },
    });
  } catch (e) {
    console.error("TTS error", e);
    return NextResponse.json({ error: "TTS hatası" }, { status: 500 });
  }
}
