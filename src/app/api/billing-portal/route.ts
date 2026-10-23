import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe";
import { localeMeta, toLocale } from "@/i18n/config";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "not_signed_in" }, { status: 401 });

    const body = (await request.json().catch(() => null)) as { lang?: unknown } | null;
    const lang = toLocale(typeof body?.lang === "string" ? body.lang : undefined);

    const { data: profile } = await supabase.from("profiles").select("stripe_customer_id").eq("id", user.id).maybeSingle();
    const customerId = (profile as { stripe_customer_id: string | null } | null)?.stripe_customer_id;
    if (!customerId) return NextResponse.json({ error: "no_billing" }, { status: 400 });

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? new URL(request.url).origin;
    const session = await getStripe().billingPortal.sessions.create({
      customer: customerId,
      locale: localeMeta[lang].stripe,
      return_url: `${siteUrl}/${lang}/dashboard`,
    });
    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("billing portal error", error);
    return NextResponse.json({ error: "generic" }, { status: 500 });
  }
}
