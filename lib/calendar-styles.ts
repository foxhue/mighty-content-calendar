import type { WorkspaceConfig } from './types';

export function getCalendarCSS(config: WorkspaceConfig): string {
  // Generate owner CSS variables from config
  const ownerVars = config.owners.map(o => `
    --${o.key}: ${o.color}; --${o.key}-light: ${o.colorLight}; --${o.key}-mid: ${o.colorMid};`
  ).join('');

  const t = config.theme;

  return `
  :root {
    --bg: ${t.bg}; --surface: ${t.surface}; --border: ${t.border};
    --text: ${t.text}; --muted: ${t.muted};
    ${ownerVars}
    --approved: ${t.approved}; --approved-light: ${t.approvedLight};
    --pending: ${t.pending}; --pending-light: ${t.pendingLight};
    --draft: ${t.draft}; --draft-light: ${t.draftLight};
    --shadow: 0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04);
    --radius: 10px; --radius-sm: 6px;
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'DM Sans', sans-serif; background: var(--bg); color: var(--text); min-height: 100vh; font-size: 14px; }

  .header { background: var(--text); color: white; padding: 20px 32px; display: flex; align-items: center; justify-content: space-between; position: sticky; top: 0; z-index: 100; }
  .header-left { display: flex; align-items: center; gap: 16px; }
  .logo { display: flex; align-items: center; gap: 10px; }
  .logo-mark { width: 32px; height: 32px; background: var(--${config.owners[0]?.key || 'owner0'}); border-radius: 8px; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 14px; }
  .header-sub { font-size: 12px; opacity: 0.5; margin-top: 1px; font-family: 'DM Mono', monospace; }
  .legend { display: flex; gap: 16px; align-items: center; }
  .legend-item { display: flex; align-items: center; gap: 6px; font-size: 12px; opacity: 0.8; }
  .legend-dot { width: 8px; height: 8px; border-radius: 50%; }

  .sync-badge { display: flex; align-items: center; gap: 6px; font-size: 11px; font-family: 'DM Mono', monospace; padding: 4px 10px; border-radius: 20px; background: rgba(255,255,255,0.1); }
  .sync-dot { width: 7px; height: 7px; border-radius: 50%; background: #6B7280; }
  .sync-dot.synced { background: #10B981; }
  .sync-dot.syncing { background: #F59E0B; animation: pulse 1s infinite; }
  .sync-dot.error { background: #EF4444; }
  @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }

  .controls { background: var(--surface); border-bottom: 1px solid var(--border); padding: 12px 32px; display: flex; align-items: center; justify-content: space-between; gap: 16px; }
  .controls-left { display: flex; align-items: center; gap: 8px; }
  .month-nav { display: flex; align-items: center; gap: 8px; }
  .month-btn { width: 32px; height: 32px; border: 1px solid var(--border); background: var(--surface); border-radius: var(--radius-sm); cursor: pointer; display: flex; align-items: center; justify-content: center; color: var(--muted); transition: all 0.15s; }
  .month-btn:hover { border-color: var(--text); color: var(--text); }
  .month-label { font-size: 15px; font-weight: 600; letter-spacing: -0.3px; min-width: 120px; text-align: center; }
  .view-tabs { display: flex; background: var(--bg); border-radius: var(--radius-sm); padding: 3px; gap: 2px; }
  .view-tab { padding: 6px 14px; border: none; background: transparent; border-radius: 5px; cursor: pointer; font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 500; color: var(--muted); transition: all 0.15s; }
  .view-tab.active { background: var(--surface); color: var(--text); box-shadow: var(--shadow); }
  .filter-bar { display: flex; align-items: center; gap: 8px; }
  .filter-chip { padding: 5px 12px; border: 1px solid var(--border); background: var(--surface); border-radius: 20px; font-family: 'DM Sans', sans-serif; font-size: 12px; font-weight: 500; cursor: pointer; color: var(--muted); transition: all 0.15s; }
  .filter-chip.active { background: var(--text); border-color: var(--text); color: white; }

  .stats-bar { padding: 16px 32px; display: flex; gap: 12px; }
  .stat-card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 12px 18px; display: flex; flex-direction: column; gap: 2px; min-width: 120px; }
  .stat-value { font-size: 22px; font-weight: 700; letter-spacing: -0.5px; }
  .stat-label { font-size: 11px; color: var(--muted); font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px; }
  .stat-card.approved .stat-value { color: var(--approved); }
  .stat-card.pending .stat-value { color: var(--pending); }
  ${config.owners.map(o => `.stat-card.${o.key} .stat-value { color: var(--${o.key}); }`).join('\n  ')}

  .main { padding: 0 32px 32px; }

  /* MONTH VIEW */
  .month-view { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); overflow: hidden; }
  .month-grid-header { display: grid; grid-template-columns: repeat(5, 1fr); border-bottom: 2px solid var(--border); }
  .day-header { padding: 10px 14px; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.8px; color: var(--muted); border-right: 1px solid var(--border); }
  .day-header:last-child { border-right: none; }
  .month-weeks { display: flex; flex-direction: column; }
  .month-week { display: grid; grid-template-columns: repeat(5, 1fr); border-bottom: 1px solid var(--border); }
  .month-week:last-child { border-bottom: none; }
  .month-cell { padding: 10px 12px; border-right: 1px solid var(--border); min-height: 90px; cursor: pointer; transition: background 0.1s; position: relative; }
  .month-cell:last-child { border-right: none; }
  .month-cell:hover { background: var(--bg); }
  .cell-date { font-size: 11px; font-family: 'DM Mono', monospace; color: var(--muted); margin-bottom: 6px; display: flex; align-items: center; justify-content: space-between; }
  .cell-pill { display: flex; align-items: center; gap: 5px; padding: 4px 8px; border-radius: 6px; font-size: 12px; font-weight: 500; margin-bottom: 4px; cursor: pointer; transition: opacity 0.1s; line-height: 1.3; }
  .cell-pill:hover { opacity: 0.8; }
  ${config.owners.map(o => `.cell-pill.${o.key} { background: var(--${o.key}-light); color: var(--${o.key}); border: 1px solid var(--${o.key}-mid); }`).join('\n  ')}
  .pill-dot { width: 6px; height: 6px; border-radius: 50%; background: currentColor; flex-shrink: 0; }
  .status-dot { width: 7px; height: 7px; border-radius: 50%; display: inline-block; margin-left: 4px; flex-shrink: 0; }
  .status-dot.approved { background: var(--approved); }
  .status-dot.pending, .status-dot.pending_review { background: var(--pending); }
  .status-dot.draft { background: var(--draft); }
  .status-dot.changes_requested { background: #EF4444; }

  /* WEEK VIEW */
  .week-view { display: flex; flex-direction: column; gap: 24px; }
  .week-section { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); overflow: hidden; }
  .week-header { padding: 12px 20px; border-bottom: 1px solid var(--border); display: flex; align-items: center; gap: 10px; background: var(--text); color: white; }
  .week-badge { font-family: 'DM Mono', monospace; font-size: 11px; font-weight: 500; background: rgba(255,255,255,0.15); padding: 3px 8px; border-radius: 4px; }
  .week-dates { font-size: 13px; opacity: 0.6; }
  .week-grid-header { display: grid; grid-template-columns: 100px 100px 1fr 120px 220px; background: var(--bg); border-bottom: 1px solid var(--border); }
  .week-grid-header div { padding: 8px 16px; font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.7px; color: var(--muted); border-right: 1px solid var(--border); }
  .week-grid-header div:last-child { border-right: none; }
  .week-row { display: grid; grid-template-columns: 100px 100px 1fr 120px 220px; border-bottom: 1px solid var(--border); align-items: stretch; min-height: 52px; cursor: pointer; }
  .week-row:last-child { border-bottom: none; }
  .week-row:hover { background: var(--bg); }
  .week-cell { padding: 12px 16px; border-right: 1px solid var(--border); display: flex; align-items: center; font-size: 13px; }
  .week-cell:last-child { border-right: none; }
  .week-day-name { font-weight: 600; }
  .week-date-val { font-family: 'DM Mono', monospace; font-size: 12px; color: var(--muted); }
  .owner-badge { padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 600; letter-spacing: 0.3px; }
  ${config.owners.map(o => `.owner-badge.${o.key} { background: var(--${o.key}-light); color: var(--${o.key}); border: 1px solid var(--${o.key}-mid); }`).join('\n  ')}
  .type-tag { display: inline-block; font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; padding: 2px 7px; border-radius: 3px; margin-bottom: 3px; }
  .content-title { font-size: 13px; font-weight: 500; line-height: 1.4; color: var(--text); }
  .content-title.tbc { color: var(--muted); font-style: italic; font-weight: 400; }
  .caption-preview { font-size: 11px; color: var(--muted); line-height: 1.3; margin-top: 2px; }
  .status-pill { padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.4px; display: inline-flex; align-items: center; gap: 5px; }
  .status-pill.approved { background: var(--approved-light); color: var(--approved); }
  .status-pill.pending_review { background: var(--pending-light); color: var(--pending); }
  .status-pill.draft { background: var(--draft-light); color: var(--draft); border: 1px solid var(--border); }
  .status-pill.changes_requested { background: #FEF2F2; color: #EF4444; }
  .platforms-cell { display: flex; flex-wrap: wrap; gap: 3px; align-items: center; }
  .platform-dot { width: 22px; height: 22px; border-radius: 5px; display: flex; align-items: center; justify-content: center; font-size: 9px; font-weight: 700; border: 1px solid var(--border); color: var(--muted); cursor: pointer; transition: all 0.1s; background: var(--bg); }
  .platform-dot.posted { background: var(--approved); color: white; border-color: var(--approved); }

  /* DAY VIEW */
  .day-nav { display: flex; align-items: center; gap: 8px; margin-bottom: 16px; }
  .day-scroll { display: flex; gap: 8px; overflow-x: auto; flex: 1; padding-bottom: 4px; }
  .day-scroll::-webkit-scrollbar { height: 3px; }
  .day-scroll::-webkit-scrollbar-track { background: var(--bg); }
  .day-scroll::-webkit-scrollbar-thumb { background: var(--border); border-radius: 2px; }
  .day-pill { flex-shrink: 0; padding: 8px 16px; border: 1px solid var(--border); border-radius: var(--radius-sm); background: var(--surface); cursor: pointer; font-family: 'DM Sans', sans-serif; font-size: 12px; font-weight: 500; color: var(--muted); transition: all 0.15s; text-align: center; min-width: 72px; }
  .day-pill:hover { border-color: var(--text); color: var(--text); }
  .day-pill.active { background: var(--text); border-color: var(--text); color: white; }
  .day-pill-name { font-weight: 600; font-size: 13px; }
  .day-pill-date { font-size: 11px; opacity: 0.6; margin-top: 1px; }
  .day-card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); overflow: hidden; }
  .day-card-header { padding: 16px 24px; border-bottom: 2px solid var(--border); display: flex; align-items: center; justify-content: space-between; }
  .day-card-title { font-size: 18px; font-weight: 700; letter-spacing: -0.4px; }
  .day-card-date { font-family: 'DM Mono', monospace; font-size: 12px; color: var(--muted); margin-top: 2px; }
  .day-content { padding: 24px; }
  .day-detail-row { display: flex; gap: 12px; margin-bottom: 16px; }
  .day-detail-label { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.6px; color: var(--muted); width: 90px; flex-shrink: 0; padding-top: 2px; }
  .day-detail-value { font-size: 14px; font-weight: 500; flex: 1; }
  .day-platforms { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 20px; padding-top: 20px; border-top: 1px solid var(--border); }
  .platform-toggle { display: flex; align-items: center; gap: 6px; padding: 6px 12px; border: 1.5px solid var(--border); border-radius: var(--radius-sm); cursor: pointer; font-size: 12px; font-weight: 600; color: var(--muted); background: var(--bg); transition: all 0.15s; user-select: none; }
  .platform-toggle.posted { background: var(--approved-light); border-color: var(--approved); color: var(--approved); }
  .platform-toggle:hover { border-color: var(--approved); color: var(--approved); }
  .platform-check { width: 14px; height: 14px; border: 1.5px solid currentColor; border-radius: 3px; display: flex; align-items: center; justify-content: center; }
  .platform-toggle.posted .platform-check::after { content: '\\2713'; font-size: 10px; line-height: 1; }
  .approve-section { margin-top: 20px; padding-top: 20px; border-top: 1px solid var(--border); display: flex; align-items: center; justify-content: space-between; }
  .approve-btn { padding: 10px 20px; border-radius: var(--radius-sm); font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 600; cursor: pointer; border: 2px solid transparent; transition: all 0.15s; }
  .approve-btn.approve { background: var(--approved); color: white; }
  .approve-btn.approve:hover { background: #047857; }
  .approve-btn.unapprove { background: transparent; border-color: var(--border); color: var(--muted); }
  .approve-btn.unapprove:hover { border-color: var(--pending); color: var(--pending); }
  .approve-btn.send-review { background: var(--pending); color: white; }
  .approve-btn.send-review:hover { background: #B45309; }
  .approved-badge { display: flex; align-items: center; gap: 8px; padding: 8px 16px; background: var(--approved-light); border: 1.5px solid var(--approved); border-radius: var(--radius-sm); color: var(--approved); font-weight: 600; font-size: 13px; }
  .changes-badge { display: flex; align-items: center; gap: 8px; padding: 8px 16px; background: #FEF2F2; border: 1.5px solid #EF4444; border-radius: var(--radius-sm); color: #EF4444; font-weight: 600; font-size: 13px; }
  .review-comment-text { font-size: 12px; color: #EF4444; margin-top: 8px; padding: 8px 12px; background: #FEF2F2; border-radius: var(--radius-sm); font-style: italic; }
  .empty-state { text-align: center; padding: 48px 24px; color: var(--muted); }
  .empty-icon { font-size: 32px; margin-bottom: 12px; }

  /* Multi-item day view */
  .day-cards-stack { display: flex; flex-direction: column; gap: 16px; }
  .add-item-btn { width: 100%; padding: 14px; border: 2px dashed var(--border); border-radius: var(--radius); background: transparent; cursor: pointer; font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 600; color: var(--muted); transition: all 0.15s; margin-top: 16px; }
  .add-item-btn:hover { border-color: var(--${config.owners[0]?.key || 'owner0'}); color: var(--${config.owners[0]?.key || 'owner0'}); background: var(--${config.owners[0]?.key || 'owner0'}-light); }
  .delete-item-btn { padding: 6px 12px; border: 1px solid var(--border); border-radius: var(--radius-sm); background: transparent; cursor: pointer; font-family: 'DM Sans', sans-serif; font-size: 11px; font-weight: 600; color: var(--muted); transition: all 0.15s; }
  .delete-item-btn:hover { border-color: #EF4444; color: #EF4444; background: #FEF2F2; }
  .item-number { font-family: 'DM Mono', monospace; font-size: 10px; font-weight: 500; padding: 2px 8px; border-radius: 4px; background: var(--bg); color: var(--muted); border: 1px solid var(--border); }

  /* Editable fields in day view */
  .day-edit-select { font-family: 'DM Sans', sans-serif; font-size: 14px; font-weight: 600; padding: 6px 10px; border: 1.5px solid var(--border); border-radius: var(--radius-sm); background: var(--surface); cursor: pointer; outline: none; transition: border-color 0.15s; }
  .day-edit-select:hover, .day-edit-select:focus { border-color: var(--${config.owners[0]?.key || 'owner0'}); }
  .day-edit-input, .day-edit-textarea { font-family: 'DM Sans', sans-serif; font-size: 15px; font-weight: 600; letter-spacing: -0.2px; padding: 6px 10px; border: 1.5px solid var(--border); border-radius: var(--radius-sm); background: var(--surface); width: 100%; outline: none; transition: border-color 0.15s; }
  .day-edit-input:hover, .day-edit-input:focus, .day-edit-textarea:hover, .day-edit-textarea:focus { border-color: var(--${config.owners[0]?.key || 'owner0'}); }
  .day-edit-input::placeholder, .day-edit-textarea::placeholder { color: var(--muted); font-style: italic; font-weight: 400; }
  .day-edit-textarea { font-size: 13px; font-weight: 400; min-height: 80px; resize: vertical; line-height: 1.5; }

  /* Loading overlay */
  .loading-overlay { position: fixed; inset: 0; background: rgba(247,246,242,0.85); display: flex; flex-direction: column; align-items: center; justify-content: center; z-index: 999; gap: 12px; }
  .loading-spinner { width: 36px; height: 36px; border: 3px solid var(--border); border-top-color: var(--${config.owners[0]?.key || 'owner0'}); border-radius: 50%; animation: spin 0.8s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }
  .loading-text { font-size: 13px; color: var(--muted); font-family: 'DM Mono', monospace; }

  @media (max-width: 768px) {
    .header { padding: 14px 16px; } .controls { padding: 10px 16px; flex-wrap: wrap; }
    .stats-bar { padding: 12px 16px; overflow-x: auto; } .main { padding: 0 16px 24px; }
    .legend { display: none; } .week-row { grid-template-columns: 90px 1fr 100px; }
    .week-cell:nth-child(2), .week-cell:nth-child(5) { display: none; }
  }
`;
}
