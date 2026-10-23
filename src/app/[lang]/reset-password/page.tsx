import type { Metadata } from "next";
import AuthCard from "@/components/AuthCard";
import ResetForm from "@/components/ResetForm";
import { getDictionary } from "@/i18n";
import { toLocale } from "@/i18n/config";

type Props = { params: Promise<{ lang: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: getDictionary(toLocale((await params).lang)).auth.resetTitle };
}

export default async function ResetPasswordPage({ params }: Props) {
  const lang = toLocale((await params).lang);
  const t = getDictionary(lang);

  return (
    <AuthCard title={t.auth.resetTitle} subtitle={t.auth.resetSubtitle}>
      <ResetForm lang={lang} t={t.auth} errors={t.errors} />
    </AuthCard>
  );
}
