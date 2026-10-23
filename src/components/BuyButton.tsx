"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Dictionary } from "@/i18n";
import type { Locale } from "@/i18n/config";

export default function BuyButton({
  courseId,
  courseSlug,
  lang,
  label,
  errors,
  className = "btn-primary btn-lg w-full",
}: {
  courseId: string;
  courseSlug: string;
  lang: Locale;
  label: string;
  errors: Dictionary["errors"];
  className?: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onClick() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId, lang }),
      });

      if (response.status === 401) {
        router.push(`/${lang}/login?redirect=${encodeURIComponent(`/${lang}/courses/${courseSlug}`)}`);
        return;
      }

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
      <button type="button" onClick={onClick} className={className} disabled={loading}>
        {loading ? "…" : label}
      </button>
      {error ? (
        <p role="alert" className="mt-2 text-sm text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}
