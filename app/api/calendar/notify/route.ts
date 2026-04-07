import { NextRequest } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase-server';
import { sendReviewReady } from '@/lib/email';

// POST /api/calendar/notify — send review-ready email to client
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { workspace, action } = body;

  if (!workspace || action !== 'review_ready') {
    return Response.json({ error: 'Invalid request' }, { status: 400 });
  }

  const supabase = getSupabaseServer();

  const { data: ws, error: wsErr } = await supabase
    .from('workspaces')
    .select('*')
    .eq('slug', workspace)
    .single();

  if (wsErr || !ws) {
    return Response.json({ error: 'Unknown workspace' }, { status: 404 });
  }

  if (!ws.client_email) {
    return Response.json({ error: 'No client email configured' }, { status: 400 });
  }

  // Get all pending_review items for this workspace
  const { data: items } = await supabase
    .from('calendar_approvals')
    .select('*')
    .eq('workspace_id', ws.id)
    .eq('status', 'pending_review');

  if (!items || items.length === 0) {
    return Response.json({ error: 'No items pending review' }, { status: 400 });
  }

  try {
    await sendReviewReady(ws, items);
    return Response.json({ ok: true, sent: items.length });
  } catch (err) {
    console.error('Failed to send review email:', err);
    return Response.json({ error: 'Email send failed' }, { status: 500 });
  }
}
