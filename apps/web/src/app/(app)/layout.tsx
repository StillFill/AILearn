import Link from "next/link";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="border-b border-zinc-200 bg-white/80 px-4 py-3 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/80">
        <nav className="mx-auto flex max-w-3xl items-center gap-4 text-sm font-medium">
          <Link href="/chat" className="text-zinc-900 dark:text-zinc-100">
            Chat
          </Link>
          <Link href="/settings" className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-400">
            Conta
          </Link>
          <span className="ml-auto text-xs font-normal text-zinc-500">SmartLearn (dev)</span>
        </nav>
      </header>
      <main className="mx-auto flex w-full max-w-3xl min-h-0 flex-1 flex-col px-4 py-4">
        {children}
      </main>
    </div>
  );
}
