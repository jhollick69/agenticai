import { createClient } from "@/lib/supabase/server";

export type Entitlement = {
  signedIn: boolean;
  email: string | null;
  isPremium: boolean;
};

// The single source of truth for "is this user allowed premium content?".
// Reads `is_premium` from the profiles table, which is written ONLY by the Stripe
// webhook (service role). The browser can never set this, so the gate is real.
export async function getEntitlement(): Promise<Entitlement> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { signedIn: false, email: null, isPremium: false };

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_premium, current_period_end")
    .eq("id", user.id)
    .single();

  const active =
    !!profile?.is_premium &&
    (!profile.current_period_end ||
      new Date(profile.current_period_end).getTime() > Date.now());

  return { signedIn: true, email: user.email ?? null, isPremium: active };
}
