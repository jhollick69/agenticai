import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { supabaseAdmin } from "@/lib/supabase/admin";

// Stripe webhook — the ONLY place premium status is granted/revoked.
// It verifies Stripe's signature, then writes entitlement with the service-role
// client. Because the browser can't reach this table, the paywall can't be faked.
//
// Local testing:  stripe listen --forward-to localhost:3000/api/webhook
// Production:     add an endpoint in the Stripe Dashboard pointing at /api/webhook
//                 and subscribe to checkout.session.completed and customer.subscription.*

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function setPremiumByCustomer(customerId: string, isPremium: boolean, periodEnd?: number) {
  await supabaseAdmin()
    .from("profiles")
    .update({
      is_premium: isPremium,
      current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    .eq("stripe_customer_id", customerId);
}

export async function POST(req: Request) {
  const body = await req.text(); // raw body required for signature verification
  const sig = req.headers.get("stripe-signature");
  if (!sig) return NextResponse.json({ error: "Missing signature" }, { status: 400 });

  const stripe = getStripe();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid signature";
    return NextResponse.json({ error: `Webhook error: ${message}` }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.subscription && session.customer) {
          const sub = await stripe.subscriptions.retrieve(session.subscription as string);
          const active = sub.status === "active" || sub.status === "trialing";
          await setPremiumByCustomer(session.customer as string, active, sub.current_period_end);
        }
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const active = sub.status === "active" || sub.status === "trialing";
        await setPremiumByCustomer(sub.customer as string, active, sub.current_period_end);
        break;
      }
      default:
        // Other events are ignored.
        break;
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "handler error";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
