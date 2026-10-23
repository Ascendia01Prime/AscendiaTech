"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Globe } from "lucide-react";
import { isLocale, localeMeta, locales, type Locale } from "@/i18n/config";

/** Switches language while staying on the same page: /en/courses -> /es/courses. */
export default function LanguageSwitcher({ current, label }: { current: Locale; label: string }) {
  const pathname = usePathname() ?? `/${current}`;
  const segments = pathname.split("/");
  const rest = isLocale(segments[1]) ? `/${segments.slice(2).join("/")}` : pathname;
  const suffix = rest === "/" ? "" : rest;

  return (
    <div className="flex items-center gap-1 rounded-xl border border-line px-1.5 py-1" role="group" aria-label={label}>
      <Globe className="mx-1 hidden h-4 w-4 text-muted sm:block" aria-hidden="true" />
      {locales.map((locale) => (
        <Link
          key={locale}
          href={`/${locale}${suffix}`}
          hrefLang={localeMeta[locale].htmlLang}
          title={localeMeta[locale].name}
          aria-current={locale === current ? "true" : undefined}
          className={`rounded-lg px-2 py-1 text-xs font-semibold transition ${
            locale === current ? "bg-brand text-accent-fg" : "text-muted hover:text-ink"
          }`}
        >
          {localeMeta[locale].short}
        </Link>
      ))}
    </div>
  );
}
