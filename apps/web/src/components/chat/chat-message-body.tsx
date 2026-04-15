"use client";

import ReactMarkdown from "react-markdown";
import rehypeKatex from "rehype-katex";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";

/** Estilos para Markdown (sem plugin typography; seguro: sem `rehype-raw`). */
const markdownClass =
  "min-w-0 text-sm leading-relaxed " +
  "[&_p]:mb-2 [&_p:last-child]:mb-0 " +
  "[&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-5 " +
  "[&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-5 " +
  "[&_li]:my-0.5 " +
  "[&_strong]:font-semibold [&_em]:italic " +
  "[&_h1]:mb-2 [&_h1]:mt-3 [&_h1]:text-lg [&_h1]:font-bold " +
  "[&_h2]:mb-2 [&_h2]:mt-2 [&_h2]:text-base [&_h2]:font-bold " +
  "[&_h3]:mb-1 [&_h3]:mt-2 [&_h3]:text-sm [&_h3]:font-semibold " +
  "[&_h4]:mb-1 [&_h4]:mt-2 [&_h4]:text-sm [&_h4]:font-medium " +
  "[&_blockquote]:my-2 [&_blockquote]:border-l-2 [&_blockquote]:border-zinc-400 [&_blockquote]:pl-3 [&_blockquote]:italic " +
  "[&_hr]:my-4 [&_hr]:border-zinc-300 dark:[&_hr]:border-zinc-600 " +
  "[&_code]:rounded [&_code]:bg-zinc-200 [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-[0.8125rem] dark:[&_code]:bg-zinc-700 " +
  "[&_pre]:my-2 [&_pre]:max-w-full [&_pre]:overflow-x-auto [&_pre]:rounded-md [&_pre]:bg-zinc-900 [&_pre]:p-3 [&_pre]:text-zinc-100 " +
  "[&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_pre_code]:text-inherit " +
  "[&_a]:underline [&_a]:break-all [&_a]:text-zinc-800 dark:[&_a]:text-zinc-200 " +
  "[&_table]:my-2 [&_table]:block [&_table]:max-w-full [&_table]:overflow-x-auto " +
  "[&_th]:border [&_th]:border-zinc-300 [&_th]:px-2 [&_th]:py-1 [&_th]:text-left dark:[&_th]:border-zinc-600 " +
  "[&_td]:border [&_td]:border-zinc-300 [&_td]:px-2 [&_td]:py-1 dark:[&_td]:border-zinc-600";

type Props = {
  content: string;
  /** Mensagens do utilizador mostram-se como texto simples (evita `**` acidental). */
  variant: "user" | "assistant";
};

function normalizeMathDelimiters(content: string): string {
  return content
    .replace(/\\\[\s*([\s\S]*?)\s*\\\]/g, (_, math) => `$$${math.trim()}$$`)
    .replace(/\\\(\s*([\s\S]*?)\s*\\\)/g, (_, math) => `$${math.trim()}$`);
}

export function ChatMessageBody({ content, variant }: Props) {
  if (variant === "user") {
    return <p className="whitespace-pre-wrap break-words">{content}</p>;
  }

  const normalizedContent = normalizeMathDelimiters(content);

  return (
    <div className={markdownClass}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
      >
        {normalizedContent}
      </ReactMarkdown>
    </div>
  );
}
