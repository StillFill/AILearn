import { NextRequest, NextResponse } from "next/server";
import { jsonError } from "@/lib/api/errors";
import { requireSessionUserId } from "@/server/auth-context";
import {
  appendMessage,
  getConversation,
  getMessages,
  setConversationModel,
} from "@/server/conversation-store";
import { streamAssistantReply } from "@/server/llm/generate-reply";
import { checkRateLimit, rateLimitKey } from "@/server/rate-limit";
import { extractSignalsFromMessage } from "@/server/study/signal-extractor";
import {
  addLearningSignals,
  getStudySessionById,
  refreshSessionProgress,
} from "@/server/study/study-service";
import { isMessageWithinSessionTheme } from "@/server/study/session-topic-guard";

type Ctx = { params: Promise<{ conversationId: string }> };
const encoder = new TextEncoder();

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

  const conversation = await getConversation(conversationId, ownerUserId);
  if (!conversation) {
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

  const priorForLlm = prior.filter((m) => m.role !== "system");
  const activeSession =
    conversation.learningSessionId != null
      ? await getStudySessionById(ownerUserId, conversation.learningSessionId)
      : null;

  if (
    activeSession &&
    !isMessageWithinSessionTheme({ session: activeSession, userContent: content })
  ) {
    const assistantMsg = await appendMessage(
      conversationId,
      ownerUserId,
      "assistant",
      [
        `Estamos na sessão de ${activeSession.subject} sobre "${activeSession.topic}".`,
        "Para estudar um tema diferente, crie uma nova sessão de estudo com a matéria e tópico corretos.",
      ].join(" "),
    );
    if (!assistantMsg) {
      return jsonError(500, "persist_failed", "Não foi possível salvar a resposta de orientação.");
    }

    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(encoder.encode("event: start\n"));
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ userMessage: userMsg })}\n\n`));
        controller.enqueue(encoder.encode("event: done\n"));
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ assistantMessage: assistantMsg, model: "session-guard" })}\n\n`,
          ),
        );
        controller.close();
      },
    });

    return new NextResponse(stream, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
  }
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const writeEvent = (event: string, payload: unknown) => {
        controller.enqueue(encoder.encode(`event: ${event}\n`));
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
      };

      writeEvent("start", { userMessage: userMsg });

      try {
        const generator = streamAssistantReply({
          priorMessages: priorForLlm,
          userContent: content,
          studySessionContext: activeSession
            ? {
                subject: activeSession.subject,
                topic: activeSession.topic,
                declaredDifficulty: activeSession.declaredDifficulty,
                goal: activeSession.goal,
              }
            : null,
        });

        let combined = "";
        let model = "mock-llm";

        while (true) {
          const next = await generator.next();
          if (next.done) {
            model = next.value.model;
            combined = next.value.content;
            break;
          }
          model = next.value.model;
          combined += next.value.delta;
          writeEvent("delta", { delta: next.value.delta, model });
        }

        await setConversationModel(conversationId, ownerUserId, model);
        const assistantMsg = await appendMessage(conversationId, ownerUserId, "assistant", combined);
        if (!assistantMsg) {
          writeEvent("error", {
            code: "persist_failed",
            message: "Não foi possível salvar a resposta",
          });
          controller.close();
          return;
        }

        if (activeSession) {
          const signals = extractSignalsFromMessage({
            session: activeSession,
            userContent: content,
            assistantContent: combined,
          });
          await addLearningSignals(ownerUserId, signals);
          await refreshSessionProgress(activeSession.id, ownerUserId);
        }

        writeEvent("done", { assistantMessage: assistantMsg, model });
        controller.close();
      } catch (e) {
        const message = e instanceof Error ? e.message : "Erro ao gerar resposta";
        writeEvent("error", { code: "llm_error", message });
        controller.close();
      }
    },
  });

  return new NextResponse(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
