import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getDictionary } from "@/i18n";
import { toLocale } from "@/i18n/config";
import { createClient } from "@/lib/supabase/server";
import { getCompletedLessonIds, getCourseBySlug, getOutline } from "@/lib/data";

type Props = { params: Promise<{ lang: string; slug: string }> };

// /learn/<course> sends the person to the first lesson they have not finished yet.
export default async function LearnIndex({ params }: Props) {
  const { lang: rawLang, slug } = await params;
  const lang = toLocale(rawLang);
  const t = getDictionary(lang);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/${lang}/login?redirect=${encodeURIComponent(`/${lang}/learn/${slug}`)}`);

  const course = await getCourseBySlug(supabase, slug);
  if (!course) notFound();

  const { data: enrollment } = await supabase
    .from("enrollments")
    .select("id")
    .eq("user_id", user.id)
    .eq("course_id", course.id)
    .eq("status", "active")
    .maybeSingle();
  if (!enrollment) redirect(`/${lang}/courses/${slug}`);

  const outline = await getOutline(supabase, [course.id]);
  if (outline.length === 0) {
    return (
      <div className="container-page py-16 text-center">
        <p className="text-muted">{t.course.noLessons}</p>
        <Link href={`/${lang}/dashboard`} className="btn-ghost mt-6">
          {t.nav.dashboard}
        </Link>
      </div>
    );
  }

  const done = await getCompletedLessonIds(supabase, user.id);
  const target = outline.find((lesson) => !done.has(lesson.id)) ?? outline[0];
  redirect(`/${lang}/learn/${slug}/${target.id}`);
}
