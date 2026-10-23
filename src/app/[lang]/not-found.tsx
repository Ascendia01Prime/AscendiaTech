import Link from "next/link";
import { cookies } from "next/headers";
import { getDictionary } from "@/i18n";
import { toLocale } from "@/i18n/config";

// Not-found pages do not receive the URL language, so use the language the person last browsed in.
export default async function NotFound() {
  const lang = toLocale((await cookies()).get("NEXT_LOCALE")?.value);
  const t = getDictionary(lang).notFound;

  return (
    <div className="container-page flex min-h-[60vh] flex-col items-center justify-center py-16 text-center">
      <p className="text-6xl font-bold text-accent">404</p>
      <h1 className="mt-4 text-2xl font-bold">{t.title}</h1>
      <p className="mt-2 max-w-md text-muted">{t.text}</p>
      <Link href={`/${lang}`} className="btn-primary mt-8">
        {t.home}
      </Link>
    </div>
  );
}
