import { NextRequest, NextResponse } from "next/server";
import { jsonError } from "@/lib/api/errors";
import { requireSessionUserId } from "@/server/auth-context";
import { checkRateLimit, rateLimitKey } from "@/server/rate-limit";
import {
  isOpenAiTtsConfigured,
  OPENAI_TTS_MAX_CHARS,
  synthesizeOpenAiSpeech,
} from "@/server/tts/openai-tts";

function ttsLimit(): { max: number; windowMs: number } {
  const max = Number(process.env.RATE_LIMIT_TTS_PER_MIN ?? 30);
  const windowMs = 60_000;
  return { max: Number.isFinite(max) && max > 0 ? max : 30, windowMs };
}

export async function POST(request: NextRequest) {
  const ownerUserId = await requireSessionUserId();
  if (!ownerUserId) {
    return jsonError(401, "unauthorized", "Sessão necessária.");
  }

  if (!isOpenAiTtsConfigured()) {
    return jsonError(
      503,
      "tts_disabled",
      "TTS OpenAI desativado ou não configurado.",
    );
  }

  const { max, windowMs } = ttsLimit();
  const rlKey = rateLimitKey("tts", ownerUserId);
  if (!checkRateLimit(rlKey, max, windowMs)) {
    return jsonError(
      429,
      "rate_limited",
      "Muitos pedidos de áudio por minuto. Aguarda um momento.",
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError(400, "invalid_json", "Corpo JSON inválido");
  }

  const text =
    typeof body === "object" &&
    body !== null &&
    "text" in body &&
    typeof (body as { text: unknown }).text === "string"
      ? (body as { text: string }).text
      : "";

  const trimmed = text.trim();
  if (!trimmed) {
    return jsonError(400, "validation_error", "Campo text é obrigatório");
  }
  if (trimmed.length > OPENAI_TTS_MAX_CHARS) {
    return jsonError(
      400,
      "validation_error",
      `Texto excede ${OPENAI_TTS_MAX_CHARS} caracteres`,
    );
  }

  try {
    const buf = await synthesizeOpenAiSpeech(trimmed);
    return new NextResponse(buf, {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Erro ao gerar áudio";
    return jsonError(502, "tts_error", message);
  }
}
