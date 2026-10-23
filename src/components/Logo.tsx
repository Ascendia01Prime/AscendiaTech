import Link from "next/link";
import { GraduationCap } from "lucide-react";
import { brand } from "@/brand";
import type { Locale } from "@/i18n/config";

export default function Logo({ lang, hideNameOnTiny = false }: { lang: Locale; hideNameOnTiny?: boolean }) {
  return (
    <Link href={`/${lang}`} className="flex items-center gap-2.5" aria-label={brand.name}>
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand text-accent-fg">
        <GraduationCap className="h-5 w-5" aria-hidden="true" />
      </span>
      <span className={`text-lg font-bold tracking-tight ${hideNameOnTiny ? "max-[420px]:hidden" : ""}`}>{brand.name}</span>
    </Link>
  );
}
