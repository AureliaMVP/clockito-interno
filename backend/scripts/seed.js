const Database = require('better-sqlite3');
const { customAlphabet } = require('nanoid');
const nano = customAlphabet('0123456789abcdefghijklmnopqrstuvwxyz', 12);
const db = new Database('clockito.db');

function upsert(table, row){
  const cols = Object.keys(row);
  const placeholders = cols.map(_=>'?').join(',');
  const sql = `INSERT OR REPLACE INTO ${table} (${cols.join(',')}) VALUES (${placeholders})`;
  const stmt = db.prepare(sql);
  stmt.run(...cols.map(c=>row[c]));
}

upsert('users', { id:'u_admin', name:'Admin', email:'admin@local', role:'admin' });
upsert('users', { id:'u_lucho', name:'Lucho', email:'lucho@local', role:'manager' });
upsert('users', { id:'u_franco', name:'Franco', email:'franco@local', role:'employee' });

const c1 = 'c_' + nano();
upsert('clients', { id:c1, name:'Cliente ACME', archived:0 });
const p1 = 'p_' + nano();
upsert('projects', { id:p1, client_id:c1, name:'Implementación IA', billable:1, hourly_rate_cents:300000, archived:0 });

console.log('Seed listo.');
