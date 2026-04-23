import { NextRequest } from "next/server";

/**
 * GET /api/speak?text=...
 *
 * Proxy naar ElevenLabs TTS. Streamt audio/mpeg terug. We doen dit
 * server-side zodat de API-key niet in de browser belandt. Geen auth —
 * de middleware dekt /api/chat al af, /api/speak hoeft niet beschermd
 * (tekst komt uit de chat-stream die wel beschermd is).
 *
 * Env vars:
 *   ELEVENLABS_API_KEY       — vereist
 *   ELEVENLABS_VOICE_ID      — vereist (bv. een Nederlandse stem)
 *   ELEVENLABS_MODEL_ID      — optioneel, default eleven_multilingual_v2
 */
export async function GET(request: NextRequest) {
  const text = request.nextUrl.searchParams.get("text") || "";
  if (!text.trim()) {
    return new Response("Missing text", { status: 400 });
  }
  if (text.length > 2500) {
    return new Response("Tekst te lang voor TTS", { status: 413 });
  }

  const apiKey = process.env.ELEVENLABS_API_KEY;
  const voiceId = process.env.ELEVENLABS_VOICE_ID;
  if (!apiKey || !voiceId) {
    return new Response("ElevenLabs niet geconfigureerd", { status: 503 });
  }

  const modelId = process.env.ELEVENLABS_MODEL_ID || "eleven_multilingual_v2";

  // Strip rendering artifacts — no markdown, no brackets, no chip suggestions.
  const clean = text
    .replace(/\[(?:suggesties|suggestions)\s*:\s*[^\]]+\]/gi, "")
    .replace(/<noor-data>[\s\S]*?<\/noor-data>/gi, "")
    .replace(/[*_`#>]/g, "")
    .trim();

  const res = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceId)}?output_format=mp3_44100_128`,
    {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
        "Content-Type": "application/json",
        Accept: "audio/mpeg",
      },
      body: JSON.stringify({
        text: clean,
        model_id: modelId,
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
          style: 0.2,
          use_speaker_boost: true,
        },
      }),
    }
  );

  if (!res.ok) {
    const body = await res.text();
    console.error(`[speak] ElevenLabs ${res.status}: ${body}`);
    return new Response(`ElevenLabs error: ${res.status}`, { status: 502 });
  }

  return new Response(res.body, {
    status: 200,
    headers: {
      "Content-Type": "audio/mpeg",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
