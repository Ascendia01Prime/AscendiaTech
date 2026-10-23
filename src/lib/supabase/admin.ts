import { createClient } from "@supabase/supabase-js";

/**
 * Service-role client: bypasses all row rules. SERVER ONLY.
 * Used just for things the browser must never do itself:
 * granting course access (Stripe webhook, free enrolment) and saving the Stripe customer id.
 */
export function createAdminClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set");
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
