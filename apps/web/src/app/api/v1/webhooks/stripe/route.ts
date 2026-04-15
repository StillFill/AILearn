import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { jsonError } from "@/lib/api/errors";
import { getStripeClient } from "@/server/billing/stripe";

export const runtime = "nodejs";

function stripeWebhookSecret(): string {
  const secret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  if (!secret) {
    throw new Error("STRIPE_WEBHOOK_SECRET não configurada.");
  }
  return secret;
}

async function syncSubscription(subscription: Stripe.Subscription) {
  const customerId =
    typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id;
  const priceId = subscription.items.data[0]?.price?.id ?? null;

  await prisma.user.updateMany({
    where: { stripeCustomerId: customerId },
    data: {
      stripeSubscriptionId: subscription.id,
      stripePriceId: priceId,
      subscriptionStatus: subscription.status,
      subscriptionCurrentPeriodEnd: subscription.cancel_at
        ? new Date(subscription.cancel_at * 1000)
        : null,
    },
  });
}

async function cancelSubscription(subscription: Stripe.Subscription) {
  const customerId =
    typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id;
  await prisma.user.updateMany({
    where: { stripeCustomerId: customerId },
    data: {
      subscriptionStatus: subscription.status,
      subscriptionCurrentPeriodEnd: null,
    },
  });
}

export async function POST(request: NextRequest) {
  let event: Stripe.Event;
  try {
    const stripe = getStripeClient();
    const signature = request.headers.get("stripe-signature");
    if (!signature) {
      return jsonError(400, "missing_signature", "Assinatura Stripe ausente.");
    }
    const body = await request.text();
    event = stripe.webhooks.constructEvent(body, signature, stripeWebhookSecret());
  } catch (error) {
    const message = error instanceof Error ? error.message : "Webhook inválido";
    return jsonError(400, "invalid_webhook", message);
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.subscription && session.customer) {
          const stripe = getStripeClient();
          const subscriptionId =
            typeof session.subscription === "string"
              ? session.subscription
              : session.subscription.id;
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          await syncSubscription(subscription);
        }
        break;
      }
      case "customer.subscription.updated":
      case "customer.subscription.created": {
        await syncSubscription(event.data.object as Stripe.Subscription);
        break;
      }
      case "customer.subscription.deleted": {
        await cancelSubscription(event.data.object as Stripe.Subscription);
        break;
      }
      default:
        break;
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao processar webhook.";
    return jsonError(500, "webhook_processing_failed", message);
  }

  return NextResponse.json({ received: true });
}
