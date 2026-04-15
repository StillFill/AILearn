import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { jsonError } from "@/lib/api/errors";
import { requireSessionUserId } from "@/server/auth-context";
import { getStripeClient, getStripePriceId } from "@/server/billing/stripe";

function appBaseUrl(request: NextRequest): string {
  const explicit = process.env.APP_URL?.trim() || process.env.NEXTAUTH_URL?.trim();
  if (explicit) return explicit;
  return request.nextUrl.origin;
}

export async function POST(request: NextRequest) {
  const userId = await requireSessionUserId();
  if (!userId) {
    return jsonError(401, "unauthorized", "Sessão necessária.");
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, stripeCustomerId: true },
  });
  if (!user) {
    return jsonError(404, "not_found", "Utilizador não encontrado.");
  }

  try {
    const stripe = getStripeClient();
    const priceId = getStripePriceId();
    const base = appBaseUrl(request);

    let customerId = user.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { userId },
      });
      customerId = customer.id;
      await prisma.user.update({
        where: { id: userId },
        data: { stripeCustomerId: customerId },
      });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${base}/settings?billing=success`,
      cancel_url: `${base}/settings?billing=cancel`,
      allow_promotion_codes: true,
      metadata: { userId },
    });

    if (!session.url) {
      return jsonError(500, "stripe_error", "Não foi possível iniciar o checkout.");
    }

    return NextResponse.json({ url: session.url });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Falha ao iniciar checkout.";
    return jsonError(500, "stripe_error", message);
  }
}
