import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowLeft, CheckCircle2, Clock, Lock, PlayCircle } from "lucide-react";
import BuyButton from "@/components/BuyButton";
import { fmt, getDictionary } from "@/i18n";
import { toLocale } from "@/i18n/config";
import { createClient } from "@/lib/supabase/server";
import { getCourseBySlug, getOutline } from "@/lib/data";
import { localizeCourse, localizeOutline } from "@/lib/localize";
import { formatPrice } from "@/lib/utils";

type Props = { params: Promise<{ lang: string; slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang: rawLang, slug } = await params;
  const lang = toLocale(rawLang);
  const course = await getCourseBySlug(await createClient(), slug);
  if (!course) return {};
  const localized = localizeCourse(course, lang);
  return { title: localized.title, description: localized.subtitle ?? undefined };
}

export default async function CoursePage({ params }: Props) {
  const { lang: rawLang, slug } = await params;
  const lang = toLocale(rawLang);
  const dict = getDictionary(lang);
  const t = dict.course;

  const supabase = await createClient();
  const baseCourse = await getCourseBySlug(supabase, slug);
  if (!baseCourse) notFound();
  const course = localizeCourse(baseCourse, lang);

  const outline = (await getOutline(supabase, [course.id])).map((lesson) => localizeOutline(lesson, lang));

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let enrolled = false;
  if (user) {
    const { data } = await supabase
      .from("enrollments")
      .select("id")
      .eq("user_id", user.id)
      .eq("course_id", course.id)
      .eq("status", "active")
      .maybeSingle();
    enrolled = Boolean(data);
  }

  const price = formatPrice(course, lang, dict.common);
  const buyLabel =
    course.pricing_type === "free"
      ? t.startFree
      : course.pricing_type === "subscription"
        ? fmt(t.subscribe, { price })
        : fmt(t.buy, { price });
  const accessLabel =
    course.pricing_type === "free" ? t.accessFree : course.pricing_type === "subscription" ? t.accessSubscription : t.accessOneTime;

  return (
    <div className="container-page py-10">
      <Link href={`/${lang}/courses`} className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" /> {t.allCourses}
      </Link>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <span className="badge">{course.kind === "guide" ? dict.common.guideBadge : dict.common.courseBadge}</span>
            <span className="badge">
              {t.level}: {dict.common.levels[course.level]}
            </span>
            {course.duration_label ? (
              <span className="badge">
                <Clock className="mr-1 h-3 w-3" aria-hidden="true" />
                {course.duration_label}
              </span>
            ) : null}
          </div>
          <h1 className="text-3xl font-bold sm:text-4xl">
            <span aria-hidden="true">{course.cover_emoji} </span>
            {course.title}
          </h1>
          {course.subtitle ? <p className="mt-2 text-lg text-muted">{course.subtitle}</p> : null}
          {course.description ? <p className="mt-6 leading-7 text-ink/90">{course.description}</p> : null}

          <h2 className="mb-4 mt-10 text-xl font-semibold">{t.curriculum}</h2>
          {outline.length === 0 ? (
            <p className="card p-6 text-muted">{t.noLessons}</p>
          ) : (
            <ol className="card divide-y divide-line">
              {outline.map((lesson) => {
                const open = enrolled || lesson.is_free_preview;
                const row = (
                  <div className="flex items-center gap-4 p-4">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface2 text-sm font-semibold">
                      {lesson.position}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">{lesson.title}</p>
                      {lesson.summary ? <p className="truncate text-sm text-muted">{lesson.summary}</p> : null}
                    </div>
                    {lesson.is_free_preview && !enrolled ? <span className="badge shrink-0">{t.freePreview}</span> : null}
                    {open ? (
                      <PlayCircle className="h-5 w-5 shrink-0 text-accent" aria-hidden="true" />
                    ) : (
                      <span title={t.locked}>
                        <Lock className="h-5 w-5 shrink-0 text-muted" aria-label={t.locked} />
                      </span>
                    )}
                  </div>
                );
                return (
                  <li key={lesson.id}>
                    {open ? (
                      <Link href={`/${lang}/learn/${course.slug}/${lesson.id}`} className="block hover:bg-surface2">
                        {row}
                      </Link>
                    ) : (
                      row
                    )}
                  </li>
                );
              })}
            </ol>
          )}
        </div>

        <aside className="lg:col-span-1">
          <div className="card sticky top-24 p-6">
            <p className="text-3xl font-bold">{price}</p>

            <div className="mt-5">
              {enrolled ? (
                <>
                  <p className="mb-3 flex items-center gap-2 text-sm text-accent">
                    <CheckCircle2 className="h-4 w-4" aria-hidden="true" /> {t.owned}
                  </p>
                  <Link href={`/${lang}/learn/${course.slug}`} className="btn-primary btn-lg w-full">
                    {t.continue}
                  </Link>
                </>
              ) : (
                <BuyButton courseId={course.id} courseSlug={course.slug} lang={lang} label={buyLabel} errors={dict.errors} />
              )}
            </div>

            <h2 className="mb-3 mt-8 text-sm font-semibold uppercase tracking-wide text-muted">{t.includes}</h2>
            <ul className="space-y-2.5 text-sm">
              {outline.length > 0 ? (
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
                  {fmt(t.lessonsIncluded, { count: outline.length })}
                </li>
              ) : null}
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
                {accessLabel}
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
                {t.progressTracking}
              </li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
