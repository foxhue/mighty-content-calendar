import { Resend } from 'resend';
import type { WorkspaceRow, CalendarApprovalRow } from './types';

function getResend(): Resend {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error('Missing RESEND_API_KEY');
  return new Resend(key);
}

function getNotificationEmail(): string {
  const email = process.env.NOTIFICATION_EMAIL;
  if (!email) throw new Error('Missing NOTIFICATION_EMAIL');
  return email;
}

function getBaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_BASE_URL;
  if (!url) throw new Error('Missing NEXT_PUBLIC_BASE_URL — set this in .env.local');
  return url;
}

function getSenderEmail(): string {
  return process.env.SENDER_EMAIL || 'noreply@foxhue.com';
}

function escHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export async function sendReviewReady(
  workspace: WorkspaceRow,
  items: CalendarApprovalRow[]
) {
  if (!workspace.client_email) return;

  const resend = getResend();
  const reviewUrl = `${getBaseUrl()}/review/${workspace.review_token}`;
  const sender = getSenderEmail();

  const itemList = items
    .map(i => `<li><strong>${escHtml(i.type)}</strong>: ${escHtml(i.title || 'Untitled')}${i.caption ? ` — ${escHtml(i.caption.slice(0, 80))}…` : ''}</li>`)
    .join('');

  await resend.emails.send({
    from: `${escHtml(workspace.name)} Content Calendar <${sender}>`,
    to: workspace.client_email,
    subject: `${escHtml(workspace.name)} — Posts Ready for Review`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1A1A18;">${escHtml(workspace.name)} Content Calendar</h2>
        <p>The following posts are ready for your review:</p>
        <ul>${itemList}</ul>
        <p style="margin-top: 24px;">
          <a href="${reviewUrl}" style="display: inline-block; padding: 12px 24px; background: ${workspace.owners?.[0]?.color || '#2563EB'}; color: white; text-decoration: none; border-radius: 6px; font-weight: 600;">
            Review Posts
          </a>
        </p>
      </div>
    `,
  });
}

export async function sendReviewFeedback(
  workspace: WorkspaceRow,
  actions: Array<{ item: CalendarApprovalRow; action: string }>
) {
  const resend = getResend();
  const notifyEmail = getNotificationEmail();
  const sender = getSenderEmail();

  const actionLines = actions
    .map(a => {
      const emoji = a.action === 'approve' ? '✅' : '🔄';
      const label = a.action === 'approve' ? 'Approved' : 'Changes Requested';
      const comment = a.action === 'request_changes' && a.item.review_comment
        ? ` — "${escHtml(a.item.review_comment)}"`
        : '';
      return `<li>${emoji} <strong>${escHtml(a.item.type)}</strong>: ${escHtml(a.item.title || 'Untitled')} — ${label}${comment}</li>`;
    })
    .join('');

  await resend.emails.send({
    from: `${escHtml(workspace.name)} Content Calendar <${sender}>`,
    to: notifyEmail,
    subject: `${escHtml(workspace.name)} — Client Review Feedback`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1A1A18;">${escHtml(workspace.name)} — Review Feedback</h2>
        <p>The client has reviewed the following posts:</p>
        <ul>${actionLines}</ul>
      </div>
    `,
  });
}
