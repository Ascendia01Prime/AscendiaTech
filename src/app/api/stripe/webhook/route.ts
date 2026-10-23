import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";

// Stripe needs the raw request body to check the signature, so this must run on Node.
export const runtime = "nodejs";

function idOf(value: string | { id: string } | null | undefined): string | null {
  if (!value) return null;
  return typeof value === "string" ? value : value.id;
}

async function grantAccess(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.user_id;
  const courseId = session.metadata?.course_id;
  if (!userId || !courseId) return;

  // For delayed payment methods the money may not have arrived yet; a later event completes it.
  if (session.payment_status !== "paid" && session.payment_status !== "no_payment_required") return;

  const admin = createAdminClient();
  const { error } = await admin.from("enrollments").upsert(
    {
      user_id: userId,
      course_id: courseId,
      source: session.mode === "subscription" ? "subscription" : "purchase",
      status: "active",
      stripe_session_id: session.id,
      stripe_subscription_id: idOf(session.subscription),
      stripe_payment_intent_id: idOf(session.payment_intent),
    },
    { onConflict: "user_id,course_id" },
  );
  if (error) throw error;
}

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!signature || !secret) {
    return NextResponse.json({ error: "Webhook not configured" }, { status: 400 });
  }

  const rawBody = await request.text();

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(rawBody, signature, secret);
  } catch (error) {
    console.error("webhook signature check failed", error);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    const admin = createAdminClient();

    switch (event.type) {
      case "checkout.session.completed":
      case "checkout.session.async_payment_succeeded":
        await grantAccess(event.data.object as Stripe.Checkout.Session);
        break;

      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const stillActive = subscription.status === "active" || subscription.status === "trialing";
        const { error } = await admin
          .from("enrollments")
          .update({ status: stillActive ? "active" : "canceled" })
          .eq("stripe_subscription_id", subscription.id);
        if (error) throw error;
        break;
      }

      case "charge.refunded": {
        const charge = event.data.object as Stripe.Charge;
        const paymentIntent = idOf(charge.payment_intent);
        // Only a full refund removes access; partial refunds keep it.
        if (paymentIntent && charge.refunded) {
          const { error } = await admin
            .from("enrollments")
            .update({ status: "refunded" })
            .eq("stripe_payment_intent_id", paymentIntent);
          if (error) throw error;
        }
        break;
      }

      default:
        break;
    }
  } catch (error) {
    console.error("webhook handler failed", event.type, error);
    // 500 makes Stripe retry later.
    return NextResponse.json({ error: "Handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
