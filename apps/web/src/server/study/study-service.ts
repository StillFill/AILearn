import { prisma } from "@/lib/prisma";
import type { AdaptivePlan, LearningSession, LearningSignal } from "@/domain/study";

function toDomainSession(row: {
  id: string;
  ownerUserId: string;
  subject: string;
  topic: string;
  declaredDifficulty: string;
  goal: string;
  understandingScore: number;
  understandingSummary: string | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  endedAt: Date | null;
  conversations?: { id: string }[];
}): LearningSession {
  return {
    id: row.id,
    ownerUserId: row.ownerUserId,
    subject: row.subject,
    topic: row.topic,
    declaredDifficulty: row.declaredDifficulty,
    goal: row.goal,
    understandingScore: row.understandingScore,
    understandingSummary: row.understandingSummary,
    status: row.status,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    endedAt: row.endedAt ? row.endedAt.toISOString() : null,
    conversationId: row.conversations?.[0]?.id ?? null,
  };
}

function toDomainSignal(row: {
  id: string;
  ownerUserId: string;
  sessionId: string | null;
  subject: string;
  topic: string | null;
  painPoint: string;
  confidence: number;
  evidence: string | null;
  planHint: string | null;
  createdAt: Date;
}): LearningSignal {
  return {
    id: row.id,
    ownerUserId: row.ownerUserId,
    sessionId: row.sessionId,
    subject: row.subject,
    topic: row.topic,
    painPoint: row.painPoint,
    confidence: row.confidence,
    evidence: row.evidence,
    planHint: row.planHint,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function getActiveStudySession(ownerUserId: string): Promise<LearningSession | null> {
  const row = await prisma.learningSession.findFirst({
    where: { ownerUserId, status: "ACTIVE" },
    orderBy: { createdAt: "desc" },
    include: {
      conversations: {
        select: { id: true },
        take: 1,
        orderBy: { createdAt: "asc" },
      },
    },
  });
  return row ? toDomainSession(row) : null;
}

export async function getStudySessionById(
  ownerUserId: string,
  sessionId: string,
): Promise<LearningSession | null> {
  const row = await prisma.learningSession.findFirst({
    where: { ownerUserId, id: sessionId },
    include: {
      conversations: {
        select: { id: true },
        take: 1,
        orderBy: { createdAt: "asc" },
      },
    },
  });
  return row ? toDomainSession(row) : null;
}

export async function listStudySessions(ownerUserId: string, take = 20): Promise<LearningSession[]> {
  const rows = await prisma.learningSession.findMany({
    where: { ownerUserId },
    orderBy: { createdAt: "desc" },
    take,
    include: {
      conversations: {
        select: { id: true },
        take: 1,
        orderBy: { createdAt: "asc" },
      },
    },
  });
  return rows.map(toDomainSession);
}

export async function startStudySession(input: {
  ownerUserId: string;
  subject: string;
  topic: string;
  declaredDifficulty: string;
  goal: string;
}): Promise<LearningSession> {
  await prisma.learningSession.updateMany({
    where: { ownerUserId: input.ownerUserId, status: "ACTIVE" },
    data: { status: "ENDED", endedAt: new Date() },
  });

  const created = await prisma.learningSession.create({
    data: {
      ownerUserId: input.ownerUserId,
      subject: input.subject,
      topic: input.topic,
      declaredDifficulty: input.declaredDifficulty,
      goal: input.goal,
      understandingScore: 10,
      understandingSummary: "Sessão iniciada. Vamos medir o avanço com base nas interações.",
      status: "ACTIVE",
    },
  });
  return toDomainSession(created);
}

export async function addLearningSignals(
  ownerUserId: string,
  signals: Array<{
    sessionId?: string | null;
    subject: string;
    topic?: string | null;
    painPoint: string;
    confidence: number;
    evidence?: string | null;
    planHint?: string | null;
  }>,
): Promise<void> {
  if (signals.length === 0) return;
  await prisma.learningSignal.createMany({
    data: signals.map((signal) => ({
      ownerUserId,
      sessionId: signal.sessionId ?? null,
      subject: signal.subject,
      topic: signal.topic ?? null,
      painPoint: signal.painPoint,
      confidence: signal.confidence,
      evidence: signal.evidence ?? null,
      planHint: signal.planHint ?? null,
    })),
  });
}

export async function listRecentSignals(ownerUserId: string, take = 8): Promise<LearningSignal[]> {
  const rows = await prisma.learningSignal.findMany({
    where: { ownerUserId },
    orderBy: { createdAt: "desc" },
    take,
  });
  return rows.map(toDomainSignal);
}

function clampScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export async function refreshSessionProgress(
  sessionId: string,
  ownerUserId: string,
): Promise<LearningSession | null> {
  const [session, signals] = await Promise.all([
    prisma.learningSession.findFirst({
      where: { id: sessionId, ownerUserId },
      include: {
        conversations: {
          select: { id: true },
          take: 1,
          orderBy: { createdAt: "asc" },
        },
      },
    }),
    prisma.learningSignal.findMany({
      where: { sessionId, ownerUserId },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
  ]);
  if (!session) return null;

  const avgConfidence =
    signals.length > 0
      ? signals.reduce((acc, signal) => acc + signal.confidence, 0) / signals.length
      : 0.4;
  const base = 22;
  const practiceBonus = Math.min(28, signals.length * 4);
  const confidencePenalty = avgConfidence * 36;
  const score = clampScore(base + practiceBonus + (100 - confidencePenalty) * 0.35);

  const summary =
    score >= 75
      ? "Boa evolução no tema. Próximo passo: exercícios de maior autonomia."
      : score >= 50
        ? "Evolução moderada. Reforce os pontos de dor detectados."
        : "Evolução inicial. Vale retomar conceito base e prática guiada.";

  const updated = await prisma.learningSession.update({
    where: { id: session.id },
    data: {
      understandingScore: score,
      understandingSummary: summary,
    },
  });
  return toDomainSession(updated);
}

export function buildAdaptivePlan(signals: LearningSignal[]): AdaptivePlan {
  if (signals.length === 0) {
    return {
      focus: [],
      nextSteps: [
        "Iniciar uma sessão orientada por matéria e tópico.",
        "Resolver 2 exercícios com explicação passo a passo no chat.",
      ],
    };
  }

  const grouped = new Map<string, number>();
  const hints = new Map<string, string>();
  for (const signal of signals) {
    const topicLabel = signal.topic ? ` (${signal.topic})` : "";
    const key = `${signal.subject}: ${signal.painPoint}${topicLabel}`;
    grouped.set(key, (grouped.get(key) ?? 0) + 1);
    if (!hints.has(key) && signal.planHint) {
      hints.set(key, signal.planHint);
    }
  }
  const focus = [...grouped.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([key]) => key);

  const nextSteps = focus.map((item) => {
    const hint = hints.get(item);
    if (hint) return `${item}: ${hint}`;
    return `${item}: praticar exercícios guiados e revisar conceito base com exemplos.`;
  });
  return { focus, nextSteps };
}
