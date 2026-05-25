import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

// Creates a Stripe Checkout session for the signed-in user and returns its URL.
export async function POST(req: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "You must be signed in." }, { status: 401 });
  }

  const { plan } = (await req.json()) as { plan?: "monthly" | "annual" };
  const priceId =
    plan === "annual"
      ? process.env.NEXT_PUBLIC_STRIPE_PRICE_ANNUAL
      : process.env.NEXT_PUBLIC_STRIPE_PRICE_MONTHLY;

  if (!priceId) {
    return NextResponse.json({ error: "Plan price is not configured." }, { status: 500 });
  }

  // Find (or create) this user's Stripe customer and remember it on their profile.
  const { data: profile } = await supabase
    .from("profiles")
    .select("stripe_customer_id")
    .eq("id", user.id)
    .single();

  const stripe = getStripe();
  let customerId = profile?.stripe_customer_id as string | null | undefined;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email ?? undefined,
      metadata: { supabase_user_id: user.id },
    });
    customerId = customer.id;
    await supabaseAdmin()
      .from("profiles")
      .update({ stripe_customer_id: customerId })
      .eq("id", user.id);
  }

  const origin = process.env.NEXT_PUBLIC_SITE_URL || new URL(req.url).origin;

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    allow_promotion_codes: true,
    success_url: `${origin}/account?status=success`,
    cancel_url: `${origin}/account?status=cancel`,
    metadata: { supabase_user_id: user.id },
    subscription_data: {
      // 7-day free trial: the card is collected now but not charged until the trial
      // ends. Stripe fires customer.subscription.created with status "trialing", which
      // our webhook treats as premium — so trial users get full access immediately.
      trial_period_days: 7,
      metadata: { supabase_user_id: user.id },
    },
  });

  return NextResponse.json({ url: session.url });
}
