"use client";

import { useMemo } from "react";
import { markdownToPlainText } from "@/lib/markdown-to-plain-text";
import { ChatMessageBody } from "./chat-message-body";
import { useMessageSpeech } from "./message-speech-context";

function SpeakerIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
    </svg>
  );
}

function StopIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden
    >
      <rect x="6" y="6" width="12" height="12" rx="1" />
    </svg>
  );
}

export function AssistantMessageRow({
  id,
  content,
}: {
  id: string;
  content: string;
}) {
  const { playingMessageId, toggleSpeak, supported } = useMessageSpeech();
  const plain = useMemo(() => markdownToPlainText(content), [content]);
  const isPlaying = playingMessageId === id;

  return (
    <div className="flex items-start gap-1.5 sm:gap-2">
      <div className="min-w-0 flex-1">
        <span className="sr-only">Assistente: </span>
        <ChatMessageBody content={content} variant="assistant" />
      </div>
      {supported ? (
        <button
          type="button"
          onClick={() => toggleSpeak(id, plain)}
          disabled={!plain}
          className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-zinc-600 hover:bg-zinc-200/90 disabled:pointer-events-none disabled:opacity-40 dark:text-zinc-300 dark:hover:bg-zinc-600/60"
          aria-label={isPlaying ? "Parar leitura" : "Ler resposta em voz alta"}
          aria-pressed={isPlaying}
          title={isPlaying ? "Parar" : "Ouvir resposta"}
        >
          {isPlaying ? (
            <StopIcon className="h-4 w-4" />
          ) : (
            <SpeakerIcon className="h-4 w-4" />
          )}
        </button>
      ) : null}
    </div>
  );
}
