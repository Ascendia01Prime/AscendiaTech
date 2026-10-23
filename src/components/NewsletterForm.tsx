"use client";

import { useState, type FormEvent } from "react";
import type { Dictionary } from "@/i18n";

export default function NewsletterForm({ t }: { t: Dictionary["newsletter"] }) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState("loading");
    try {
      const response = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setState(response.ok ? "done" : "error");
      if (response.ok) setEmail("");
    } catch {
      setState("error");
    }
  }

  if (state === "done") {
    return <p className="text-sm text-accent">{t.thanks}</p>;
  }

  return (
    <form onSubmit={onSubmit} className="space-y-2">
      <div className="flex gap-2">
        <label htmlFor="newsletter-email" className="sr-only">
          {t.label}
        </label>
        <input
          id="newsletter-email"
          type="email"
          required
          placeholder={t.placeholder}
          className="input py-2.5"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <button type="submit" className="btn-primary shrink-0" disabled={state === "loading"}>
          {t.button}
        </button>
      </div>
      {state === "error" ? (
        <p role="alert" className="text-xs text-danger">
          {t.error}
        </p>
      ) : null}
    </form>
  );
}
