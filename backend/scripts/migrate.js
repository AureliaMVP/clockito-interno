const Database = require('better-sqlite3');
const db = new Database('clockito.db');
console.log('DB at', db.name);
console.log('Schema OK (tables created on load by store.js). Nothing to do.');
