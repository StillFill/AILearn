import type { Message } from "@/domain/chat";
import { getSystemPrompt } from "@/server/prompts/system";

export interface GenerateReplyInput {
  /** Histórico já persistido (sem a nova mensagem do usuário). */
  priorMessages: Message[];
  userContent: string;
}

export interface GenerateReplyOutput {
  content: string;
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

function mockReply(input: GenerateReplyInput): GenerateReplyOutput {
  const system = getSystemPrompt();
  void system;
  const q = input.userContent.trim() || "(mensagem vazia)";
  return {
    model: "mock-llm",
    content: [
      "[Modo demonstração — sem OPENAI_API_KEY no servidor]",
      "",
      `Sua pergunta: «${q}»`,
      "",
      "Com a integração real, aqui viria a resposta do modelo seguindo o prompt pedagógico (passo a passo, tom de professor). O BFF monta system + histórico + sua mensagem e persiste tudo após a conclusão.",
    ].join("\n"),
  };
}

/** Chamada mínima à API de chat da OpenAI (JSON completo na mesma requisição). */
async function openAiChatCompletion(input: GenerateReplyInput): Promise<GenerateReplyOutput> {
  const model = process.env.OPENAI_CHAT_MODEL?.trim() || "gpt-4o-mini";
  const system = getSystemPrompt();

  const apiMessages: { role: "system" | "user" | "assistant"; content: string }[] = [
    { role: "system", content: system },
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
