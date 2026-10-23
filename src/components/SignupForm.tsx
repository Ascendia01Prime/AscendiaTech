"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { authErrorMessage } from "@/lib/utils";
import { fmt, type Dictionary } from "@/i18n";
import type { Locale } from "@/i18n/config";

export default function SignupForm({
  lang,
  redirectTo,
  referralCode,
  t,
  errors,
}: {
  lang: Locale;
  redirectTo: string;
  referralCode: string | null;
  t: Dictionary["auth"];
  errors: Dictionary["errors"];
}) {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkEmail, setCheckEmail] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        // "locale" lets you write confirmation emails in the person's language (see README).
        data: { full_name: fullName, locale: lang, referral_code: referralCode ?? undefined },
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirectTo)}`,
      },
    });

    if (signUpError) {
      setError(authErrorMessage(signUpError, errors));
      setLoading(false);
      return;
    }

    // If email confirmation is switched off in Supabase, the person is signed in straight away.
    if (data.session) {
      router.push(redirectTo);
      router.refresh();
      return;
    }

    setCheckEmail(true);
    setLoading(false);
  }

  if (checkEmail) {
    return (
      <div className="rounded-xl border border-line bg-surface2 p-4 text-center text-sm">
        <p className="font-semibold">{t.checkEmailTitle}</p>
        <p className="mt-1 text-muted">{fmt(t.checkEmailText, { email })}</p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label htmlFor="name" className="label">
          {t.fullName}
        </label>
        <input
          id="name"
          type="text"
          required
          autoComplete="name"
          className="input"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
        />
      </div>
      <div>
        <label htmlFor="email" className="label">
          {t.email}
        </label>
        <input
          id="email"
          type="email"
          required
          autoComplete="email"
          className="input"
          placeholder={t.emailPlaceholder}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div>
        <label htmlFor="password" className="label">
          {t.password}
        </label>
        <input
          id="password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          className="input"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <p className="mt-1 text-xs text-muted">{t.passwordHint}</p>
      </div>
      {error ? (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      ) : null}
      <button type="submit" className="btn-primary w-full" disabled={loading}>
        {loading ? t.creating : t.createButton}
      </button>
    </form>
  );
}
