export type PricingType = "free" | "one_time" | "subscription";

/** Per-language overrides stored in the database, keyed by locale: { "es": {...}, "pt-br": {...} } */
export type Translations<T> = Record<string, Partial<T>>;

export interface Course {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  level: "beginner" | "intermediate" | "advanced";
  duration_label: string | null;
  cover_emoji: string;
  kind: "course" | "guide";
  pricing_type: PricingType;
  price_cents: number | null;
  currency: string;
  billing_interval: "month" | "year" | null;
  stripe_price_id: string | null;
  published: boolean;
  sort_order: number;
  translations: Translations<Pick<Course, "title" | "subtitle" | "description" | "duration_label">> | null;
}

export interface LessonOutline {
  id: string;
  course_id: string;
  position: number;
  title: string;
  summary: string | null;
  duration_minutes: number | null;
  is_free_preview: boolean;
  translations: Translations<Pick<LessonOutline, "title" | "summary">> | null;
}

export interface Lesson {
  id: string;
  course_id: string;
  position: number;
  title: string;
  summary: string | null;
  duration_minutes: number | null;
  is_free_preview: boolean;
  video_url: string | null;
  content_md: string | null;
  translations: Translations<Pick<Lesson, "title" | "summary" | "video_url" | "content_md">> | null;
}

export interface Enrollment {
  id: string;
  user_id: string;
  course_id: string;
  source: "purchase" | "subscription" | "free" | "admin";
  status: "active" | "canceled" | "refunded";
}

export interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  stripe_customer_id: string | null;
  referral_code: string | null;
}

export interface EventItem {
  id: string;
  title: string;
  description: string | null;
  starts_at: string;
  join_url: string | null;
  translations: Translations<Pick<EventItem, "title" | "description">> | null;
}
