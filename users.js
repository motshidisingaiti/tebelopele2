import { api } from '../api.js';
import { el, toast, openModal, closeModal, escapeHtml } from '../ui.js';

const ROLES = ['content_manager', 'appointment_manager', 'referral_manager', 'clinical', 'staff', 'admin', 'super_admin'];

export async function renderUsers() {
  const root = el(`
    <div>
      <div class="portal-topbar">
        <div><h1>Staff &amp; access</h1><p class="muted">Accounts and roles for the administration portal.</p></div>
        <button class="btn btn-primary" id="new-btn">New account</button>
      </div>
      <div class="panel">
        <div class="panel-head"><h3>Accounts</h3></div>
        <div id="table-wrap"></div>
      </div>
    </div>
  `);

  const wrap = root.querySelector('#table-wrap');

  async function load() {
    wrap.innerHTML = '<div class="loading-row">Loading\u2026</div>';
    const list = await api.listUsers();
    renderTable(wrap, list, load);
  }

  root.querySelector('#new-btn').addEventListener('click', () => openCreateModal(load));
  await load();
  return root;
}

function renderTable(wrap, list, reload) {
  wrap.innerHTML = '';
  const table = el(`
    <table>
      <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>MFA</th><th>Status</th><th></th></tr></thead>
      <tbody></tbody>
    </table>
  `);
  const tbody = table.querySelector('tbody');

  list.forEach((u) => {
    const row = el(`
      <tr>
        <td>${escapeHtml(u.name)}</td>
        <td>${escapeHtml(u.email)}</td>
        <td>${u.role.replace('_', ' ')}</td>
        <td>${u.mfaEnabled ? '<span class="badge-ok badge">on</span>' : '<span class="badge">off</span>'}</td>
        <td>${u.status === 'active' ? '<span class="badge-ok badge">active</span>' : '<span class="badge-danger badge">suspended</span>'}</td>
        <td></td>
      </tr>
    `);
    const toggleBtn = el(
      `<button class="btn btn-sm ${u.status === 'active' ? 'btn-danger' : 'btn-ghost'}">${u.status === 'active' ? 'Suspend' : 'Reactivate'}</button>`
    );
    toggleBtn.addEventListener('click', async () => {
      try {
        await api.updateUser(u.id, { status: u.status === 'active' ? 'suspended' : 'active' });
        toast('Account updated');
        reload();
      } catch (err) {
        toast(err.message, { error: true });
      }
    });
    row.lastElementChild.appendChild(toggleBtn);
    tbody.appendChild(row);
  });

  wrap.appendChild(table);
}

function openCreateModal(reload) {
  const { backdrop, content } = openModal(`
    <h3>New staff account</h3>
    <form id="user-form">
      <div class="field">
        <label for="name">Full name</label>
        <input type="text" id="name" required />
      </div>
      <div class="field">
        <label for="email">Email</label>
        <input type="email" id="email" required />
      </div>
      <div class="field">
        <label for="password">Temporary password</label>
        <input type="password" id="password" required />
      </div>
      <div class="field">
        <label for="role">Role</label>
        <select id="role">
          ${ROLES.map((r) => `<option value="${r}">${r.replace('_', ' ')}</option>`).join('')}
        </select>
        <p class="field-hint">Admin and super_admin accounts require MFA per platform policy.</p>
      </div>
      <div class="modal-actions">
        <button type="button" class="btn btn-ghost" id="cancel-btn">Cancel</button>
        <button type="submit" class="btn btn-primary">Create account</button>
      </div>
    </form>
  `);

  content.querySelector('#cancel-btn').addEventListener('click', () => closeModal(backdrop));
  content.querySelector('#user-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = {
      name: content.querySelector('#name').value.trim(),
      email: content.querySelector('#email').value.trim(),
      password: content.querySelector('#password').value,
      role: content.querySelector('#role').value,
    };
    try {
      await api.createUser(payload);
      toast('Account created');
      closeModal(backdrop);
      reload();
    } catch (err) {
      toast(err.message, { error: true });
    }
  });
}
