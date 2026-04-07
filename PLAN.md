# Content Calendar — Plan

## Context

Multi-tenant content calendar for agencies managing social media posts on behalf of clients. Built with Next.js 16 + Supabase + Resend. Deployed to Vercel. PRD: `PRD-ContentCalendar.docx`.

Core architecture complete. Now aligning the product with the PRD and making it usable for real client work.

---

## Active: PRD Alignment & Usability

### 1. Link field on calendar items
- [ ] Add `link` TEXT column to calendar_approvals (run in Supabase SQL editor)
- [ ] Update types, API route allowlist, calendar day view input, review page display
- **Why**: Posts reference Google Sheets — links currently go to WhatsApp

### 2. Status model alignment (PRD section 4.1)
- [ ] Add SCHEDULED and LIVE statuses to match PRD lifecycle: DRAFT → NEEDS SIGN-OFF → APPROVED → SCHEDULED → LIVE
- [ ] Rename `pending_review` → `needs_signoff` (or map display labels)
- [ ] Add "Mark as Live" action in day view
- [ ] Lock approved posts from further edits (PRD: "Post is locked from further edits")
- **Why**: PRD defines 5 statuses, code only has 4. No way to mark posts as published.

### 3. End-to-end post creation test
- [ ] Verify: click empty day in month view → day view → create post → edit title/type/caption → save
- [ ] Verify: new post appears in month view with correct status circle
- [ ] Fix any bugs found in the create-from-empty-day flow

---

## Backlog: Product Readiness

- [ ] Workspace admin UI (`/admin` — create/edit workspaces, regenerate review token)
- [ ] Product naming & branding (client-facing review page needs a real name)
- [ ] Custom domain

## Backlog: Future

- [ ] Workspace picker at root `/`
- [ ] "Suggest a post" on review page (free-text → email)
- [ ] Review page polling
- [ ] Pricing model / usage tracking
- [ ] Native API publishing via Ayrshare (v2 — PRD section 10)

---

## Workflow Rules

- **One task at a time.** Complete → commit → next.
- **New feature ideas → Backlog.** We don't context-switch.
- **Bugs found during work → fix immediately.**
- **Every PR**: 3-agent review (security, performance, quality) before merge.
- **PLAN.md stays updated** as tasks complete.

---

## Verification

After each deployment:
1. `/mighty` — calendar renders, all 3 views work, create/edit/delete posts works
2. `/foxhue` — different branding, different data, no bleed
3. `/review/<token>` — approve/request changes works, no editing
4. View source — no Supabase keys visible
5. Email flow — review-ready + feedback notifications send
