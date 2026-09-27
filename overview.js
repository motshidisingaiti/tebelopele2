import { api, getUser } from '../api.js';
import { el } from '../ui.js';

export async function renderOverview() {
  const [kpis, topics, channels] = await Promise.all([
    api.getOverview(),
    api.getTopics().catch(() => ({})),
    api.getChannels().catch(() => ({})),
  ]);
  const user = getUser();

  const root = el(`
    <div>
      <div class="portal-topbar">
        <div>
          <h1>Overview</h1>
          <p class="muted">Welcome back, ${user ? user.name : ''}.</p>
        </div>
      </div>

      <div class="kpi-row">
        <div class="kpi"><b>${kpis.conversations}</b><span>Conversations</span></div>
        <div class="kpi"><b>${kpis.appointmentsBooked}</b><span>Appointments booked</span></div>
        <div class="kpi"><b>${kpis.escalationsPending}</b><span>Escalations pending</span></div>
        <div class="kpi"><b>${kpis.referralsOpen}</b><span>Referrals open</span></div>
        <div class="kpi"><b>${kpis.reminderDeliveryRatePct === null ? '—' : kpis.reminderDeliveryRatePct + '%'}</b><span>Reminder delivery</span></div>
      </div>

      <div class="panel">
        <div class="panel-head"><h3>Conversation topics</h3></div>
        <div id="topics-body"></div>
      </div>

      <div class="panel">
        <div class="panel-head"><h3>Channels</h3></div>
        <div id="channels-body"></div>
      </div>
    </div>
  `);

  fillBreakdown(root.querySelector('#topics-body'), topics, 'topic');
  fillBreakdown(root.querySelector('#channels-body'), channels, 'channel');

  return root;
}

function fillBreakdown(container, counts, label) {
  const entries = Object.entries(counts || {});
  if (entries.length === 0) {
    container.appendChild(el(`<div class="empty-state">No ${label} data yet.</div>`));
    return;
  }
  const table = el(`
    <table>
      <thead><tr><th>${label[0].toUpperCase() + label.slice(1)}</th><th>Count</th></tr></thead>
      <tbody>
        ${entries
          .sort((a, b) => b[1] - a[1])
          .map(([k, v]) => `<tr><td>${k}</td><td>${v}</td></tr>`)
          .join('')}
      </tbody>
    </table>
  `);
  container.appendChild(table);
}
