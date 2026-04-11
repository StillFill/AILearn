import Link from "next/link";
import { ChatThread } from "@/components/chat/ChatThread";

type PageProps = { params: Promise<{ conversationId: string }> };

export default async function ChatConversationPage({ params }: PageProps) {
  const { conversationId } = await params;

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <div className="flex items-center gap-3 text-sm">
        <Link href="/chat" className="text-zinc-600 underline-offset-2 hover:text-zinc-900 hover:underline dark:text-zinc-400">
          ← Voltar
        </Link>
        <h1 className="font-semibold text-zinc-900 dark:text-zinc-50">Chat</h1>
      </div>
      <ChatThread conversationId={conversationId} />
    </div>
  );
}
