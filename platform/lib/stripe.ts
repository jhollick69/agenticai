import Stripe from "stripe";

// Lazily instantiated so the module is side-effect-free at import time
// (otherwise `next build` evaluates it without env vars and fails).
let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: "2024-06-20",
      typescript: true,
    });
  }
  return _stripe;
}
