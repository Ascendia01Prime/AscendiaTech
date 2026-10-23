import type { Metadata } from "next";
import CourseCard from "@/components/CourseCard";
import { getDictionary } from "@/i18n";
import { toLocale } from "@/i18n/config";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getPublishedCourses } from "@/lib/data";
import { localizeCourse } from "@/lib/localize";

type Props = { params: Promise<{ lang: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: getDictionary(toLocale((await params).lang)).courses.title };
}

export default async function CoursesPage({ params }: Props) {
  const lang = toLocale((await params).lang);
  const t = getDictionary(lang).courses;

  const courses = isSupabaseConfigured()
    ? (await getPublishedCourses(await createClient())).map((course) => localizeCourse(course, lang))
    : [];

  return (
    <div className="container-page py-12">
      <h1 className="text-3xl font-bold sm:text-4xl">{t.title}</h1>
      <p className="mt-2 text-muted">{t.subtitle}</p>

      {courses.length === 0 ? (
        <p className="card mt-10 p-8 text-center text-muted">{t.empty}</p>
      ) : (
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => (
            <CourseCard key={course.id} course={course} lang={lang} />
          ))}
        </div>
      )}
    </div>
  );
}
