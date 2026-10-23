import Link from "next/link";
import type { Metadata } from "next";
import { KeyRound, LifeBuoy, LogIn, UserPlus, Wallet } from "lucide-react";
import type { ReactNode } from "react";
import { brand } from "@/brand";
import { getDictionary } from "@/i18n";
import { toLocale } from "@/i18n/config";

type Props = { params: Promise<{ lang: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: getDictionary(toLocale((await params).lang)).help.title };
}

function Section({
  icon,
  title,
  steps,
  action,
}: {
  icon: ReactNode;
  title: string;
  steps: string[];
  action: ReactNode;
}) {
  return (
    <section className="card p-6">
      <h2 className="mb-5 flex items-center gap-3 text-xl font-semibold">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/15 text-accent">{icon}</span>
        {title}
      </h2>
      <ol className="space-y-3">
        {steps.map((step, index) => (
          <li key={step} className="flex gap-3 text-sm">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand text-xs font-bold text-accent-fg">
              {index + 1}
            </span>
            <span className="pt-0.5">{step}</span>
          </li>
        ))}
      </ol>
      <div className="mt-6">{action}</div>
    </section>
  );
}

export default async function HelpPage({ params }: Props) {
  const lang = toLocale((await params).lang);
  const t = getDictionary(lang).help;

  return (
    <div className="container-page max-w-3xl space-y-6 py-12">
      <header className="text-center">
        <h1 className="text-3xl font-bold sm:text-4xl">{t.title}</h1>
        <p className="mt-2 text-sm text-muted">{t.subtitle}</p>
      </header>

      <Section
        icon={<UserPlus className="h-5 w-5" aria-hidden="true" />}
        title={t.signupTitle}
        steps={t.signupSteps}
        action={
          <Link href={`/${lang}/signup`} className="btn-primary">
            {t.signupButton}
          </Link>
        }
      />
      <Section
        icon={<LogIn className="h-5 w-5" aria-hidden="true" />}
        title={t.loginTitle}
        steps={t.loginSteps}
        action={
          <Link href={`/${lang}/login`} className="btn-primary">
            {t.loginButton}
          </Link>
        }
      />
      <Section
        icon={<KeyRound className="h-5 w-5" aria-hidden="true" />}
        title={t.resetTitle}
        steps={t.resetSteps}
        action={
          <Link href={`/${lang}/forgot-password`} className="btn-primary">
            {t.resetButton}
          </Link>
        }
      />
      <Section
        icon={<Wallet className="h-5 w-5" aria-hidden="true" />}
        title={t.cancelTitle}
        steps={t.cancelSteps}
        action={
          <Link href={`/${lang}/dashboard`} className="btn-primary">
            {t.cancelButton}
          </Link>
        }
      />

      <section className="card flex flex-wrap items-center justify-between gap-4 p-6">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/15 text-accent">
            <LifeBuoy className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <h2 className="font-semibold">{t.contactTitle}</h2>
            <p className="text-sm text-muted">{t.contactText}</p>
          </div>
        </div>
        <a href={`mailto:${brand.supportEmail}`} className="btn-ghost">
          {t.contactButton}
        </a>
      </section>
    </div>
  );
}
