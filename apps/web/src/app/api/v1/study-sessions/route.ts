import { NextRequest, NextResponse } from "next/server";
import { jsonError } from "@/lib/api/errors";
import { requireSessionUserId } from "@/server/auth-context";
import {
  buildAdaptivePlan,
  getActiveStudySession,
  listStudySessions,
  listRecentSignals,
  startStudySession,
} from "@/server/study/study-service";
import { createConversation } from "@/server/conversation-store";

export async function GET() {
  const ownerUserId = await requireSessionUserId();
  if (!ownerUserId) {
    return jsonError(401, "unauthorized", "Sessão necessária.");
  }

  const [activeSession, sessions, recentSignals] = await Promise.all([
    getActiveStudySession(ownerUserId),
    listStudySessions(ownerUserId, 30),
    listRecentSignals(ownerUserId, 8),
  ]);

  return NextResponse.json({
    activeSession,
    sessions,
    recentSignals,
    adaptivePlan: buildAdaptivePlan(recentSignals),
  });
}

export async function POST(request: NextRequest) {
  const ownerUserId = await requireSessionUserId();
  if (!ownerUserId) {
    return jsonError(401, "unauthorized", "Sessão necessária.");
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError(400, "invalid_json", "Corpo JSON inválido.");
  }

  const payload = (body ?? {}) as Record<string, unknown>;
  const subject = typeof payload.subject === "string" ? payload.subject.trim() : "";
  const topic = typeof payload.topic === "string" ? payload.topic.trim() : "";
  const declaredDifficulty =
    typeof payload.declaredDifficulty === "string" ? payload.declaredDifficulty.trim() : "";
  const goal = typeof payload.goal === "string" ? payload.goal.trim() : "";

  if (!subject || !topic || !declaredDifficulty || !goal) {
    return jsonError(
      400,
      "validation_error",
      "subject, topic, declaredDifficulty e goal são obrigatórios.",
    );
  }

  const session = await startStudySession({
    ownerUserId,
    subject,
    topic,
    declaredDifficulty,
    goal,
  });
  const conversation = await createConversation(
    ownerUserId,
    `${subject}: ${topic}`,
    session.id,
  );

  return NextResponse.json({ session: { ...session, conversationId: conversation.id } }, { status: 201 });
}
