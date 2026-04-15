"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { ChatThread } from "@/components/chat/ChatThread";
import type { AdaptivePlan, LearningSession, LearningSignal } from "@/domain/study";
import { SUBJECT_OPTIONS } from "@/domain/learning-profile";
import {
  fetchStudySessionState,
  startStudySession,
} from "@/lib/api/v1-client";

export default function ChatIndexPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<LearningSession[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [activeSession, setActiveSession] = useState<LearningSession | null>(null);
  const [recentSignals, setRecentSignals] = useState<LearningSignal[]>([]);
  const [adaptivePlan, setAdaptivePlan] = useState<AdaptivePlan>({ focus: [], nextSteps: [] });
  const [sessionSubject, setSessionSubject] = useState("");
  const [sessionTopic, setSessionTopic] = useState("");
  const [sessionDifficulty, setSessionDifficulty] = useState("");
  const [sessionGoal, setSessionGoal] = useState("");
  const [sessionPending, setSessionPending] = useState(false);

  const loadStudyState = useCallback(async () => {
    const res = await fetchStudySessionState();
    if (!res.ok) return;
    const data = (await res.json()) as {
      activeSession: LearningSession | null;
      sessions: LearningSession[];
      recentSignals: LearningSignal[];
      adaptivePlan: AdaptivePlan;
    };
    setActiveSession(data.activeSession ?? null);
    const allSessions = data.sessions ?? [];
    setSessions(allSessions);
    setRecentSignals(data.recentSignals ?? []);
    setAdaptivePlan(data.adaptivePlan ?? { focus: [], nextSteps: [] });
    setSelectedSessionId((prev) => {
      if (prev && allSessions.some((session) => session.id === prev)) {
        return prev;
      }
      return data.activeSession?.id ?? allSessions[0]?.id ?? null;
    });
    setSelectedConversationId((prev) => {
      if (prev && allSessions.some((session) => session.conversationId === prev)) {
        return prev;
      }
      return data.activeSession?.conversationId ?? allSessions[0]?.conversationId ?? null;
    });
  }, []);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      await loadStudyState();
      setLoading(false);
    })();
  }, [loadStudyState]);

  useEffect(() => {
    if (!activeSession) return;
    const timer = setInterval(() => {
      void loadStudyState();
    }, 8000);
    return () => clearInterval(timer);
  }, [activeSession, loadStudyState]);

  async function handleNew() {
    setCreating(true);
    setError(null);
    try {
      await handleStartSession();
    } finally {
      setCreating(false);
    }
  }

  function handleSelectSession(session: LearningSession) {
    setSelectedSessionId(session.id);
    setSelectedConversationId(session.conversationId ?? null);
    if (session.conversationId) {
      router.replace(`/chat?sessionId=${session.id}&conversationId=${session.conversationId}`);
    } else {
      router.replace(`/chat?sessionId=${session.id}`);
    }
  }

  async function handleStartSession() {
    if (!sessionTopic.trim() || !sessionDifficulty.trim() || !sessionGoal.trim()) {
      setError("Preencha tópico, dificuldade e objetivo da sessão.");
      return;
    }
    setSessionPending(true);
    setError(null);
    try {
      const res = await startStudySession({
        subject: sessionSubject.trim(),
        topic: sessionTopic.trim(),
        declaredDifficulty: sessionDifficulty.trim(),
        goal: sessionGoal.trim(),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: { message?: string } } | null;
        setError(data?.error?.message ?? "Não foi possível iniciar sessão guiada.");
        return;
      }
      const data = (await res.json()) as { session: LearningSession };
      if (data.session.conversationId) {
        setSelectedConversationId(data.session.conversationId);
        setSelectedSessionId(data.session.id);
      }
      await loadStudyState();
    } finally {
      setSessionPending(false);
    }
  }

  const selectedSession =
    sessions.find((session) => session.id === selectedSessionId) ?? activeSession;

  const signalsForHeader = selectedSession
    ? recentSignals
        .filter((signal) => signal.sessionId === selectedSession.id)
        .slice(0, 3)
    : [];

  const progressScore = selectedSession?.understandingScore ?? 0;
  const progressToneClass =
    progressScore < 25
      ? "bg-red-500"
      : progressScore < 50
        ? "bg-yellow-500"
        : progressScore < 75
          ? "bg-orange-500"
          : "bg-emerald-500";

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Sessões de estudo</h1>
        <button
          type="button"
          onClick={() => void handleNew()}
          disabled={creating}
          className="rounded-md bg-zinc-900 px-3 py-1.5 text-sm text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
        >
          {creating ? "Criando…" : "Nova sessão"}
        </button>
      </div>
      <section className="rounded-lg border border-zinc-200 bg-white/70 p-3 dark:border-zinc-800 dark:bg-zinc-950/40">
        <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Sessão guiada (modo professor)</p>
        <div className="mt-2 grid grid-cols-1 gap-2 lg:grid-cols-4">
          <input
            value={sessionSubject}
            onChange={(e) => setSessionSubject(e.target.value)}
            list="study-subject-options"
            placeholder="Matéria"
            className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          />
          <datalist id="study-subject-options">
            {SUBJECT_OPTIONS.map((subject) => (
              <option key={subject} value={subject} />
            ))}
          </datalist>
          <input
            value={sessionTopic}
            onChange={(e) => setSessionTopic(e.target.value)}
            placeholder="Tópico"
            className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          />
          <input
            value={sessionDifficulty}
            onChange={(e) => setSessionDifficulty(e.target.value)}
            placeholder="Dificuldade principal"
            className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          />
          <input
            value={sessionGoal}
            onChange={(e) => setSessionGoal(e.target.value)}
            placeholder="Objetivo da sessão"
            className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          />
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
          <button
            type="button"
            onClick={() => void handleStartSession()}
            disabled={sessionPending}
            className="rounded-md bg-zinc-900 px-3 py-1.5 text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
          >
            {sessionPending ? "Iniciando..." : "Iniciar sessão de estudo"}
          </button>
          {selectedSession ? (
            <>
              <span className="text-zinc-600 dark:text-zinc-400">
                Sessão selecionada: {selectedSession.subject} / {selectedSession.topic} — foco em{" "}
                {selectedSession.goal}.
              </span>
              <span className="rounded-full border border-zinc-300 bg-zinc-50 px-2 py-1 text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
                Avanço no tema: {selectedSession.understandingScore}%
              </span>
              <div className="w-full max-w-sm">
                <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
                  <div
                    className={`h-full transition-all ${progressToneClass}`}
                    style={{ width: `${Math.max(0, Math.min(100, selectedSession.understandingScore))}%` }}
                  />
                </div>
                <div className="mt-1 flex justify-between text-[10px] text-zinc-500 dark:text-zinc-400">
                  <span>0%</span>
                  <span>25%</span>
                  <span>50%</span>
                  <span>75%</span>
                  <span>100%</span>
                </div>
              </div>
              {selectedSession.understandingSummary ? (
                <span className="w-full text-zinc-500 dark:text-zinc-400">
                  {selectedSession.understandingSummary}
                </span>
              ) : null}
              {signalsForHeader.length > 0 ? (
                <span className="w-full text-zinc-500 dark:text-zinc-400">
                  Dados encontrados na sessão:
                </span>
              ) : null}
              {signalsForHeader.map((signal) => (
                <span
                  key={`header-signal-${signal.id}`}
                  className="rounded-full border border-zinc-300 bg-zinc-50 px-2 py-1 text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
                >
                  {signal.painPoint}
                  {signal.topic ? ` (${signal.topic})` : ""}
                </span>
              ))}
            </>
          ) : (
            <span className="text-zinc-500">Nenhuma sessão ativa. Inicie uma sessão para orientar o chat.</span>
          )}
        </div>
        {(adaptivePlan.focus.length > 0 || recentSignals.length > 0) ? (
          <div className="mt-3 grid grid-cols-1 gap-2 lg:grid-cols-2">
            <div className="rounded-md border border-zinc-200 bg-white p-2 dark:border-zinc-800 dark:bg-zinc-900/60">
              <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                O que a IA entendeu como dificuldade
              </p>
              <ul className="mt-1 flex flex-col gap-1 text-xs text-zinc-600 dark:text-zinc-400">
                {recentSignals.slice(0, 3).map((signal) => (
                  <li key={signal.id} className="rounded border border-zinc-200 p-2 dark:border-zinc-800">
                    <p className="font-medium text-zinc-800 dark:text-zinc-200">
                      {signal.subject}
                      {signal.topic ? ` • ${signal.topic}` : ""}
                    </p>
                    <p className="mt-0.5">{signal.painPoint}</p>
                    {signal.evidence ? (
                      <p className="mt-0.5 text-zinc-500 dark:text-zinc-400">
                        Evidência: &quot;{signal.evidence.slice(0, 120)}&quot;
                      </p>
                    ) : null}
                    <p className="mt-0.5 text-zinc-500 dark:text-zinc-400">
                      Confiança: {Math.round(signal.confidence * 100)}%
                    </p>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-md border border-zinc-200 bg-white p-2 dark:border-zinc-800 dark:bg-zinc-900/60">
              <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">Plano adaptativo (próximos passos)</p>
              <ul className="mt-1 flex flex-col gap-1 text-xs text-zinc-600 dark:text-zinc-400">
                {adaptivePlan.nextSteps.slice(0, 3).map((step) => (
                  <li key={step}>- {step}</li>
                ))}
              </ul>
            </div>
          </div>
        ) : null}
      </section>
      {error ? (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}
      {loading ? (
        <p className="text-sm text-zinc-500">Carregando…</p>
      ) : sessions.length === 0 ? (
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Você ainda não tem sessões. Clique em &quot;Nova sessão&quot; para começar.
        </p>
      ) : (
        <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 lg:grid-cols-[minmax(22rem,28rem)_1fr]">
          <div className="min-h-0 rounded-lg border border-zinc-200 bg-white/60 p-2 dark:border-zinc-800 dark:bg-zinc-950/40">
            <ul className="grid grid-cols-1 gap-2">
              {sessions.map((session) => (
                <li key={session.id}>
                  <button
                    type="button"
                    onClick={() => handleSelectSession(session)}
                    className={`block w-full rounded-lg border px-3 py-2 text-left text-sm hover:bg-zinc-50 dark:hover:bg-zinc-900/60 ${
                      selectedSessionId === session.id
                        ? "border-zinc-400 bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-900/60"
                        : "border-zinc-200 dark:border-zinc-800"
                    }`}
                  >
                    <span className="font-medium text-zinc-900 dark:text-zinc-100">
                      {session.subject} — {session.topic}
                    </span>
                    <span className="mt-1 block truncate text-zinc-500 dark:text-zinc-400">
                      {session.goal}
                    </span>
                    {session.status === "ACTIVE" ? (
                      <span className="mt-1 block truncate text-zinc-500 dark:text-zinc-400">
                        Sessão ativa
                      </span>
                    ) : null}
                  </button>
                </li>
              ))}
            </ul>
          </div>
          <div className="hidden min-h-0 lg:flex">
            {selectedConversationId ? (
              <ChatThread conversationId={selectedConversationId} />
            ) : (
              <aside className="w-full rounded-lg border border-zinc-200 bg-white/60 p-4 text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950/40 dark:text-zinc-400">
                <p className="font-medium text-zinc-900 dark:text-zinc-100">Selecione uma sessão</p>
                <p className="mt-2">
                  Escolha uma sessão na coluna ao lado para abrir o chat vinculado.
                </p>
              </aside>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
