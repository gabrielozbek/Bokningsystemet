const path = require('path');
const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');

const dbPath = process.argv[2] ?? path.join(__dirname, '..', '_db.sqlite3');

const db = new Database(dbPath);

db.exec('PRAGMA foreign_keys = OFF');

db.exec(`
  DROP TABLE IF EXISTS bookings;
  DROP TABLE IF EXISTS products;
  DROP TABLE IF EXISTS tables;
  DROP TABLE IF EXISTS users;
  DROP TABLE IF EXISTS sessions;
  DROP TABLE IF EXISTS acl;
  DROP TABLE IF EXISTS "table";
  DROP TABLE IF EXISTS reservations;
`);

db.exec(`
  CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    phone TEXT NOT NULL DEFAULT '',
    role TEXT NOT NULL DEFAULT 'user',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE tables (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    capacity INTEGER NOT NULL,
    location TEXT NOT NULL DEFAULT '',
    description TEXT NOT NULL DEFAULT '',
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    quantity TEXT NOT NULL,
    price$ NUMERIC NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    categories TEXT NOT NULL
  );

  CREATE TABLE bookings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER NOT NULL,
    tableId INTEGER NOT NULL,
    guestCount INTEGER NOT NULL,
    start TEXT NOT NULL,
    endTime TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'booked',
    note TEXT NOT NULL DEFAULT '',
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (tableId) REFERENCES tables(id) ON DELETE CASCADE
  );

  CREATE TABLE sessions (
    id TEXT PRIMARY KEY,
    created TEXT NOT NULL DEFAULT (datetime('now')),
    modified TEXT NOT NULL DEFAULT (datetime('now')),
    data TEXT DEFAULT '{}'
  );

  CREATE TABLE acl (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userRoles TEXT NOT NULL,
    method TEXT NOT NULL DEFAULT 'GET',
    allow TEXT NOT NULL DEFAULT 'allow',
    route TEXT NOT NULL,
    match TEXT NOT NULL DEFAULT 'true',
    comment TEXT NOT NULL DEFAULT ''
  );
`);

db.exec('PRAGMA foreign_keys = ON');

const insertUser = db.prepare(`INSERT INTO users (email, password, first_name, last_name, phone, role)
VALUES (@email, @password, @first_name, @last_name, @phone, @role)`);

const insertTable = db.prepare(`INSERT INTO tables (name, capacity, location, description, is_active)
VALUES (@name, @capacity, @location, @description, @is_active)`);

const insertProduct = db.prepare(`INSERT INTO products (name, description, quantity, price$, slug, categories)
VALUES (@name, @description, @quantity, @price, @slug, @categories)`);

const insertBooking = db.prepare(`INSERT INTO bookings (
  userId, tableId, guestCount, start, endTime, status, note
) VALUES (@userId, @tableId, @guestCount, @start, @endTime, @status, @note)`);

const insertAcl = db.prepare(`INSERT INTO acl (userRoles, method, allow, route, match, comment)
VALUES (@userRoles, @method, @allow, @route, @match, @comment)`);

const seed = db.transaction(() => {
  const users = [
    {
      email: 'admin@bistro.se',
      password: bcrypt.hashSync('Admin123!', 10),
      first_name: 'Anna',
      last_name: 'Andersson',
      phone: '+4610110000',
      role: 'admin'
    },
    {
      email: 'service@bistro.se',
      password: bcrypt.hashSync('Staff123!', 10),
      first_name: 'Oskar',
      last_name: 'Olsson',
      phone: '+4610110001',
      role: 'staff'
    },
    {
      email: 'kund@example.com',
      password: bcrypt.hashSync('Kund123!', 10),
      first_name: 'Karin',
      last_name: 'Kund',
      phone: '+46701111111',
      role: 'user'
    }
  ];
  users.forEach(user => insertUser.run(user));

  const tables = [
    { name: 'Fonsterbord 1', capacity: 2, location: 'Fonster', description: 'Mysigt bord vid fonstret', is_active: 1 },
    { name: 'Fonsterbord 2', capacity: 4, location: 'Fonster', description: 'Perfekt for ett mindre sallskap', is_active: 1 },
    { name: 'Barbord', capacity: 2, location: 'Bar', description: 'Snabbt stopp nara baren', is_active: 1 },
    { name: 'Salong 1', capacity: 6, location: 'Salong', description: 'Rymligt bord for storre sallskap', is_active: 1 },
    { name: 'Salong 2', capacity: 8, location: 'Salong', description: 'Avskilt bord for evenemang', is_active: 1 }
  ];
  tables.forEach(table => insertTable.run(table));

  const products = [
    {
      name: 'Bistro Burger',
      description: 'Saftig burgare med cheddar, karamelliserad lok och tryffelmajonnas.',
      quantity: '10',
      price: 169,
      slug: 'bistro-burger',
      categories: 'JSON:["Middag","Kott"]'
    },
    {
      name: 'Grillad Lax',
      description: 'Grillad laxfile serverad med citronhollandaise och sparris.',
      quantity: '8',
      price: 189,
      slug: 'grillad-lax',
      categories: 'JSON:["Middag","Fisk"]'
    },
    {
      name: 'Caprese Sallad',
      description: 'Tomater, buffelmozzarella och basilika med balsamicoglace.',
      quantity: '12',
      price: 129,
      slug: 'caprese-sallad',
      categories: 'JSON:["Forratt","Vegetariskt"]'
    }
  ];
  products.forEach(product => insertProduct.run(product));

  const userIdByEmail = email => db.prepare('SELECT id FROM users WHERE email = ?').get(email).id;
  const tableIdByName = name => db.prepare('SELECT id FROM tables WHERE name = ?').get(name).id;

  const bookings = [
    {
      userId: userIdByEmail('admin@bistro.se'),
      tableId: tableIdByName('Fonsterbord 1'),
      guestCount: 2,
      start: '2025-10-10T18:00:00',
      endTime: '2025-10-10T20:00:00',
      status: 'booked',
      note: 'Anniversary dinner'
    },
    {
      userId: userIdByEmail('service@bistro.se'),
      tableId: tableIdByName('Salong 2'),
      guestCount: 6,
      start: '2025-10-11T19:00:00',
      endTime: '2025-10-11T21:30:00',
      status: 'blocked',
      note: 'Team planning'
    },
    {
      userId: userIdByEmail('kund@example.com'),
      tableId: tableIdByName('Fonsterbord 2'),
      guestCount: 4,
      start: '2025-10-12T17:30:00',
      endTime: '2025-10-12T19:30:00',
      status: 'booked',
      note: 'Family night'
    }
  ];
  bookings.forEach(booking => insertBooking.run(booking));

  const aclEntries = [
    {
      userRoles: 'visitor,user,staff,admin',
      method: 'GET',
      allow: 'allow',
      route: '/api',
      match: 'false',
      comment: 'Tillat allt som inte ar API under "/api"'
    },
    {
      userRoles: 'visitor,user,staff,admin',
      method: '*',
      allow: 'allow',
      route: '/api/login',
      match: 'true',
      comment: 'Inloggningsrutter'
    },
    {
      userRoles: 'visitor',
      method: 'POST',
      allow: 'allow',
      route: '/api/users',
      match: 'true',
      comment: 'Tillat registrering for besokare'
    },
    {
      userRoles: 'admin',
      method: '*',
      allow: 'allow',
      route: '/api/users',
      match: 'true',
      comment: 'Admin hanterar anvandare'
    },
    {
      userRoles: 'admin',
      method: '*',
      allow: 'allow',
      route: '/api/acl',
      match: 'true',
      comment: 'Admin hanterar ACL'
    },
    {
      userRoles: 'admin',
      method: '*',
      allow: 'allow',
      route: '/api/sessions',
      match: 'true',
      comment: 'Admin ser sessioner'
    },
    {
      userRoles: 'visitor,user,staff,admin',
      method: 'GET',
      allow: 'allow',
      route: '/api/tables',
      match: 'true',
      comment: 'Lista bord'
    },
    {
      userRoles: 'visitor,user,staff,admin',
      method: 'GET',
      allow: 'allow',
      route: '/api/products',
      match: 'true',
      comment: 'Lista produkter'
    },
    {
      userRoles: 'visitor,user,staff,admin',
      method: 'GET',
      allow: 'allow',
      route: '/api/bookings',
      match: 'true',
      comment: 'Lista bokningar'
    },
    {
      userRoles: 'visitor',
      method: 'POST',
      allow: 'allow',
      route: '/api/bookings',
      match: 'true',
      comment: 'Besokare kan skapa bokning'
    },
    {
      userRoles: 'visitor,user,staff,admin',
      method: '*',
      allow: 'allow',
      route: '/api/bookings',
      match: 'true',
      comment: 'Hantera bokningar'
    }
  ];
  aclEntries.forEach(entry => insertAcl.run(entry));
});

seed();

console.log(`Databasen vid ${dbPath} har initialiserats.`);
