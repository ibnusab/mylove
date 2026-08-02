import initSqlJs, { Database } from 'sql.js';
import fs from 'fs';
import path from 'path';

const DB_FILE = path.join(process.cwd(), 'database.sqlite');

let db: Database | null = null;

export async function getDb(): Promise<Database> {
  if (db) return db;

  const SQL = await initSqlJs();

  if (fs.existsSync(DB_FILE)) {
    const filebuffer = fs.readFileSync(DB_FILE);
    db = new SQL.Database(filebuffer);
  } else {
    db = new SQL.Database();
    saveDb(db);
  }

  initTables(db);
  return db;
}

export function saveDb(databaseInstance?: Database) {
  const target = databaseInstance || db;
  if (!target) return;
  const data = target.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(DB_FILE, buffer);
}

function initTables(database: Database) {
  database.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS relationship_settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      key TEXT UNIQUE NOT NULL,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS timeline_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      date TEXT NOT NULL,
      description TEXT,
      category TEXT,
      location TEXT,
      photo_url TEXT,
      favorite INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS gallery_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL, -- 'photo' or 'video'
      url TEXT NOT NULL,
      caption TEXT,
      date TEXT,
      favorite INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS music_tracks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      artist TEXT NOT NULL,
      file_url TEXT NOT NULL,
      album_art TEXT,
      duration TEXT,
      favorite INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS love_notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sender TEXT NOT NULL,
      receiver TEXT NOT NULL,
      message TEXT NOT NULL,
      emoji TEXT DEFAULT '❤️',
      is_pinned INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS calendar_memories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      title TEXT NOT NULL,
      note TEXT,
      media_url TEXT,
      event_type TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS love_letters (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      date TEXT NOT NULL,
      is_opened INTEGER DEFAULT 0,
      is_archived INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Seed default admin user if missing
  const userCheck = database.exec("SELECT COUNT(*) as count FROM users;");
  if (userCheck.length === 0 || userCheck[0].values[0][0] === 0) {
    database.run(
      `INSERT INTO users (username, password) VALUES (?, ?);`,
      ['love', '123456']
    );
  }

  // Seed default relationship settings if missing
  const settingsCheck = database.exec("SELECT COUNT(*) as count FROM relationship_settings;");
  if (settingsCheck.length === 0 || settingsCheck[0].values[0][0] === 0) {
    const defaultSettings: [string, string][] = [
      ['partner1_name', 'Sabri'],
      ['partner2_name', 'Anisa'],
      ['anniversary_date', new Date().toISOString().slice(0, 10)],
      ['quote', 'In all the world, there is no heart for me like yours.'],
      ['couple_photo_url', ''],
      ['accent_color', '#EC407A'],
      ['particle_intensity', 'medium'],
      ['theme_mode', 'pastel'],
      ['gallery_layout', 'masonry']
    ];
    defaultSettings.forEach(([k, v]) => {
      database.run(`INSERT INTO relationship_settings (key, value) VALUES (?, ?);`, [k, v]);
    });
  }

  saveDb(database);
}

// Helper query function that turns sql.js results into array of objects
export function queryAll(database: Database, sql: string, params: any[] = []): any[] {
  const stmt = database.prepare(sql);
  if (params.length) stmt.bind(params);
  const results: any[] = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject());
  }
  stmt.free();
  return results;
}

export function queryOne(database: Database, sql: string, params: any[] = []): any | null {
  const results = queryAll(database, sql, params);
  return results.length > 0 ? results[0] : null;
}

export function runQuery(database: Database, sql: string, params: any[] = []): void {
  database.run(sql, params);
  saveDb(database);
}
