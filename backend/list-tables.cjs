const path = require('path');
const Database = require('better-sqlite3');

const resolvePath = input => path.resolve(__dirname, input ?? '_db.sqlite3');
const db = new Database(resolvePath(process.argv[2]));
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all();
for (const { name } of tables) {
  const columns = db.prepare(`PRAGMA table_info('${name.replace(/'/g, "''")}')`).all();
  console.log(`\n${name}`);
  console.table(columns.map(({ name: column, type }) => ({ column, type })));
}
