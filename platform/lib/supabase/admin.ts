import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Service-role client — bypasses Row Level Security. Use ONLY in trusted server
// code (e.g. the Stripe webhook) to write entitlement. Never import this into a
// Client Component, and never expose the service-role key to the browser.
//
// Lazily instantiated so importing this module has no side effects at build time.
let _admin: SupabaseClient | null = null;

export function supabaseAdmin(): SupabaseClient {
  if (!_admin) {
    _admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false, autoRefreshToken: false } },
    );
  }
  return _admin;
}
