import { api } from '../api.js';
import { el, toast, openModal, closeModal, escapeHtml } from '../ui.js';

export async function renderKnowledgeBase() {
  const root = el(`
    <div>
      <div class="portal-topbar">
        <div><h1>Knowledge base</h1><p class="muted">What the assistant is allowed to state as fact — hours, eligibility, short answers.</p></div>
        <button class="btn btn-primary" id="new-btn">New entry</button>
      </div>
      <div class="panel">
        <div class="panel-head"><h3>Entries</h3></div>
        <div id="table-wrap"></div>
      </div>
    </div>
  `);

  const wrap = root.querySelector('#table-wrap');

  async function load() {
    wrap.innerHTML = '<div class="loading-row">Loading\u2026</div>';
    const list = await api.listKnowledgeBase();
    renderTable(wrap, list, load);
  }

  root.querySelector('#new-btn').addEventListener('click', () => openCreateModal(load));
  await load();
  return root;
}

function renderTable(wrap, list, reload) {
  if (list.length === 0) {
    wrap.innerHTML = '<div class="empty-state">Nothing here yet — the assistant will say "I don\u2019t have that information" until you add entries.</div>';
    return;
  }
  wrap.innerHTML = '';
  const table = el(`
    <table>
      <thead><tr><th>Question</th><th>Answer</th><th>Topic</th><th>Owner</th><th></th></tr></thead>
      <tbody></tbody>
    </table>
  `);
  const tbody = table.querySelector('tbody');

  list.forEach((k) => {
    const row = el(`
      <tr>
        <td style="max-width:220px;">${escapeHtml(k.question)}</td>
        <td style="max-width:320px;">${escapeHtml(k.answer)}</td>
        <td>${escapeHtml(k.topic)}</td>
        <td>${escapeHtml(k.owner)}</td>
        <td></td>
      </tr>
    `);
    const removeBtn = el('<button class="btn btn-danger btn-sm">Remove</button>');
    removeBtn.addEventListener('click', async () => {
      try {
        await api.deleteKnowledgeBase(k.id);
        toast('Entry removed');
        reload();
      } catch (err) {
        toast(err.message, { error: true });
      }
    });
    row.lastElementChild.appendChild(removeBtn);
    tbody.appendChild(row);
  });

  wrap.appendChild(table);
}

function openCreateModal(reload) {
  const { backdrop, content } = openModal(`
    <h3>New knowledge base entry</h3>
    <form id="kb-form">
      <div class="field">
        <label for="question">Question / trigger</label>
        <input type="text" id="question" required placeholder="e.g. What are TWC opening hours?" />
      </div>
      <div class="field">
        <label for="answer">Answer the assistant may give</label>
        <textarea id="answer" required></textarea>
      </div>
      <div class="field">
        <label for="topic">Topic</label>
        <input type="text" id="topic" placeholder="e.g. hours, testing, prevention" />
      </div>
      <div class="field">
        <label for="owner">Owner</label>
        <input type="text" id="owner" required placeholder="e.g. TWC Clinical Team" />
      </div>
      <div class="modal-actions">
        <button type="button" class="btn btn-ghost" id="cancel-btn">Cancel</button>
        <button type="submit" class="btn btn-primary">Add entry</button>
      </div>
    </form>
  `);

  content.querySelector('#cancel-btn').addEventListener('click', () => closeModal(backdrop));
  content.querySelector('#kb-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = {
      question: content.querySelector('#question').value.trim(),
      answer: content.querySelector('#answer').value.trim(),
      topic: content.querySelector('#topic').value.trim() || 'general',
      owner: content.querySelector('#owner').value.trim(),
    };
    try {
      await api.createKnowledgeBase(payload);
      toast('Entry added');
      closeModal(backdrop);
      reload();
    } catch (err) {
      toast(err.message, { error: true });
    }
  });
}
