"use client";

import { useState } from "react";

type Props = {
  disabled?: boolean;
  onSend: (text: string) => Promise<void>;
};

export function Composer({ disabled, onSend }: Props) {
  const [value, setValue] = useState("");
  const [sending, setSending] = useState(false);

  async function submit() {
    const text = value.trim();
    if (!text || sending || disabled) return;
    setSending(true);
    try {
      await onSend(text);
      setValue("");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex flex-col gap-2 border-t border-zinc-200 pt-3 dark:border-zinc-800">
      <label htmlFor="chat-composer" className="sr-only">
        Sua mensagem
      </label>
      <textarea
        id="chat-composer"
        rows={3}
        className="w-full resize-y rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none ring-zinc-400 focus:ring-2 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100"
        placeholder="Ex.: Não entendi frações equivalentes…"
        value={value}
        disabled={disabled || sending}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            void submit();
          }
        }}
      />
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => void submit()}
          disabled={disabled || sending || !value.trim()}
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
        >
          {sending ? "Enviando…" : "Enviar"}
        </button>
      </div>
    </div>
  );
}
