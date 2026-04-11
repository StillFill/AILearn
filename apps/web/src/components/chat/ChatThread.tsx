"use client";

import { useCallback, useEffect, useState } from "react";
import type { Message } from "@/domain/chat";
import { fetchMessages, sendUserMessage } from "@/lib/api/v1-client";
import { Composer } from "./Composer";
import { MessageList } from "./MessageList";
import { ModelNotice } from "./ModelNotice";

type Props = { conversationId: string };

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
    const data = (await res.json()) as {
      assistantMessage: Message;
      userMessage: Message;
    };
    setMessages((prev) => [...prev, data.userMessage, data.assistantMessage]);
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
