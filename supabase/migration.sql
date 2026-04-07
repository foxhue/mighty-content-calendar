-- ============================================================
-- MIGRATION: Multi-Tenant Content Calendar
-- Run this in the Supabase SQL editor
-- ============================================================

-- 1. Create workspaces table
CREATE TABLE workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  logo_mark TEXT NOT NULL,
  owners JSONB NOT NULL,
  platforms JSONB NOT NULL,
  content_types JSONB NOT NULL,
  type_colors JSONB NOT NULL,
  theme JSONB NOT NULL DEFAULT '{}',
  review_token TEXT UNIQUE DEFAULT gen_random_uuid()::text,
  client_email TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS on workspaces: no public read policy
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;

-- 2. Seed Mighty workspace
INSERT INTO workspaces (slug, name, logo_mark, owners, platforms, content_types, type_colors, theme, client_email)
VALUES (
  'mighty',
  'Mighty',
  'M',
  '[
    {"name": "FoxHue", "key": "foxhue", "color": "#2563EB", "colorLight": "#EFF6FF", "colorMid": "#BFDBFE"},
    {"name": "Pau", "key": "pau", "color": "#7C3AED", "colorLight": "#F5F3FF", "colorMid": "#DDD6FE"}
  ]'::jsonb,
  '["LinkedIn", "Google", "Reddit", "YouTube", "X", "Facebook", "Instagram"]'::jsonb,
  '["Blog", "Partner Blog", "Mighty Selects", "Customer Spotlight", "Video", "Image/Carousel"]'::jsonb,
  '{"Blog": "#2563EB", "Partner Blog": "#0891B2", "Mighty Selects": "#7C3AED", "Customer Spotlight": "#D97706", "Video": "#DC2626", "Image/Carousel": "#059669"}'::jsonb,
  '{
    "bg": "#F7F6F2", "surface": "#FFFFFF", "border": "#E4E2DC",
    "text": "#1A1A18", "muted": "#8A8880",
    "approved": "#059669", "approvedLight": "#ECFDF5",
    "pending": "#D97706", "pendingLight": "#FFFBEB",
    "draft": "#6B7280", "draftLight": "#F9FAFB"
  }'::jsonb,
  NULL
);

-- 3. Modify calendar_approvals table
-- Add workspace_id column
ALTER TABLE calendar_approvals ADD COLUMN workspace_id UUID REFERENCES workspaces(id);

-- Set existing rows to Mighty workspace
UPDATE calendar_approvals SET workspace_id = (SELECT id FROM workspaces WHERE slug = 'mighty');

-- Make it NOT NULL after backfill
ALTER TABLE calendar_approvals ALTER COLUMN workspace_id SET NOT NULL;

-- Rename override columns to clean names
ALTER TABLE calendar_approvals RENAME COLUMN title_override TO title;
ALTER TABLE calendar_approvals RENAME COLUMN type_override TO type;

-- Add new columns
ALTER TABLE calendar_approvals ADD COLUMN owner TEXT;
ALTER TABLE calendar_approvals ADD COLUMN day TEXT;
ALTER TABLE calendar_approvals ADD COLUMN week TEXT;
ALTER TABLE calendar_approvals ADD COLUMN date TEXT;
ALTER TABLE calendar_approvals ADD COLUMN slot INTEGER DEFAULT 0;
ALTER TABLE calendar_approvals ADD COLUMN caption TEXT;
ALTER TABLE calendar_approvals ADD COLUMN review_comment TEXT;
ALTER TABLE calendar_approvals ADD COLUMN status TEXT DEFAULT 'draft';

-- Enable RLS on calendar_approvals (no permissive policies = anon gets nothing)
ALTER TABLE calendar_approvals ENABLE ROW LEVEL SECURITY;

-- 4. Migrate approved boolean → status field for existing rows
UPDATE calendar_approvals SET status = CASE
  WHEN approved = true THEN 'approved'
  WHEN approved = false THEN 'pending_review'
  ELSE 'draft'
END;

-- 5. Insert the 23 hardcoded Mighty items as real rows
-- First, delete any existing rows that will conflict (from the old system)
-- Then insert fresh rows with full data

-- Helper: get mighty workspace id
DO $$
DECLARE
  mighty_id UUID;
BEGIN
  SELECT id INTO mighty_id FROM workspaces WHERE slug = 'mighty';

  -- Delete old rows for March 2026 (they'll be replaced with full data)
  DELETE FROM calendar_approvals WHERE month = '2026-03';

  -- Insert all 23 items with complete data
  INSERT INTO calendar_approvals (id, workspace_id, month, owner, day, week, date, slot, type, title, status, platforms) VALUES
    ('2026-03-02-0', mighty_id, '2026-03', 'FoxHue', 'Monday',    'W1', '2026-03-02', 0, 'Blog',              'The Real Cost of DIY: When to Stop Doing Everything Yourself',            'pending_review', '{}'),
    ('2026-03-03-0', mighty_id, '2026-03', 'Pau',    'Tuesday',   'W1', '2026-03-03', 0, 'Video',             'TBC',                                                                     'draft',          '{}'),
    ('2026-03-04-0', mighty_id, '2026-03', 'Pau',    'Wednesday', 'W1', '2026-03-04', 0, 'Customer Spotlight', 'TBC',                                                                     'draft',          '{}'),
    ('2026-03-05-0', mighty_id, '2026-03', 'FoxHue', 'Thursday',  'W1', '2026-03-05', 0, 'Mighty Selects',    'Mighty Selects [TBC]',                                                    'pending_review', '{}'),
    ('2026-03-06-0', mighty_id, '2026-03', 'FoxHue', 'Friday',    'W1', '2026-03-06', 0, 'Partner Blog',      'Partner Blog [TBC]',                                                      'pending_review', '{}'),
    ('2026-03-09-0', mighty_id, '2026-03', 'FoxHue', 'Monday',    'W2', '2026-03-09', 0, 'Blog',              'How to Build a Business That Runs Without You (At Least for a Week)',     'pending_review', '{}'),
    ('2026-03-10-0', mighty_id, '2026-03', 'Pau',    'Tuesday',   'W2', '2026-03-10', 0, 'Video',             'TBC',                                                                     'draft',          '{}'),
    ('2026-03-11-0', mighty_id, '2026-03', 'Pau',    'Wednesday', 'W2', '2026-03-11', 0, 'Customer Spotlight', 'TBC',                                                                     'draft',          '{}'),
    ('2026-03-12-0', mighty_id, '2026-03', 'FoxHue', 'Thursday',  'W2', '2026-03-12', 0, 'Mighty Selects',    'Mighty Selects [TBC]',                                                    'pending_review', '{}'),
    ('2026-03-13-0', mighty_id, '2026-03', 'FoxHue', 'Friday',    'W2', '2026-03-13', 0, 'Partner Blog',      'Partner Blog — GoDaddy: 10 Things Every Small Business Should Automate', 'pending_review', '{}'),
    ('2026-03-16-0', mighty_id, '2026-03', 'FoxHue', 'Monday',    'W3', '2026-03-16', 0, 'Blog',              'Spring Clean Your Business Expenses',                                     'pending_review', '{}'),
    ('2026-03-17-0', mighty_id, '2026-03', 'Pau',    'Tuesday',   'W3', '2026-03-17', 0, 'Video',             'TBC',                                                                     'draft',          '{}'),
    ('2026-03-18-0', mighty_id, '2026-03', 'Pau',    'Wednesday', 'W3', '2026-03-18', 0, 'Customer Spotlight', 'TBC',                                                                     'draft',          '{}'),
    ('2026-03-19-0', mighty_id, '2026-03', 'FoxHue', 'Thursday',  'W3', '2026-03-19', 0, 'Mighty Selects',    'Mighty Selects [TBC]',                                                    'pending_review', '{}'),
    ('2026-03-20-0', mighty_id, '2026-03', 'FoxHue', 'Friday',    'W3', '2026-03-20', 0, 'Partner Blog',      'Partner Blog — BILL: How to Improve Your Business Credit Score',          'pending_review', '{}'),
    ('2026-03-23-0', mighty_id, '2026-03', 'FoxHue', 'Monday',    'W4', '2026-03-23', 0, 'Blog',              'What the Best Small Businesses Do Differently with Their Vendors',         'pending_review', '{}'),
    ('2026-03-24-0', mighty_id, '2026-03', 'Pau',    'Tuesday',   'W4', '2026-03-24', 0, 'Video',             'TBC',                                                                     'draft',          '{}'),
    ('2026-03-25-0', mighty_id, '2026-03', 'Pau',    'Wednesday', 'W4', '2026-03-25', 0, 'Customer Spotlight', 'TBC',                                                                     'draft',          '{}'),
    ('2026-03-26-0', mighty_id, '2026-03', 'FoxHue', 'Thursday',  'W4', '2026-03-26', 0, 'Mighty Selects',    'Mighty Selects [TBC]',                                                    'pending_review', '{}'),
    ('2026-03-27-0', mighty_id, '2026-03', 'FoxHue', 'Friday',    'W4', '2026-03-27', 0, 'Partner Blog',      'Partner Blog — Gusto: Quarterly Taxes for Small Businesses',              'pending_review', '{}'),
    ('2026-03-30-0', mighty_id, '2026-03', 'FoxHue', 'Monday',    'W5', '2026-03-30', 0, 'Blog',              'Stop Overpaying for the Stuff You Buy Every Month',                       'pending_review', '{}'),
    ('2026-03-31-0', mighty_id, '2026-03', 'Pau',    'Tuesday',   'W5', '2026-03-31', 0, 'Video',             'TBC',                                                                     'draft',          '{}');
END $$;

-- 6. Add indexes for common query patterns
CREATE INDEX idx_approvals_workspace_month ON calendar_approvals(workspace_id, month);
CREATE INDEX idx_approvals_workspace_status ON calendar_approvals(workspace_id, status);

-- 7. Drop the old approved column (now replaced by status)
-- Run this AFTER verifying the migration worked:
-- ALTER TABLE calendar_approvals DROP COLUMN approved;

-- ============================================================
-- CLIENT B: Foxhue workspace (for testing multi-tenancy)
-- ============================================================
INSERT INTO workspaces (slug, name, logo_mark, owners, platforms, content_types, type_colors, theme, client_email)
VALUES (
  'foxhue',
  'Foxhue',
  'F',
  '[
    {"name": "Andrew", "key": "andrew", "color": "#2563EB", "colorLight": "#EFF6FF", "colorMid": "#BFDBFE"},
    {"name": "Ashley", "key": "ashley", "color": "#059669", "colorLight": "#ECFDF5", "colorMid": "#A7F3D0"}
  ]'::jsonb,
  '["LinkedIn", "Facebook", "Instagram", "X", "YouTube", "Google"]'::jsonb,
  '["Case Study", "Thought Leadership", "Tips & Tricks", "Behind the Scenes", "Video", "Carousel"]'::jsonb,
  '{"Case Study": "#2563EB", "Thought Leadership": "#7C3AED", "Tips & Tricks": "#059669", "Behind the Scenes": "#D97706", "Video": "#DC2626", "Carousel": "#0891B2"}'::jsonb,
  '{
    "bg": "#F0F4F8", "surface": "#FFFFFF", "border": "#D1D5DB",
    "text": "#111827", "muted": "#6B7280",
    "approved": "#059669", "approvedLight": "#ECFDF5",
    "pending": "#D97706", "pendingLight": "#FFFBEB",
    "draft": "#6B7280", "draftLight": "#F9FAFB"
  }'::jsonb,
  NULL
);

-- Seed a few Foxhue calendar items for April 2026
DO $$
DECLARE
  foxhue_id UUID;
BEGIN
  SELECT id INTO foxhue_id FROM workspaces WHERE slug = 'foxhue';

  INSERT INTO calendar_approvals (id, workspace_id, month, owner, day, week, date, slot, type, title, status, platforms) VALUES
    ('2026-04-06-0', foxhue_id, '2026-04', 'Andrew', 'Monday',    'W1', '2026-04-06', 0, 'Case Study',          'How We Built a Multi-Tenant Calendar in a Weekend',     'draft', '{}'),
    ('2026-04-07-0', foxhue_id, '2026-04', 'Ashley', 'Tuesday',   'W1', '2026-04-07', 0, 'Thought Leadership',  'Why Every Agency Needs a Content Ops System',           'draft', '{}'),
    ('2026-04-08-0', foxhue_id, '2026-04', 'Andrew', 'Wednesday', 'W1', '2026-04-08', 0, 'Tips & Tricks',       '5 Supabase Patterns That Save Hours',                   'draft', '{}'),
    ('2026-04-09-0', foxhue_id, '2026-04', 'Ashley', 'Thursday',  'W1', '2026-04-09', 0, 'Behind the Scenes',   'Building in Public: Week 1 of Content Calendar SaaS',   'draft', '{}'),
    ('2026-04-10-0', foxhue_id, '2026-04', 'Andrew', 'Friday',    'W1', '2026-04-10', 0, 'Video',               'Demo: From Static HTML to Multi-Tenant Next.js',        'draft', '{}'),
    ('2026-04-13-0', foxhue_id, '2026-04', 'Ashley', 'Monday',    'W2', '2026-04-13', 0, 'Case Study',          'Content Approval Workflows That Actually Get Used',     'draft', '{}'),
    ('2026-04-14-0', foxhue_id, '2026-04', 'Andrew', 'Tuesday',   'W2', '2026-04-14', 0, 'Carousel',            'Before & After: Spreadsheet vs Content Calendar',       'draft', '{}');
END $$;
