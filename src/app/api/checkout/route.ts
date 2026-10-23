import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/stripe";
import { localeMeta, toLocale } from "@/i18n/config";
import type { Course } from "@/lib/types";

export const runtime = "nodejs";

// Errors are returned as short codes; the browser shows them in the reader's language.
function fail(error: string, status: number) {
  return NextResponse.json({ error }, { status });
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return fail("not_signed_in", 401);

    const body = (await request.json().catch(() => null)) as { courseId?: unknown; lang?: unknown } | null;
    if (!body || typeof body.courseId !== "string") return fail("invalid_request", 400);
    const lang = toLocale(typeof body.lang === "string" ? body.lang : undefined);

    // Row rules mean only published courses can be read here.
    const { data: courseRow } = await supabase.from("courses").select("*").eq("id", body.courseId).maybeSingle();
    const course = courseRow as Course | null;
    if (!course) return fail("not_found", 404);

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? new URL(request.url).origin;

    // Already has access? Send them straight in.
    const { data: existing } = await supabase
      .from("enrollments")
      .select("id")
      .eq("user_id", user.id)
      .eq("course_id", course.id)
      .eq("status", "active")
      .maybeSingle();
    if (existing) return NextResponse.json({ url: `${siteUrl}/${lang}/learn/${course.slug}` });

    const admin = createAdminClient();

    // Free courses: enrol directly, no Stripe involved.
    if (course.pricing_type === "free") {
      const { error } = await admin.from("enrollments").upsert(
        { user_id: user.id, course_id: course.id, source: "free", status: "active" },
        { onConflict: "user_id,course_id" },
      );
      if (error) throw error;
      return NextResponse.json({ url: `${siteUrl}/${lang}/learn/${course.slug}` });
    }

    if (!course.stripe_price_id && (!course.price_cents || course.price_cents <= 0)) {
      return fail("not_purchasable", 400);
    }

    const stripe = getStripe();

    // Find or create the Stripe customer for this person.
    const { data: profile } = await supabase.from("profiles").select("stripe_customer_id").eq("id", user.id).maybeSingle();
    let customerId = (profile as { stripe_customer_id: string | null } | null)?.stripe_customer_id ?? null;
    if (!customerId) {
      const customer = await stripe.customers.create({ email: user.email ?? undefined, metadata: { user_id: user.id } });
      customerId = customer.id;
      await admin.from("profiles").update({ stripe_customer_id: customerId }).eq("id", user.id);
    }

    const isSubscription = course.pricing_type === "subscription";
    const recurring = isSubscription ? { interval: (course.billing_interval ?? "month") as "month" | "year" } : undefined;

    const lineItem: Stripe.Checkout.SessionCreateParams.LineItem = course.stripe_price_id
      ? { price: course.stripe_price_id, quantity: 1 }
      : {
          quantity: 1,
          price_data: {
            currency: course.currency,
            unit_amount: course.price_cents as number,
            product_data: { name: course.title, description: course.subtitle ?? undefined },
            recurring,
          },
        };

    const metadata = { user_id: user.id, course_id: course.id };

    const session = await stripe.checkout.sessions.create({
      mode: isSubscription ? "subscription" : "payment",
      customer: customerId,
      client_reference_id: user.id,
      line_items: [lineItem],
      allow_promotion_codes: true,
      locale: localeMeta[lang].stripe,
      success_url: `${siteUrl}/${lang}/dashboard?purchased=${encodeURIComponent(course.slug)}`,
      cancel_url: `${siteUrl}/${lang}/courses/${course.slug}`,
      metadata,
      subscription_data: isSubscription ? { metadata } : undefined,
      payment_intent_data: isSubscription ? undefined : { metadata },
    });

    if (!session.url) throw new Error("Stripe did not return a checkout URL");
    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("checkout error", error);
    return fail("generic", 500);
  }
}
