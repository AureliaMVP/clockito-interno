const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const db = require('./store');
const dayjs = require('dayjs');

const app = express();
app.use(cors());
app.use(morgan('dev'));
app.use(bodyParser.json());

// Simple auth middleware (X-User header to identify acting user; internal use only)
app.use((req, res, next) => {
  req.userId = req.header('x-user-id') || 'u_admin';
  next();
});

// Health
app.get('/health', (_, res) => res.json({ ok: true, time: new Date().toISOString() }));

// ---- Users (read only) ----
app.get('/api/users', (req, res) => res.json(db.listUsers()));

// ---- Clients ----
app.get('/api/clients', (req, res) => res.json(db.listClients()));
app.post('/api/clients', (req, res) => res.json(db.createClient(req.body)));
app.put('/api/clients/:id', (req, res) => res.json(db.updateClient(req.params.id, req.body)));
app.delete('/api/clients/:id', (req, res) => res.json(db.deleteClient(req.params.id)));

// ---- Projects ----
app.get('/api/projects', (req, res) => res.json(db.listProjects()));
app.post('/api/projects', (req, res) => res.json(db.createProject(req.body)));
app.put('/api/projects/:id', (req, res) => res.json(db.updateProject(req.params.id, req.body)));
app.delete('/api/projects/:id', (req, res) => res.json(db.deleteProject(req.params.id)));

// ---- Timer (per user) ----
app.get('/api/timer', (req, res) => {
  res.json(db.getActiveTimer(req.userId));
});
app.post('/api/timer/start', (req, res) => {
  const { project_id, task, note } = req.body;
  res.json(db.startTimer(req.userId, project_id, task, note));
});
app.post('/api/timer/stop', (req, res) => {
  res.json(db.stopTimer(req.userId));
});

// ---- Manual time entries ----
app.get('/api/time-entries', (req, res) => {
  const { from, to, user_id } = req.query;
  res.json(db.listTimeEntries({ from, to, user_id }));
});
app.post('/api/time-entries', (req, res) => {
  res.json(db.createTimeEntry({ ...req.body, user_id: req.body.user_id || req.userId }));
});
app.put('/api/time-entries/:id', (req, res) => res.json(db.updateTimeEntry(req.params.id, req.body)));
app.delete('/api/time-entries/:id', (req, res) => res.json(db.deleteTimeEntry(req.params.id)));

// ---- Timesheets (weekly) ----
app.get('/api/timesheets', (req, res) => {
  const { user_id, week_start } = req.query;
  res.json(db.getOrCreateTimesheet(user_id || req.userId, week_start));
});
app.post('/api/timesheets/submit', (req, res) => {
  const { user_id, week_start } = req.body;
  res.json(db.submitTimesheet(user_id || req.userId, week_start));
});
app.post('/api/timesheets/withdraw', (req, res) => {
  const { user_id, week_start, reason } = req.body;
  res.json(db.withdrawTimesheet(user_id || req.userId, week_start, reason));
});

// ---- Approvals ----
app.post('/api/approvals/approve', (req, res) => {
  const { user_id, week_start } = req.body;
  res.json(db.approveTimesheet(user_id || req.userId, week_start, req.userId));
});
app.post('/api/approvals/reject', (req, res) => {
  const { user_id, week_start, reason } = req.body;
  res.json(db.rejectTimesheet(user_id || req.userId, week_start, req.userId, reason));
});

// ---- Reports ----
app.get('/api/reports/summary', (req, res) => {
  const { from, to, group_by } = req.query;
  res.json(db.reportSummary({ from, to, group_by }));
});
app.get('/api/reports/detailed', (req, res) => {
  const { from, to } = req.query;
  res.json(db.listTimeEntries({ from, to }));
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Clockito backend running on http://localhost:${PORT}`);
});
