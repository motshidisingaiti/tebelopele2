import { API_BASE_URL } from './config.js';

const TOKEN_KEY = 'tshedimoso_token';
const USER_KEY = 'tshedimoso_user';

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}
export function getUser() {
  const raw = localStorage.getItem(USER_KEY);
  return raw ? JSON.parse(raw) : null;
}
export function setSession(token, user) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}
export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}
export function isAuthenticated() {
  return !!getToken();
}
export function hasRole(...roles) {
  const user = getUser();
  return !!user && roles.includes(user.role);
}

async function request(path, { method = 'GET', body, auth = false } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (auth) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch (err) {
    throw new Error('Could not reach the Tshedimoso API. Check API_BASE_URL and that the backend is running.');
  }

  if (response.status === 401 && auth) {
    clearSession();
    window.location.hash = '#/login';
  }

  const isJson = (response.headers.get('content-type') || '').includes('application/json');
  const data = isJson ? await response.json().catch(() => ({})) : null;

  if (!response.ok) {
    throw new Error((data && data.error) || `Request failed (${response.status})`);
  }
  return data;
}

export const api = {
  // Auth
  login: (email, password) => request('/api/auth/login', { method: 'POST', body: { email, password } }),

  // Chat (public)
  sendChatMessage: (payload) => request('/api/chat/message', { method: 'POST', body: payload }),

  // Appointments
  getOpenSlots: (params = {}) => request(`/api/appointments/slots?${new URLSearchParams(params)}`),
  bookSlot: (id, payload) => request(`/api/appointments/${id}/book`, { method: 'POST', body: payload }),
  listAppointments: (params = {}) =>
    request(`/api/appointments?${new URLSearchParams(params)}`, { auth: true }),
  updateAppointment: (id, patch) => request(`/api/appointments/${id}`, { method: 'PATCH', body: patch }),

  // Content
  listContent: (params = {}) => request(`/api/content?${new URLSearchParams(params)}`, { auth: true }),
  createContent: (payload) => request('/api/content', { method: 'POST', body: payload, auth: true }),
  updateContent: (id, patch) => request(`/api/content/${id}`, { method: 'PATCH', body: patch, auth: true }),
  transitionContent: (id, state) =>
    request(`/api/content/${id}/transition`, { method: 'POST', body: { state }, auth: true }),

  // Knowledge base
  listKnowledgeBase: () => request('/api/knowledge-base', { auth: true }),
  createKnowledgeBase: (payload) => request('/api/knowledge-base', { method: 'POST', body: payload, auth: true }),
  deleteKnowledgeBase: (id) => request(`/api/knowledge-base/${id}`, { method: 'DELETE', auth: true }),

  // Referrals
  listReferrals: (params = {}) => request(`/api/referrals?${new URLSearchParams(params)}`, { auth: true }),
  updateReferral: (id, patch) => request(`/api/referrals/${id}`, { method: 'PATCH', body: patch, auth: true }),

  // Escalations
  listEscalations: (params = {}) => request(`/api/escalations?${new URLSearchParams(params)}`, { auth: true }),
  updateEscalation: (id, status) =>
    request(`/api/escalations/${id}`, { method: 'PATCH', body: { status }, auth: true }),

  // Users
  listUsers: () => request('/api/users', { auth: true }),
  createUser: (payload) => request('/api/users', { method: 'POST', body: payload, auth: true }),
  updateUser: (id, patch) => request(`/api/users/${id}`, { method: 'PATCH', body: patch, auth: true }),

  // Audit logs
  listAuditLogs: (params = {}) => request(`/api/audit-logs?${new URLSearchParams(params)}`, { auth: true }),

  // Analytics
  getOverview: () => request('/api/analytics/overview', { auth: true }),
  getConversationsByDay: () => request('/api/analytics/conversations-by-day', { auth: true }),
  getChannels: () => request('/api/analytics/channels', { auth: true }),
  getTopics: () => request('/api/analytics/topics', { auth: true }),
};
