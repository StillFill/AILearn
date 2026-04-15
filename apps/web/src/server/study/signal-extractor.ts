import type { LearningSession } from "@/domain/study";

const PAIN_PATTERNS: Array<{ pattern: RegExp; painPoint: string; hint: string }> = [
  {
    pattern: /(não entendo|nao entendo|confuso|me confundo)/i,
    painPoint: "Compreensão de conceito base",
    hint: "Rever definição principal com exemplos simples.",
  },
  {
    pattern: /(erro|errando|errei|sempre erro)/i,
    painPoint: "Erros recorrentes na execução",
    hint: "Treinar exercícios curtos com correção imediata.",
  },
  {
    pattern: /(logarit|equaç|equac|fraç|fracao|porcent|funç|func)/i,
    painPoint: "Aplicação em subtema específico",
    hint: "Focar em exercícios progressivos do subtema citado.",
  },
];

export function extractSignalsFromMessage(input: {
  session: LearningSession | null;
  userContent: string;
  assistantContent: string;
}): Array<{
  sessionId?: string | null;
  subject: string;
  topic?: string | null;
  painPoint: string;
  confidence: number;
  evidence?: string | null;
  planHint?: string | null;
}> {
  const session = input.session;
  if (!session) return [];

  const text = `${input.userContent}\n${input.assistantContent}`.trim();
  const detected: Array<{
    sessionId?: string | null;
    subject: string;
    topic?: string | null;
    painPoint: string;
    confidence: number;
    evidence?: string | null;
    planHint?: string | null;
  }> = [];

  for (const candidate of PAIN_PATTERNS) {
    if (!candidate.pattern.test(text)) continue;
    detected.push({
      sessionId: session.id,
      subject: session.subject,
      topic: session.topic,
      painPoint: candidate.painPoint,
      confidence: 0.72,
      evidence: input.userContent.slice(0, 240),
      planHint: candidate.hint,
    });
  }

  if (detected.length === 0) {
    detected.push({
      sessionId: session.id,
      subject: session.subject,
      topic: session.topic,
      painPoint: session.declaredDifficulty,
      confidence: 0.55,
      evidence: input.userContent.slice(0, 240),
      planHint: `Retomar ${session.topic} com explicação em passos curtos e 2 exercícios guiados.`,
    });
  }

  return detected;
}

type AiSignal = {
  painPoint: string;
  topic?: string;
  confidence?: number;
  evidence?: string;
  planHint?: string;
};

async function extractSignalsWithOpenAi(input: {
  session: LearningSession;
  userContent: string;
  assistantContent: string;
}): Promise<AiSignal[]> {
  if (!process.env.OPENAI_API_KEY?.trim()) return [];

  const model = process.env.OPENAI_CHAT_MODEL?.trim() || "gpt-4o-mini";
  const prompt = [
    "Você é um analista pedagógico interno.",
    "Extraia sinais de dificuldade do aluno em JSON, com foco em utilidade para plano de estudo.",
    "Evite frases genéricas (ex.: 'não sei nada sobre'). Seja específico no obstáculo cognitivo.",
    "Se não houver sinais claros, devolva lista vazia.",
  ].join(" ");

  const userPayload = {
    subject: input.session.subject,
    topic: input.session.topic,
    declaredDifficulty: input.session.declaredDifficulty,
    goal: input.session.goal,
    studentMessage: input.userContent,
    tutorMessage: input.assistantContent,
  };

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "learning_signals",
          schema: {
            type: "object",
            additionalProperties: false,
            properties: {
              signals: {
                type: "array",
                items: {
                  type: "object",
                  additionalProperties: false,
                  properties: {
                    painPoint: { type: "string" },
                    topic: { type: "string" },
                    confidence: { type: "number" },
                    evidence: { type: "string" },
                    planHint: { type: "string" },
                  },
                  required: ["painPoint", "confidence", "planHint"],
                },
              },
            },
            required: ["signals"],
          },
        },
      },
      messages: [
        { role: "system", content: prompt },
        { role: "user", content: JSON.stringify(userPayload) },
      ],
    }),
  });

  if (!response.ok) return [];
  const data = (await response.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const raw = data.choices?.[0]?.message?.content;
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as { signals?: AiSignal[] };
    return Array.isArray(parsed.signals) ? parsed.signals : [];
  } catch {
    return [];
  }
}

export async function extractSignalsFromMessageEnhanced(input: {
  session: LearningSession | null;
  userContent: string;
  assistantContent: string;
}): Promise<
  Array<{
    sessionId?: string | null;
    subject: string;
    topic?: string | null;
    painPoint: string;
    confidence: number;
    evidence?: string | null;
    planHint?: string | null;
  }>
> {
  const session = input.session;
  if (!session) return [];

  const aiSignals = await extractSignalsWithOpenAi({
    session,
    userContent: input.userContent,
    assistantContent: input.assistantContent,
  });

  if (aiSignals.length > 0) {
    const dedup = new Set<string>();
    const normalized = aiSignals
      .map((signal) => ({
        sessionId: session.id,
        subject: session.subject,
        topic: signal.topic?.trim() || session.topic,
        painPoint: signal.painPoint.trim(),
        confidence: Math.max(0.35, Math.min(0.98, Number(signal.confidence ?? 0.7))),
        evidence: signal.evidence?.trim() || input.userContent.slice(0, 240),
        planHint: signal.planHint?.trim() || `Reforçar ${session.topic} em passos curtos.`,
      }))
      .filter((signal) => signal.painPoint.length > 0)
      .filter((signal) => {
        const key = `${signal.subject}|${signal.topic}|${signal.painPoint}`.toLowerCase();
        if (dedup.has(key)) return false;
        dedup.add(key);
        return true;
      });
    if (normalized.length > 0) return normalized;
  }

  return extractSignalsFromMessage(input);
}
