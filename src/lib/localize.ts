import type { Locale } from "@/i18n/config";
import type { Course, EventItem, Lesson, LessonOutline } from "./types";

// Content (course titles, lesson text...) lives in the database. The base columns hold the
// default language (English). Other languages are stored in the "translations" column and
// override the base value when present and not empty.

function pick<T extends object, K extends keyof T>(base: T, overrides: Partial<T> | undefined, key: K): T[K] {
  const value = overrides?.[key];
  if (value === undefined || value === null || value === "") return base[key];
  return value as T[K];
}

export function localizeCourse(course: Course, lang: Locale): Course {
  const o = course.translations?.[lang];
  if (!o) return course;
  return {
    ...course,
    title: pick(course, o, "title"),
    subtitle: pick(course, o, "subtitle"),
    description: pick(course, o, "description"),
    duration_label: pick(course, o, "duration_label"),
  };
}

export function localizeOutline(lesson: LessonOutline, lang: Locale): LessonOutline {
  const o = lesson.translations?.[lang];
  if (!o) return lesson;
  return { ...lesson, title: pick(lesson, o, "title"), summary: pick(lesson, o, "summary") };
}

export function localizeLesson(lesson: Lesson, lang: Locale): Lesson {
  const o = lesson.translations?.[lang];
  if (!o) return lesson;
  return {
    ...lesson,
    title: pick(lesson, o, "title"),
    summary: pick(lesson, o, "summary"),
    video_url: pick(lesson, o, "video_url"),
    content_md: pick(lesson, o, "content_md"),
  };
}

export function localizeEvent(event: EventItem, lang: Locale): EventItem {
  const o = event.translations?.[lang];
  if (!o) return event;
  return { ...event, title: pick(event, o, "title"), description: pick(event, o, "description") };
}
