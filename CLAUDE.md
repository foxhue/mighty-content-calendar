# Mighty Content Calendar

Multi-tenant content calendar for managing social media posts. Built with Next.js 16 + React 19 + Supabase + Resend. Vanilla JS calendar engine wrapped in a React shell.

## Architecture

The calendar rendering is **vanilla JS** — `initCalendar()` in `lib/calendar.ts` owns the DOM. React is just a mounting shell (`CalendarClient.tsx` passes a `<div ref>` and calls `initCalendar` in a `useEffect`). This is intentional; don't refactor it into React components.

- **Server components** (`app/[slug]/page.tsx`, `app/review/[token]/page.tsx`) fetch data from Supabase and pass it as props
- **CSS is server-injected** via `<style dangerouslySetInnerHTML>` using `getCalendarCSS()` to avoid FOUC
- **API routes** proxy all Supabase calls with `workspace_id` scoping — the client never talks to Supabase directly

## Key Files

```
lib/calendar.ts        — Vanilla JS calendar engine (initCalendar, esc(), rendering)
lib/calendar-styles.ts — CSS generation per workspace theme
lib/types.ts           — WorkspaceConfig, CalendarItem, row types, converters
lib/supabase-server.ts — Server-side Supabase client (service role key)
lib/email.ts           — Resend email helpers (review-ready, feedback)

app/[slug]/page.tsx          — Server component: loads workspace + items
app/[slug]/CalendarClient.tsx — Client component: mounts initCalendar()
app/review/[token]/page.tsx  — Client review page (token-based access)
app/review/[token]/ReviewClient.tsx — Review UI

app/api/calendar/route.ts        — GET/POST/DELETE calendar items
app/api/calendar/notify/route.ts  — Send review-ready email
app/api/review/route.ts           — Approve/request changes

supabase/migration.sql — Full schema + seed data
```

## Next.js 16 Warning

`params` is a Promise in Next.js 16 — must be awaited:
```tsx
export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
```
Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

## Environment Variables

Required in `.env.local`:
```
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=...
RESEND_API_KEY=...
NOTIFICATION_EMAIL=hello@foxhue.com
```

## Commands

```bash
npm run dev    # Start dev server
npm run build  # Production build
npm run lint   # ESLint
```

## Supabase Schema

Two tables, both with RLS enabled and no permissive policies (service role key bypasses RLS):

**workspaces** — `id` (UUID PK), `slug` (unique), `name`, `logo_mark`, `owners` (JSONB), `platforms` (JSONB), `content_types` (JSONB), `type_colors` (JSONB), `theme` (JSONB), `review_token` (unique), `client_email`, `created_at`

**calendar_approvals** — `id` (text PK, format `YYYY-MM-DD-slot`), `workspace_id` (FK → workspaces), `month`, `owner`, `day`, `week`, `date`, `slot`, `type`, `title`, `caption`, `status` (draft|pending_review|approved|changes_requested), `review_comment`, `platforms` (JSONB), `created_at`, `updated_at`

Migration file: `supabase/migration.sql`

## Multi-Tenancy

- **Slug-based routing**: `/<slug>` loads that workspace's calendar
- **workspace_id scoping**: Every Supabase query filters by `workspace_id` — never omit this
- **Review tokens**: Clients access `/review/<token>` — token-based, no auth needed. Never expose workspace slugs to clients.
- Root `/` currently redirects to `/mighty`

## Pre-Commit Workflow

Before committing and pushing, ALWAYS:
1. Spin up Playwright browser agent to visually test the calendar
2. Run 3 parallel review agents — security-engineer, performance-engineer, quality-engineer
3. Fix all issues before commit/push

Never skip these steps.

## Conventions

- **Path alias**: `@/*` maps to project root
- **HTML escaping**: Use `esc()` in `lib/calendar.ts` for all user content injected into DOM
- **Field allowlisting**: POST routes explicitly allowlist fields — never spread request body
- **Deterministic IDs**: Calendar item IDs follow `YYYY-MM-DD-slot` format
- **Snake_case ↔ camelCase**: DB uses snake_case, TypeScript uses camelCase. Use `rowToCalendarItem()` / `rowToWorkspaceConfig()` converters.
