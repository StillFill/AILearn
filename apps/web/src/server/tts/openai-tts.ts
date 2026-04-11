/**
 * Text-to-speech via OpenAI Audio API (servidor — chave nunca no browser).
 * Ativado só com OPENAI_TTS_ENABLED=true e OPENAI_API_KEY definida.
 */

const OPENAI_SPEECH_URL = "https://api.openai.com/v1/audio/speech";

const ALLOWED_VOICES = new Set([
  "alloy",
  "echo",
  "fable",
  "onyx",
  "nova",
  "shimmer",
]);

/** Limite da API OpenAI para o campo `input`. */
export const OPENAI_TTS_MAX_CHARS = 4096;

export function isOpenAiTtsEnabledFlag(): boolean {
  const v = process.env.OPENAI_TTS_ENABLED?.trim().toLowerCase();
  return v === "true" || v === "1";
}

/** TTS OpenAI disponível no BFF (flag + chave). */
export function isOpenAiTtsConfigured(): boolean {
  return (
    isOpenAiTtsEnabledFlag() && Boolean(process.env.OPENAI_API_KEY?.trim())
  );
}

export function openAiTtsModel(): string {
  return process.env.OPENAI_TTS_MODEL?.trim() || "tts-1";
}

export function openAiTtsVoice(): string {
  const v = (process.env.OPENAI_TTS_VOICE?.trim().toLowerCase() || "nova") as
    | "alloy"
    | "echo"
    | "fable"
    | "onyx"
    | "nova"
    | "shimmer";
  return ALLOWED_VOICES.has(v) ? v : "nova";
}

export async function synthesizeOpenAiSpeech(
  text: string,
): Promise<ArrayBuffer> {
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key) {
    throw new Error("OPENAI_API_KEY is not set");
  }
  const input = text.trim().slice(0, OPENAI_TTS_MAX_CHARS);
  if (!input) {
    throw new Error("empty input");
  }

  const res = await fetch(OPENAI_SPEECH_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: openAiTtsModel(),
      voice: openAiTtsVoice(),
      input,
      response_format: "mp3",
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`OpenAI TTS ${res.status}: ${errText.slice(0, 400)}`);
  }

  return res.arrayBuffer();
}
