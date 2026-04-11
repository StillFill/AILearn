import { auth } from "@/auth";

export default async function SettingsPage() {
  const session = await auth();
  const u = session?.user;

  return (
    <div className="flex flex-col gap-3 text-sm text-zinc-700 dark:text-zinc-300">
      <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Conta e plano</h1>
      <dl className="grid max-w-md grid-cols-[8rem_1fr] gap-x-2 gap-y-2 rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900/60">
        <dt className="text-zinc-500">Email</dt>
        <dd>{u?.email ?? "—"}</dd>
        <dt className="text-zinc-500">Nome</dt>
        <dd>{u?.name ?? "—"}</dd>
        <dt className="text-zinc-500">Perfil</dt>
        <dd>{u?.role === "GUARDIAN" ? "Responsável / educador" : "Estudante"}</dd>
      </dl>
      <p className="text-zinc-500">
        Assinatura Stripe e opções de privacidade entram na fase P4; dados de conta já usam PostgreSQL quando
        `DATABASE_URL` está configurado.
      </p>
    </div>
  );
}
