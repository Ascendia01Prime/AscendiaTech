// Supported languages. The first segment of every page URL is one of these: /en, /es, /pt-br.
export const locales = ["en", "es", "pt-br"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "en";

export const localeMeta: Record<
  Locale,
  {
    /** Name shown in menus, written in that language. */
    name: string;
    /** Short label for the language switcher. */
    short: string;
    /** Value for <html lang>. */
    htmlLang: string;
    /** Locale used for number and currency formatting. */
    intl: string;
    /** Locale code Stripe understands for Checkout and the billing portal. */
    stripe: "en" | "es" | "pt-BR";
  }
> = {
  en: { name: "English", short: "EN", htmlLang: "en", intl: "en-US", stripe: "en" },
  es: { name: "Español", short: "ES", htmlLang: "es", intl: "es-ES", stripe: "es" },
  "pt-br": { name: "Português (Brasil)", short: "PT", htmlLang: "pt-BR", intl: "pt-BR", stripe: "pt-BR" },
};

export function isLocale(value: string | null | undefined): value is Locale {
  return typeof value === "string" && (locales as readonly string[]).includes(value);
}

/** Use when a value should be a locale but might not be (e.g. a URL segment). */
export function toLocale(value: string | null | undefined): Locale {
  return isLocale(value) ? value : defaultLocale;
}

/** Pick the best supported language from an Accept-Language header. Returns null if nothing matches. */
export function matchLocale(acceptLanguage: string | null | undefined): Locale | null {
  if (!acceptLanguage) return null;
  const tags = acceptLanguage
    .split(",")
    .map((part) => {
      const [tag, ...params] = part.trim().split(";");
      const qParam = params.find((p) => p.trim().startsWith("q="));
      const q = qParam ? Number.parseFloat(qParam.trim().slice(2)) : 1;
      return { tag: tag.trim().toLowerCase(), q: Number.isNaN(q) ? 0 : q };
    })
    .filter((entry) => entry.tag && entry.q > 0)
    .sort((a, b) => b.q - a.q);

  for (const { tag } of tags) {
    if (tag.startsWith("pt")) return "pt-br"; // any Portuguese -> Brazilian Portuguese
    if (tag.startsWith("es")) return "es";
    if (tag.startsWith("en")) return "en";
  }
  return null;
}
