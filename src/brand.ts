// Everything that identifies your business lives here. Edit this file first.
// Text that changes per language (tagline, hero, help, legal templates...) lives in
// src/i18n/dictionaries/ (en.ts, es.ts, pt-br.ts).
export const brand = {
  name: "Ascendia Tech",
  supportEmail: "hello@example.com",
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",

  // Shown on the About page and in the footer. Replace with your real details.
  company: {
    legalName: "Your Company Ltd",
    jurisdiction: "England and Wales",
    address: "Add your registered address here",
  },
} as const;
