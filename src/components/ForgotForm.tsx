"use client";

import { useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import { authErrorMessage } from "@/lib/utils";
import { fmt, type Dictionary } from "@/i18n";
import type { Locale } from "@/i18n/config";

export default function ForgotForm({
  lang,
  t,
  errors,
}: {
  lang: Locale;
  t: Dictionary["auth"];
  errors: Dictionary["errors"];
}) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(`/${lang}/reset-password`)}`,
    });

    setLoading(false);
    if (resetError) {
      setError(authErrorMessage(resetError, errors));
      return;
    }
    setSent(true);
  }

  if (sent) {
    return (
      <div className="rounded-xl border border-line bg-surface2 p-4 text-center text-sm">
        <p className="font-semibold">{t.sentTitle}</p>
        <p className="mt-1 text-muted">{fmt(t.sentText, { email })}</p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
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
      {error ? (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      ) : null}
      <button type="submit" className="btn-primary w-full" disabled={loading}>
        {loading ? t.sending : t.sendLink}
      </button>
    </form>
  );
}
