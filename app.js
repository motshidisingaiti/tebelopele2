import { isAuthenticated, getUser, clearSession, hasRole } from './api.js';
import { el } from './ui.js';

import { renderChat } from './pages/chat.js';
import { renderLogin } from './pages/login.js';
import { renderOverview } from './pages/overview.js';
import { renderAppointments } from './pages/appointments.js';
import { renderConversations } from './pages/conversations.js';
import { renderReferrals } from './pages/referrals.js';
import { renderContent } from './pages/content.js';
import { renderKnowledgeBase } from './pages/knowledgeBase.js';
import { renderUsers } from './pages/users.js';
import { renderAuditLogs } from './pages/auditLogs.js';

const app = document.getElementById('app');

// Ensure a toast-root container exists once, outside the routed view.
if (!document.getElementById('toast-root')) {
  document.body.appendChild(el('<div id="toast-root"></div>'));
}

const PORTAL_ROUTES = [
  { path: 'overview', label: 'Overview', section: null, render: renderOverview, roles: null },
  { path: 'appointments', label: 'Appointments', section: null, render: renderAppointments, roles: ['admin', 'super_admin', 'appointment_manager', 'staff'] },
  { path: 'conversations', label: 'Conversations', section: null, render: renderConversations, roles: ['admin', 'super_admin', 'staff', 'clinical'] },
  { path: 'referrals', label: 'Referrals', section: null, render: renderReferrals, roles: ['admin', 'super_admin', 'referral_manager', 'staff'] },
  { path: 'content', label: 'Content library', section: 'Manage', render: renderContent, roles: ['admin', 'super_admin', 'content_manager'] },
  { path: 'knowledge-base', label: 'Knowledge base', section: null, render: renderKnowledgeBase, roles: ['admin', 'super_admin', 'content_manager'] },
  { path: 'users', label: 'Staff & access', section: 'Admin', render: renderUsers, roles: ['admin', 'super_admin'] },
  { path: 'audit-logs', label: 'Audit log', section: null, render: renderAuditLogs, roles: ['admin', 'super_admin'] },
];

function visibleRoutes() {
  return PORTAL_ROUTES.filter((r) => !r.roles || hasRole(...r.roles));
}

function renderPublicShell(bodyEl) {
  app.innerHTML = '';
  const shell = el(`
    <div class="public-shell">
      <header class="public-header">
        <a class="brand" href="#/">
          <span class="brand-mark"></span>
          <span class="brand-name">Tshedimoso <span>Connect</span></span>
        </a>
      </header>
      <main class="public-main"></main>
    </div>
  `);
  shell.querySelector('.public-main').appendChild(bodyEl);
  app.appendChild(shell);
}

function renderPortalShell(routePath) {
  const user = getUser();
  app.innerHTML = '';

  const nav = visibleRoutes()
    .map((r) => `
      <a class="nav-item${r.path === routePath ? ' active' : ''}" href="#/portal/${r.path}">${r.label}</a>
    `)
    .join('');

  const shell = el(`
    <div class="portal-shell">
      <nav class="portal-nav">
        <a class="brand" href="#/portal/overview">
          <span class="brand-mark"></span>
          <span class="brand-name">Tshedimoso <span>Portal</span></span>
        </a>
        ${nav}
        <div class="nav-user">
          <b>${user ? user.name : ''}</b>
          <span>${user ? user.role.replace('_', ' ') : ''}</span>
          <button id="logout-btn">Log out</button>
        </div>
      </nav>
      <main class="portal-main"></main>
    </div>
  `);

  shell.querySelector('#logout-btn').addEventListener('click', () => {
    clearSession();
    window.location.hash = '#/login';
  });

  app.appendChild(shell);
  return shell.querySelector('.portal-main');
}

async function route() {
  const hash = window.location.hash || '#/';
  const parts = hash.replace(/^#\//, '').split('/').filter(Boolean);

  // Public routes
  if (parts[0] === undefined || parts[0] === '') {
    renderPublicShell(renderChat());
    return;
  }
  if (parts[0] === 'login') {
    if (isAuthenticated()) {
      window.location.hash = '#/portal/overview';
      return;
    }
    renderPublicShell(renderLogin());
    return;
  }

  // Portal routes — require auth
  if (parts[0] === 'portal') {
    if (!isAuthenticated()) {
      window.location.hash = '#/login';
      return;
    }
    const routePath = parts[1] || 'overview';
    const routeDef = PORTAL_ROUTES.find((r) => r.path === routePath);

    if (!routeDef) {
      window.location.hash = '#/portal/overview';
      return;
    }
    if (routeDef.roles && !hasRole(...routeDef.roles)) {
      const main = renderPortalShell('overview');
      main.appendChild(el('<div class="panel"><div class="empty-state">You don\u2019t have access to this section.</div></div>'));
      return;
    }

    const main = renderPortalShell(routePath);
    main.appendChild(el('<div class="loading-row">Loading\u2026</div>'));
    try {
      const view = await routeDef.render();
      main.innerHTML = '';
      main.appendChild(view);
    } catch (err) {
      main.innerHTML = '';
      main.appendChild(el(`<div class="panel"><div class="empty-state">${err.message}</div></div>`));
    }
    return;
  }

  window.location.hash = '#/';
}

window.addEventListener('hashchange', route);
window.addEventListener('DOMContentLoaded', route);
route();
