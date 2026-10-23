import Link from "next/link";
import type { Metadata } from "next";
import AuthCard from "@/components/AuthCard";
import LoginForm from "@/components/LoginForm";
import { getDictionary } from "@/i18n";
import { toLocale } from "@/i18n/config";
import { safeRedirect } from "@/lib/utils";

type Props = {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export async function generateMetadata({ params }: Pick<Props, "params">): Promise<Metadata> {
  return { title: getDictionary(toLocale((await params).lang)).auth.signInTitle };
}

export default async function LoginPage({ params, searchParams }: Props) {
  const lang = toLocale((await params).lang);
  const t = getDictionary(lang);
  const query = await searchParams;
  const redirectParam = typeof query.redirect === "string" ? query.redirect : undefined;
  const redirectTo = safeRedirect(redirectParam, `/${lang}/dashboard`);

  return (
    <AuthCard
      title={t.auth.signInTitle}
      subtitle={
        <>
          {t.auth.newHere}{" "}
          <Link
            href={`/${lang}/signup${redirectParam ? `?redirect=${encodeURIComponent(redirectTo)}` : ""}`}
            className="font-semibold text-accent"
          >
            {t.auth.createAccount}
          </Link>
        </>
      }
    >
      {query.error === "auth" ? (
        <p role="alert" className="mb-4 rounded-xl border border-danger/40 bg-danger/10 p-3 text-sm text-danger">
          {t.auth.linkExpired}
        </p>
      ) : null}
      <LoginForm lang={lang} redirectTo={redirectTo} t={t.auth} errors={t.errors} />
    </AuthCard>
  );
}
