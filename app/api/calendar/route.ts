import { NextRequest } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase-server';

const VALID_STATUSES = ['draft', 'pending_review', 'approved', 'changes_requested'];
const MONTH_RE = /^\d{4}-\d{2}$/;
const ID_RE = /^\d{4}-\d{2}-\d{2}-\d+$/;

// GET /api/calendar?workspace=mighty&month=2026-03
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const workspace = searchParams.get('workspace');
  const month = searchParams.get('month');

  if (!workspace || !month) {
    return Response.json({ error: 'Missing workspace or month' }, { status: 400 });
  }

  if (!MONTH_RE.test(month)) {
    return Response.json({ error: 'Invalid month format' }, { status: 400 });
  }

  const supabase = getSupabaseServer();

  const { data: ws, error: wsErr } = await supabase
    .from('workspaces')
    .select('id')
    .eq('slug', workspace)
    .single();

  if (wsErr || !ws) {
    return Response.json({ error: 'Unknown workspace' }, { status: 404 });
  }

  const { data: items, error } = await supabase
    .from('calendar_approvals')
    .select('*')
    .eq('workspace_id', ws.id)
    .eq('month', month)
    .order('date', { ascending: true })
    .order('slot', { ascending: true });

  if (error) {
    console.error('Calendar GET error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }

  return Response.json(items || []);
}

// POST /api/calendar — upsert item (allowlisted fields only)
export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const workspace = body.workspace as string | undefined;
  const id = body.id as string | undefined;

  if (!workspace || !id) {
    return Response.json({ error: 'Missing workspace or id' }, { status: 400 });
  }

  if (!ID_RE.test(id)) {
    return Response.json({ error: 'Invalid id format' }, { status: 400 });
  }

  const supabase = getSupabaseServer();

  const { data: ws, error: wsErr } = await supabase
    .from('workspaces')
    .select('id')
    .eq('slug', workspace)
    .single();

  if (wsErr || !ws) {
    return Response.json({ error: 'Unknown workspace' }, { status: 404 });
  }

  // Validate status if provided
  const status = body.status as string | undefined;
  if (status && !VALID_STATUSES.includes(status)) {
    return Response.json({ error: 'Invalid status' }, { status: 400 });
  }

  // Allowlisted fields only — no spread of arbitrary body fields
  const row: Record<string, unknown> = {
    id,
    workspace_id: ws.id,
    updated_at: new Date().toISOString(),
  };

  // Only set fields that are explicitly provided
  if (body.month !== undefined) row.month = body.month;
  if (body.owner !== undefined) row.owner = body.owner;
  if (body.day !== undefined) row.day = body.day;
  if (body.week !== undefined) row.week = body.week;
  if (body.date !== undefined) row.date = body.date;
  if (body.slot !== undefined) row.slot = body.slot;
  if (body.type !== undefined) row.type = body.type;
  if (body.title !== undefined) row.title = typeof body.title === 'string' ? body.title.slice(0, 500) : '';
  if (body.caption !== undefined) row.caption = typeof body.caption === 'string' ? body.caption.slice(0, 10000) : null;
  if (status) row.status = status;
  if (body.review_comment !== undefined) row.review_comment = typeof body.review_comment === 'string' ? body.review_comment.slice(0, 5000) : null;
  if (body.platforms !== undefined && typeof body.platforms === 'object') row.platforms = body.platforms;

  const { error } = await supabase
    .from('calendar_approvals')
    .upsert(row, { onConflict: 'id' });

  if (error) {
    console.error('Calendar POST error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }

  return Response.json({ ok: true });
}

// DELETE /api/calendar?workspace=mighty&id=2026-03-02-1
export async function DELETE(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const workspace = searchParams.get('workspace');
  const id = searchParams.get('id');

  if (!workspace || !id) {
    return Response.json({ error: 'Missing workspace or id' }, { status: 400 });
  }

  if (!ID_RE.test(id)) {
    return Response.json({ error: 'Invalid id format' }, { status: 400 });
  }

  const supabase = getSupabaseServer();

  const { data: ws, error: wsErr } = await supabase
    .from('workspaces')
    .select('id')
    .eq('slug', workspace)
    .single();

  if (wsErr || !ws) {
    return Response.json({ error: 'Unknown workspace' }, { status: 404 });
  }

  const { error } = await supabase
    .from('calendar_approvals')
    .delete()
    .eq('id', id)
    .eq('workspace_id', ws.id);

  if (error) {
    console.error('Calendar DELETE error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }

  return Response.json({ ok: true });
}
