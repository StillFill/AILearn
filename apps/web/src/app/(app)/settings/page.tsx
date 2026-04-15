import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ManageSubscriptionButton } from "@/components/settings/manage-subscription-button";
import { getStripeClient } from "@/server/billing/stripe";

function formatRole(role: "STUDENT" | "GUARDIAN" | undefined): string {
  return role === "GUARDIAN" ? "Responsável / educador" : "Estudante";
}

function formatSubscriptionStatus(status: string | null | undefined): string {
  if (!status) return "Sem assinatura ativa";
  if (status === "active") return "Ativa";
  if (status === "trialing") return "Em período de teste";
  if (status === "canceled") return "Cancelada";
  if (status === "past_due") return "Pagamento pendente";
  return status;
}

function formatDatePtBr(value: Date): string {
  return value.toLocaleDateString("pt-BR");
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
            subscriptionStatus: true,
            subscriptionCurrentPeriodEnd: true,
            stripeCustomerId: true,
            stripeSubscriptionId: true,
          },
        })
      : null;
  const hasActiveSubscription = profile?.subscriptionStatus === "active";
  let nextChargeDate = profile?.subscriptionCurrentPeriodEnd ?? null;

  // Fallback: if webhook has not persisted the cycle date yet, query Stripe directly.
  if (
    hasActiveSubscription &&
    !nextChargeDate &&
    profile?.stripeCustomerId &&
    profile?.stripeSubscriptionId
  ) {
    try {
      const stripe = getStripeClient();
      const upcomingInvoice = await stripe.invoices.createPreview({
        customer: profile.stripeCustomerId,
        subscription: profile.stripeSubscriptionId,
      });
      if (typeof upcomingInvoice.next_payment_attempt === "number") {
        nextChargeDate = new Date(upcomingInvoice.next_payment_attempt * 1000);
      } else if (typeof upcomingInvoice.due_date === "number") {
        nextChargeDate = new Date(upcomingInvoice.due_date * 1000);
      }
    } catch {
      // Keeps UI resilient even when Stripe API is temporarily unavailable.
    }
  }

  return (
    <div className="flex flex-col gap-3 text-sm text-zinc-700 dark:text-zinc-300">
      <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Conta e plano</h1>
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <dl className="grid grid-cols-[8rem_1fr] gap-x-2 gap-y-2 rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900/60">
          <dt className="text-zinc-500">Email</dt>
          <dd>{u?.email ?? "—"}</dd>
          <dt className="text-zinc-500">Nome</dt>
          <dd>{u?.name ?? "—"}</dd>
          <dt className="text-zinc-500">Perfil</dt>
          <dd>{formatRole(u?.role)}</dd>
        </dl>
        <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900/60">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Assinatura</h2>
          <p className="mt-2">
            Status:{" "}
            <span className="font-medium">{formatSubscriptionStatus(profile?.subscriptionStatus)}</span>
          </p>
          <p className="mt-1 text-xs text-zinc-500">
            {hasActiveSubscription
              ? nextChargeDate
                ? `Próxima cobrança em ${formatDatePtBr(nextChargeDate)}.`
                : "Assinatura ativa. A data da próxima cobrança será sincronizada em instantes."
              : "Ao assinar, o status e a próxima cobrança aparecerão aqui automaticamente."}
          </p>
          {!hasActiveSubscription ? (
            <div className="mt-3">
              <ManageSubscriptionButton />
            </div>
          ) : (
            <div className="mt-3">
              <ManageSubscriptionButton mode="portal" />
            </div>
          )}
        </div>
      </div>
      <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900/60">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Perfil pedagógico</h2>
        <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-3">
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
        Assinatura Stripe usa checkout hospedado e webhook para sincronizar status no PostgreSQL.
      </p>
    </div>
  );
}
