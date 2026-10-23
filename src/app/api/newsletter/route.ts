import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { email?: unknown } | null;
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";

  if (!email || email.length > 254 || !EMAIL_PATTERN.test(email)) {
    return NextResponse.json({ error: "invalid_email" }, { status: 400 });
  }

  const supabase = await createClient();
  const { error } = await supabase.from("newsletter_subscribers").insert({ email });

  // 23505 = already subscribed. Treat as success so we never reveal who is on the list.
  if (error && error.code !== "23505") {
    return NextResponse.json({ error: "generic" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
