import Link from "next/link";
import { Lock, ShieldCheck, CreditCard } from "lucide-react";
import Logo from "./Logo";
import NewsletterForm from "./NewsletterForm";
import { brand } from "@/brand";
import { getDictionary } from "@/i18n";
import type { Locale } from "@/i18n/config";

export default function Footer({ lang }: { lang: Locale }) {
  const dict = getDictionary(lang);
  const t = dict.footer;

  return (
    <footer className="mt-24 border-t border-line bg-surface/40">
      <div className="container-page grid gap-10 py-12 md:grid-cols-4">
        <div>
          <Logo lang={lang} />
          <p className="mt-4 text-sm text-muted">{dict.tagline}</p>
        </div>

        <div>
          <h3 className="mb-3 text-sm font-semibold">{t.company}</h3>
          <ul className="space-y-2 text-sm text-muted">
            <li>
              <Link href={`/${lang}/about`} className="hover:text-ink">
                {t.about}
              </Link>
            </li>
            <li>
              <Link href={`/${lang}/courses`} className="hover:text-ink">
                {dict.nav.courses}
              </Link>
            </li>
            <li>
              <Link href={`/${lang}/help`} className="hover:text-ink">
                {dict.nav.help}
              </Link>
            </li>
            <li>
              <a href={`mailto:${brand.supportEmail}`} className="hover:text-ink">
                {brand.supportEmail}
              </a>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="mb-3 text-sm font-semibold">{t.legal}</h3>
          <ul className="space-y-2 text-sm text-muted">
            <li>
              <Link href={`/${lang}/legal/terms`} className="hover:text-ink">
                {t.terms}
              </Link>
            </li>
            <li>
              <Link href={`/${lang}/legal/privacy`} className="hover:text-ink">
                {t.privacy}
              </Link>
            </li>
            <li>
              <Link href={`/${lang}/legal/cookies`} className="hover:text-ink">
                {t.cookies}
              </Link>
            </li>
            <li>
              <Link href={`/${lang}/legal/refunds`} className="hover:text-ink">
                {t.refunds}
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="mb-3 text-sm font-semibold">{t.newsletter}</h3>
          <p className="mb-3 text-sm text-muted">{t.newsletterText}</p>
          <NewsletterForm t={dict.newsletter} />
        </div>
      </div>

      <div className="border-t border-line">
        <div className="container-page flex flex-col gap-3 py-6 text-xs text-muted md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <p>
              © {new Date().getFullYear()} {brand.company.legalName}. {t.rights}
            </p>
            {dict.disclaimer ? <p>{dict.disclaimer}</p> : null}
          </div>
          <ul className="flex flex-wrap items-center gap-4">
            <li className="flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4" aria-hidden="true" /> {t.securePayments}
            </li>
            <li className="flex items-center gap-1.5">
              <Lock className="h-4 w-4" aria-hidden="true" /> {t.ssl}
            </li>
            <li className="flex items-center gap-1.5">
              <CreditCard className="h-4 w-4" aria-hidden="true" /> {t.stripe}
            </li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
