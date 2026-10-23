import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getDictionary } from "@/i18n";
import { toLocale } from "@/i18n/config";
import { renderMarkdown } from "@/lib/markdown";

type Props = { params: Promise<{ lang: string; doc: string }> };

const DOCS = ["terms", "privacy", "cookies", "refunds"] as const;
type DocKey = (typeof DOCS)[number];

function isDoc(value: string): value is DocKey {
  return (DOCS as readonly string[]).includes(value);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang, doc } = await params;
  if (!isDoc(doc)) return {};
  return { title: getDictionary(toLocale(lang)).legal.docs[doc].title };
}

export default async function LegalPage({ params }: Props) {
  const { lang: rawLang, doc } = await params;
  if (!isDoc(doc)) notFound();
  const t = getDictionary(toLocale(rawLang)).legal;
  const page = t.docs[doc];

  return (
    <div className="container-page max-w-3xl py-12">
      <h1 className="text-3xl font-bold sm:text-4xl">{page.title}</h1>
      <p role="note" className="mt-4 rounded-xl border border-accent/40 bg-accent/10 p-4 text-sm">
        {t.templateNote}
      </p>
      {/* Safe: renderMarkdown() escapes every HTML character before formatting. */}
      <div className="prose-lite mt-6" dangerouslySetInnerHTML={{ __html: renderMarkdown(page.body) }} />
    </div>
  );
}
