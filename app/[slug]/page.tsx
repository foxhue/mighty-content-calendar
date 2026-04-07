import { notFound } from 'next/navigation';
import { getSupabaseServer } from '@/lib/supabase-server';
import { rowToWorkspaceConfig } from '@/lib/types';
import type { WorkspaceRow, CalendarApprovalRow } from '@/lib/types';
import CalendarClient from './CalendarClient';

export default async function WorkspacePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = getSupabaseServer();

  // Load workspace config
  const { data: wsRow, error: wsErr } = await supabase
    .from('workspaces')
    .select('*')
    .eq('slug', slug)
    .single();

  if (wsErr || !wsRow) {
    notFound();
  }

  const config = rowToWorkspaceConfig(wsRow as WorkspaceRow);

  // Load current month's data
  const currentMonth = new Date().toISOString().slice(0, 7);
  const { data: items } = await supabase
    .from('calendar_approvals')
    .select('*')
    .eq('workspace_id', wsRow.id)
    .eq('month', currentMonth)
    .order('date', { ascending: true })
    .order('slot', { ascending: true });

  return (
    <CalendarClient
      config={config}
      initialData={(items || []) as CalendarApprovalRow[]}
    />
  );
}
