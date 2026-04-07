import { NextRequest } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase-server';

// GET /api/calendar?workspace=mighty&month=2026-03
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const workspace = searchParams.get('workspace');
  const month = searchParams.get('month');

  if (!workspace || !month) {
    return Response.json({ error: 'Missing workspace or month' }, { status: 400 });
  }

  const supabase = getSupabaseServer();

  // Look up workspace by slug
  const { data: ws, error: wsErr } = await supabase
    .from('workspaces')
    .select('id')
    .eq('slug', workspace)
    .single();

  if (wsErr || !ws) {
    return Response.json({ error: 'Unknown workspace' }, { status: 404 });
  }

  // Fetch items scoped to this workspace + month
  const { data: items, error } = await supabase
    .from('calendar_approvals')
    .select('*')
    .eq('workspace_id', ws.id)
    .eq('month', month)
    .order('date', { ascending: true })
    .order('slot', { ascending: true });

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json(items || []);
}

// POST /api/calendar — upsert item
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { workspace, id, ...changes } = body;

  if (!workspace || !id) {
    return Response.json({ error: 'Missing workspace or id' }, { status: 400 });
  }

  const supabase = getSupabaseServer();

  // Validate workspace
  const { data: ws, error: wsErr } = await supabase
    .from('workspaces')
    .select('id')
    .eq('slug', workspace)
    .single();

  if (wsErr || !ws) {
    return Response.json({ error: 'Unknown workspace' }, { status: 404 });
  }

  // Build the row to upsert
  const row = {
    id,
    workspace_id: ws.id,
    ...changes,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from('calendar_approvals')
    .upsert(row, { onConflict: 'id' });

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
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

  const supabase = getSupabaseServer();

  // Validate workspace
  const { data: ws, error: wsErr } = await supabase
    .from('workspaces')
    .select('id')
    .eq('slug', workspace)
    .single();

  if (wsErr || !ws) {
    return Response.json({ error: 'Unknown workspace' }, { status: 404 });
  }

  // Delete, scoped to workspace
  const { error } = await supabase
    .from('calendar_approvals')
    .delete()
    .eq('id', id)
    .eq('workspace_id', ws.id);

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ ok: true });
}
