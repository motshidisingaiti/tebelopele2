// Minimal JSON-file datastore.
//
// This keeps the project dependency-free for a demo/proposal build. Swap
// this module out for a real database (Postgres, MySQL) before production —
// every call site uses the same load/save/collection interface, so the
// routes and services never need to change.

const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'db.json');

const DEFAULT_DATA = {
  users: [],
  clients: [],
  appointments: [],
  content: [],
  referrals: [],
  conversations: [],
  escalations: [],
  notifications: [],
};

function load() {
  if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify(DEFAULT_DATA, null, 2));
  }
  const raw = fs.readFileSync(DB_PATH, 'utf-8');
  return JSON.parse(raw);
}

function save(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

// Returns a simple collection API scoped to one table name, backed by the
// same file. Reads/writes the whole file each call — fine at demo scale,
// not meant to survive concurrent writers in production.
function collection(name) {
  return {
    all() {
      const data = load();
      return data[name] || [];
    },
    find(predicate) {
      return this.all().find(predicate);
    },
    filter(predicate) {
      return this.all().filter(predicate);
    },
    insert(record) {
      const data = load();
      data[name] = data[name] || [];
      data[name].push(record);
      save(data);
      return record;
    },
    update(id, patch) {
      const data = load();
      const idx = (data[name] || []).findIndex((r) => r.id === id);
      if (idx === -1) return null;
      data[name][idx] = { ...data[name][idx], ...patch, updatedAt: new Date().toISOString() };
      save(data);
      return data[name][idx];
    },
    remove(id) {
      const data = load();
      const before = (data[name] || []).length;
      data[name] = (data[name] || []).filter((r) => r.id !== id);
      save(data);
      return data[name].length < before;
    },
  };
}

module.exports = { load, save, collection };
