import Link from "next/link";
import type { Metadata } from "next";
import AuthCard from "@/components/AuthCard";
import SignupForm from "@/components/SignupForm";
import { getDictionary } from "@/i18n";
import { toLocale } from "@/i18n/config";
import { safeRedirect } from "@/lib/utils";

type Props = {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export async function generateMetadata({ params }: Pick<Props, "params">): Promise<Metadata> {
  return { title: getDictionary(toLocale((await params).lang)).auth.signUpTitle };
}

export default async function SignupPage({ params, searchParams }: Props) {
  const lang = toLocale((await params).lang);
  const t = getDictionary(lang);
  const query = await searchParams;
  const redirectParam = typeof query.redirect === "string" ? query.redirect : undefined;
  const redirectTo = safeRedirect(redirectParam, `/${lang}/dashboard`);

  // Referral links look like /en/signup?ref=ab12cd34
  const rawRef = typeof query.ref === "string" ? query.ref : "";
  const referralCode = /^[a-z0-9]{4,16}$/i.test(rawRef) ? rawRef.toLowerCase() : null;

  return (
    <AuthCard
      title={t.auth.signUpTitle}
      subtitle={
        <>
          {t.auth.haveAccount}{" "}
          <Link
            href={`/${lang}/login${redirectParam ? `?redirect=${encodeURIComponent(redirectTo)}` : ""}`}
            className="font-semibold text-accent"
          >
            {t.auth.signInLink}
          </Link>
        </>
      }
    >
      <SignupForm lang={lang} redirectTo={redirectTo} referralCode={referralCode} t={t.auth} errors={t.errors} />
    </AuthCard>
  );
}
