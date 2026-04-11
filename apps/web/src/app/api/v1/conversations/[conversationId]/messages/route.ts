import { NextRequest, NextResponse } from "next/server";
import { jsonError } from "@/lib/api/errors";
import { requireSessionUserId } from "@/server/auth-context";
import {
  appendMessage,
  getConversation,
  getMessages,
  setConversationModel,
} from "@/server/conversation-store";
import { generateAssistantReply } from "@/server/llm/generate-reply";
import { checkRateLimit, rateLimitKey } from "@/server/rate-limit";

type Ctx = { params: Promise<{ conversationId: string }> };

function chatMessageLimit(): { max: number; windowMs: number } {
  const max = Number(process.env.RATE_LIMIT_CHAT_MESSAGES_PER_MIN ?? 40);
  const windowMs = 60_000;
  return { max: Number.isFinite(max) && max > 0 ? max : 40, windowMs };
}

export async function GET(_request: NextRequest, context: Ctx) {
  const { conversationId } = await context.params;
  const ownerUserId = await requireSessionUserId();
  if (!ownerUserId) {
    return jsonError(401, "unauthorized", "Sessão necessária.");
  }
  const messages = await getMessages(conversationId, ownerUserId);
  if (messages === null) {
    return jsonError(404, "not_found", "Conversa não encontrada");
  }
  return NextResponse.json({ messages });
}

export async function POST(request: NextRequest, context: Ctx) {
  const { conversationId } = await context.params;
  const ownerUserId = await requireSessionUserId();
  if (!ownerUserId) {
    return jsonError(401, "unauthorized", "Sessão necessária.");
  }

  const { max, windowMs } = chatMessageLimit();
  const rlKey = rateLimitKey("chat-msg", ownerUserId);
  if (!checkRateLimit(rlKey, max, windowMs)) {
    return jsonError(429, "rate_limited", "Muitas mensagens por minuto. Aguarda um momento.");
  }

  if (!(await getConversation(conversationId, ownerUserId))) {
    return jsonError(404, "not_found", "Conversa não encontrada");
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError(400, "invalid_json", "Corpo JSON inválido");
  }

  const content =
    typeof body === "object" &&
    body !== null &&
    "content" in body &&
    typeof (body as { content: unknown }).content === "string"
      ? (body as { content: string }).content.trim()
      : "";

  if (!content) {
    return jsonError(400, "validation_error", "Campo content é obrigatório");
  }

  const prior = (await getMessages(conversationId, ownerUserId)) ?? [];
  const userMsg = await appendMessage(conversationId, ownerUserId, "user", content);
  if (!userMsg) {
    return jsonError(500, "persist_failed", "Não foi possível salvar a mensagem");
  }

  try {
    const priorForLlm = prior.filter((m) => m.role !== "system");
    const reply = await generateAssistantReply({
      priorMessages: priorForLlm,
      userContent: content,
    });

    await setConversationModel(conversationId, ownerUserId, reply.model);

    const assistantMsg = await appendMessage(
      conversationId,
      ownerUserId,
      "assistant",
      reply.content,
    );
    if (!assistantMsg) {
      return jsonError(500, "persist_failed", "Não foi possível salvar a resposta");
    }

    return NextResponse.json({
      userMessage: userMsg,
      assistantMessage: assistantMsg,
      model: reply.model,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Erro ao gerar resposta";
    return jsonError(502, "llm_error", message);
  }
}
