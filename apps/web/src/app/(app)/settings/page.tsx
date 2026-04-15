import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

function formatRole(role: "STUDENT" | "GUARDIAN" | undefined): string {
  return role === "GUARDIAN" ? "Responsável / educador" : "Estudante";
}

export default async function SettingsPage() {
  const session = await auth();
  const u = session?.user;
  const profile =
    u?.id != null
      ? await prisma.user.findUnique({
          where: { id: u.id },
          select: {
            affinitySubjects: true,
            difficultySubjects: true,
            learningGoal: true,
          },
        })
      : null;

  return (
    <div className="flex flex-col gap-3 text-sm text-zinc-700 dark:text-zinc-300">
      <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Conta e plano</h1>
      <dl className="grid max-w-md grid-cols-[8rem_1fr] gap-x-2 gap-y-2 rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900/60">
        <dt className="text-zinc-500">Email</dt>
        <dd>{u?.email ?? "—"}</dd>
        <dt className="text-zinc-500">Nome</dt>
        <dd>{u?.name ?? "—"}</dd>
        <dt className="text-zinc-500">Perfil</dt>
        <dd>{formatRole(u?.role)}</dd>
      </dl>
      <div className="max-w-md rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900/60">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Perfil pedagógico</h2>
        <div className="mt-3 flex flex-col gap-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-zinc-500">Matérias com afinidade</p>
            <p className="mt-1">
              {profile?.affinitySubjects?.length
                ? profile.affinitySubjects.join(", ")
                : "Nenhuma matéria selecionada ainda."}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-zinc-500">Matérias com dificuldade</p>
            <p className="mt-1">
              {profile?.difficultySubjects?.length
                ? profile.difficultySubjects.join(", ")
                : "Nenhuma matéria selecionada ainda."}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-zinc-500">Objetivo principal</p>
            <p className="mt-1">{profile?.learningGoal ?? "Não definido."}</p>
          </div>
        </div>
      </div>
      <p className="text-zinc-500">
        Assinatura Stripe e opções de privacidade entram na fase P4; dados de conta já usam PostgreSQL quando
        `DATABASE_URL` está configurado.
      </p>
    </div>
  );
}
