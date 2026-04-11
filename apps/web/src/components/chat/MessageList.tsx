import type { Message } from "@/domain/chat";

export function MessageList({ messages }: { messages: Message[] }) {
  if (messages.length === 0) {
    return (
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        Nenhuma mensagem ainda. Envie uma dúvida abaixo.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-3" aria-live="polite">
      {messages.map((m) => (
        <li
          key={m.id}
          className={`max-w-[min(100%,52rem)] rounded-lg px-3 py-2 text-sm leading-relaxed ${
            m.role === "user"
              ? "ml-auto bg-zinc-200 text-zinc-900 dark:bg-zinc-700 dark:text-zinc-50"
              : "mr-auto bg-zinc-100 text-zinc-900 dark:bg-zinc-800/80 dark:text-zinc-100"
          }`}
        >
          <span className="sr-only">{m.role === "user" ? "Você" : "Assistente"}: </span>
          <pre className="whitespace-pre-wrap font-sans">{m.content}</pre>
        </li>
      ))}
    </ul>
  );
}
