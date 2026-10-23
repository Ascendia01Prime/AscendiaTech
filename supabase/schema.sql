-- =====================================================================
-- Ascendia Tech: database schema, access rules (RLS) and sample data
-- Run this whole file once in Supabase -> SQL Editor.
--
-- Languages: the base columns (title, description, content_md...) hold English.
-- Spanish and Brazilian Portuguese go in the "translations" column, like:
--   { "es": { "title": "..." }, "pt-br": { "title": "..." } }
-- Anything missing in a translation falls back to the English value.
-- =====================================================================

create extension if not exists "pgcrypto";

-- ---------- Tables ----------------------------------------------------

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  stripe_customer_id text,
  referral_code text unique default substr(replace(gen_random_uuid()::text, '-', ''), 1, 8),
  referred_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  subtitle text,
  description text,
  level text not null default 'beginner' check (level in ('beginner', 'intermediate', 'advanced')),
  duration_label text,
  cover_emoji text not null default '🎓',
  kind text not null default 'course' check (kind in ('course', 'guide')),
  pricing_type text not null default 'one_time' check (pricing_type in ('free', 'one_time', 'subscription')),
  price_cents integer check (price_cents is null or price_cents >= 0),
  currency text not null default 'usd',
  billing_interval text check (billing_interval is null or billing_interval in ('month', 'year')),
  -- Optional: paste an existing Stripe Price ID. If empty, checkout builds the price from the fields above.
  stripe_price_id text,
  published boolean not null default false,
  sort_order integer not null default 0,
  translations jsonb not null default '{}'::jsonb,   -- title, subtitle, description, duration_label per language
  created_at timestamptz not null default now()
);

create table if not exists public.lessons (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  position integer not null,
  title text not null,
  summary text,
  video_url text,          -- YouTube, Vimeo or a direct .mp4/.webm link
  content_md text,         -- lesson notes in simple Markdown
  is_free_preview boolean not null default false,
  duration_minutes integer,
  translations jsonb not null default '{}'::jsonb,   -- title, summary, video_url, content_md per language
  unique (course_id, position)
);

-- One row = one person has access to one course.
create table if not exists public.enrollments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  source text not null default 'purchase' check (source in ('purchase', 'subscription', 'free', 'admin')),
  status text not null default 'active' check (status in ('active', 'canceled', 'refunded')),
  stripe_session_id text,
  stripe_subscription_id text,
  stripe_payment_intent_id text,
  created_at timestamptz not null default now(),
  unique (user_id, course_id)
);

create table if not exists public.lesson_progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  completed_at timestamptz not null default now(),
  primary key (user_id, lesson_id)
);

-- Live sessions, webinars, deadlines. Shown in "Upcoming events" on the dashboard.
create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  starts_at timestamptz not null,
  join_url text,
  published boolean not null default true,
  translations jsonb not null default '{}'::jsonb,   -- title, description per language
  created_at timestamptz not null default now()
);

create table if not exists public.newsletter_subscribers (
  email text primary key,
  created_at timestamptz not null default now()
);

create index if not exists lessons_course_idx on public.lessons(course_id, position);
create index if not exists enrollments_user_idx on public.enrollments(user_id);
create index if not exists enrollments_sub_idx on public.enrollments(stripe_subscription_id);
create index if not exists enrollments_pi_idx on public.enrollments(stripe_payment_intent_id);
create index if not exists profiles_referred_idx on public.profiles(referred_by);
create index if not exists events_start_idx on public.events(starts_at);

-- ---------- Public outline view ---------------------------------------
-- Lets visitors see lesson titles of a published course (the curriculum)
-- without exposing video links or lesson content, in any language.
-- Views run with the owner's rights, so they bypass the lessons table's
-- row rules on purpose; they only ever expose the columns listed here.
create or replace view public.lesson_outline as
  select
    l.id, l.course_id, l.position, l.title, l.summary, l.duration_minutes, l.is_free_preview,
    (
      select coalesce(jsonb_object_agg(t.k, jsonb_build_object('title', t.v -> 'title', 'summary', t.v -> 'summary')), '{}'::jsonb)
      from jsonb_each(l.translations) as t(k, v)
    ) as translations
  from public.lessons l
  join public.courses c on c.id = l.course_id
  where c.published;

grant select on public.lesson_outline to anon, authenticated;

-- ---------- Create a profile automatically on sign-up -------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  referrer uuid;
begin
  -- The sign-up form passes ?ref=CODE along as user metadata.
  select p.id into referrer
  from public.profiles p
  where p.referral_code = new.raw_user_meta_data ->> 'referral_code';

  insert into public.profiles (id, email, full_name, referred_by)
  values (new.id, new.email, coalesce(new.raw_user_meta_data ->> 'full_name', ''), referrer)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- Referral numbers for the dashboard --------------------------
create or replace function public.referral_stats()
returns table (invited bigint, purchased bigint)
language sql
stable
security definer
set search_path = public
as $$
  select
    count(*) as invited,
    count(*) filter (
      where exists (
        select 1 from public.enrollments e
        where e.user_id = p.id
          and e.status = 'active'
          and e.source in ('purchase', 'subscription')
      )
    ) as purchased
  from public.profiles p
  where p.referred_by = auth.uid();
$$;

revoke all on function public.referral_stats() from public;
grant execute on function public.referral_stats() to authenticated;

-- ---------- Row Level Security ------------------------------------------
alter table public.profiles enable row level security;
alter table public.courses enable row level security;
alter table public.lessons enable row level security;
alter table public.enrollments enable row level security;
alter table public.lesson_progress enable row level security;
alter table public.events enable row level security;
alter table public.newsletter_subscribers enable row level security;

-- Profiles: a person can read only their own row, and change only their own NAME.
-- (Column-level grant below: nobody can edit their own Stripe customer id or referral links.)
drop policy if exists "profiles read own" on public.profiles;
create policy "profiles read own" on public.profiles
  for select using (id = auth.uid());

drop policy if exists "profiles update own" on public.profiles;
create policy "profiles update own" on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

revoke update on public.profiles from anon, authenticated;
grant update (full_name) on public.profiles to authenticated;

-- Courses: anyone can see published courses.
drop policy if exists "courses read published" on public.courses;
create policy "courses read published" on public.courses
  for select using (published);

-- Lessons: full content only for free previews or people with active access.
drop policy if exists "lessons read if allowed" on public.lessons;
create policy "lessons read if allowed" on public.lessons
  for select using (
    exists (select 1 from public.courses c where c.id = lessons.course_id and c.published)
    and (
      is_free_preview
      or exists (
        select 1 from public.enrollments e
        where e.course_id = lessons.course_id
          and e.user_id = auth.uid()
          and e.status = 'active'
      )
    )
  );

-- Enrollments: read your own. Rows are only ever written by the server
-- (Stripe webhook / free enrolment) using the service-role key.
drop policy if exists "enrollments read own" on public.enrollments;
create policy "enrollments read own" on public.enrollments
  for select using (user_id = auth.uid());

-- Progress: manage your own, and only for lessons you are allowed to see.
drop policy if exists "progress read own" on public.lesson_progress;
create policy "progress read own" on public.lesson_progress
  for select using (user_id = auth.uid());

drop policy if exists "progress insert own" on public.lesson_progress;
create policy "progress insert own" on public.lesson_progress
  for insert with check (
    user_id = auth.uid()
    and exists (select 1 from public.lessons l where l.id = lesson_id)
  );

drop policy if exists "progress delete own" on public.lesson_progress;
create policy "progress delete own" on public.lesson_progress
  for delete using (user_id = auth.uid());

-- Events: anyone can see published events.
drop policy if exists "events read published" on public.events;
create policy "events read published" on public.events
  for select using (published);

-- Newsletter: anyone can subscribe; nobody can read the list from the browser.
drop policy if exists "newsletter insert" on public.newsletter_subscribers;
create policy "newsletter insert" on public.newsletter_subscribers
  for insert with check (true);

-- ---------- Sample content (replace with your own) ----------------------
-- Safe to re-run: skipped if the slug already exists.

insert into public.courses
  (slug, title, subtitle, description, level, duration_label, cover_emoji, kind, pricing_type, price_cents, billing_interval, published, sort_order)
values
  ('ai-assistant-quickstart',
   'AI Assistant Quickstart',
   'Your first productive day with an AI assistant',
   'A short, free guide that gets you from zero to your first useful result: how to ask clearly, how to iterate, and how to check the answer. Sample content, replace it with your own.',
   'beginner', '45 min', '🚀', 'guide', 'free', null, null, true, 1),
  ('prompting-for-work',
   'Prompting for Work',
   'Write prompts that save hours every week',
   'A practical course on structuring requests, giving context, using examples and building reusable prompt templates for everyday work. Sample content, replace it with your own.',
   'beginner', '3 hours', '✍️', 'course', 'one_time', 4900, null, true, 2),
  ('automation-lab',
   'Automation Lab',
   'Monthly membership: workflows and templates',
   'Build real automations step by step. New workflows and templates every month. Sample content, replace it with your own.',
   'intermediate', 'New lessons monthly', '⚙️', 'course', 'subscription', 1900, 'month', true, 3)
on conflict (slug) do nothing;

insert into public.lessons (course_id, position, title, summary, video_url, content_md, is_free_preview, duration_minutes)
select c.id, v.position, v.title, v.summary, null, v.content_md, v.is_free_preview, v.duration_minutes
from public.courses c
join (values
  ('ai-assistant-quickstart', 1, 'Welcome and how this guide works', 'What you will build in the next 45 minutes.',
   E'# Welcome\n\nThis is **sample lesson content**. Replace it with your own text, links and video.\n\n- Short lessons you can finish in one sitting\n- A small exercise at the end of each one\n\nUse the button below when you finish a lesson to track your progress.', true, 5),
  ('ai-assistant-quickstart', 2, 'Ask clearly: the four-part request', 'Goal, context, format, constraints.',
   E'# The four-part request\n\n1. **Goal**: what you want\n2. **Context**: what the assistant needs to know\n3. **Format**: how you want the answer\n4. **Constraints**: length, tone, things to avoid\n\n> Sample content. Add your own examples here.', true, 12),
  ('ai-assistant-quickstart', 3, 'Iterate and verify', 'Improve the first answer and check it.',
   E'# Iterate and verify\n\nTreat the first answer as a draft. Ask for changes, then check facts and numbers yourself.\n\n`Sample content: replace me.`', true, 15),

  ('prompting-for-work', 1, 'Why structure beats cleverness', 'The mindset behind reliable prompts.',
   E'# Structure beats cleverness\n\nSample lesson. A free preview so visitors can see what the course feels like.', true, 10),
  ('prompting-for-work', 2, 'Giving context and examples', 'Show, do not just tell.',
   E'# Context and examples\n\nSample paid lesson content. Only visible to people who bought the course.', false, 25),
  ('prompting-for-work', 3, 'Reusable prompt templates', 'Build a small library you use every day.',
   E'# Reusable templates\n\nSample paid lesson content.', false, 30),
  ('prompting-for-work', 4, 'Checking and improving results', 'A simple review routine.',
   E'# Review routine\n\nSample paid lesson content.', false, 20),

  ('automation-lab', 1, 'Welcome to the Lab', 'How the membership works.',
   E'# Welcome to the Lab\n\nSample lesson. Free preview.', true, 8),
  ('automation-lab', 2, 'Your first automated workflow', 'Trigger, steps, result.',
   E'# First workflow\n\nSample members-only content.', false, 35),
  ('automation-lab', 3, 'Connecting your tools', 'Email, spreadsheets and chat.',
   E'# Connecting tools\n\nSample members-only content.', false, 40)
) as v(slug, position, title, summary, content_md, is_free_preview, duration_minutes)
  on v.slug = c.slug
on conflict (course_id, position) do nothing;

-- ---------- Sample translations (Spanish and Brazilian Portuguese) -----
update public.courses set translations = jsonb_build_object(
  'es', jsonb_build_object(
    'title', 'Inicio rápido con un asistente de IA',
    'subtitle', 'Tu primer día productivo con un asistente de IA',
    'description', 'Una guía breve y gratuita que te lleva de cero a tu primer resultado útil: cómo pedir con claridad, cómo iterar y cómo comprobar la respuesta. Contenido de ejemplo, sustitúyelo por el tuyo.',
    'duration_label', '45 min'),
  'pt-br', jsonb_build_object(
    'title', 'Início rápido com um assistente de IA',
    'subtitle', 'Seu primeiro dia produtivo com um assistente de IA',
    'description', 'Um guia curto e gratuito que leva você do zero ao primeiro resultado útil: como pedir com clareza, como refinar e como conferir a resposta. Conteúdo de exemplo, substitua pelo seu.',
    'duration_label', '45 min')
) where slug = 'ai-assistant-quickstart';

update public.courses set translations = jsonb_build_object(
  'es', jsonb_build_object(
    'title', 'Prompts para el trabajo',
    'subtitle', 'Escribe prompts que te ahorren horas cada semana',
    'description', 'Un curso práctico sobre cómo estructurar peticiones, dar contexto, usar ejemplos y crear plantillas de prompts reutilizables para el trabajo diario. Contenido de ejemplo, sustitúyelo por el tuyo.',
    'duration_label', '3 horas'),
  'pt-br', jsonb_build_object(
    'title', 'Prompts para o trabalho',
    'subtitle', 'Escreva prompts que economizam horas toda semana',
    'description', 'Um curso prático sobre como estruturar pedidos, dar contexto, usar exemplos e criar modelos de prompts reutilizáveis para o dia a dia. Conteúdo de exemplo, substitua pelo seu.',
    'duration_label', '3 horas')
) where slug = 'prompting-for-work';

update public.courses set translations = jsonb_build_object(
  'es', jsonb_build_object(
    'title', 'Laboratorio de automatización',
    'subtitle', 'Membresía mensual: flujos de trabajo y plantillas',
    'description', 'Crea automatizaciones reales paso a paso. Nuevos flujos y plantillas cada mes. Contenido de ejemplo, sustitúyelo por el tuyo.',
    'duration_label', 'Lecciones nuevas cada mes'),
  'pt-br', jsonb_build_object(
    'title', 'Laboratório de Automação',
    'subtitle', 'Assinatura mensal: fluxos de trabalho e modelos',
    'description', 'Crie automações reais passo a passo. Novos fluxos e modelos todo mês. Conteúdo de exemplo, substitua pelo seu.',
    'duration_label', 'Aulas novas todo mês')
) where slug = 'automation-lab';

update public.lessons l set translations = jsonb_build_object(
  'es', jsonb_build_object('title', v.es_title, 'summary', v.es_summary, 'content_md', v.es_md),
  'pt-br', jsonb_build_object('title', v.pt_title, 'summary', v.pt_summary, 'content_md', v.pt_md)
)
from (values
  ('ai-assistant-quickstart', 1,
   'Bienvenida y cómo funciona esta guía', 'Lo que lograrás en los próximos 45 minutos.',
   E'# Bienvenida\n\nEste es un **contenido de ejemplo**. Sustitúyelo por tu propio texto, enlaces y vídeo.\n\n- Lecciones cortas que terminas de una sentada\n- Un pequeño ejercicio al final de cada una\n\nUsa el botón de abajo al terminar cada lección para seguir tu progreso.',
   'Boas-vindas e como este guia funciona', 'O que você vai conseguir nos próximos 45 minutos.',
   E'# Boas-vindas\n\nEste é um **conteúdo de exemplo**. Substitua pelo seu próprio texto, links e vídeo.\n\n- Aulas curtas que você conclui de uma vez\n- Um pequeno exercício no fim de cada uma\n\nUse o botão abaixo ao terminar cada aula para acompanhar seu progresso.'),
  ('ai-assistant-quickstart', 2,
   'Pide con claridad: la petición en cuatro partes', 'Objetivo, contexto, formato y límites.',
   E'# La petición en cuatro partes\n\n1. **Objetivo**: lo que quieres\n2. **Contexto**: lo que el asistente necesita saber\n3. **Formato**: cómo quieres la respuesta\n4. **Límites**: extensión, tono y lo que debe evitar\n\n> Contenido de ejemplo. Añade aquí tus propios ejemplos.',
   'Peça com clareza: o pedido em quatro partes', 'Objetivo, contexto, formato e limites.',
   E'# O pedido em quatro partes\n\n1. **Objetivo**: o que você quer\n2. **Contexto**: o que o assistente precisa saber\n3. **Formato**: como você quer a resposta\n4. **Limites**: tamanho, tom e o que deve evitar\n\n> Conteúdo de exemplo. Adicione aqui seus próprios exemplos.'),
  ('ai-assistant-quickstart', 3,
   'Itera y verifica', 'Mejora la primera respuesta y compruébala.',
   E'# Itera y verifica\n\nTrata la primera respuesta como un borrador. Pide cambios y comprueba tú mismo los datos y las cifras.\n\n`Contenido de ejemplo: sustitúyeme.`',
   'Refine e confira', 'Melhore a primeira resposta e confira.',
   E'# Refine e confira\n\nTrate a primeira resposta como um rascunho. Peça ajustes e confira você mesmo os fatos e os números.\n\n`Conteúdo de exemplo: substitua-me.`'),

  ('prompting-for-work', 1,
   'Por qué la estructura vence a la astucia', 'La mentalidad detrás de prompts fiables.',
   E'# La estructura vence a la astucia\n\nLección de ejemplo. Una vista previa gratuita para que los visitantes vean cómo es el curso.',
   'Por que estrutura vence esperteza', 'A mentalidade por trás de prompts confiáveis.',
   E'# Estrutura vence esperteza\n\nAula de exemplo. Uma prévia gratuita para os visitantes conhecerem o curso.'),
  ('prompting-for-work', 2,
   'Dar contexto y ejemplos', 'Muestra, no solo cuentes.',
   E'# Contexto y ejemplos\n\nContenido de ejemplo de pago. Solo lo ven quienes compraron el curso.',
   'Dar contexto e exemplos', 'Mostre, não apenas conte.',
   E'# Contexto e exemplos\n\nConteúdo de exemplo pago. Só quem comprou o curso vê.'),
  ('prompting-for-work', 3,
   'Plantillas de prompts reutilizables', 'Crea una pequeña biblioteca que uses a diario.',
   E'# Plantillas reutilizables\n\nContenido de ejemplo de pago.',
   'Modelos de prompts reutilizáveis', 'Monte uma pequena biblioteca para usar todo dia.',
   E'# Modelos reutilizáveis\n\nConteúdo de exemplo pago.'),
  ('prompting-for-work', 4,
   'Comprobar y mejorar resultados', 'Una rutina de revisión sencilla.',
   E'# Rutina de revisión\n\nContenido de ejemplo de pago.',
   'Conferir e melhorar resultados', 'Uma rotina de revisão simples.',
   E'# Rotina de revisão\n\nConteúdo de exemplo pago.'),

  ('automation-lab', 1,
   'Bienvenido al Laboratorio', 'Cómo funciona la membresía.',
   E'# Bienvenido al Laboratorio\n\nLección de ejemplo. Vista previa gratuita.',
   'Bem-vindo ao Laboratório', 'Como funciona a assinatura.',
   E'# Bem-vindo ao Laboratório\n\nAula de exemplo. Prévia grátis.'),
  ('automation-lab', 2,
   'Tu primer flujo automatizado', 'Disparador, pasos y resultado.',
   E'# Primer flujo\n\nContenido de ejemplo solo para miembros.',
   'Seu primeiro fluxo automatizado', 'Gatilho, etapas e resultado.',
   E'# Primeiro fluxo\n\nConteúdo de exemplo só para assinantes.'),
  ('automation-lab', 3,
   'Conecta tus herramientas', 'Correo, hojas de cálculo y chat.',
   E'# Conectar herramientas\n\nContenido de ejemplo solo para miembros.',
   'Conecte suas ferramentas', 'E-mail, planilhas e chat.',
   E'# Conectar ferramentas\n\nConteúdo de exemplo só para assinantes.')
) as v(slug, position, es_title, es_summary, es_md, pt_title, pt_summary, pt_md)
join public.courses c on c.slug = v.slug
where l.course_id = c.id and l.position = v.position;
