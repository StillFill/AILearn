import { MessageRole as PrismaMessageRole } from "@prisma/client";
import type { Conversation, ConversationWithMeta, Message } from "@/domain/chat";
import { prisma } from "@/lib/prisma";
import { PROMPT_VERSION } from "@/server/prompts/system";

const DEFAULT_MODEL = "mock-llm";

function preview(text: string, max = 80): string {
  const t = text.replace(/\s+/g, " ").trim();
  return t.length <= max ? t : `${t.slice(0, max)}…`;
}

function toPrismaRole(r: Message["role"]): PrismaMessageRole {
  switch (r) {
    case "user":
      return PrismaMessageRole.USER;
    case "assistant":
      return PrismaMessageRole.ASSISTANT;
    case "system":
      return PrismaMessageRole.SYSTEM;
    default:
      return PrismaMessageRole.USER;
  }
}

function fromPrismaRole(r: PrismaMessageRole): Message["role"] {
  switch (r) {
    case PrismaMessageRole.USER:
      return "user";
    case PrismaMessageRole.ASSISTANT:
      return "assistant";
    case PrismaMessageRole.SYSTEM:
      return "system";
    default:
      return "user";
  }
}

function toDomainMessage(m: {
  id: string;
  conversationId: string;
  role: PrismaMessageRole;
  content: string;
  createdAt: Date;
  tokenCount: number | null;
}): Message {
  return {
    id: m.id,
    conversationId: m.conversationId,
    role: fromPrismaRole(m.role),
    content: m.content,
    createdAt: m.createdAt.toISOString(),
    tokenCount: m.tokenCount ?? undefined,
  };
}

function toDomainConversation(c: {
  id: string;
  ownerUserId: string;
  learningSessionId: string | null;
  title: string | null;
  model: string;
  promptVersion: string;
  createdAt: Date;
}): Conversation {
  return {
    id: c.id,
    ownerUserId: c.ownerUserId,
    learningSessionId: c.learningSessionId,
    title: c.title,
    model: c.model,
    promptVersion: c.promptVersion,
    createdAt: c.createdAt.toISOString(),
  };
}

export async function listConversations(ownerUserId: string): Promise<ConversationWithMeta[]> {
  const convs = await prisma.conversation.findMany({
    where: { ownerUserId },
    orderBy: { createdAt: "desc" },
    include: {
      messages: {
        where: { role: { not: PrismaMessageRole.SYSTEM } },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  return convs.map((c) => {
    const last = c.messages[0];
    return {
      ...toDomainConversation(c),
      lastMessagePreview: last ? preview(last.content) : null,
    };
  });
}

export async function getConversation(
  conversationId: string,
  ownerUserId: string,
): Promise<Conversation | null> {
  const c = await prisma.conversation.findFirst({
    where: { id: conversationId, ownerUserId },
  });
  return c ? toDomainConversation(c) : null;
}

export async function createConversation(
  ownerUserId: string,
  title: string | null,
  learningSessionId?: string | null,
): Promise<Conversation> {
  if (learningSessionId) {
    const validSession = await prisma.learningSession.findFirst({
      where: { id: learningSessionId, ownerUserId },
      select: { id: true },
    });
    if (!validSession) {
      throw new Error("Sessão de estudo inválida para este utilizador.");
    }
  }

  const c = await prisma.conversation.create({
    data: {
      ownerUserId,
      learningSessionId: learningSessionId ?? null,
      title: title?.trim() || null,
      model: DEFAULT_MODEL,
      promptVersion: PROMPT_VERSION,
    },
  });
  return toDomainConversation(c);
}

export async function getMessages(
  conversationId: string,
  ownerUserId: string,
): Promise<Message[] | null> {
  const c = await prisma.conversation.findFirst({
    where: { id: conversationId, ownerUserId },
    select: { id: true },
  });
  if (!c) return null;

  const rows = await prisma.message.findMany({
    where: { conversationId },
    orderBy: { createdAt: "asc" },
  });
  return rows.map(toDomainMessage);
}

export async function appendMessage(
  conversationId: string,
  ownerUserId: string,
  role: Message["role"],
  content: string,
): Promise<Message | null> {
  const c = await prisma.conversation.findFirst({
    where: { id: conversationId, ownerUserId },
    select: { id: true },
  });
  if (!c) return null;

  const m = await prisma.message.create({
    data: {
      conversationId,
      role: toPrismaRole(role),
      content,
    },
  });
  return toDomainMessage(m);
}

export async function setConversationModel(
  conversationId: string,
  ownerUserId: string,
  model: string,
): Promise<void> {
  await prisma.conversation.updateMany({
    where: { id: conversationId, ownerUserId },
    data: { model },
  });
}
