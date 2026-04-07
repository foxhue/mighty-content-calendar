import { notFound } from 'next/navigation';
import { getSupabaseServer } from '@/lib/supabase-server';
import type { WorkspaceRow, CalendarApprovalRow } from '@/lib/types';
import ReviewClient from './ReviewClient';

export default async function ReviewPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const supabase = getSupabaseServer();

  // Look up workspace by review token (not slug — client never sees the slug)
  const { data: ws, error: wsErr } = await supabase
    .from('workspaces')
    .select('*')
    .eq('review_token', token)
    .single();

  if (wsErr || !ws) {
    notFound();
  }

  const workspace = ws as WorkspaceRow;

  // Get items that are pending_review, approved, or changes_requested
  const { data: items } = await supabase
    .from('calendar_approvals')
    .select('*')
    .eq('workspace_id', workspace.id)
    .in('status', ['pending_review', 'approved', 'changes_requested'])
    .order('date', { ascending: true })
    .order('slot', { ascending: true });

  return (
    <ReviewClient
      workspace={workspace}
      items={(items || []) as CalendarApprovalRow[]}
      token={token}
    />
  );
}
