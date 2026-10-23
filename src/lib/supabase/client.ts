import { createBrowserClient } from "@supabase/ssr";

/** Supabase client for Client Components (login forms, profile form). */
export function createClient() {
  return createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
}
