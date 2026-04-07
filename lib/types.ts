export interface Owner {
  name: string;
  key: string;
  color: string;
  colorLight: string;
  colorMid: string;
}

export interface WorkspaceConfig {
  id: string;
  slug: string;
  name: string;
  logoMark: string;
  owners: Owner[];
  platforms: string[];
  contentTypes: string[];
  typeColors: Record<string, string>;
  theme: {
    bg: string;
    surface: string;
    border: string;
    text: string;
    muted: string;
    approved: string;
    approvedLight: string;
    pending: string;
    pendingLight: string;
    draft: string;
    draftLight: string;
  };
  reviewToken: string;
  clientEmail: string | null;
}

export interface CalendarItem {
  id: string;
  workspaceId: string;
  month: string;
  owner: string;
  day: string;
  week: string;
  date: string;
  slot: number;
  type: string;
  title: string;
  caption: string | null;
  status: 'draft' | 'pending_review' | 'approved' | 'changes_requested';
  reviewComment: string | null;
  platforms: Record<string, boolean>;
  createdAt: string;
  updatedAt: string;
}

// Shape of rows coming from Supabase (snake_case)
export interface CalendarApprovalRow {
  id: string;
  workspace_id: string;
  month: string;
  owner: string;
  day: string;
  week: string;
  date: string;
  slot: number;
  type: string;
  title: string;
  caption: string | null;
  status: string;
  review_comment: string | null;
  platforms: Record<string, boolean> | null;
  created_at: string;
  updated_at: string;
}

export interface WorkspaceRow {
  id: string;
  slug: string;
  name: string;
  logo_mark: string;
  owners: Owner[];
  platforms: string[];
  content_types: string[];
  type_colors: Record<string, string>;
  theme: Record<string, string>;
  review_token: string;
  client_email: string | null;
  created_at: string;
}

export function rowToCalendarItem(row: CalendarApprovalRow): CalendarItem {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    month: row.month,
    owner: row.owner,
    day: row.day,
    week: row.week,
    date: row.date,
    slot: row.slot,
    type: row.type,
    title: row.title,
    caption: row.caption,
    status: row.status as CalendarItem['status'],
    reviewComment: row.review_comment,
    platforms: row.platforms || {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function rowToWorkspaceConfig(row: WorkspaceRow): WorkspaceConfig {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    logoMark: row.logo_mark,
    owners: row.owners,
    platforms: row.platforms,
    contentTypes: row.content_types,
    typeColors: row.type_colors,
    theme: {
      bg: row.theme.bg || '#F7F6F2',
      surface: row.theme.surface || '#FFFFFF',
      border: row.theme.border || '#E4E2DC',
      text: row.theme.text || '#1A1A18',
      muted: row.theme.muted || '#8A8880',
      approved: row.theme.approved || '#059669',
      approvedLight: row.theme.approvedLight || '#ECFDF5',
      pending: row.theme.pending || '#D97706',
      pendingLight: row.theme.pendingLight || '#FFFBEB',
      draft: row.theme.draft || '#6B7280',
      draftLight: row.theme.draftLight || '#F9FAFB',
    },
    reviewToken: row.review_token,
    clientEmail: row.client_email,
  };
}
