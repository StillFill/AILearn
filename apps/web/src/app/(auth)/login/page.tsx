import Link from "next/link";

export default function LoginPage() {
  return (
    <div className="mx-auto flex max-w-md flex-col gap-4 px-4 py-16 text-sm text-zinc-700 dark:text-zinc-300">
      <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">Entrar</h1>
      <p>
        Placeholder (P2): fluxo de autenticação será implementado aqui. Por enquanto o BFF usa o
        usuário de desenvolvimento padrão.
      </p>
      <Link href="/chat" className="text-zinc-900 underline dark:text-zinc-100">
        Ir para o chat (dev)
      </Link>
    </div>
  );
}
