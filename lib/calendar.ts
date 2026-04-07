import type { WorkspaceConfig, CalendarApprovalRow } from './types';

interface CalendarItem {
  id: string;
  owner: string;
  day: string;
  week: string;
  date: string;
  slot: number;
  type: string;
  title: string;
  caption: string | null;
  status: string;
  reviewComment: string | null;
  platforms: Record<string, boolean>;
}

interface CalendarState {
  currentMonth: string;
  currentView: 'month' | 'week' | 'day';
  currentFilter: string;
  selectedDay: string | null;
  data: CalendarItem[];
  config: WorkspaceConfig;
  container: HTMLElement;
  pollInterval: ReturnType<typeof setInterval> | null;
}

function rowToItem(row: CalendarApprovalRow): CalendarItem {
  return {
    id: row.id,
    owner: row.owner,
    day: row.day,
    week: row.week,
    date: row.date,
    slot: row.slot,
    type: row.type,
    title: row.title,
    caption: row.caption,
    status: row.status || 'draft',
    reviewComment: row.review_comment,
    platforms: (row.platforms && typeof row.platforms === 'object') ? row.platforms : {},
  };
}

function esc(str: string): string {
  const d = document.createElement('div');
  d.textContent = str;
  return d.innerHTML;
}

function itemId(item: CalendarItem): string {
  return item.date + '-' + item.slot;
}

function getDayOrder(day: string): number {
  return ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'].indexOf(day);
}

function formatDate(dateStr: string): string {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

function getOwnerClass(config: WorkspaceConfig, ownerName: string): string {
  const owner = config.owners.find(o => o.name === ownerName);
  return owner ? owner.key : config.owners[0]?.key || 'default';
}

function getStatusClass(item: CalendarItem): string {
  return item.status;
}

function getStatusLabel(item: CalendarItem): string {
  switch (item.status) {
    case 'approved': return '✓ Approved';
    case 'pending_review': return 'Pending Review';
    case 'changes_requested': return 'Changes Requested';
    default: return 'Draft';
  }
}

function getTypeColor(config: WorkspaceConfig, type: string): string {
  return config.typeColors[type] || '#6B7280';
}

export function initCalendar(
  container: HTMLElement,
  config: WorkspaceConfig,
  initialData: CalendarApprovalRow[]
): () => void {
  const state: CalendarState = {
    currentMonth: new Date().toISOString().slice(0, 7),
    currentView: 'month',
    currentFilter: 'all',
    selectedDay: null,
    data: initialData.map(rowToItem),
    config,
    container,
    pollInterval: null,
  };

  // If initial data has items, use the month from the first item
  if (initialData.length > 0) {
    state.currentMonth = initialData[0].month;
  }

  // API helpers
  async function apiGet(month: string): Promise<CalendarApprovalRow[]> {
    const res = await fetch(`/api/calendar?workspace=${config.slug}&month=${month}`);
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    return res.json();
  }

  async function apiUpsert(item: CalendarItem, extraChanges?: Record<string, unknown>): Promise<boolean> {
    const res = await fetch('/api/calendar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        workspace: config.slug,
        id: itemId(item),
        month: state.currentMonth,
        owner: item.owner,
        day: item.day,
        week: item.week,
        date: item.date,
        slot: item.slot,
        type: item.type,
        title: item.title,
        caption: item.caption,
        status: item.status,
        review_comment: item.reviewComment,
        platforms: item.platforms,
        ...extraChanges,
      }),
    });
    return res.ok;
  }

  async function apiDelete(id: string): Promise<boolean> {
    const res = await fetch(`/api/calendar?workspace=${config.slug}&id=${id}`, { method: 'DELETE' });
    return res.ok;
  }

  // Sync status
  function setSyncStatus(status: string, text: string) {
    const dot = container.querySelector('#syncDot') as HTMLElement;
    const label = container.querySelector('#syncText') as HTMLElement;
    if (dot) dot.className = 'sync-dot ' + status;
    if (label) label.textContent = text;
  }

  // Data loading
  async function loadData() {
    setSyncStatus('syncing', 'Syncing…');
    try {
      const rows = await apiGet(state.currentMonth);
      state.data = rows.map(rowToItem);
      setSyncStatus('synced', 'Live');
      const overlay = container.querySelector('#loadingOverlay') as HTMLElement;
      if (overlay) overlay.style.display = 'none';
      render();
    } catch {
      setSyncStatus('error', 'Offline');
      const overlay = container.querySelector('#loadingOverlay') as HTMLElement;
      if (overlay) overlay.style.display = 'none';
      render();
    }
  }

  async function saveItem(item: CalendarItem, extraChanges?: Record<string, unknown>) {
    setSyncStatus('syncing', 'Saving…');
    const ok = await apiUpsert(item, extraChanges);
    if (ok) {
      setSyncStatus('synced', 'Saved ✓');
      setTimeout(() => setSyncStatus('synced', 'Live'), 2000);
    } else {
      setSyncStatus('error', 'Save failed');
    }
    return ok;
  }

  // Helpers
  function getWeeks(): Record<string, CalendarItem[]> {
    const weeks: Record<string, CalendarItem[]> = {};
    state.data.forEach(item => {
      if (!weeks[item.week]) weeks[item.week] = [];
      weeks[item.week].push(item);
    });
    return weeks;
  }

  function filteredData(): CalendarItem[] {
    return state.data.filter(item => {
      if (state.currentFilter === 'all') return true;
      // Check if filter matches an owner key
      const ownerMatch = config.owners.find(o => o.key === state.currentFilter);
      if (ownerMatch) return item.owner === ownerMatch.name;
      if (state.currentFilter === 'pending') return item.status === 'pending_review';
      return true;
    });
  }

  // Render stats
  function renderStats() {
    const approved = state.data.filter(d => d.status === 'approved').length;
    const pending = state.data.filter(d => d.status === 'pending_review').length;
    const changes = state.data.filter(d => d.status === 'changes_requested').length;

    const ownerStats = config.owners.map(o => {
      const count = state.data.filter(d => d.owner === o.name).length;
      return `<div class="stat-card ${o.key}"><div class="stat-value">${count}</div><div class="stat-label">${o.name}</div></div>`;
    }).join('');

    const statsBar = container.querySelector('#statsBar');
    if (statsBar) {
      statsBar.innerHTML = `
        <div class="stat-card approved"><div class="stat-value">${approved}</div><div class="stat-label">Approved</div></div>
        <div class="stat-card pending"><div class="stat-value">${pending}</div><div class="stat-label">Pending Review</div></div>
        ${changes > 0 ? `<div class="stat-card" style="border-color:#FCA5A5"><div class="stat-value" style="color:#EF4444">${changes}</div><div class="stat-label">Changes Req.</div></div>` : ''}
        <div class="stat-card"><div class="stat-value">${state.data.length}</div><div class="stat-label">Total Pieces</div></div>
        ${ownerStats}`;
    }
  }

  // Month view
  function renderMonthView() {
    const weeks = getWeeks();
    const fd = filteredData();
    const fdSet = new Set(fd.map(i => itemId(i)));
    const days = ['Monday','Tuesday','Wednesday','Thursday','Friday'];
    let html = `<div class="month-view"><div class="month-grid-header">${days.map(d => `<div class="day-header">${d}</div>`).join('')}</div><div class="month-weeks">`;
    Object.entries(weeks).forEach(([wk, items]) => {
      html += `<div class="month-week">`;
      days.forEach(day => {
        const dayItems = items.filter(i => i.day === day && fdSet.has(itemId(i)));
        if (!dayItems.length) { html += `<div class="month-cell"></div>`; return; }
        const date = dayItems[0].date;
        const pillsHtml = dayItems.map(item => {
          const sc = getStatusClass(item);
          const short = item.title.length > 40 ? item.title.slice(0, 38) + '…' : item.title;
          return `<div class="cell-pill ${getOwnerClass(config, item.owner)}" title="${esc(item.title)}">
            <div class="pill-dot"></div>
            <span style="flex:1;min-width:0">
              <span style="font-size:9px;font-weight:600;opacity:0.6;text-transform:uppercase;letter-spacing:0.4px;display:block">${esc(item.type)}</span>
              <span ${item.title === 'TBC' ? 'style="font-style:italic;opacity:0.6"' : ''}>${esc(short)}</span>
            </span>
            <div class="status-dot ${sc}"></div>
          </div>`;
        }).join('');
        html += `<div class="month-cell" data-action="showDay" data-date="${date}">
          <div class="cell-date"><span>${formatDate(date)}</span><span style="font-size:9px;color:var(--muted)">${wk}</span></div>
          ${pillsHtml}
        </div>`;
      });
      html += `</div>`;
    });
    html += `</div></div>`;
    const main = container.querySelector('#mainContent');
    if (main) main.innerHTML = html;
  }

  // Week view
  function renderWeekView() {
    const weeks = getWeeks();
    const fdIds = new Set(filteredData().map(i => itemId(i)));
    let html = `<div class="week-view">`;
    Object.entries(weeks).forEach(([wk, items]) => {
      const sorted = items.sort((a, b) => getDayOrder(a.day) - getDayOrder(b.day) || a.slot - b.slot).filter(i => fdIds.has(itemId(i)));
      if (!sorted.length) return;
      const dates = sorted.map(i => formatDate(i.date));
      html += `<div class="week-section">
        <div class="week-header"><span class="week-badge">${wk}</span><span class="week-dates">${dates[0]} – ${dates[dates.length - 1]}</span></div>
        <div class="week-grid-header"><div>Day</div><div>Date</div><div>Content</div><div>Status</div><div>Platforms</div></div>`;
      sorted.forEach(item => {
        const plats = config.platforms.map(p => `<div class="platform-dot ${item.platforms[p] ? 'posted' : ''}" data-action="togglePlatform" data-date="${item.date}" data-slot="${item.slot}" data-platform="${p}" title="${p}">${p[0]}</div>`).join('');
        const captionPreview = item.caption ? `<div class="caption-preview">${esc(item.caption.length > 60 ? item.caption.slice(0, 58) + '…' : item.caption)}</div>` : '';
        html += `<div class="week-row" data-action="showDay" data-date="${item.date}">
          <div class="week-cell"><div><div class="week-day-name">${item.day}</div><div style="margin-top:2px"><span class="owner-badge ${getOwnerClass(config, item.owner)}">${item.owner}</span></div></div></div>
          <div class="week-cell"><span class="week-date-val">${formatDate(item.date)}</span></div>
          <div class="week-cell" style="flex-direction:column;align-items:flex-start;gap:3px">
            <span class="type-tag" style="color:${getTypeColor(config, item.type)};border:1px solid ${getTypeColor(config, item.type)}20;background:${getTypeColor(config, item.type)}10">${esc(item.type)}</span>
            <div class="content-title ${item.title === 'TBC' ? 'tbc' : ''}">${esc(item.title)}</div>
            ${captionPreview}
          </div>
          <div class="week-cell"><span class="status-pill ${getStatusClass(item)}">${getStatusLabel(item)}</span></div>
          <div class="week-cell"><div class="platforms-cell">${plats}</div></div>
        </div>`;
      });
      html += `</div>`;
    });
    html += `</div>`;
    const main = container.querySelector('#mainContent');
    if (main) main.innerHTML = html;
  }

  // Day view
  function renderDayView() {
    const fd = filteredData().sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    if (!state.selectedDay && fd.length) state.selectedDay = fd[0].date;

    const seenDates = new Set<string>();
    const pills = fd.filter(item => { if (seenDates.has(item.date)) return false; seenDates.add(item.date); return true; }).map(item => {
      const d = new Date(item.date + 'T00:00:00');
      return `<div class="day-pill ${item.date === state.selectedDay ? 'active' : ''}" data-action="selectDay" data-date="${item.date}">
        <div class="day-pill-name">${d.toLocaleDateString('en-GB', { weekday: 'short' })}</div>
        <div class="day-pill-date">${d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</div>
      </div>`;
    }).join('');

    const dayItems = state.data.filter(i => i.date === state.selectedDay).sort((a, b) => a.slot - b.slot);
    let detail = '';
    if (dayItems.length) {
      const cards = dayItems.map((item, idx) => {
        const plats = config.platforms.map(p => `<div class="platform-toggle ${item.platforms[p] ? 'posted' : ''}" data-action="togglePlatform" data-date="${item.date}" data-slot="${item.slot}" data-platform="${p}"><div class="platform-check"></div>${p}</div>`).join('');

        let approveSection = '';
        if (item.status === 'draft') {
          approveSection = `<div class="approve-section">
            <div style="color:var(--muted);font-size:13px">Draft — not yet sent for review</div>
            <button class="approve-btn send-review" data-action="sendForReview" data-date="${item.date}" data-slot="${item.slot}">Send for Review</button>
          </div>`;
        } else if (item.status === 'approved') {
          approveSection = `<div class="approve-section">
            <div class="approved-badge">✓ Approved</div>
            <button class="approve-btn unapprove" data-action="setStatus" data-date="${item.date}" data-slot="${item.slot}" data-status="pending_review">Revoke Approval</button>
          </div>`;
        } else if (item.status === 'changes_requested') {
          approveSection = `<div class="approve-section">
            <div class="changes-badge">Changes Requested</div>
            <button class="approve-btn send-review" data-action="setStatus" data-date="${item.date}" data-slot="${item.slot}" data-status="pending_review">Re-send for Review</button>
          </div>
          ${item.reviewComment ? `<div class="review-comment-text">"${esc(item.reviewComment)}"</div>` : ''}`;
        } else {
          approveSection = `<div class="approve-section">
            <div style="color:var(--muted);font-size:13px">Pending client review</div>
            <button class="approve-btn approve" data-action="setStatus" data-date="${item.date}" data-slot="${item.slot}" data-status="approved">✓ Mark as Approved</button>
          </div>`;
        }

        const deleteBtn = item.slot > 0 ? `<button class="delete-item-btn" data-action="deleteItem" data-date="${item.date}" data-slot="${item.slot}">Delete</button>` : '';

        return `<div class="day-card">
          <div class="day-card-header">
            <div>
              <div style="display:flex;align-items:center;gap:8px"><div class="day-card-title">${item.day}</div><span class="item-number">Item ${idx + 1}</span></div>
              <div class="day-card-date">${formatDate(item.date)} · ${item.week}</div>
            </div>
            <div style="display:flex;gap:8px;align-items:center">${deleteBtn}<span class="owner-badge ${getOwnerClass(config, item.owner)}">${item.owner}</span><span class="status-pill ${getStatusClass(item)}">${getStatusLabel(item)}</span></div>
          </div>
          <div class="day-content">
            <div class="day-detail-row"><div class="day-detail-label">Type</div><div class="day-detail-value">
              <select class="day-edit-select" style="color:${getTypeColor(config, item.type)}" data-action="updateType" data-date="${item.date}" data-slot="${item.slot}">
                ${config.contentTypes.map(t => `<option value="${t}" ${t === item.type ? 'selected' : ''}>${t}</option>`).join('')}
              </select>
            </div></div>
            <div class="day-detail-row"><div class="day-detail-label">Title</div><div class="day-detail-value">
              <input class="day-edit-input" value="${esc(item.title)}" placeholder="Enter title…" data-action="updateTitle" data-date="${item.date}" data-slot="${item.slot}">
            </div></div>
            <div class="day-detail-row"><div class="day-detail-label">Caption</div><div class="day-detail-value">
              <textarea class="day-edit-textarea" placeholder="Enter post caption/body…" data-action="updateCaption" data-date="${item.date}" data-slot="${item.slot}">${esc(item.caption || '')}</textarea>
            </div></div>
            <div style="margin-top:16px"><div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.6px;color:var(--muted);margin-bottom:10px">Platform Publishing</div><div class="day-platforms">${plats}</div></div>
            ${approveSection}
          </div>
        </div>`;
      }).join('');
      detail = `<div class="day-cards-stack">${cards}</div><button class="add-item-btn" data-action="addItem" data-date="${state.selectedDay}">+ Add Content</button>`;
    }
    const main = container.querySelector('#mainContent');
    if (main) main.innerHTML = `<div class="day-nav"><div class="day-scroll">${pills}</div></div>${detail}`;
  }

  // Main render
  function render() {
    const [y, m] = state.currentMonth.split('-').map(Number);
    const label = container.querySelector('#monthLabel');
    if (label) label.textContent = new Date(y, m - 1, 1).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
    renderStats();
    if (state.currentView === 'month') renderMonthView();
    else if (state.currentView === 'week') renderWeekView();
    else renderDayView();
  }

  // Event handlers via delegation
  function handleClick(e: Event) {
    const target = (e.target as HTMLElement).closest('[data-action]') as HTMLElement;
    if (!target) return;
    const action = target.dataset.action;
    const date = target.dataset.date;
    const slot = target.dataset.slot ? parseInt(target.dataset.slot) : undefined;

    switch (action) {
      case 'showDay':
        if (date) {
          state.selectedDay = date;
          state.currentView = 'day';
          container.querySelectorAll('.view-tab').forEach((t, i) => t.classList.toggle('active', i === 2));
          render();
        }
        break;

      case 'selectDay':
        if (date) {
          state.selectedDay = date;
          renderDayView();
        }
        break;

      case 'changeMonth': {
        const dir = parseInt(target.dataset.dir || '0');
        const [cy, cm] = state.currentMonth.split('-').map(Number);
        let nm = cm + dir, ny = cy;
        if (nm > 12) { nm = 1; ny++; } if (nm < 1) { nm = 12; ny--; }
        state.currentMonth = `${ny}-${String(nm).padStart(2, '0')}`;
        state.selectedDay = null;
        loadData();
        break;
      }

      case 'setView': {
        const view = target.dataset.view as 'month' | 'week' | 'day';
        if (view) {
          state.currentView = view;
          container.querySelectorAll('.view-tab').forEach(t => t.classList.remove('active'));
          target.classList.add('active');
          render();
        }
        break;
      }

      case 'setFilter': {
        const filter = target.dataset.filter;
        if (filter) {
          state.currentFilter = filter;
          container.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
          target.classList.add('active');
          render();
        }
        break;
      }

      case 'togglePlatform': {
        e.stopPropagation();
        if (date && slot !== undefined) {
          const item = state.data.find(i => i.date === date && i.slot === slot);
          if (item) {
            const platform = target.dataset.platform!;
            item.platforms[platform] = !item.platforms[platform];
            render();
            saveItem(item);
          }
        }
        break;
      }

      case 'setStatus': {
        if (date && slot !== undefined) {
          const item = state.data.find(i => i.date === date && i.slot === slot);
          if (item) {
            item.status = target.dataset.status!;
            render();
            saveItem(item);
          }
        }
        break;
      }

      case 'sendForReview': {
        if (date && slot !== undefined) {
          const item = state.data.find(i => i.date === date && i.slot === slot);
          if (item) {
            item.status = 'pending_review';
            render();
            saveItem(item);
            // Fire review ready email for this workspace
            fetch('/api/calendar/notify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ workspace: config.slug, action: 'review_ready' }),
            }).catch(() => {});
          }
        }
        break;
      }

      case 'addItem': {
        if (date) {
          const existing = state.data.filter(i => i.date === date);
          if (!existing.length) return;
          const maxSlot = existing.reduce((max, i) => Math.max(max, i.slot), -1);
          const baseItem = existing.find(i => i.slot === 0) || existing[0];
          const newItem: CalendarItem = {
            id: date + '-' + (maxSlot + 1),
            week: baseItem.week, day: baseItem.day,
            date, slot: maxSlot + 1, owner: baseItem.owner,
            type: config.contentTypes[0] || 'Blog', title: '', caption: null,
            status: 'draft', reviewComment: null,
            platforms: Object.fromEntries(config.platforms.map(p => [p, false])),
          };
          state.data.push(newItem);
          render();
          saveItem(newItem).then(ok => {
            if (!ok) {
              const idx = state.data.findIndex(i => i.date === date && i.slot === newItem.slot);
              if (idx !== -1) state.data.splice(idx, 1);
              render();
            }
          });
        }
        break;
      }

      case 'deleteItem': {
        if (date && slot !== undefined && slot > 0) {
          if (!confirm('Delete this content item?')) return;
          const idx = state.data.findIndex(i => i.date === date && i.slot === slot);
          if (idx === -1) return;
          const id = itemId(state.data[idx]);
          setSyncStatus('syncing', 'Deleting…');
          apiDelete(id).then(ok => {
            if (ok) {
              state.data.splice(idx, 1);
              render();
              setSyncStatus('synced', 'Deleted ✓');
              setTimeout(() => setSyncStatus('synced', 'Live'), 2000);
            } else {
              setSyncStatus('error', 'Delete failed');
            }
          });
        }
        break;
      }
    }
  }

  // Change handlers for inputs
  function handleChange(e: Event) {
    const target = e.target as HTMLElement;
    const action = target.dataset.action;
    const date = target.dataset.date;
    const slot = target.dataset.slot ? parseInt(target.dataset.slot) : undefined;

    if (!action || !date || slot === undefined) return;
    const item = state.data.find(i => i.date === date && i.slot === slot);
    if (!item) return;

    if (action === 'updateType') {
      const newType = (target as HTMLSelectElement).value;
      if (item.type === newType) return;
      item.type = newType;
      renderStats();
      saveItem(item);
    } else if (action === 'updateTitle') {
      const newTitle = (target as HTMLInputElement).value;
      if (item.title === newTitle) return;
      item.title = newTitle;
      saveItem(item);
    } else if (action === 'updateCaption') {
      const newCaption = (target as HTMLTextAreaElement).value;
      if (item.caption === newCaption) return;
      item.caption = newCaption || null;
      saveItem(item);
    }
  }

  // Build the HTML shell
  function buildShell() {
    const legendItems = config.owners.map(o =>
      `<div class="legend-item"><div class="legend-dot" style="background:var(--${o.key})"></div>${o.name}</div>`
    ).join('');

    const filterChips = [
      `<button class="filter-chip active" data-action="setFilter" data-filter="all">All</button>`,
      ...config.owners.map(o =>
        `<button class="filter-chip" data-action="setFilter" data-filter="${o.key}">${o.name}</button>`
      ),
      `<button class="filter-chip" data-action="setFilter" data-filter="pending">Pending Review</button>`,
    ].join('');

    container.innerHTML = `
      <div id="loadingOverlay" class="loading-overlay">
        <div class="loading-spinner"></div>
        <div class="loading-text">Loading calendar…</div>
      </div>
      <div class="header">
        <div class="header-left">
          <div class="logo">
            <div class="logo-mark">${esc(config.logoMark)}</div>
            <div>
              <div style="font-size:15px;font-weight:700;letter-spacing:-0.3px;">${esc(config.name)}</div>
              <div class="header-sub">Content Calendar</div>
            </div>
          </div>
        </div>
        <div style="display:flex;align-items:center;gap:20px">
          <div class="legend">
            ${legendItems}
            <div class="legend-item"><div class="legend-dot" style="background:var(--approved)"></div>Approved</div>
            <div class="legend-item"><div class="legend-dot" style="background:var(--pending)"></div>Pending</div>
          </div>
          <div class="sync-badge" id="syncBadge">
            <div class="sync-dot syncing" id="syncDot"></div>
            <span id="syncText">Connecting…</span>
          </div>
        </div>
      </div>
      <div class="controls">
        <div class="controls-left">
          <div class="month-nav">
            <button class="month-btn" data-action="changeMonth" data-dir="-1">‹</button>
            <div class="month-label" id="monthLabel"></div>
            <button class="month-btn" data-action="changeMonth" data-dir="1">›</button>
          </div>
          <div class="view-tabs">
            <button class="view-tab active" data-action="setView" data-view="month">Month</button>
            <button class="view-tab" data-action="setView" data-view="week">Week</button>
            <button class="view-tab" data-action="setView" data-view="day">Day</button>
          </div>
        </div>
        <div class="filter-bar">${filterChips}</div>
      </div>
      <div class="stats-bar" id="statsBar"></div>
      <div class="main" id="mainContent"></div>
    `;
  }

  // Initialize
  buildShell();
  container.addEventListener('click', handleClick);
  container.addEventListener('change', handleChange);
  container.addEventListener('blur', (e) => {
    const target = e.target as HTMLElement;
    if (target.dataset.action === 'updateTitle' || target.dataset.action === 'updateCaption') {
      handleChange(e);
    }
  }, true);

  // Handle Enter key on title input
  container.addEventListener('keydown', (e) => {
    const target = e.target as HTMLElement;
    if ((e as KeyboardEvent).key === 'Enter' && target.dataset.action === 'updateTitle') {
      (target as HTMLInputElement).blur();
    }
  });

  // Initial render (data already loaded from server component)
  const overlay = container.querySelector('#loadingOverlay') as HTMLElement;
  if (overlay) overlay.style.display = 'none';
  setSyncStatus('synced', 'Live');
  render();

  // Poll for changes every 30 seconds
  state.pollInterval = setInterval(async () => {
    try {
      const rows = await apiGet(state.currentMonth);
      const newData = rows.map(rowToItem);
      const oldJson = JSON.stringify(state.data.map(i => ({ ...i })));
      const newJson = JSON.stringify(newData);
      if (oldJson !== newJson) {
        const isEditing = document.activeElement && (
          document.activeElement.classList.contains('day-edit-input') ||
          document.activeElement.classList.contains('day-edit-select') ||
          document.activeElement.classList.contains('day-edit-textarea')
        );
        if (!isEditing) {
          state.data = newData;
          render();
        }
      }
    } catch {
      setSyncStatus('error', 'Sync failed');
    }
  }, 30000);

  // Return cleanup function
  return () => {
    if (state.pollInterval) clearInterval(state.pollInterval);
    container.removeEventListener('click', handleClick);
    container.removeEventListener('change', handleChange);
  };
}
