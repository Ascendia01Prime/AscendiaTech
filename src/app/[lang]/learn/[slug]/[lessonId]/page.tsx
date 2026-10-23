import Link from "next/link";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, ArrowRight, CheckCircle2, Circle, ExternalLink, Lock } from "lucide-react";
import CompleteButton from "@/components/CompleteButton";
import ProgressBar from "@/components/ProgressBar";
import { fmt, getDictionary } from "@/i18n";
import { toLocale } from "@/i18n/config";
import { createClient } from "@/lib/supabase/server";
import { getCompletedLessonIds, getCourseBySlug, getOutline } from "@/lib/data";
import { localizeCourse, localizeLesson, localizeOutline } from "@/lib/localize";
import { renderMarkdown } from "@/lib/markdown";
import { videoEmbed } from "@/lib/utils";
import type { Lesson } from "@/lib/types";

type Props = { params: Promise<{ lang: string; slug: string; lessonId: string }> };

export const metadata: Metadata = { robots: { index: false } };

export default async function LessonPage({ params }: Props) {
  const { lang: rawLang, slug, lessonId } = await params;
  const lang = toLocale(rawLang);
  const t = getDictionary(lang).learn;
  const here = `/${lang}/learn/${slug}/${lessonId}`;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/${lang}/login?redirect=${encodeURIComponent(here)}`);

  const baseCourse = await getCourseBySlug(supabase, slug);
  if (!baseCourse) notFound();
  const course = localizeCourse(baseCourse, lang);

  // Row rules only return the lesson if it is a free preview or this person has access.
  const { data: lessonRow } = await supabase
    .from("lessons")
    .select("*")
    .eq("id", lessonId)
    .eq("course_id", course.id)
    .maybeSingle();
  if (!lessonRow) redirect(`/${lang}/courses/${slug}`);
  const lesson = localizeLesson(lessonRow as Lesson, lang);

  const { data: enrollment } = await supabase
    .from("enrollments")
    .select("id")
    .eq("user_id", user.id)
    .eq("course_id", course.id)
    .eq("status", "active")
    .maybeSingle();
  const enrolled = Boolean(enrollment);

  const outline = (await getOutline(supabase, [course.id])).map((item) => localizeOutline(item, lang));
  const done = await getCompletedLessonIds(supabase, user.id);
  const doneInCourse = outline.filter((item) => done.has(item.id)).length;
  const percent = outline.length ? (doneInCourse / outline.length) * 100 : 0;

  const index = outline.findIndex((item) => item.id === lesson.id);
  const hrefFor = (item: (typeof outline)[number]) =>
    enrolled || item.is_free_preview ? `/${lang}/learn/${slug}/${item.id}` : `/${lang}/courses/${slug}`;
  const prev = index > 0 ? outline[index - 1] : null;
  const next = index >= 0 && index < outline.length - 1 ? outline[index + 1] : null;

  const video = videoEmbed(lesson.video_url);
  const html = renderMarkdown(lesson.content_md);

  return (
    <div className="container-page py-8">
      <Link href={`/${lang}/courses/${slug}`} className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" /> {course.title}
      </Link>

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        {/* Lesson list */}
        <aside className="card h-fit p-5 lg:sticky lg:top-24">
          <h2 className="font-semibold">{t.lessons}</h2>
          <p className="mb-3 mt-1 text-xs text-muted">{fmt(t.completedCount, { done: doneInCourse, total: outline.length })}</p>
          <ProgressBar value={percent} />
          <ol className="mt-4 space-y-1">
            {outline.map((item) => {
              const open = enrolled || item.is_free_preview;
              const isCurrent = item.id === lesson.id;
              return (
                <li key={item.id}>
                  <Link
                    href={hrefFor(item)}
                    aria-current={isCurrent ? "page" : undefined}
                    className={`flex items-start gap-2.5 rounded-xl px-3 py-2.5 text-sm transition ${
                      isCurrent ? "bg-accent/15 text-ink" : "text-muted hover:bg-surface2 hover:text-ink"
                    }`}
                  >
                    {done.has(item.id) ? (
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
                    ) : open ? (
                      <Circle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                    ) : (
                      <Lock className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                    )}
                    <span>{item.title}</span>
                  </Link>
                </li>
              );
            })}
          </ol>
        </aside>

        {/* Lesson */}
        <article className="min-w-0">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            {lesson.is_free_preview && !enrolled ? <span className="badge">{t.preview}</span> : null}
            {lesson.duration_minutes ? <span className="badge">{fmt(t.minutes, { count: lesson.duration_minutes })}</span> : null}
          </div>
          <h1 className="text-3xl font-bold">{lesson.title}</h1>
          {lesson.summary ? <p className="mt-2 text-muted">{lesson.summary}</p> : null}

          {video?.type === "iframe" ? (
            <div className="card mt-6 aspect-video overflow-hidden">
              <iframe
                src={video.src}
                title={lesson.title}
                className="h-full w-full"
                loading="lazy"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                allowFullScreen
                referrerPolicy="strict-origin-when-cross-origin"
              />
            </div>
          ) : null}
          {video?.type === "file" ? (
            <video src={video.src} controls preload="metadata" className="card mt-6 aspect-video w-full bg-black" />
          ) : null}
          {video?.type === "link" ? (
            <a href={video.src} target="_blank" rel="noopener noreferrer" className="btn-ghost mt-6">
              <ExternalLink className="h-4 w-4" aria-hidden="true" /> {t.watch}
            </a>
          ) : null}

          {html ? (
            // Safe: renderMarkdown() escapes every HTML character before formatting.
            <div className="prose-lite mt-6" dangerouslySetInnerHTML={{ __html: html }} />
          ) : !video ? (
            <p className="card mt-6 p-6 text-muted">{t.noContent}</p>
          ) : null}

          <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-line pt-6">
            <CompleteButton
              lessonId={lesson.id}
              completed={done.has(lesson.id)}
              nextHref={next && (enrolled || next.is_free_preview) ? hrefFor(next) : null}
              t={t}
            />
            <div className="flex items-center gap-2">
              {prev ? (
                <Link href={hrefFor(prev)} className="btn-ghost">
                  <ArrowLeft className="h-4 w-4" aria-hidden="true" /> {t.previous}
                </Link>
              ) : null}
              {next ? (
                <Link href={hrefFor(next)} className="btn-ghost">
                  {t.next} <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              ) : null}
            </div>
          </div>
        </article>
      </div>
    </div>
  );
}
