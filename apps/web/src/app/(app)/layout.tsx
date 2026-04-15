import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { signOutAction } from "./actions";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const label = session.user.email ?? session.user.name ?? "Conta";

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="border-b border-zinc-200 bg-white/80 px-4 py-3 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/80">
        <nav className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-4 text-sm font-medium">
          <Link href="/chat" className="text-zinc-900 dark:text-zinc-100">
            Chat
          </Link>
          <Link href="/settings" className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-400">
            Conta
          </Link>
          <span className="ml-auto text-xs font-normal text-zinc-500 dark:text-zinc-400">{label}</span>
          <form action={signOutAction}>
            <button
              type="submit"
              className="text-xs font-medium text-zinc-600 underline-offset-2 hover:text-zinc-900 hover:underline dark:text-zinc-400"
            >
              Sair
            </button>
          </form>
        </nav>
      </header>
      <main className="mx-auto flex w-full max-w-6xl min-h-0 flex-1 flex-col px-4 py-4 lg:px-6 lg:py-6">
        {children}
      </main>
    </div>
  );
}
