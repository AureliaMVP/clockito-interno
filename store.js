
const Database = require('better-sqlite3');
const { customAlphabet } = require('nanoid');
const dayjs = require('dayjs');

const nano = customAlphabet('0123456789abcdefghijklmnopqrstuvwxyz', 12);
const db = new Database('clockito.db');

// create tables if not exist
db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL DEFAULT 'employee'
);
CREATE TABLE IF NOT EXISTS clients (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  archived INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  client_id TEXT,
  name TEXT NOT NULL,
  billable INTEGER NOT NULL DEFAULT 1,
  hourly_rate_cents INTEGER DEFAULT 0,
  archived INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY(client_id) REFERENCES clients(id)
);
CREATE TABLE IF NOT EXISTS time_entries (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  project_id TEXT,
  task TEXT,
  note TEXT,
  start TEXT NOT NULL,
  end TEXT,
  duration_seconds INTEGER,
  approved INTEGER NOT NULL DEFAULT 0,
  locked INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY(user_id) REFERENCES users(id),
  FOREIGN KEY(project_id) REFERENCES projects(id)
);
CREATE TABLE IF NOT EXISTS timers (
  user_id TEXT PRIMARY KEY,
  project_id TEXT,
  task TEXT,
  note TEXT,
  start TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS timesheets (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  week_start TEXT NOT NULL, -- ISO date (Monday as start, assume)
  status TEXT NOT NULL DEFAULT 'draft', -- draft|submitted|approved|rejected|withdrawn
  reviewer_id TEXT,
  changed_at TEXT
);
`);

function listUsers() {
  return db.prepare('SELECT id, name, email, role FROM users ORDER BY name').all();
}

// Clients
function listClients() {
  return db.prepare('SELECT * FROM clients WHERE archived=0 ORDER BY name').all();
}
function createClient(input) {
  const id = 'c_' + nano();
  db.prepare('INSERT INTO clients (id, name) VALUES (?, ?)').run(id, input.name || 'Sin nombre');
  return { ok: true, id };
}
function updateClient(id, input) {
  db.prepare('UPDATE clients SET name=?, archived=? WHERE id=?')
    .run(input.name, input.archived ? 1 : 0, id);
  return { ok: true };
}
function deleteClient(id) {
  db.prepare('DELETE FROM clients WHERE id=?').run(id);
  return { ok: true };
}

// Projects
function listProjects() {
  return db.prepare(`
    SELECT p.*, (SELECT name FROM clients c WHERE c.id=p.client_id) as client_name
    FROM projects p WHERE p.archived=0 ORDER BY name
  `).all();
}
function createProject(input) {
  const id = 'p_' + nano();
  db.prepare('INSERT INTO projects (id, client_id, name, billable, hourly_rate_cents) VALUES (?, ?, ?, ?, ?)')
    .run(id, input.client_id || null, input.name || 'Proyecto', input.billable ? 1 : 0, input.hourly_rate_cents || 0);
  return { ok: true, id };
}
function updateProject(id, input) {
  db.prepare('UPDATE projects SET client_id=?, name=?, billable=?, hourly_rate_cents=?, archived=? WHERE id=?')
    .run(input.client_id || null, input.name, input.billable ? 1 : 0, input.hourly_rate_cents || 0, input.archived ? 1 : 0, id);
  return { ok: true };
}
function deleteProject(id) {
  db.prepare('DELETE FROM projects WHERE id=?').run(id);
  return { ok: true };
}

// Timer
function getActiveTimer(user_id) {
  const t = db.prepare('SELECT * FROM timers WHERE user_id=?').get(user_id);
  return t || null;
}
function startTimer(user_id, project_id, task, note) {
  // stop any active
  const active = getActiveTimer(user_id);
  if (active) stopTimer(user_id);
  const start = new Date().toISOString();
  db.prepare('INSERT OR REPLACE INTO timers (user_id, project_id, task, note, start) VALUES (?, ?, ?, ?, ?)')
    .run(user_id, project_id || null, task || null, note || null, start);
  return { ok: true, start };
}
function stopTimer(user_id) {
  const active = getActiveTimer(user_id);
  if (!active) return { ok: false, error: 'no_active_timer' };
  const end = new Date().toISOString();
  const duration = Math.max(0, Math.floor((new Date(end) - new Date(active.start)) / 1000));
  const id = 't_' + nano();
  db.prepare(`INSERT INTO time_entries
    (id, user_id, project_id, task, note, start, end, duration_seconds)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
    .run(id, user_id, active.project_id || null, active.task || null, active.note || null, active.start, end, duration);
  db.prepare('DELETE FROM timers WHERE user_id=?').run(user_id);
  return { ok: true, entry_id: id, duration_seconds: duration };
}

// Time entries
function listTimeEntries({ from, to, user_id } = {}) {
  let q = `SELECT te.*, p.name as project_name, u.name as user_name
           FROM time_entries te
           LEFT JOIN projects p ON p.id=te.project_id
           LEFT JOIN users u ON u.id=te.user_id
           WHERE 1=1`;
  const params = [];
  if (from) { q += ' AND te.start >= ?'; params.push(from); }
  if (to)   { q += ' AND te.start <= ?'; params.push(to); }
  if (user_id) { q += ' AND te.user_id=?'; params.push(user_id); }
  q += ' ORDER BY te.start DESC';
  return db.prepare(q).all(...params);
}
function createTimeEntry(input) {
  const id = 't_' + nano();
  const start = input.start || new Date().toISOString();
  const end = input.end || null;
  const duration = input.duration_seconds || (end ? Math.max(0, Math.floor((new Date(end) - new Date(start))/1000)) : null);
  db.prepare(`INSERT INTO time_entries (id, user_id, project_id, task, note, start, end, duration_seconds)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
    .run(id, input.user_id, input.project_id || null, input.task || null, input.note || null, start, end, duration);
  return { ok: true, id };
}
function updateTimeEntry(id, input) {
  const row = db.prepare('SELECT * FROM time_entries WHERE id=?').get(id);
  if (!row) return { ok: false, error: 'not_found' };
  if (row.locked) return { ok: false, error: 'locked' };
  const start = input.start || row.start;
  const end = input.end !== undefined ? input.end : row.end;
  const duration = input.duration_seconds !== undefined
    ? input.duration_seconds
    : (end ? Math.max(0, Math.floor((new Date(end) - new Date(start))/1000)) : row.duration_seconds);
  db.prepare(`UPDATE time_entries SET user_id=?, project_id=?, task=?, note=?, start=?, end=?, duration_seconds=? WHERE id=?`)
    .run(input.user_id || row.user_id, input.project_id || row.project_id, input.task || row.task, input.note || row.note, start, end, duration, id);
  return { ok: true };
}
function deleteTimeEntry(id) {
  db.prepare('DELETE FROM time_entries WHERE id=?').run(id);
  return { ok: true };
}

// Timesheets (weekly, Monday start)
function mondayOf(dateISO) {
  const d = dayjs(dateISO || new Date());
  const day = d.day(); // 0..6 (0=Sunday)
  const diff = (day === 0 ? -6 : 1 - day);
  return d.add(diff, 'day').startOf('day').format('YYYY-MM-DD');
}
function getOrCreateTimesheet(user_id, week_start) {
  const monday = mondayOf(week_start || new Date());
  let ts = db.prepare('SELECT * FROM timesheets WHERE user_id=? AND week_start=?').get(user_id, monday);
  if (!ts) {
    ts = { id: 'ts_' + nano(), user_id, week_start: monday, status: 'draft', reviewer_id: null, changed_at: new Date().toISOString() };
    db.prepare('INSERT INTO timesheets (id, user_id, week_start, status, reviewer_id, changed_at) VALUES (?, ?, ?, ?, ?, ?)')
      .run(ts.id, ts.user_id, ts.week_start, ts.status, ts.reviewer_id, ts.changed_at);
  }
  // Aggregate weekly hours
  const from = dayjs(monday).toISOString();
  const to = dayjs(monday).add(7, 'day').toISOString();
  const entries = listTimeEntries({ from, to, user_id });
  const total_seconds = entries.reduce((s, e) => s + (e.duration_seconds || 0), 0);
  return { ...ts, total_seconds, entries };
}
function submitTimesheet(user_id, week_start) {
  const monday = mondayOf(week_start || new Date());
  db.prepare('UPDATE timesheets SET status=?, changed_at=? WHERE user_id=? AND week_start=?')
    .run('submitted', new Date().toISOString(), user_id, monday);
  // lock entries in that period
  const from = dayjs(monday).toISOString();
  const to = dayjs(monday).add(7, 'day').toISOString();
  db.prepare('UPDATE time_entries SET locked=1 WHERE user_id=? AND start>=? AND start<=?').run(user_id, from, to);
  return getOrCreateTimesheet(user_id, monday);
}
function withdrawTimesheet(user_id, week_start, reason) {
  const monday = mondayOf(week_start || new Date());
  const ts = db.prepare('SELECT * FROM timesheets WHERE user_id=? AND week_start=?').get(user_id, monday);
  if (!ts || ts.status !== 'submitted') return { ok: false, error: 'invalid_state' };
  db.prepare('UPDATE timesheets SET status=?, changed_at=? WHERE user_id=? AND week_start=?')
    .run('withdrawn', new Date().toISOString(), user_id, monday);
  // unlock entries
  const from = dayjs(monday).toISOString();
  const to = dayjs(monday).add(7, 'day').toISOString();
  db.prepare('UPDATE time_entries SET locked=0 WHERE user_id=? AND start>=? AND start<=?').run(user_id, from, to);
  return getOrCreateTimesheet(user_id, monday);
}

// Approvals
function approveTimesheet(user_id, week_start, reviewer_id) {
  const monday = mondayOf(week_start || new Date());
  db.prepare('UPDATE timesheets SET status=?, reviewer_id=?, changed_at=? WHERE user_id=? AND week_start=?')
    .run('approved', reviewer_id, new Date().toISOString(), user_id, monday);
  db.prepare('UPDATE time_entries SET approved=1, locked=1 WHERE user_id=? AND start>=? AND start<=?')
    .run(user_id, dayjs(monday).toISOString(), dayjs(monday).add(7,'day').toISOString());
  return getOrCreateTimesheet(user_id, monday);
}
function rejectTimesheet(user_id, week_start, reviewer_id, reason) {
  const monday = mondayOf(week_start || new Date());
  db.prepare('UPDATE timesheets SET status=?, reviewer_id=?, changed_at=? WHERE user_id=? AND week_start=?')
    .run('rejected', reviewer_id, new Date().toISOString(), user_id, monday);
  // keep locked=0 to allow edits
  db.prepare('UPDATE time_entries SET approved=0, locked=0 WHERE user_id=? AND start>=? AND start<=?')
    .run(user_id, dayjs(monday).toISOString(), dayjs(monday).add(7,'day').toISOString());
  return getOrCreateTimesheet(user_id, monday);
}

// Reports
function reportSummary({ from, to, group_by }) {
  const rows = listTimeEntries({ from, to });
  // group_by: project|user|client
  const map = new Map();
  for (const r of rows) {
    let key = 'total';
    if (group_by === 'project') key = r.project_id || 'no_project';
    if (group_by === 'user') key = r.user_id;
    if (group_by === 'client') key = r.client_id || 'no_client';
    const cur = map.get(key) || { seconds: 0, ids: [] };
    cur.seconds += r.duration_seconds || 0;
    cur.ids.push(r.id);
    map.set(key, cur);
  }
  const out = [];
  for (const [k, v] of map.entries()) {
    out.push({ key: k, seconds: v.seconds, entries: v.ids.length });
  }
  return out.sort((a,b)=>b.seconds-a.seconds);
}

module.exports = {
  listUsers,
  listClients, createClient, updateClient, deleteClient,
  listProjects, createProject, updateProject, deleteProject,
  getActiveTimer, startTimer, stopTimer,
  listTimeEntries, createTimeEntry, updateTimeEntry, deleteTimeEntry,
  getOrCreateTimesheet, submitTimesheet, withdrawTimesheet,
  approveTimesheet, rejectTimesheet,
  reportSummary,
};
