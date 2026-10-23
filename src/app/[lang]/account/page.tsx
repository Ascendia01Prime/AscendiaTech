import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LogOut } from "lucide-react";
import BillingButton from "@/components/BillingButton";
import ProfileForm from "@/components/ProfileForm";
import { getDictionary } from "@/i18n";
import { toLocale } from "@/i18n/config";
import { createClient } from "@/lib/supabase/server";

type Props = { params: Promise<{ lang: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: getDictionary(toLocale((await params).lang)).account.title };
}

export default async function AccountPage({ params }: Props) {
  const lang = toLocale((await params).lang);
  const dict = getDictionary(lang);
  const t = dict.account;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/${lang}/login?redirect=${encodeURIComponent(`/${lang}/account`)}`);

  const { data } = await supabase.from("profiles").select("full_name, stripe_customer_id").eq("id", user.id).maybeSingle();
  const profile = data as { full_name: string | null; stripe_customer_id: string | null } | null;

  return (
    <div className="container-page max-w-2xl space-y-6 py-10">
      <h1 className="text-3xl font-bold">{t.title}</h1>

      <section className="card p-6">
        <h2 className="mb-4 text-lg font-semibold">{t.profile}</h2>
        <ProfileForm userId={user.id} email={user.email ?? ""} fullName={profile?.full_name ?? ""} t={t} />
      </section>

      <section className="card p-6">
        <h2 className="text-lg font-semibold">{t.security}</h2>
        <p className="mb-4 mt-1 text-sm text-muted">{t.securityText}</p>
        <Link href={`/${lang}/forgot-password`} className="btn-ghost">
          {t.changePassword}
        </Link>
      </section>

      {profile?.stripe_customer_id ? (
        <section className="card flex flex-wrap items-center justify-between gap-4 p-6">
          <div>
            <h2 className="text-lg font-semibold">{dict.dashboard.billingTitle}</h2>
            <p className="text-sm text-muted">{dict.dashboard.billingText}</p>
          </div>
          <BillingButton lang={lang} label={dict.dashboard.manageBilling} errors={dict.errors} />
        </section>
      ) : null}

      <form action={`/auth/signout?lang=${lang}`} method="post">
        <button type="submit" className="btn-ghost">
          <LogOut className="h-4 w-4" aria-hidden="true" /> {t.signOut}
        </button>
      </form>
    </div>
  );
}
