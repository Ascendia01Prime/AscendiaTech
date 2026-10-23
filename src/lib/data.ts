import type { SupabaseClient } from "@supabase/supabase-js";
import type { Course, Enrollment, EventItem, LessonOutline } from "./types";

export async function getPublishedCourses(supabase: SupabaseClient, limit?: number): Promise<Course[]> {
  let query = supabase.from("courses").select("*").eq("published", true).order("sort_order", { ascending: true });
  if (limit) query = query.limit(limit);
  const { data } = await query;
  return (data ?? []) as Course[];
}

export async function getCourseBySlug(supabase: SupabaseClient, slug: string): Promise<Course | null> {
  const { data } = await supabase.from("courses").select("*").eq("slug", slug).eq("published", true).maybeSingle();
  return (data as Course | null) ?? null;
}

export async function getOutline(supabase: SupabaseClient, courseIds: string[]): Promise<LessonOutline[]> {
  if (courseIds.length === 0) return [];
  const { data } = await supabase
    .from("lesson_outline")
    .select("*")
    .in("course_id", courseIds)
    .order("position", { ascending: true });
  return (data ?? []) as LessonOutline[];
}

export async function getActiveEnrollments(supabase: SupabaseClient, userId: string): Promise<Enrollment[]> {
  const { data } = await supabase.from("enrollments").select("*").eq("user_id", userId).eq("status", "active");
  return (data ?? []) as Enrollment[];
}

export async function getCompletedLessonIds(supabase: SupabaseClient, userId: string): Promise<Set<string>> {
  const { data } = await supabase.from("lesson_progress").select("lesson_id").eq("user_id", userId);
  return new Set((data ?? []).map((row: { lesson_id: string }) => row.lesson_id));
}

export async function getUpcomingEvents(supabase: SupabaseClient, limit = 5): Promise<EventItem[]> {
  const { data } = await supabase
    .from("events")
    .select("*")
    .eq("published", true)
    .gte("starts_at", new Date().toISOString())
    .order("starts_at", { ascending: true })
    .limit(limit);
  return (data ?? []) as EventItem[];
}

export async function getReferralStats(supabase: SupabaseClient): Promise<{ invited: number; purchased: number }> {
  const { data } = await supabase.rpc("referral_stats");
  const row = (Array.isArray(data) ? data[0] : data) as { invited?: number | string; purchased?: number | string } | null;
  return { invited: Number(row?.invited ?? 0), purchased: Number(row?.purchased ?? 0) };
}
