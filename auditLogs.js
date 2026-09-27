import { api } from '../api.js';
import { el, formatDate, escapeHtml } from '../ui.js';

export async function renderAuditLogs() {
  const root = el(`
    <div>
      <div class="portal-topbar">
        <div><h1>Audit log</h1><p class="muted">Logins, data access, and admin actions — restricted to authorised users.</p></div>
        <div class="toolbar">
          <input type="text" id="action-filter" placeholder="Filter by action, e.g. content.publish" />
        </div>
      </div>
      <div class="panel">
        <div class="panel-head"><h3>Recent events</h3></div>
        <div id="table-wrap"></div>
      </div>
    </div>
  `);

  const wrap = root.querySelector('#table-wrap');
  const filter = root.querySelector('#action-filter');
  let debounceTimer;

  async function load() {
    wrap.innerHTML = '<div class="loading-row">Loading\u2026</div>';
    const params = filter.value.trim() ? { action: filter.value.trim() } : {};
    const list = await api.listAuditLogs(params);
    renderTable(wrap, list);
  }

  filter.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(load, 300);
  });

  await load();
  return root;
}

function renderTable(wrap, list) {
  if (list.length === 0) {
    wrap.innerHTML = '<div class="empty-state">No matching events.</div>';
    return;
  }
  wrap.innerHTML = '';
  const table = el(`
    <table>
      <thead><tr><th>When</th><th>Actor</th><th>Action</th><th>Result</th></tr></thead>
      <tbody></tbody>
    </table>
  `);
  const tbody = table.querySelector('tbody');

  list.forEach((entry) => {
    const actorLabel =
      entry.actor === 'client' ? 'Client' : entry.actor === 'unknown' ? 'Unknown' : `${entry.actor.name} (${entry.actor.role})`;
    const row = el(`
      <tr>
        <td>${formatDate(entry.timestamp)}</td>
        <td>${escapeHtml(actorLabel)}</td>
        <td>${escapeHtml(entry.action)}</td>
        <td><span class="${entry.result === 'success' ? 'badge-ok' : 'badge-danger'} badge">${entry.result}</span></td>
      </tr>
    `);
    tbody.appendChild(row);
  });

  wrap.appendChild(table);
}
