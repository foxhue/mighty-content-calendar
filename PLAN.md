# Mighty Content Calendar — Plan

## Context

Multi-tenant content calendar for managing social media posts across Foxhue clients. Core build is complete: Next.js 16 app with vanilla JS calendar engine, Supabase backend, API routes, review workflow with email notifications. Deployed to Vercel.

This plan is the single source of truth for remaining work. New features get added to the backlog — we don't get distracted. Bugs are fixed inline. Every PR goes through 3-agent review (security, performance, quality).

---

## Active Work

### Cleanup & Hardening
- [ ] Disable Vercel deployment protection (needed for client review URLs)
- [ ] Uncomment `DROP COLUMN approved` in migration once verified
- [ ] Update CLAUDE.md if anything has drifted from reality

---

## Backlog (not now — add new items here)

- [ ] Token rotation (regenerate review link if leaked)
- [ ] Workspace admin UI (`/admin` — create/edit workspaces without raw SQL)
- [ ] Workspace picker at root `/` (replace hardcoded redirect to `/mighty`)
- [ ] "Suggest a post" field on review page (free-text → email to Foxhue)
- [ ] Product naming (replace "Mighty Content Calendar" with product brand)
- [ ] Pricing model decision (per workspace? flat monthly?)
- [ ] Review page polling (real-time updates while client is viewing)
- [ ] Usage tracking in schema (if needed for pricing)
- [ ] Custom domain (calendar.foxhue.com or other)
- [ ] Link field on calendar items (e.g. Google Sheet links — new `link` column + UI in day view + display on review page)

---

## Workflow Rules

- **One task at a time.** Complete → commit → next.
- **New feature ideas → Backlog.** We don't context-switch.
- **Bugs found during work → fix immediately**, don't defer.
- **Every PR**: 3-agent review (security-engineer, performance-engineer, quality-engineer) before merge.
- **PLAN.md stays updated** as tasks complete. Check boxes, move items, remove what's done.

---

## Verification

After each deployment:
1. `/mighty` — calendar renders, all 3 views work, CRUD works
2. `/foxhue` — different branding, different data, no bleed
3. `/review/<token>` — approve/request changes works, no editing
4. View source — no Supabase keys visible
5. Email flow — review-ready notification sends, feedback notification sends
