import { NextResponse } from "next/server";

/** Placeholder P4 — Stripe checkout. */
export async function POST() {
  return NextResponse.json(
    { error: { code: "not_implemented", message: "Checkout ainda não implementado." } },
    { status: 501 },
  );
}
