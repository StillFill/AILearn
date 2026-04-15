"use client";

import { useCallback, useEffect, useState } from "react";
import type { Message } from "@/domain/chat";
import { fetchMessages, sendUserMessage } from "@/lib/api/v1-client";
import { Composer } from "./Composer";
import { MessageList } from "./MessageList";
import { ModelNotice } from "./ModelNotice";

type Props = { conversationId: string };
type StreamEventName = "start" | "delta" | "done" | "error";

export function ChatThread({ conversationId }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoadError(null);
    const res = await fetchMessages(conversationId);
    if (!res.ok) {
      setLoadError("Não foi possível carregar as mensagens.");
      setMessages([]);
      return;
    }
    const data = (await res.json()) as { messages: Message[] };
    setMessages(data.messages ?? []);
  }, [conversationId]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      await reload();
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [reload]);

  async function handleSend(text: string) {
    setSendError(null);
    const res = await sendUserMessage(conversationId, text);
    if (!res.ok) {
      const j = (await res.json().catch(() => null)) as {
        error?: { message?: string };
      } | null;
      setSendError(j?.error?.message ?? `Erro ${res.status}`);
      return;
    }
    if (!res.body) {
      setSendError("Resposta sem stream.");
      return;
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    const pendingAssistantId = `assistant-pending-${Date.now()}`;
    let hasStarted = false;

    const upsertPendingAssistant = (delta: string) => {
      setMessages((prev) => {
        const idx = prev.findIndex((m) => m.id === pendingAssistantId);
        if (idx === -1) {
          return [
            ...prev,
            {
              id: pendingAssistantId,
              conversationId,
              role: "assistant",
              content: delta,
              createdAt: new Date().toISOString(),
            },
          ];
        }
        const next = [...prev];
        next[idx] = { ...next[idx], content: next[idx].content + delta };
        return next;
      });
    };

    const replacePendingAssistant = (assistantMessage: Message) => {
      setMessages((prev) => {
        const idx = prev.findIndex((m) => m.id === pendingAssistantId);
        if (idx === -1) return [...prev, assistantMessage];
        const next = [...prev];
        next[idx] = assistantMessage;
        return next;
      });
    };

    const removePendingAssistant = () => {
      setMessages((prev) => prev.filter((m) => m.id !== pendingAssistantId));
    };

    const handleSseEvent = (eventName: StreamEventName, dataRaw: string) => {
      const payload = JSON.parse(dataRaw) as Record<string, unknown>;
      if (eventName === "start") {
        const userMessage = payload.userMessage as Message | undefined;
        if (userMessage && !hasStarted) {
          hasStarted = true;
          setMessages((prev) => [...prev, userMessage]);
        }
        return;
      }
      if (eventName === "delta") {
        const delta = typeof payload.delta === "string" ? payload.delta : "";
        if (delta) upsertPendingAssistant(delta);
        return;
      }
      if (eventName === "done") {
        const assistantMessage = payload.assistantMessage as Message | undefined;
        if (assistantMessage) replacePendingAssistant(assistantMessage);
        return;
      }
      if (eventName === "error") {
        removePendingAssistant();
        setSendError(
          typeof payload.message === "string" ? payload.message : "Erro ao gerar resposta em tempo real.",
        );
      }
    };

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const chunks = buffer.split("\n\n");
      buffer = chunks.pop() ?? "";

      for (const chunk of chunks) {
        const lines = chunk.split("\n");
        const eventLine = lines.find((line) => line.startsWith("event:"));
        const dataLine = lines.find((line) => line.startsWith("data:"));
        if (!eventLine || !dataLine) continue;
        const eventName = eventLine.slice(6).trim() as StreamEventName;
        const dataRaw = dataLine.slice(5).trim();
        try {
          handleSseEvent(eventName, dataRaw);
        } catch {
          setSendError("Erro ao processar resposta em tempo real.");
        }
      }
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <ModelNotice />
      {loading ? (
        <p className="text-sm text-zinc-500">Carregando…</p>
      ) : loadError ? (
        <p className="text-sm text-red-600" role="alert">
          {loadError}
        </p>
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto rounded-md border border-zinc-200 bg-white/50 p-3 dark:border-zinc-800 dark:bg-zinc-950/40">
          <MessageList messages={messages} />
        </div>
      )}
      {sendError ? (
        <p className="text-sm text-red-600" role="alert">
          {sendError}
        </p>
      ) : null}
      <Composer disabled={loading || !!loadError} onSend={handleSend} />
    </div>
  );
}
