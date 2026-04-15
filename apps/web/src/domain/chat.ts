/** Entidades de chat alinhadas a `docs/03-arquitetura-tecnica.md` (domínio conceitual). */

export type MessageRole = "user" | "assistant" | "system";

export interface Message {
  id: string;
  conversationId: string;
  role: MessageRole;
  content: string;
  createdAt: string;
  tokenCount?: number;
}

export interface Conversation {
  id: string;
  ownerUserId: string;
  learningSessionId?: string | null;
  title: string | null;
  model: string;
  promptVersion: string;
  createdAt: string;
}

export interface ConversationWithMeta extends Conversation {
  lastMessagePreview: string | null;
}
