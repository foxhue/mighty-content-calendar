'use client';

import { useState } from 'react';
import type { WorkspaceRow, CalendarApprovalRow } from '@/lib/types';

interface Props {
  workspace: WorkspaceRow;
  items: CalendarApprovalRow[];
  token: string;
}

export default function ReviewClient({ workspace, items: initialItems, token }: Props) {
  const [items, setItems] = useState(initialItems);
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState<string | null>(null);

  const primaryColor = workspace.owners?.[0]?.color || '#2563EB';
  const typeColors = workspace.type_colors as Record<string, string>;

  async function handleAction(itemId: string, action: 'approve' | 'request_changes', reviewComment?: string) {
    setLoading(itemId);
    try {
      const res = await fetch('/api/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, itemId, action, comment: reviewComment }),
      });
      if (res.ok) {
        setItems(prev => prev.map(item => {
          if (item.id !== itemId) return item;
          return {
            ...item,
            status: action === 'approve' ? 'approved' : 'changes_requested',
            review_comment: action === 'request_changes' ? (reviewComment || '') : null,
          };
        }));
      }
    } finally {
      setLoading(null);
      setActiveModal(null);
      setComment('');
    }
  }

  const pendingItems = items.filter(i => i.status === 'pending_review');
  const approvedItems = items.filter(i => i.status === 'approved');
  const changesItems = items.filter(i => i.status === 'changes_requested');

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", background: '#F7F6F2', minHeight: '100vh' }}>
      {/* Fonts loaded via root layout — no duplicate @import needed */}
      <style>{`* { box-sizing: border-box; margin: 0; padding: 0; }`}</style>

      {/* Header */}
      <div style={{
        background: '#1A1A18', color: 'white', padding: '20px 32px',
        display: 'flex', alignItems: 'center', gap: 16,
      }}>
        <div style={{
          width: 32, height: 32, background: primaryColor, borderRadius: 8,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 700, fontSize: 14,
        }}>
          {workspace.logo_mark}
        </div>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, letterSpacing: '-0.3px' }}>{workspace.name}</div>
          <div style={{ fontSize: 12, opacity: 0.5, fontFamily: "'DM Mono', monospace" }}>Content Review</div>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '32px 24px' }}>
        {/* Pending review */}
        {pendingItems.length > 0 && (
          <Section title="Awaiting Your Review" count={pendingItems.length} color="#D97706">
            {pendingItems.map(item => (
              <ReviewCard key={item.id} item={item} typeColors={typeColors} loading={loading === item.id}>
                <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                  <button
                    onClick={() => handleAction(item.id, 'approve')}
                    disabled={loading === item.id}
                    style={{
                      padding: '10px 20px', borderRadius: 6, border: 'none',
                      background: '#059669', color: 'white', fontWeight: 600,
                      fontSize: 13, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
                    }}
                  >
                    ✓ Approve
                  </button>
                  <button
                    onClick={() => { setActiveModal(item.id); setComment(''); }}
                    disabled={loading === item.id}
                    style={{
                      padding: '10px 20px', borderRadius: 6,
                      border: '1.5px solid #E4E2DC', background: 'white',
                      color: '#8A8880', fontWeight: 600, fontSize: 13,
                      cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
                    }}
                  >
                    Request Changes
                  </button>
                </div>

                {/* Changes modal */}
                {activeModal === item.id && (
                  <div style={{
                    marginTop: 12, padding: 16, background: '#FEF2F2',
                    borderRadius: 8, border: '1px solid #FECACA',
                  }}>
                    <textarea
                      value={comment}
                      onChange={e => setComment(e.target.value)}
                      placeholder="What changes would you like?"
                      style={{
                        width: '100%', minHeight: 80, padding: 10,
                        border: '1px solid #E4E2DC', borderRadius: 6,
                        fontFamily: "'DM Sans', sans-serif", fontSize: 13,
                        resize: 'vertical', outline: 'none',
                      }}
                    />
                    <div style={{ display: 'flex', gap: 8, marginTop: 8, justifyContent: 'flex-end' }}>
                      <button
                        onClick={() => setActiveModal(null)}
                        style={{
                          padding: '8px 16px', borderRadius: 6,
                          border: '1px solid #E4E2DC', background: 'white',
                          fontSize: 12, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
                        }}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleAction(item.id, 'request_changes', comment)}
                        disabled={!comment.trim()}
                        style={{
                          padding: '8px 16px', borderRadius: 6, border: 'none',
                          background: comment.trim() ? '#EF4444' : '#E4E2DC',
                          color: 'white', fontWeight: 600, fontSize: 12,
                          cursor: comment.trim() ? 'pointer' : 'default',
                          fontFamily: "'DM Sans', sans-serif",
                        }}
                      >
                        Submit Feedback
                      </button>
                    </div>
                  </div>
                )}
              </ReviewCard>
            ))}
          </Section>
        )}

        {/* Changes requested */}
        {changesItems.length > 0 && (
          <Section title="Changes Requested" count={changesItems.length} color="#EF4444">
            {changesItems.map(item => (
              <ReviewCard key={item.id} item={item} typeColors={typeColors} loading={false}>
                {item.review_comment && (
                  <div style={{
                    marginTop: 12, padding: 12, background: '#FEF2F2',
                    borderRadius: 6, fontSize: 13, color: '#EF4444',
                    fontStyle: 'italic',
                  }}>
                    &ldquo;{item.review_comment}&rdquo;
                  </div>
                )}
              </ReviewCard>
            ))}
          </Section>
        )}

        {/* Approved */}
        {approvedItems.length > 0 && (
          <Section title="Approved" count={approvedItems.length} color="#059669">
            {approvedItems.map(item => (
              <ReviewCard key={item.id} item={item} typeColors={typeColors} loading={false}>
                <div style={{
                  marginTop: 12, display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '6px 12px', background: '#ECFDF5', border: '1px solid #059669',
                  borderRadius: 6, color: '#059669', fontWeight: 600, fontSize: 12,
                }}>
                  ✓ Approved
                </div>
              </ReviewCard>
            ))}
          </Section>
        )}

        {items.length === 0 && (
          <div style={{ textAlign: 'center', padding: '64px 24px', color: '#8A8880' }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>📋</div>
            <div style={{ fontSize: 15, fontWeight: 500 }}>No posts to review right now</div>
            <div style={{ fontSize: 13, marginTop: 4 }}>Check back when new content is ready.</div>
          </div>
        )}
      </div>
    </div>
  );
}

function Section({ title, count, color, children }: {
  title: string; count: number; color: string; children: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: 32 }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16,
      }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, letterSpacing: '-0.3px' }}>{title}</h2>
        <span style={{
          padding: '2px 8px', borderRadius: 10, background: color + '15',
          color, fontSize: 12, fontWeight: 700,
        }}>
          {count}
        </span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {children}
      </div>
    </div>
  );
}

function ReviewCard({ item, typeColors, loading, children }: {
  item: CalendarApprovalRow; typeColors: Record<string, string>;
  loading: boolean; children: React.ReactNode;
}) {
  const typeColor = typeColors[item.type] || '#6B7280';
  const platforms = item.platforms as Record<string, boolean> | null;
  const activePlatforms = platforms
    ? Object.entries(platforms).filter(([, v]) => v).map(([k]) => k)
    : [];

  return (
    <div style={{
      background: 'white', border: '1px solid #E4E2DC', borderRadius: 10,
      padding: 20, opacity: loading ? 0.6 : 1, transition: 'opacity 0.2s',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <span style={{
              fontSize: 10, fontWeight: 600, textTransform: 'uppercase' as const,
              letterSpacing: '0.5px', padding: '2px 7px', borderRadius: 3,
              color: typeColor, border: `1px solid ${typeColor}20`,
              background: `${typeColor}10`,
            }}>
              {item.type}
            </span>
            {activePlatforms.length > 0 && (
              <span style={{ fontSize: 11, color: '#8A8880' }}>
                {activePlatforms.join(', ')}
              </span>
            )}
          </div>
          <div style={{ fontSize: 15, fontWeight: 600, letterSpacing: '-0.2px', lineHeight: 1.4 }}>
            {item.title || 'Untitled'}
          </div>
          {item.caption && (
            <div style={{
              fontSize: 13, color: '#4A4A48', lineHeight: 1.6,
              marginTop: 8, whiteSpace: 'pre-wrap' as const,
            }}>
              {item.caption}
            </div>
          )}
        </div>
        <div style={{
          fontSize: 11, color: '#8A8880', fontFamily: "'DM Mono', monospace",
          whiteSpace: 'nowrap' as const,
        }}>
          {new Date(item.date + 'T00:00:00').toLocaleDateString('en-GB', {
            weekday: 'short', day: 'numeric', month: 'short',
          })}
        </div>
      </div>
      {children}
    </div>
  );
}
