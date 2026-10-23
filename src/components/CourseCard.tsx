import Link from "next/link";
import { Clock } from "lucide-react";
import type { Course } from "@/lib/types";
import { formatPrice } from "@/lib/utils";
import { getDictionary } from "@/i18n";
import type { Locale } from "@/i18n/config";

/** Pass a course that has already been through localizeCourse(). */
export default function CourseCard({ course, lang }: { course: Course; lang: Locale }) {
  const t = getDictionary(lang).common;

  return (
    <Link
      href={`/${lang}/courses/${course.slug}`}
      className="card group flex h-full flex-col p-6 transition hover:border-accent/60 hover:bg-surface2"
    >
      <div className="mb-4 flex items-center justify-between">
        <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-surface2 text-2xl" aria-hidden="true">
          {course.cover_emoji}
        </span>
        <span className="badge">{course.kind === "guide" ? t.guideBadge : t.courseBadge}</span>
      </div>
      <h3 className="text-lg font-semibold group-hover:text-accent">{course.title}</h3>
      {course.subtitle ? <p className="mt-1 text-sm text-muted">{course.subtitle}</p> : null}
      <div className="mt-auto flex items-center justify-between pt-6 text-sm">
        <span className="flex items-center gap-1.5 text-muted">
          <Clock className="h-4 w-4" aria-hidden="true" />
          {course.duration_label ?? t.levels[course.level]}
        </span>
        <span className="font-semibold text-accent">{formatPrice(course, lang, t)}</span>
      </div>
    </Link>
  );
}
