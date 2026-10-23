import type { Locale } from "./config";
import { en, type Dictionary } from "./dictionaries/en";
import { es } from "./dictionaries/es";
import { ptBr } from "./dictionaries/pt-br";

export type { Dictionary };

const dictionaries: Record<Locale, Dictionary> = {
  en,
  es,
  "pt-br": ptBr,
};

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale];
}

/** Fill {placeholders} in a translated string: fmt("Hello {name}", { name: "Ana" }). */
export function fmt(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => (key in vars ? String(vars[key]) : match));
}
