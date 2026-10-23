# Ascendia Tech: courses and guides platform

A courses-and-guides website with accounts, a student dashboard, Stripe payments and
three languages (English, Spanish, Brazilian Portuguese).

**Stack:** Next.js 15 (App Router) · TypeScript · Tailwind CSS · Supabase (sign-in + database) · Stripe (payments)

> **Status: written but not yet built or run.** The workspace this was created in could not
> install npm packages, so `npm run build` has never been executed. The code was type-checked
> against stand-in types and every language file was checked for matching keys, but expect to
> fix a few small things the first time you run it. Test with Stripe **test mode** first.

## What you get

| Area | Pages |
|---|---|
| Public | Home, course catalog, course page (curriculum + buy button), Help, About, Terms/Privacy/Cookies/Refunds |
| Accounts | Sign up, sign in, forgot/reset password, account page |
| Student dashboard | Greeting, stats, My courses with progress, My guides and materials, Upcoming events, Invite-a-friend link with counts, recommendations, billing |
| Learning | Lesson player (video + notes), mark complete, previous/next, free-preview lessons |
| Payments | One-time purchases, monthly/yearly subscriptions, free courses, Stripe billing portal, refunds remove access |
| Languages | `/en`, `/es`, `/pt-br`. Language is detected from the browser on first visit, remembered, and switchable in the header |

## Setup (about 30 minutes)

### 1. Install

```bash
npm install
cp .env.example .env.local
```

### 2. Supabase

1. Create a project at supabase.com.
2. **SQL Editor** → paste the whole of `supabase/schema.sql` → Run. This creates the tables, access
   rules and sample content (3 sample courses with Spanish and Portuguese text).
3. **Project Settings → API**: copy the Project URL, `anon` key and `service_role` key into `.env.local`.
   The `service_role` key is secret: server only, never in the browser, never committed.
4. **Authentication → URL Configuration**: set *Site URL* to your site, and add these *Redirect URLs*:
   `http://localhost:3000/auth/callback` and `https://YOUR-DOMAIN/auth/callback`.
5. Optional: **Authentication → Email Templates**. The sign-up form saves the person's language as
   `{{ .Data.locale }}` (`en`, `es` or `pt-br`), so you can write one template that switches language
   with `{{ if eq .Data.locale "es" }}…{{ end }}`. Until you do, Supabase sends its default English emails.

### 3. Stripe

1. Put your **test** secret key in `STRIPE_SECRET_KEY`.
2. Locally, forward webhooks: `stripe listen --forward-to localhost:3000/api/stripe/webhook`
   and copy the `whsec_…` it prints into `STRIPE_WEBHOOK_SECRET`.
3. In production: Stripe Dashboard → Developers → Webhooks → add `https://YOUR-DOMAIN/api/stripe/webhook`
   with these events: `checkout.session.completed`, `checkout.session.async_payment_succeeded`,
   `customer.subscription.updated`, `customer.subscription.deleted`, `charge.refunded`.
4. Settings → Billing → **Customer portal**: save the default configuration so "Manage billing" works.
5. Test card: `4242 4242 4242 4242`, any future date, any CVC.

### 4. Run

```bash
npm run dev      # http://localhost:3000 → redirects to /en, /es or /pt-br
npm run typecheck
npm run build
```

## Make it yours

| What | Where |
|---|---|
| Name (set to "Ascendia Tech"), support email, company details | `src/brand.ts`. Replace the placeholder email, company name and address before launch |
| Brand colours | top of `src/app/globals.css`. Already set to the Ascendia palette from ascendiaprime.com (navy `#020617`, blue `#3f8bf9`, purple `#ab57f3`); the button gradient runs blue to purple |
| Font | Poppins, loaded in `src/app/[lang]/layout.tsx` |
| Logo | `src/components/Logo.tsx` shows an icon and the name. Swap the icon for your own logo file when you have one |
| All interface text, in 3 languages | `src/i18n/dictionaries/en.ts`, `es.ts`, `pt-br.ts` |
| Legal pages | Templates in the dictionaries, marked as such. **Have a lawyer replace them before launch.** |
| Footer disclaimer ("not affiliated with…") | `disclaimer` in the dictionaries. Delete or edit as you see fit |

### Adding courses and lessons

Supabase → **Table Editor**. Set `published = true` for a course to appear.

- **courses**: `pricing_type` is `free`, `one_time` or `subscription`. `price_cents` is in cents (4900 = 49.00).
  `kind` is `course` or `guide` (guides show in "My guides and materials"). Leave `stripe_price_id` empty
  and checkout builds the price for you.
- **lessons**: `video_url` takes a YouTube or Vimeo link, or a direct .mp4. `content_md` takes simple Markdown.
  `is_free_preview = true` lets anyone with an account view that lesson without buying.
- **events**: shows in "Upcoming events" on the dashboard.

### Translating your own content

The base columns hold English. Put other languages in the `translations` column (JSON):

```json
{
  "es":    { "title": "Prompts para el trabajo", "subtitle": "…", "description": "…" },
  "pt-br": { "title": "Prompts para o trabalho", "subtitle": "…", "description": "…" }
}
```

For lessons use `title`, `summary`, `content_md` and `video_url` (handy for a video recorded in that language).
Anything missing falls back to English. See the sample rows created by `schema.sql`.

### Adding a fourth language

1. Add it to `locales` and `localeMeta` in `src/i18n/config.ts`.
2. Copy `en.ts` to a new file in `src/i18n/dictionaries/`, translate it, and register it in `src/i18n/index.ts`.
3. Add its translations to the `translations` JSON of your courses.

## How access is protected

- Every table has Row Level Security. Paid lesson content can only be read by people with an active
  enrollment (or for free-preview lessons). The public curriculum comes from a limited view that exposes titles only.
- Enrollments are written only by the server: the Stripe webhook (after the signature is verified) or free-course enrolment.
- People can edit only their own name. Stripe and referral fields are locked by column permissions.
- Redirect targets are checked to stay on this site, and lesson Markdown is HTML-escaped before display.

## Known limits

- **Not run yet** (see the note at the top).
- **Referral rewards are not automatic.** The dashboard counts people invited and people who bought; granting
  a reward (for example a free course) is up to you. Add an `enrollments` row with `source = 'admin'`.
- **No admin screen.** Content is managed in the Supabase Table Editor.
- **Sign-up with a referral** only counts when the person arrives through the referral link itself.
- **No rate limiting** on the newsletter form. Add one (or a CAPTCHA) before running ads at scale.
- Supabase's confirmation and reset emails are English until you edit the templates (step 2.5).

## Go live (Netlify)

Netlify runs Next.js 15 fully, including the sign-in middleware and the Stripe webhook. Vercel works the same
way if you prefer it: import the repository and add the same variables.

**Order matters.** Variables starting with `NEXT_PUBLIC_` are baked in when the site is built, so add all
variables *before* the first deploy, and redeploy after you change any of them.

1. **GitHub.** Put this folder in a private repository (the `.gitignore` already keeps `.env.local` out).
2. **Supabase.** Finish section 2 above. For production also set up your own email sender under
   Authentication > SMTP Settings. Supabase's built-in sender is for testing and is heavily rate-limited.
3. **Netlify.** Add new project > Import from Git > pick the repository. The build command is already in
   `netlify.toml`. Under Project configuration > Environment variables add the six values from `.env.example`.
   Paste the Stripe and Supabase secret keys there yourself; never put them in the repository.
4. **Deploy**, then note the live address. Set `NEXT_PUBLIC_SITE_URL` to it (or to your own domain, step 8) and redeploy.
   In Supabase > Authentication > URL Configuration set the Site URL to the same address and add
   `https://YOUR-ADDRESS/auth/callback` to the Redirect URLs.
5. **Stripe, test mode first.** Developers > Webhooks > add `https://YOUR-ADDRESS/api/stripe/webhook` with the five
   events listed in section 3. Copy its signing secret (`whsec_...`) into `STRIPE_WEBHOOK_SECRET` on Netlify and redeploy.
   Also save the Customer portal settings (Settings > Billing > Customer portal).
6. **Test the whole loop** with card `4242 4242 4242 4242`: sign up, buy a course, check it appears in the dashboard,
   open a lesson, then refund the payment in Stripe and check access is removed.
7. **Before taking real money:**
   - Replace the placeholders in `src/brand.ts` (support email, company name, address).
   - Have the Terms, Privacy, Cookie and Refund pages reviewed. They are templates, and selling digital content to
     consumers has rules about cancellation rights, VAT and refunds.
   - Activate your Stripe account, then switch to the **live** keys (`sk_live_...`) and create a second webhook
     endpoint in live mode. It has its own signing secret.
   - Run one small real purchase and refund it.
8. **Your own domain** (for example `learn.yourdomain.com`): Netlify > Domain management > add the domain and create
   the DNS record it shows. Then update `NEXT_PUBLIC_SITE_URL`, the Supabase Site URL and redirect URL, and the Stripe
   webhook address, and redeploy.

**If the build says a secret was found in the output:** Netlify's scanner may flag `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
That key is public by design. Add that one name to a `SECRETS_SCAN_OMIT_KEYS` variable. Never do this for
`SUPABASE_SERVICE_ROLE_KEY` or `STRIPE_SECRET_KEY`; if those ever show up in the output, stop and rotate them.
