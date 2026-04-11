import { NextResponse } from "next/server";

/** Placeholder P4 — validar assinatura Stripe e atualizar assinatura no banco. */
export async function POST() {
  return NextResponse.json(
    { error: { code: "not_implemented", message: "Webhook Stripe ainda não implementado." } },
    { status: 501 },
  );
}
