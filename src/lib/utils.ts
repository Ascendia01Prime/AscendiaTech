import type { Course } from "./types";
import { localeMeta, type Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n";

/** "Free", "$49", or "$19 / month", formatted for the reader's language. */
export function formatPrice(
  course: Pick<Course, "pricing_type" | "price_cents" | "currency" | "billing_interval">,
  lang: Locale,
  t: Dictionary["common"],
): string {
  if (course.pricing_type === "free" || course.price_cents == null) return t.free;
  const amount = new Intl.NumberFormat(localeMeta[lang].intl, {
    style: "currency",
    currency: course.currency.toUpperCase(),
    minimumFractionDigits: course.price_cents % 100 === 0 ? 0 : 2,
  }).format(course.price_cents / 100);
  if (course.pricing_type === "subscription") {
    const interval = course.billing_interval === "year" ? t.perYear : t.perMonth;
    return `${amount} / ${interval}`;
  }
  return amount;
}

/**
 * Only allow redirects to paths on this site. Blocks "//evil.com",
 * "https://evil.com" and "/\evil.com" style open-redirect tricks.
 */
export function safeRedirect(value: string | null | undefined, fallback = "/dashboard"): string {
  if (!value) return fallback;
  if (!value.startsWith("/")) return fallback;
  if (value.startsWith("//") || value.startsWith("/\\")) return fallback;
  return value;
}

/** Map a Supabase auth error to a message in the reader's language. */
export function authErrorMessage(error: { code?: string; message?: string; status?: number }, t: Dictionary["errors"]): string {
  const code = error.code ?? "";
  switch (code) {
    case "invalid_credentials":
      return t.invalid_credentials;
    case "email_not_confirmed":
      return t.email_not_confirmed;
    case "user_already_exists":
    case "email_exists":
      return t.user_already_exists;
    case "weak_password":
      return t.weak_password;
    case "same_password":
      return t.same_password;
    case "over_request_rate_limit":
    case "over_email_send_rate_limit":
      return t.rate_limited;
    default:
      return error.status === 429 ? t.rate_limited : t.generic;
  }
}

export type VideoEmbed =
  | { type: "iframe"; src: string }
  | { type: "file"; src: string }
  | { type: "link"; src: string };

/** Turn a pasted video link into something safe to show. */
export function videoEmbed(url: string | null | undefined): VideoEmbed | null {
  if (!url) return null;
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return null;
  const host = parsed.hostname.replace(/^www\./, "");

  if (host === "youtube.com" || host === "m.youtube.com") {
    const id = parsed.searchParams.get("v") ?? (parsed.pathname.startsWith("/embed/") ? parsed.pathname.split("/")[2] : null);
    if (id) return { type: "iframe", src: `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}` };
  }
  if (host === "youtu.be") {
    const id = parsed.pathname.slice(1);
    if (id) return { type: "iframe", src: `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}` };
  }
  if (host === "vimeo.com") {
    const id = parsed.pathname.split("/").filter(Boolean)[0];
    if (id && /^\d+$/.test(id)) return { type: "iframe", src: `https://player.vimeo.com/video/${id}` };
  }
  if (host === "player.vimeo.com") {
    return { type: "iframe", src: parsed.toString() };
  }
  if (/\.(mp4|webm|ogg)$/i.test(parsed.pathname)) {
    return { type: "file", src: parsed.toString() };
  }
  return { type: "link", src: parsed.toString() };
}
