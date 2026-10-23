import "../globals.css";
import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Poppins } from "next/font/google";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { brand } from "@/brand";
import { getDictionary } from "@/i18n";
import { localeMeta, locales, toLocale } from "@/i18n/config";

const poppins = Poppins({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
  variable: "--font-poppins",
});

// Colours the phone browser bar to match the site background.
export const viewport: Viewport = { themeColor: "#020617" };

type LangParams = { params: Promise<{ lang: string }> };

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export async function generateMetadata({ params }: LangParams): Promise<Metadata> {
  const lang = toLocale((await params).lang);
  const dict = getDictionary(lang);
  return {
    metadataBase: new URL(brand.siteUrl),
    title: { default: `${brand.name}: ${dict.tagline}`, template: `%s | ${brand.name}` },
    description: dict.siteDescription,
    // Tells search engines about the other language versions of the home page.
    alternates: {
      languages: Object.fromEntries(locales.map((l) => [localeMeta[l].htmlLang, `/${l}`])),
    },
  };
}

export default async function LangLayout({ children, params }: { children: ReactNode } & LangParams) {
  // The middleware guarantees a valid language in the URL; toLocale is just a safety net.
  const lang = toLocale((await params).lang);

  return (
    <html lang={localeMeta[lang].htmlLang} className={poppins.variable}>
      <body className="flex min-h-screen flex-col">
        <Header lang={lang} />
        <main className="flex-1">{children}</main>
        <Footer lang={lang} />
      </body>
    </html>
  );
}
