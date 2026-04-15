"use client";

import { useState } from "react";

type Props = {
  mode?: "checkout" | "portal";
};

export function ManageSubscriptionButton({ mode = "checkout" }: Props) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function startFlow() {
    setPending(true);
    setError(null);
    try {
      const endpoint = mode === "portal" ? "/api/v1/billing/portal" : "/api/v1/billing/checkout";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = (await res.json().catch(() => null)) as
        | { url?: string; error?: { message?: string } }
        | null;
      if (!res.ok || !data?.url) {
        setError(data?.error?.message ?? `Erro ${res.status}`);
        return;
      }
      window.location.href = data.url;
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={() => void startFlow()}
        disabled={pending}
        className="w-fit rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
      >
        {pending
          ? mode === "portal"
            ? "Abrindo portal..."
            : "Abrindo checkout..."
          : mode === "portal"
            ? "Gerenciar assinatura"
            : "Assinar plano"}
      </button>
      {error ? (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
