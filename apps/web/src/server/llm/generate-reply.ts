import type { Message } from "@/domain/chat";
import type { AdaptivePlan } from "@/domain/study";
import { getSystemPrompt } from "@/server/prompts/system";

type GuidedPhase = "diagnosticar" | "ensinar" | "praticar" | "verificar" | "consolidar";

function guidedPhaseForTurn(assistantMessagesSoFar: number): GuidedPhase {
  if (assistantMessagesSoFar <= 0) return "diagnosticar";
  if (assistantMessagesSoFar === 1) return "ensinar";
  if (assistantMessagesSoFar === 2) return "praticar";
  if (assistantMessagesSoFar === 3) return "verificar";
  return "consolidar";
}

function buildGuidedStudySessionHint(
  ctx: NonNullable<GenerateReplyInput["studySessionContext"]>,
  priorMessages: Message[],
): string {
  const assistantTurns = priorMessages.filter((m) => m.role === "assistant").length;
  const phase = guidedPhaseForTurn(assistantTurns);
  const phaseFocus: Record<GuidedPhase, string> = {
    diagnosticar:
      "Diagnosticar: perceber o que o aluno já sabe ou já tentou e alinhar a dúvida; só perguntas curtas e acolhedoras.",
    ensinar:
      "Ensinar: explicar o conceito ou o método ligado ao tópico, com um exemplo breve se fizer sentido.",
    praticar:
      "Praticar: propor uma tarefa ou pergunta para o aluno tentar; orientar o raciocínio sem entregar a solução completa de imediato.",
    verificar:
      "Verificar: checar se fez sentido; pedir que explique com as palavras dele ou aplique num caso mínimo.",
    consolidar:
      "Consolidar: um resumo muito curto, correção pontual ou um próximo micro-desafio — uma ideia principal só.",
  };

  return [
    "",
    `Modo professor (sessão guiada ativa): Matéria=${ctx.subject}; Tópico=${ctx.topic}; Dificuldade declarada=${ctx.declaredDifficulty}; Objetivo=${ctx.goal}.`,
    `Nesta resposta, trabalhe **apenas** a fase: ${phaseFocus[phase]}`,
    "Se o histórico mostrar que essa fase já ficou clara, avance **só uma** fase seguinte em vez de repetir.",
    'Não escreva um plano com "Passo 1 / Passo 2…" nem antecipe todas as etapas; não liste o pipeline inteiro (diagnosticar → ensinar → …) na mesma mensagem.',
    "Termine com no máximo **uma** pergunta ou convite para o aluno responder.",
  ].join(" ");
}

const ADAPTIVE_PLAN_MAX_CHARS = 900;

/** Resumo do plano adaptativo para o system prompt (não exposto ao aluno como lista). */
function formatAdaptivePlanForSystem(plan: AdaptivePlan): string {
  const focus = plan.focus.filter(Boolean);
  const steps = plan.nextSteps.filter(Boolean);
  if (focus.length === 0 && steps.length === 0) return "";

  const focusLine =
    focus.length > 0 ? `Focos inferidos: ${focus.join("; ")}.` : "";
  const stepsLine =
    steps.length > 0
      ? `Sugestões de continuidade (ajuste à conversa atual): ${steps.slice(0, 4).join(" | ")}`
      : "";

  const block = [
    "",
    "Plano adaptativo desta sessão (memória interna — não leia como roteiro ao aluno):",
    [focusLine, stepsLine].filter(Boolean).join(" "),
    "Use como fio condutor: priorize coerência com a última mensagem e o histórico; não assuma que o aluno ainda tem todas estas dificuldades.",
  ].join(" ");

  return block.length <= ADAPTIVE_PLAN_MAX_CHARS
    ? block
    : `${block.slice(0, ADAPTIVE_PLAN_MAX_CHARS)}…`;
}

function buildSystemContent(input: GenerateReplyInput): string {
  const base = getSystemPrompt();
  const sessionHint = input.studySessionContext
    ? buildGuidedStudySessionHint(input.studySessionContext, input.priorMessages)
    : "";
  const adaptiveHint =
    input.studySessionContext && input.adaptivePlan
      ? formatAdaptivePlanForSystem(input.adaptivePlan)
      : "";
  return `${base}${sessionHint}${adaptiveHint}`;
}

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
  /** Derivado dos sinais desta sessão; guia o tutor sem substituir o diálogo. */
  adaptivePlan?: AdaptivePlan | null;
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
  const q = input.userContent.trim() || "(mensagem vazia)";
  const studyContext = input.studySessionContext
    ? `\nSessão ativa: ${input.studySessionContext.subject} / ${input.studySessionContext.topic}. Objetivo: ${input.studySessionContext.goal}.`
    : "";
  const planNote =
    input.adaptivePlan && (input.adaptivePlan.focus.length > 0 || input.adaptivePlan.nextSteps.length > 0)
      ? `\nPlano adaptativo (resumo): ${input.adaptivePlan.focus.join("; ") || "(foco em construção)"}`
      : "";
  return {
    model: "mock-llm",
    content: [
      "[Modo demonstração — sem OPENAI_API_KEY no servidor]",
      "",
      `Sua pergunta: «${q}»`,
      studyContext,
      planNote,
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
  const system = buildSystemContent(input);

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

async function* streamOpenAiChatCompletion(
  input: GenerateReplyInput,
): AsyncGenerator<GenerateReplyChunk, GenerateReplyOutput> {
  const model = process.env.OPENAI_CHAT_MODEL?.trim() || "gpt-4o-mini";
  const system = buildSystemContent(input);

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
