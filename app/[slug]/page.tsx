import { notFound } from 'next/navigation';
import { getSupabaseServer } from '@/lib/supabase-server';
import { rowToWorkspaceConfig } from '@/lib/types';
import { getCalendarCSS } from '@/lib/calendar-styles';
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

  // Strip sensitive fields before sending to client
  const { reviewToken: _rt, clientEmail: _ce, ...safeConfig } = config;

  // Load current month's data
  const currentMonth = new Date().toISOString().slice(0, 7);
  const { data: items } = await supabase
    .from('calendar_approvals')
    .select('*')
    .eq('workspace_id', wsRow.id)
    .eq('month', currentMonth)
    .order('date', { ascending: true })
    .order('slot', { ascending: true });

  // Generate CSS server-side to avoid FOUC
  const css = getCalendarCSS(config);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <CalendarClient
        config={safeConfig}
        initialData={(items || []) as CalendarApprovalRow[]}
      />
    </>
  );
}
