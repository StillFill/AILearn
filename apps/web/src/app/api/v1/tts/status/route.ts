import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api/errors";
import { requireSessionUserId } from "@/server/auth-context";
import { isOpenAiTtsConfigured } from "@/server/tts/openai-tts";

/**
 * Indica se o cliente pode usar POST /api/v1/tts (OpenAI).
 * Não expõe chaves nem texto.
 */
export async function GET() {
  const ownerUserId = await requireSessionUserId();
  if (!ownerUserId) {
    return jsonError(401, "unauthorized", "Sessão necessária.");
  }
  return NextResponse.json({ openaiTtsEnabled: isOpenAiTtsConfigured() });
}
