import { randomUUID } from "crypto";
import type { Conversation, ConversationWithMeta, Message } from "@/domain/chat";
import { PROMPT_VERSION } from "@/server/prompts/system";

/**
 * Persistência em memória (processo único).
 * TODO (P3): trocar por PostgreSQL + repositório injetável.
 */
const conversations = new Map<string, Conversation>();
const messagesByConversation = new Map<string, Message[]>();

const DEFAULT_MODEL = "mock-llm";

function preview(text: string, max = 80): string {
  const t = text.replace(/\s+/g, " ").trim();
  return t.length <= max ? t : `${t.slice(0, max)}…`;
}

export function listConversations(ownerUserId: string): ConversationWithMeta[] {
  const list = [...conversations.values()].filter((c) => c.ownerUserId === ownerUserId);
  list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return list.map((c) => {
    const msgs = messagesByConversation.get(c.id) ?? [];
    const last = msgs.filter((m) => m.role !== "system").at(-1);
    return {
      ...c,
      lastMessagePreview: last ? preview(last.content) : null,
    };
  });
}

export function getConversation(
  conversationId: string,
  ownerUserId: string,
): Conversation | null {
  const c = conversations.get(conversationId);
  if (!c || c.ownerUserId !== ownerUserId) return null;
  return c;
}

export function createConversation(
  ownerUserId: string,
  title: string | null,
): Conversation {
  const id = randomUUID();
  const now = new Date().toISOString();
  const conv: Conversation = {
    id,
    ownerUserId,
    title: title?.trim() || null,
    model: DEFAULT_MODEL,
    promptVersion: PROMPT_VERSION,
    createdAt: now,
  };
  conversations.set(id, conv);
  messagesByConversation.set(id, []);
  return conv;
}

export function getMessages(
  conversationId: string,
  ownerUserId: string,
): Message[] | null {
  const c = getConversation(conversationId, ownerUserId);
  if (!c) return null;
  return [...(messagesByConversation.get(conversationId) ?? [])].sort((a, b) =>
    a.createdAt.localeCompare(b.createdAt),
  );
}

export function appendMessage(
  conversationId: string,
  ownerUserId: string,
  role: Message["role"],
  content: string,
): Message | null {
  const c = getConversation(conversationId, ownerUserId);
  if (!c) return null;
  const msg: Message = {
    id: randomUUID(),
    conversationId,
    role,
    content,
    createdAt: new Date().toISOString(),
  };
  const list = messagesByConversation.get(conversationId) ?? [];
  list.push(msg);
  messagesByConversation.set(conversationId, list);
  return msg;
}

export function setConversationModel(conversationId: string, ownerUserId: string, model: string) {
  const c = getConversation(conversationId, ownerUserId);
  if (!c) return;
  conversations.set(conversationId, { ...c, model });
}
