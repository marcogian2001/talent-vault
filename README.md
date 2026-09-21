# Talent Vault

Talent Vault is the private job board for A.N. Sushi Academy: a curated marketplace of elite
hospitality opportunities (private residencies, yachts, expedition cruises, luxury resorts and
fine dining) for students to browse and apply to, with a full admin back office to manage
opportunities and applications.

## Stack

- [Next.js 16](https://nextjs.org) (App Router) + React 19 + TypeScript
- [Tailwind CSS v4](https://tailwindcss.com) + [shadcn/ui](https://ui.shadcn.com)
- [Drizzle ORM](https://orm.drizzle.team) + [Neon Postgres](https://neon.tech)
- [better-auth](https://better-auth.com) for authentication (email + password)
- [Resend](https://resend.com) for transactional email (admin invites)

## Roles

- **Student / chef** (default role on sign-up): registers, then must complete the qualification
  questionnaire at `/onboarding` — certificates and documents to upload, languages, experience,
  availability. Until every *required* question is answered, `/opportunities` and
  `/applications` redirect back to it. Once it is complete the application waits for an admin at
  `/review` ("under review"). After approval they can browse, apply or send counter-proposals, and
  edit their answers at any time from `/profile`. If an admin rejects the application, the chef sees
  the reason (and the questions flagged for correction) on `/profile`, fixes the answers and
  documents there and sends the application for review again.
- **Admin**: manages opportunities (create/edit/delete) and applications (review, change status)
  from `/admin`, configures the questionnaire at `/admin/onboarding` (question text in English and
  Italian, answer type, required or skippable, order) and reviews chef submissions and documents
  at `/admin/chefs`, where each chef can be approved or rejected with a note. The chef gets an email
  with the outcome (needs the Resend variables in `.env.local`; the decision is saved either way).

Questions, help texts and choice options each have an optional Italian wording: chefs who switch
the app to IT see it, and anything left untranslated falls back to the English text. The stored
answer is always the option's `value` slug, so translating a label never invalidates an answer
already given. The admin panel itself stays in English.
- **Super admin**: an admin who can additionally invite new admins from `/admin/team`. The first
  super admin(s) are bootstrapped via the `SUPER_ADMIN_EMAILS` env var — see setup below.

## Setup

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Create a Neon database** at [neon.tech](https://neon.tech) and copy its connection string.

3. **Configure environment variables** — copy `.env.example` to `.env.local` and fill it in:

   ```bash
   cp .env.example .env.local
   ```

   | Variable | Description |
   |---|---|
   | `DATABASE_URL` | Neon Postgres connection string |
   | `BETTER_AUTH_URL` | Public URL of the app (e.g. `http://localhost:3000` in dev) |
   | `BETTER_AUTH_SECRET` | Random secret — generate with `openssl rand -base64 32` |
   | `SUPER_ADMIN_EMAILS` | Comma-separated emails to auto-promote to super admin |
   | `BLOB_READ_WRITE_TOKEN` | [Vercel Blob](https://vercel.com/docs/vercel-blob) token, used for opportunity images **and** the documents chefs upload during onboarding — create a Blob store in your Vercel project, then `vercel env pull .env.local` |
   | `RESEND_API_KEY` | API key from [resend.com](https://resend.com), used to send admin-invite emails |
   | `RESEND_FROM_EMAIL` | Sender address — must be on a domain verified in your Resend dashboard |

4. **Apply the database schema**

   ```bash
   npm run db:migrate
   ```

5. **Seed the opportunities data** (parses `rules/opportunites.txt` into the `opportunities` table)

   ```bash
   npm run db:seed
   ```

6. **Seed the chef questionnaire** (15 default questions — idempotent, never overwrites edits
   made from `/admin/onboarding`)

   ```bash
   npm run db:seed:onboarding
   ```

7. **Become the first super admin**: make sure your email is listed in `SUPER_ADMIN_EMAILS`,
   then start the app and register a normal account (`/register`) with that exact email — it will
   automatically be promoted to admin + super admin.

8. **Run the dev server**

   ```bash
   npm run dev
   ```

## Database workflow

Schema changes go through versioned migrations rather than `drizzle-kit push`, since the app now
holds real user data:

```bash
npm run db:generate   # generate a new migration from src/db/schema.ts
npm run db:migrate     # apply pending migrations to DATABASE_URL
npm run db:studio      # browse the database
```

`npm run db:push` still exists for quick local prototyping, but should not be used once real user
data exists in an environment — prefer generate + migrate.

## Deployment (Vercel)

1. Push this repository to GitHub and import it into [Vercel](https://vercel.com).
2. Add all the environment variables listed above in the Vercel project settings (use your
   production Neon connection string and your production domain for `BETTER_AUTH_URL`).
3. Run `npm run db:migrate` against the production `DATABASE_URL` before (or right after) the
   first deploy — Vercel's build step does not run migrations automatically.
4. Verify your sending domain in the Resend dashboard so `RESEND_FROM_EMAIL` can actually deliver
   admin-invite emails in production.
5. Deploy. Register with an email from `SUPER_ADMIN_EMAILS` to bootstrap the first super admin in
   production, as in step 7 above.

## Project structure

- `src/db/schema.ts` — Drizzle schema (better-auth tables, onboarding questions/answers/files,
  admin invites, opportunities, applications).
- `src/lib/onboarding*.ts` — the questionnaire: shared types, zod validation built from the
  stored question rows, the derived "onboarding complete" check used by every chef-facing gate,
  and the upload contract.
- `src/lib/auth.ts` / `src/lib/auth-client.ts` — better-auth server/client configuration.
- `src/proxy.ts` — edge-level session gate (Next.js 16's `middleware.ts` equivalent).
- `src/app/page.tsx`, `src/app/login`, `src/app/register`, `src/app/accept-invite/[token]` —
  public pages (landing, sign in, sign up, admin-invite acceptance).
- `src/app/onboarding` — the mandatory chef qualification questionnaire, driven by the questions
  the admin configured; `src/app/profile` — the same answers, editable later (and where a rejected
  chef fixes them); `src/app/review` — the "under review" screen. `src/lib/chef-review.ts` holds the
  review decisions; a chef's stage (`incomplete`, `pending`, `approved`, `rejected`) is derived, and a
  chef with a finished questionnaire and no review row is simply pending.
- `src/app/opportunities`, `src/app/applications` — chef-facing browsing and application
  tracking (both gated on a complete questionnaire).
- `src/app/admin` — admin dashboard, opportunities CRUD, applications review, questionnaire
  builder (`/admin/onboarding`), chef submissions (`/admin/chefs`), team/invites (super admin
  only).
- `src/app/api/onboarding/files` — client-upload token issuer and the authenticated download
  proxy for chef documents (blob URLs are never exposed).
