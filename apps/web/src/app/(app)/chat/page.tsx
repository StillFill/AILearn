"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import type { ConversationWithMeta } from "@/domain/chat";
import { createConversation, fetchConversations } from "@/lib/api/v1-client";

export default function ChatIndexPage() {
  const router = useRouter();
  const [items, setItems] = useState<ConversationWithMeta[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    const res = await fetchConversations();
    if (!res.ok) {
      setError("Falha ao listar conversas.");
      return;
    }
    const data = (await res.json()) as { conversations: ConversationWithMeta[] };
    setItems(data.conversations ?? []);
  }, []);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      await load();
      setLoading(false);
    })();
  }, [load]);

  async function handleNew() {
    setCreating(true);
    setError(null);
    try {
      const res = await createConversation({});
      if (!res.ok) {
        setError("Não foi possível criar conversa.");
        return;
      }
      const data = (await res.json()) as { conversation: { id: string } };
      router.push(`/chat/${data.conversation.id}`);
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Conversas</h1>
        <button
          type="button"
          onClick={() => void handleNew()}
          disabled={creating}
          className="rounded-md bg-zinc-900 px-3 py-1.5 text-sm text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
        >
          {creating ? "Criando…" : "Nova conversa"}
        </button>
      </div>
      {error ? (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}
      {loading ? (
        <p className="text-sm text-zinc-500">Carregando…</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Você ainda não tem conversas. Clique em &quot;Nova conversa&quot; para começar.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {items.map((c) => (
            <li key={c.id}>
              <Link
                href={`/chat/${c.id}`}
                className="block rounded-lg border border-zinc-200 px-3 py-2 text-sm hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900/60"
              >
                <span className="font-medium text-zinc-900 dark:text-zinc-100">
                  {c.title || "Conversa sem título"}
                </span>
                {c.lastMessagePreview ? (
                  <span className="mt-1 block truncate text-zinc-500 dark:text-zinc-400">
                    {c.lastMessagePreview}
                  </span>
                ) : null}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
