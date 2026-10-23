import Stripe from "stripe";

let client: Stripe | null = null;

/** Lazily created so the app can build and run before Stripe keys are added. */
export function getStripe(): Stripe {
  if (!client) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
    client = new Stripe(key);
  }
  return client;
}
