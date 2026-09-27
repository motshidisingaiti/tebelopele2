import { api } from '../api.js';
import { el, formatDate, toast } from '../ui.js';

const STATUS_BADGE = { pending: 'badge-danger', claimed: 'badge-warn', resolved: 'badge-ok' };

export async function renderConversations() {
  const root = el(`
    <div>
      <div class="portal-topbar">
        <div><h1>Conversations</h1><p class="muted">Escalations the assistant has handed to a person.</p></div>
        <div class="toolbar">
          <select id="status-filter">
            <option value="">All statuses</option>
            <option value="pending" selected>Pending</option>
            <option value="claimed">Claimed</option>
            <option value="resolved">Resolved</option>
          </select>
        </div>
      </div>
      <div class="panel">
        <div class="panel-head"><h3>Escalation queue</h3></div>
        <div id="table-wrap"></div>
      </div>
    </div>
  `);

  const wrap = root.querySelector('#table-wrap');
  const filter = root.querySelector('#status-filter');

  async function load() {
    wrap.innerHTML = '<div class="loading-row">Loading\u2026</div>';
    const params = filter.value ? { status: filter.value } : {};
    const list = await api.listEscalations(params);
    renderTable(wrap, list, load);
  }

  filter.addEventListener('change', load);
  await load();
  return root;
}

function renderTable(wrap, list, reload) {
  if (list.length === 0) {
    wrap.innerHTML = '<div class="empty-state">Nothing waiting here.</div>';
    return;
  }
  wrap.innerHTML = '';
  const table = el(`
    <table>
      <thead><tr><th>Raised</th><th>Reason</th><th>Channel</th><th>Last message</th><th>Status</th><th></th></tr></thead>
      <tbody></tbody>
    </table>
  `);
  const tbody = table.querySelector('tbody');

  list.forEach((e) => {
    const lastMsg = (e.conversation?.messages || []).slice(-1)[0];
    const row = el(`
      <tr>
        <td>${formatDate(e.createdAt)}</td>
        <td>${e.reason}</td>
        <td>${e.conversation ? e.conversation.channel : '—'}</td>
        <td style="max-width:280px;">${lastMsg ? escapeCell(lastMsg.content) : '—'}</td>
        <td><span class="${STATUS_BADGE[e.status] || 'badge'}">${e.status}</span></td>
        <td></td>
      </tr>
    `);
    const actionsCell = row.lastElementChild;

    if (e.status === 'pending') {
      const claimBtn = el('<button class="btn btn-ghost btn-sm">Claim</button>');
      claimBtn.addEventListener('click', () => updateStatus(e.id, 'claimed', reload));
      actionsCell.appendChild(claimBtn);
    }
    if (e.status === 'claimed') {
      const resolveBtn = el('<button class="btn btn-primary btn-sm">Resolve</button>');
      resolveBtn.addEventListener('click', () => updateStatus(e.id, 'resolved', reload));
      actionsCell.appendChild(resolveBtn);
    }
    tbody.appendChild(row);
  });

  wrap.appendChild(table);
}

async function updateStatus(id, status, reload) {
  try {
    await api.updateEscalation(id, status);
    toast(`Escalation ${status}`);
    reload();
  } catch (err) {
    toast(err.message, { error: true });
  }
}

function escapeCell(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
