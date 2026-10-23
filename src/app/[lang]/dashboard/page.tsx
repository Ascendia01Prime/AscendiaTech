import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ArrowRight, BookOpen, CalendarDays, CheckCircle2, Gift, Library } from "lucide-react";
import BillingButton from "@/components/BillingButton";
import CopyButton from "@/components/CopyButton";
import CourseCard from "@/components/CourseCard";
import ProgressBar from "@/components/ProgressBar";
import { brand } from "@/brand";
import { fmt, getDictionary } from "@/i18n";
import { localeMeta, toLocale } from "@/i18n/config";
import { createClient } from "@/lib/supabase/server";
import {
  getActiveEnrollments,
  getCompletedLessonIds,
  getCourseBySlug,
  getOutline,
  getPublishedCourses,
  getReferralStats,
  getUpcomingEvents,
} from "@/lib/data";
import { localizeCourse, localizeEvent } from "@/lib/localize";
import type { Course } from "@/lib/types";

type Props = {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export async function generateMetadata({ params }: Pick<Props, "params">): Promise<Metadata> {
  return { title: getDictionary(toLocale((await params).lang)).nav.dashboard };
}

export default async function DashboardPage({ params, searchParams }: Props) {
  const lang = toLocale((await params).lang);
  const dict = getDictionary(lang);
  const t = dict.dashboard;
  const query = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/${lang}/login?redirect=${encodeURIComponent(`/${lang}/dashboard`)}`);

  const [{ data: profileRow }, enrollments, done, upcoming, referral, allCourses] = await Promise.all([
    supabase.from("profiles").select("full_name, stripe_customer_id, referral_code").eq("id", user.id).maybeSingle(),
    getActiveEnrollments(supabase, user.id),
    getCompletedLessonIds(supabase, user.id),
    getUpcomingEvents(supabase),
    getReferralStats(supabase),
    getPublishedCourses(supabase),
  ]);
  const profile = profileRow as { full_name: string | null; stripe_customer_id: string | null; referral_code: string | null } | null;

  // Everything the person has access to, with progress.
  const enrolledIds = new Set(enrollments.map((enrollment) => enrollment.course_id));
  const myCourses: Course[] = allCourses
    .filter((course) => enrolledIds.has(course.id))
    .map((course) => localizeCourse(course, lang));
  const outline = await getOutline(
    supabase,
    myCourses.map((course) => course.id),
  );

  const stats = myCourses.map((course) => {
    const lessons = outline.filter((lesson) => lesson.course_id === course.id);
    const completed = lessons.filter((lesson) => done.has(lesson.id)).length;
    const next = lessons.find((lesson) => !done.has(lesson.id)) ?? lessons[0];
    return {
      course,
      total: lessons.length,
      completed,
      percent: lessons.length ? (completed / lessons.length) * 100 : 0,
      finished: lessons.length > 0 && completed === lessons.length,
      nextId: next?.id ?? null,
    };
  });

  const courseStats = stats.filter((item) => item.course.kind === "course");
  const guideStats = stats.filter((item) => item.course.kind === "guide");
  const lessonsDone = stats.reduce((sum, item) => sum + item.completed, 0);
  const lessonsTotal = stats.reduce((sum, item) => sum + item.total, 0);
  const coursesDone = stats.filter((item) => item.finished).length;
  const overall = lessonsTotal ? (lessonsDone / lessonsTotal) * 100 : 0;

  const recommended = allCourses
    .filter((course) => !enrolledIds.has(course.id))
    .slice(0, 3)
    .map((course) => localizeCourse(course, lang));

  const rawPurchased = typeof query.purchased === "string" ? query.purchased : "";
  const purchasedCourse = /^[a-z0-9-]+$/.test(rawPurchased) ? await getCourseBySlug(supabase, rawPurchased) : null;

  const name = profile?.full_name?.trim() || user.email?.split("@")[0] || "";
  const initial = (name[0] ?? "?").toUpperCase();
  const referralLink = profile?.referral_code ? `${brand.siteUrl}/${lang}/signup?ref=${profile.referral_code}` : null;
  const dateFormat = new Intl.DateTimeFormat(localeMeta[lang].intl, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
    timeZoneName: "short",
  });

  return (
    <div className="container-page space-y-8 py-10">
      {/* Greeting */}
      <section className="card flex items-center gap-5 bg-gradient-to-br from-accent/10 to-transparent p-6">
        <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-brand text-2xl font-bold text-accent-fg">
          {initial}
        </span>
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-bold sm:text-3xl">{fmt(t.welcome, { name })}</h1>
          <p className="text-muted">{t.welcomeSub}</p>
        </div>
      </section>

      {purchasedCourse ? (
        <p role="status" className="rounded-xl border border-accent/40 bg-accent/10 p-4 text-sm">
          <CheckCircle2 className="mr-2 inline h-4 w-4 text-accent" aria-hidden="true" />
          {fmt(t.purchased, { title: localizeCourse(purchasedCourse, lang).title })}
        </p>
      ) : null}

      {/* Stats */}
      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: t.statsPrograms, value: String(stats.length) },
          { label: t.statsLessons, value: String(lessonsDone) },
          { label: t.statsCourses, value: String(coursesDone) },
          { label: t.statsProgress, value: `${Math.round(overall)}%` },
        ].map((item) => (
          <div key={item.label} className="card p-5">
            <p className="text-3xl font-bold text-accent">{item.value}</p>
            <p className="mt-1 text-sm text-muted">{item.label}</p>
          </div>
        ))}
      </section>

      {/* My courses */}
      <section>
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <h2 className="flex items-center gap-2 text-xl font-semibold">
              <BookOpen className="h-5 w-5 text-accent" aria-hidden="true" /> {t.myCourses}
            </h2>
            <p className="text-sm text-muted">{t.myCoursesSub}</p>
          </div>
        </div>
        {courseStats.length === 0 ? (
          <div className="card p-8 text-center">
            <p className="text-muted">{t.myCoursesEmpty}</p>
            <Link href={`/${lang}/courses`} className="btn-primary mt-5">
              {t.browseCourses}
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {courseStats.map((item) => (
              <div key={item.course.id} className="card flex flex-col p-6">
                <div className="flex items-start gap-4">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-surface2 text-2xl" aria-hidden="true">
                    {item.course.cover_emoji}
                  </span>
                  <div className="min-w-0">
                    <h3 className="font-semibold">{item.course.title}</h3>
                    <p className="text-sm text-muted">{fmt(dict.learn.completedCount, { done: item.completed, total: item.total })}</p>
                  </div>
                </div>
                <div className="mt-4">
                  <ProgressBar value={item.percent} />
                </div>
                <Link href={`/${lang}/learn/${item.course.slug}`} className="btn-primary mt-5 self-start">
                  {item.completed > 0 ? t.continue : t.start} <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Guides and materials */}
      <section className="card p-6">
        <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 text-xl font-semibold">
              <Library className="h-5 w-5 text-accent" aria-hidden="true" /> {t.myGuides}
            </h2>
            <p className="text-sm text-muted">{t.myGuidesSub}</p>
          </div>
          {guideStats.length > 0 ? (
            <span className="badge border-accent/40 text-accent">
              <CheckCircle2 className="mr-1 h-3 w-3" aria-hidden="true" />
              {fmt(t.ready, { count: guideStats.length })}
            </span>
          ) : null}
        </div>
        {guideStats.length === 0 ? (
          <p className="text-muted">{t.guidesEmpty}</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {guideStats.map((item) => (
              <div key={item.course.id} className="rounded-xl border border-line bg-bg/40 p-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-surface2 text-xl" aria-hidden="true">
                    {item.course.cover_emoji}
                  </span>
                  <h3 className="text-sm font-semibold">{item.course.title}</h3>
                </div>
                <Link href={`/${lang}/learn/${item.course.slug}`} className="btn-primary mt-4 w-full">
                  {t.openGuide} <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Events and referral */}
      <div className="grid gap-4 lg:grid-cols-2">
        <section className="card p-6">
          <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold">
            <CalendarDays className="h-5 w-5 text-accent" aria-hidden="true" /> {t.events}
          </h2>
          {upcoming.length === 0 ? (
            <p className="text-muted">{t.eventsEmpty}</p>
          ) : (
            <ul className="space-y-3">
              {upcoming.map((raw) => {
                const event = localizeEvent(raw, lang);
                return (
                  <li key={event.id} className="flex items-center justify-between gap-3 rounded-xl border border-line p-3">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{event.title}</p>
                      <p className="text-xs text-muted">{dateFormat.format(new Date(event.starts_at))}</p>
                    </div>
                    {event.join_url && /^https?:\/\//i.test(event.join_url) ? (
                      <a href={event.join_url} target="_blank" rel="noopener noreferrer" className="btn-ghost shrink-0">
                        {t.join}
                      </a>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {referralLink ? (
          <section className="card p-6">
            <h2 className="mb-1 flex items-center gap-2 text-xl font-semibold">
              <Gift className="h-5 w-5 text-accent" aria-hidden="true" /> {t.inviteTitle}
            </h2>
            <p className="mb-4 text-sm text-muted">{t.inviteText}</p>
            <label htmlFor="referral-link" className="label">
              {t.yourLink}
            </label>
            <div className="flex gap-2">
              <input id="referral-link" readOnly value={referralLink} className="input py-2.5 text-xs" />
              <CopyButton value={referralLink} copyLabel={t.copy} copiedLabel={t.copied} />
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-line p-3 text-center">
                <p className="text-2xl font-bold text-accent">{referral.invited}</p>
                <p className="text-xs text-muted">{t.invited}</p>
              </div>
              <div className="rounded-xl border border-line p-3 text-center">
                <p className="text-2xl font-bold text-accent">{referral.purchased}</p>
                <p className="text-xs text-muted">{t.purchasedStat}</p>
              </div>
            </div>
          </section>
        ) : null}
      </div>

      {/* Recommended */}
      {recommended.length > 0 ? (
        <section>
          <h2 className="text-xl font-semibold">{t.recommended}</h2>
          <p className="mb-4 text-sm text-muted">{t.recommendedText}</p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {recommended.map((course) => (
              <CourseCard key={course.id} course={course} lang={lang} />
            ))}
          </div>
        </section>
      ) : null}

      {/* Billing */}
      {profile?.stripe_customer_id ? (
        <section className="card flex flex-wrap items-center justify-between gap-4 p-6">
          <div>
            <h2 className="font-semibold">{t.billingTitle}</h2>
            <p className="text-sm text-muted">{t.billingText}</p>
          </div>
          <BillingButton lang={lang} label={t.manageBilling} errors={dict.errors} />
        </section>
      ) : null}
    </div>
  );
}
