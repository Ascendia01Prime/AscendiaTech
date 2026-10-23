import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { defaultLocale, isLocale, matchLocale, type Locale } from "@/i18n/config";

const LOCALE_COOKIE = "NEXT_LOCALE";

// Pages (after the language prefix) that need a signed-in person.
const PROTECTED = ["/dashboard", "/account", "/learn"];

function pickLocale(request: NextRequest): Locale {
  const saved = request.cookies.get(LOCALE_COOKIE)?.value;
  if (isLocale(saved)) return saved;
  return matchLocale(request.headers.get("accept-language")) ?? defaultLocale;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const firstSegment = pathname.split("/")[1];

  // 1. No language in the URL yet: add one (saved choice, then browser language, then English).
  if (!isLocale(firstSegment)) {
    const url = request.nextUrl.clone();
    url.pathname = `/${pickLocale(request)}${pathname === "/" ? "" : pathname}`;
    return NextResponse.redirect(url);
  }

  const lang: Locale = firstSegment;
  const pathWithoutLang = pathname.slice(lang.length + 1) || "/";

  let response = NextResponse.next({ request });

  // 2. Sign-in checks. Skipped until Supabase is configured so the marketing pages still load.
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    });

    // Refreshes the session cookie and tells us who is signed in.
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const needsLogin = PROTECTED.some((prefix) => pathWithoutLang === prefix || pathWithoutLang.startsWith(`${prefix}/`));

    if (!user && needsLogin) {
      const url = request.nextUrl.clone();
      url.pathname = `/${lang}/login`;
      url.search = "";
      url.searchParams.set("redirect", pathname + request.nextUrl.search);
      return NextResponse.redirect(url);
    }

    if (user && (pathWithoutLang === "/login" || pathWithoutLang === "/signup")) {
      const url = request.nextUrl.clone();
      url.pathname = `/${lang}/dashboard`;
      url.search = "";
      return NextResponse.redirect(url);
    }
  }

  // 3. Remember the language the person is browsing in.
  if (request.cookies.get(LOCALE_COOKIE)?.value !== lang) {
    response.cookies.set(LOCALE_COOKIE, lang, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
  }

  return response;
}

export const config = {
  matcher: [
    // Skip API routes, auth route handlers, Next internals and static files.
    "/((?!api/|auth/|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml)$).*)",
  ],
};
