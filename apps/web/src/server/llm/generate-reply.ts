import type { Message } from "@/domain/chat";
import { getSystemPrompt } from "@/server/prompts/system";

export interface GenerateReplyInput {
  /** Histórico já persistido (sem a nova mensagem do usuário). */
  priorMessages: Message[];
  userContent: string;
  studySessionContext?: {
    subject: string;
    topic: string;
    declaredDifficulty: string;
    goal: string;
  } | null;
}

export interface GenerateReplyOutput {
  content: string;
  model: string;
}

export interface GenerateReplyChunk {
  delta: string;
  model: string;
}

/**
 * Camada LLM no servidor — chave nunca no browser.
 * Hoje: resposta mockada. Trocar por provedor (OpenAI/Azure/etc.) mantendo esta interface.
 */
export async function generateAssistantReply(
  input: GenerateReplyInput,
): Promise<GenerateReplyOutput> {
  const useOpenAI = Boolean(process.env.OPENAI_API_KEY?.trim());

  if (!useOpenAI) {
    return mockReply(input);
  }

  return openAiChatCompletion(input);
}

export async function* streamAssistantReply(
  input: GenerateReplyInput,
): AsyncGenerator<GenerateReplyChunk, GenerateReplyOutput> {
  const useOpenAI = Boolean(process.env.OPENAI_API_KEY?.trim());
  if (!useOpenAI) {
    return yield* streamMockReply(input);
  }
  return yield* streamOpenAiChatCompletion(input);
}

function mockReply(input: GenerateReplyInput): GenerateReplyOutput {
  const system = getSystemPrompt();
  void system;
  const q = input.userContent.trim() || "(mensagem vazia)";
  const studyContext = input.studySessionContext
    ? `\nSessão ativa: ${input.studySessionContext.subject} / ${input.studySessionContext.topic}. Objetivo: ${input.studySessionContext.goal}.`
    : "";
  return {
    model: "mock-llm",
    content: [
      "[Modo demonstração — sem OPENAI_API_KEY no servidor]",
      "",
      `Sua pergunta: «${q}»`,
      studyContext,
      "",
      "Com a integração real, aqui viria a resposta do modelo seguindo o prompt pedagógico (passo a passo, tom de professor). O BFF monta system + histórico + sua mensagem e persiste tudo após a conclusão.",
    ].join("\n"),
  };
}

async function* streamMockReply(
  input: GenerateReplyInput,
): AsyncGenerator<GenerateReplyChunk, GenerateReplyOutput> {
  const full = mockReply(input);
  const parts = full.content.split(/(\s+)/).filter((part) => part.length > 0);
  let combined = "";
  for (const part of parts) {
    combined += part;
    yield { delta: part, model: full.model };
    await new Promise((resolve) => setTimeout(resolve, 20));
  }
  return { model: full.model, content: combined };
}

/** Chamada mínima à API de chat da OpenAI (JSON completo na mesma requisição). */
async function openAiChatCompletion(input: GenerateReplyInput): Promise<GenerateReplyOutput> {
  const model = process.env.OPENAI_CHAT_MODEL?.trim() || "gpt-4o-mini";
  const system = getSystemPrompt();

  const sessionHint = input.studySessionContext
    ? `\nModo professor (sessão guiada ativa): Matéria=${input.studySessionContext.subject}; Tópico=${input.studySessionContext.topic}; Dificuldade declarada=${input.studySessionContext.declaredDifficulty}; Objetivo=${input.studySessionContext.goal}. Conduza em etapas: diagnosticar -> ensinar -> praticar -> verificar -> próximo passo.`
    : "";

  const apiMessages: { role: "system" | "user" | "assistant"; content: string }[] = [
    { role: "system", content: `${system}${sessionHint}` },
    ...input.priorMessages
      .filter((m) => m.role !== "system")
      .map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
    { role: "user", content: input.userContent },
  ];

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model,
      messages: apiMessages,
      temperature: 0.6,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`OpenAI error ${res.status}: ${errText.slice(0, 500)}`);
  }

  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const content = data.choices?.[0]?.message?.content?.trim();
  if (!content) {
    throw new Error("OpenAI: resposta vazia");
  }

  return { model, content };
}

async function* streamOpenAiChatCompletion(
  input: GenerateReplyInput,
): AsyncGenerator<GenerateReplyChunk, GenerateReplyOutput> {
  const model = process.env.OPENAI_CHAT_MODEL?.trim() || "gpt-4o-mini";
  const system = getSystemPrompt();
  const sessionHint = input.studySessionContext
    ? `\nModo professor (sessão guiada ativa): Matéria=${input.studySessionContext.subject}; Tópico=${input.studySessionContext.topic}; Dificuldade declarada=${input.studySessionContext.declaredDifficulty}; Objetivo=${input.studySessionContext.goal}. Conduza em etapas: diagnosticar -> ensinar -> praticar -> verificar -> próximo passo.`
    : "";

  const apiMessages: { role: "system" | "user" | "assistant"; content: string }[] = [
    { role: "system", content: `${system}${sessionHint}` },
    ...input.priorMessages
      .filter((m) => m.role !== "system")
      .map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
    { role: "user", content: input.userContent },
  ];

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model,
      messages: apiMessages,
      temperature: 0.6,
      stream: true,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`OpenAI error ${res.status}: ${errText.slice(0, 500)}`);
  }

  if (!res.body) {
    throw new Error("OpenAI: stream indisponível");
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let content = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const events = buffer.split("\n\n");
    buffer = events.pop() ?? "";

    for (const event of events) {
      const lines = event
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line.startsWith("data:"))
        .map((line) => line.slice(5).trim());
      for (const line of lines) {
        if (line === "[DONE]") {
          return { model, content: content.trim() };
        }
        try {
          const json = JSON.parse(line) as {
            choices?: { delta?: { content?: string } }[];
          };
          const delta = json.choices?.[0]?.delta?.content ?? "";
          if (!delta) continue;
          content += delta;
          yield { delta, model };
        } catch {
          // Ignore malformed SSE chunks from upstream and continue.
        }
      }
    }
  }

  const trimmed = content.trim();
  if (!trimmed) {
    throw new Error("OpenAI: resposta vazia");
  }
  return { model, content: trimmed };
}
