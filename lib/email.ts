import { Resend } from 'resend';
import type { WorkspaceRow, CalendarApprovalRow } from './types';

function getResend(): Resend {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error('Missing RESEND_API_KEY');
  return new Resend(key);
}

function getNotificationEmail(): string {
  return process.env.NOTIFICATION_EMAIL || 'hello@foxhue.com';
}

export async function sendReviewReady(
  workspace: WorkspaceRow,
  items: CalendarApprovalRow[]
) {
  if (!workspace.client_email) return;

  const resend = getResend();
  const reviewUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'https://calendar.foxhue.com'}/review/${workspace.review_token}`;

  const itemList = items
    .map(i => `<li><strong>${i.type}</strong>: ${i.title || 'Untitled'}${i.caption ? ` — ${i.caption.slice(0, 80)}…` : ''}</li>`)
    .join('');

  await resend.emails.send({
    from: 'Content Calendar <calendar@foxhue.com>',
    to: workspace.client_email,
    subject: `${workspace.name} — Posts Ready for Review`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1A1A18;">${workspace.name} Content Calendar</h2>
        <p>The following posts are ready for your review:</p>
        <ul>${itemList}</ul>
        <p style="margin-top: 24px;">
          <a href="${reviewUrl}" style="display: inline-block; padding: 12px 24px; background: #2563EB; color: white; text-decoration: none; border-radius: 6px; font-weight: 600;">
            Review Posts
          </a>
        </p>
        <p style="color: #8A8880; font-size: 12px; margin-top: 32px;">
          This email was sent by Foxhue Content Calendar.
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

  const actionLines = actions
    .map(a => {
      const emoji = a.action === 'approve' ? '✅' : '🔄';
      const label = a.action === 'approve' ? 'Approved' : 'Changes Requested';
      const comment = a.action === 'request_changes' && a.item.review_comment
        ? ` — "${a.item.review_comment}"`
        : '';
      return `<li>${emoji} <strong>${a.item.type}</strong>: ${a.item.title || 'Untitled'} — ${label}${comment}</li>`;
    })
    .join('');

  await resend.emails.send({
    from: 'Content Calendar <calendar@foxhue.com>',
    to: notifyEmail,
    subject: `${workspace.name} — Client Review Feedback`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1A1A18;">${workspace.name} — Review Feedback</h2>
        <p>The client has reviewed the following posts:</p>
        <ul>${actionLines}</ul>
        <p style="color: #8A8880; font-size: 12px; margin-top: 32px;">
          This notification was sent by Foxhue Content Calendar.
        </p>
      </div>
    `,
  });
}
