import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isLocale } from "@/i18n/config";

export async function POST(request: Request) {
  const url = new URL(request.url);
  const lang = url.searchParams.get("lang");

  const supabase = await createClient();
  await supabase.auth.signOut();

  const target = isLocale(lang) ? `/${lang}` : "/";
  return NextResponse.redirect(new URL(target, request.url), { status: 303 });
}
