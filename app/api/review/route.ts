import { NextRequest } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase-server';
import { sendReviewFeedback } from '@/lib/email';

// POST /api/review — approve or request changes
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { token, itemId, action, comment } = body;

  if (!token || !itemId || !action) {
    return Response.json({ error: 'Missing token, itemId, or action' }, { status: 400 });
  }

  if (action !== 'approve' && action !== 'request_changes') {
    return Response.json({ error: 'Invalid action' }, { status: 400 });
  }

  const supabase = getSupabaseServer();

  // Look up workspace by review token
  const { data: ws, error: wsErr } = await supabase
    .from('workspaces')
    .select('*')
    .eq('review_token', token)
    .single();

  if (wsErr || !ws) {
    return Response.json({ error: 'Invalid review token' }, { status: 404 });
  }

  // Build update
  const update: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (action === 'approve') {
    update.status = 'approved';
    update.review_comment = null;
  } else {
    update.status = 'changes_requested';
    update.review_comment = comment || '';
  }

  // Update the item, scoped to this workspace
  const { data: updatedItem, error } = await supabase
    .from('calendar_approvals')
    .update(update)
    .eq('id', itemId)
    .eq('workspace_id', ws.id)
    .select()
    .single();

  if (error || !updatedItem) {
    return Response.json({ error: 'Item not found' }, { status: 404 });
  }

  // Send email notification to Foxhue
  try {
    await sendReviewFeedback(ws, [{ item: updatedItem, action }]);
  } catch {
    // Don't fail the review action if email fails
    console.error('Failed to send review feedback email');
  }

  return Response.json({ ok: true, status: update.status });
}
