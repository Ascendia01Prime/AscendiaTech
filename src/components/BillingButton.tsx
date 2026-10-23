"use client";

import { useState } from "react";
import { CreditCard } from "lucide-react";
import type { Dictionary } from "@/i18n";
import type { Locale } from "@/i18n/config";

export default function BillingButton({
  lang,
  label,
  errors,
}: {
  lang: Locale;
  label: string;
  errors: Dictionary["errors"];
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function open() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/billing-portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lang }),
      });
      const data = (await response.json()) as { url?: string; error?: string };
      if (!response.ok || !data.url) {
        const code = data.error as keyof Dictionary["errors"] | undefined;
        setError((code && errors[code]) || errors.generic);
        setLoading(false);
        return;
      }
      window.location.href = data.url;
    } catch {
      setError(errors.network);
      setLoading(false);
    }
  }

  return (
    <div>
      <button type="button" onClick={open} className="btn-ghost" disabled={loading}>
        <CreditCard className="h-4 w-4" aria-hidden="true" />
        {label}
      </button>
      {error ? (
        <p role="alert" className="mt-2 text-sm text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}
