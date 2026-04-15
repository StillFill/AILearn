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
