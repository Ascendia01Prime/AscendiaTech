import Link from "next/link";
import type { Metadata } from "next";
import AuthCard from "@/components/AuthCard";
import ForgotForm from "@/components/ForgotForm";
import { getDictionary } from "@/i18n";
import { toLocale } from "@/i18n/config";

type Props = { params: Promise<{ lang: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: getDictionary(toLocale((await params).lang)).auth.forgotTitle };
}

export default async function ForgotPasswordPage({ params }: Props) {
  const lang = toLocale((await params).lang);
  const t = getDictionary(lang);

  return (
    <AuthCard
      title={t.auth.forgotTitle}
      subtitle={
        <>
          {t.auth.remembered}{" "}
          <Link href={`/${lang}/login`} className="font-semibold text-accent">
            {t.auth.backToSignIn}
          </Link>
        </>
      }
    >
      <ForgotForm lang={lang} t={t.auth} errors={t.errors} />
    </AuthCard>
  );
}
