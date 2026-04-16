/**
 * Remove todas as sessões de estudo, conversas, mensagens e sinais pedagógicos.
 * Mantém apenas registos de User (e dados de conta / Stripe no User).
 *
 * Uso (na pasta apps/web, com DATABASE_URL definida):
 *   node scripts/clean-sessions-and-chats.mjs
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const result = await prisma.$transaction(async (tx) => {
    const signals = await tx.learningSignal.deleteMany({});
    const messages = await tx.message.deleteMany({});
    const conversations = await tx.conversation.deleteMany({});
    const sessions = await tx.learningSession.deleteMany({});
    return { signals, messages, conversations, sessions };
  });

  console.log("Limpeza concluída:", {
    learningSignals: result.signals.count,
    messages: result.messages.count,
    conversations: result.conversations.count,
    learningSessions: result.sessions.count,
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
