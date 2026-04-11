/**
 * Converte Markdown aproximado em texto para TTS (sem dependências).
 * Objetivo: evitar ler "#", "**" e blocos de código em voz alta.
 */
export function markdownToPlainText(markdown: string): string {
  let s = markdown.replace(/\r\n/g, "\n");

  s = s.replace(/```[\w-]*\n?[\s\S]*?```/g, " ");
  s = s.replace(/`([^`]+)`/g, "$1");

  s = s.replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1");
  s = s.replace(/\[([^\]]+)\]\([^)]*\)/g, "$1");

  s = s.replace(/^#{1,6}\s+/gm, "");
  s = s.replace(/\*\*([^*]+)\*\*/g, "$1");
  s = s.replace(/__([^_]+)__/g, "$1");
  s = s.replace(/~~([^~]+)~~/g, "$1");
  s = s.replace(/\*([^*\n]+)\*/g, "$1");
  s = s.replace(/_([^_\n]+)_/g, "$1");

  s = s.replace(/^>\s?/gm, "");
  s = s.replace(/^\s*[-*+]\s+/gm, "");
  s = s.replace(/^\s*\d+\.\s+/gm, "");

  s = s.replace(/\|/g, " ");
  s = s.replace(/^\s*[-:]{3,}\s*$/gm, " ");

  s = s.replace(/[ \t]+\n/g, "\n");
  s = s.replace(/\n{3,}/g, "\n\n");
  s = s.replace(/[ \t]{2,}/g, " ");

  return s.trim();
}
