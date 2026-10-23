import Link from "next/link";
import { ArrowRight, BookOpen, Lock, Sparkles } from "lucide-react";
import CourseCard from "@/components/CourseCard";
import { getDictionary } from "@/i18n";
import { toLocale } from "@/i18n/config";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getPublishedCourses } from "@/lib/data";
import { localizeCourse } from "@/lib/localize";

type Props = { params: Promise<{ lang: string }> };

const featureIcons = [Sparkles, BookOpen, Lock];

export default async function HomePage({ params }: Props) {
  const lang = toLocale((await params).lang);
  const t = getDictionary(lang);

  const courses = isSupabaseConfigured()
    ? (await getPublishedCourses(await createClient(), 3)).map((course) => localizeCourse(course, lang))
    : [];

  return (
    <>
      {/* Hero */}
      <section className="container-page pb-16 pt-16 text-center sm:pt-24">
        <span className="badge border-accent/40 text-accent">{t.home.eyebrow}</span>
        <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-extrabold tracking-tight sm:text-6xl">{t.home.heroTitle}</h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-muted">{t.home.heroSubtitle}</p>
        <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link href={`/${lang}/courses`} className="btn-primary btn-lg">
            {t.home.browse} <ArrowRight className="h-5 w-5" aria-hidden="true" />
          </Link>
          <Link href={`/${lang}/signup`} className="btn-ghost btn-lg">
            {t.home.createAccount}
          </Link>
        </div>
      </section>

      {/* Why us */}
      <section className="container-page py-12">
        <h2 className="mb-8 text-center text-2xl font-bold sm:text-3xl">{t.home.whyTitle}</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {t.home.features.map((feature, index) => {
            const Icon = featureIcons[index % featureIcons.length];
            return (
              <div key={feature.title} className="card p-6">
                <span className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-accent/15 text-accent">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <h3 className="font-semibold">{feature.title}</h3>
                <p className="mt-2 text-sm text-muted">{feature.text}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Featured courses */}
      {courses.length > 0 ? (
        <section className="container-page py-12">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold sm:text-3xl">{t.home.featuredTitle}</h2>
              <p className="mt-1 text-muted">{t.home.featuredText}</p>
            </div>
            <Link href={`/${lang}/courses`} className="flex items-center gap-1 text-sm font-semibold text-accent">
              {t.home.viewAll} <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map((course) => (
              <CourseCard key={course.id} course={course} lang={lang} />
            ))}
          </div>
        </section>
      ) : null}

      {/* How it works */}
      <section className="container-page py-12">
        <h2 className="mb-8 text-center text-2xl font-bold sm:text-3xl">{t.home.howTitle}</h2>
        <ol className="grid gap-4 md:grid-cols-3">
          {t.home.steps.map((step, index) => (
            <li key={step.title} className="card p-6">
              <span className="mb-4 flex h-9 w-9 items-center justify-center rounded-full bg-brand text-sm font-bold text-accent-fg">
                {index + 1}
              </span>
              <h3 className="font-semibold">{step.title}</h3>
              <p className="mt-2 text-sm text-muted">{step.text}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Final call to action */}
      <section className="container-page py-12">
        <div className="card bg-gradient-to-br from-accent/15 to-transparent p-10 text-center">
          <h2 className="text-2xl font-bold sm:text-3xl">{t.home.ctaTitle}</h2>
          <p className="mx-auto mt-3 max-w-xl text-muted">{t.home.ctaText}</p>
          <Link href={`/${lang}/signup`} className="btn-primary btn-lg mt-8">
            {t.home.createAccount}
          </Link>
        </div>
      </section>
    </>
  );
}
