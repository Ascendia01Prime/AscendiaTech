import type { Metadata } from "next";
import { brand } from "@/brand";
import { fmt, getDictionary } from "@/i18n";
import { toLocale } from "@/i18n/config";

type Props = { params: Promise<{ lang: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const t = getDictionary(toLocale((await params).lang)).about;
  return { title: fmt(t.title, { name: brand.name }) };
}

export default async function AboutPage({ params }: Props) {
  const lang = toLocale((await params).lang);
  const t = getDictionary(lang).about;

  const rows: Array<[string, string]> = [
    [t.legalEntity, brand.company.legalName],
    [t.jurisdiction, brand.company.jurisdiction],
    [t.address, brand.company.address],
    [t.email, brand.supportEmail],
    [t.website, brand.siteUrl],
  ];

  return (
    <div className="container-page max-w-3xl py-12">
      <h1 className="text-3xl font-bold sm:text-4xl">{fmt(t.title, { name: brand.name })}</h1>
      <div className="mt-6 space-y-4 leading-7 text-ink/90">
        {t.body.map((paragraph) => (
          <p key={paragraph}>{fmt(paragraph, { name: brand.name })}</p>
        ))}
      </div>

      <section className="card mt-10 p-6">
        <h2 className="mb-4 text-xl font-semibold">{t.legalTitle}</h2>
        <dl className="space-y-3 text-sm">
          {rows.map(([label, value]) => (
            <div key={label} className="grid gap-1 sm:grid-cols-3">
              <dt className="text-muted">{label}</dt>
              <dd className="sm:col-span-2">{value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-semibold">{t.contactTitle}</h2>
        <p className="mt-2 text-muted">{fmt(t.contactText, { email: brand.supportEmail })}</p>
      </section>
    </div>
  );
}
