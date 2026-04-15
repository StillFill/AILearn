import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { jsonError } from "@/lib/api/errors";
import { requireSessionUserId } from "@/server/auth-context";
import { getStripeClient } from "@/server/billing/stripe";

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
    select: { stripeCustomerId: true },
  });

  if (!user?.stripeCustomerId) {
    return jsonError(400, "no_subscription", "Ainda não existe assinatura para gerenciar.");
  }

  try {
    const stripe = getStripeClient();
    const base = appBaseUrl(request);
    const session = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${base}/settings`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Falha ao abrir o portal de assinatura.";
    return jsonError(500, "stripe_error", message);
  }
}
