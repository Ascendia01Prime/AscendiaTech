import Link from "next/link";
import Logo from "./Logo";
import LanguageSwitcher from "./LanguageSwitcher";
import { createClient } from "@/lib/supabase/server";
import { getDictionary } from "@/i18n";
import type { Locale } from "@/i18n/config";

export default async function Header({ lang }: { lang: Locale }) {
  const t = getDictionary(lang).nav;

  let signedIn = false;
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    signedIn = Boolean(user);
  }

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-bg/80 backdrop-blur">
      <div className="container-page flex h-16 items-center justify-between gap-3">
        <Logo lang={lang} hideNameOnTiny />
        <nav className="flex items-center gap-1 text-sm sm:gap-2">
          <Link href={`/${lang}/courses`} className="hidden rounded-lg px-3 py-2 text-muted hover:text-ink sm:block">
            {t.courses}
          </Link>
          <Link href={`/${lang}/help`} className="hidden rounded-lg px-3 py-2 text-muted hover:text-ink md:block">
            {t.help}
          </Link>
          <LanguageSwitcher current={lang} label={t.language} />
          {signedIn ? (
            <>
              <Link href={`/${lang}/account`} className="hidden rounded-lg px-3 py-2 text-muted hover:text-ink md:block">
                {t.account}
              </Link>
              <Link href={`/${lang}/dashboard`} className="btn-primary ml-1">
                {t.dashboard}
              </Link>
            </>
          ) : (
            <>
              <Link href={`/${lang}/login`} className="hidden rounded-lg px-3 py-2 font-medium hover:text-accent sm:block">
                {t.signIn}
              </Link>
              <Link href={`/${lang}/signup`} className="btn-primary ml-1">
                {t.getStarted}
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
