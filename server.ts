import express from 'express';
import path from 'path';
import fs from 'fs';
import cors from 'cors';
import multer from 'multer';
import { createServer as createViteServer } from 'vite';
import { getDb, queryAll, queryOne, runQuery } from './server/db.js';

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

// Ensure upload directories exist
const uploadBase = path.join(process.cwd(), 'uploads');
const photosDir = path.join(uploadBase, 'photos');
const videosDir = path.join(uploadBase, 'videos');
const musicDir = path.join(uploadBase, 'music');

[uploadBase, photosDir, videosDir, musicDir].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Configure Multer Storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, photosDir);
    } else if (file.mimetype.startsWith('video/')) {
      cb(null, videosDir);
    } else if (file.mimetype.startsWith('audio/')) {
      cb(null, musicDir);
    } else {
      cb(null, uploadBase);
    }
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
});

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static uploads
app.use('/uploads', express.static(uploadBase));

async function main() {
  const db = await getDb();

  // --- API ROUTES ---

  // 1. Auth API
  app.post('/api/auth/login', (req, res) => {
    const { username, password } = req.body;
    const user = queryOne(db, 'SELECT * FROM users WHERE username = ? AND password = ?;', [
      username,
      password,
    ]);
    if (user) {
      res.json({ success: true, user: { id: user.id, username: user.username } });
    } else {
      res.status(401).json({ success: false, message: 'Invalid username or password' });
    }
  });

  app.get('/api/auth/me', (req, res) => {
    const user = queryOne(db, 'SELECT id, username FROM users LIMIT 1;');
    res.json({ user });
  });

  app.post('/api/auth/change-password', (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const user = queryOne(db, 'SELECT * FROM users WHERE password = ? LIMIT 1;', [currentPassword]);
    if (!user) {
      return res.status(400).json({ success: false, message: 'Current password incorrect' });
    }
    runQuery(db, 'UPDATE users SET password = ? WHERE id = ?;', [newPassword, user.id]);
    res.json({ success: true, message: 'Password updated successfully' });
  });

  // 2. Settings API
  app.get('/api/settings', (req, res) => {
    const rows = queryAll(db, 'SELECT key, value FROM relationship_settings;');
    const settingsObj: Record<string, string> = {};
    rows.forEach((r) => {
      settingsObj[r.key] = r.value;
    });
    res.json(settingsObj);
  });

  app.post('/api/settings', (req, res) => {
    const settings: Record<string, string> = req.body;
    Object.entries(settings).forEach(([k, v]) => {
      const existing = queryOne(db, 'SELECT id FROM relationship_settings WHERE key = ?;', [k]);
      if (existing) {
        runQuery(db, 'UPDATE relationship_settings SET value = ? WHERE key = ?;', [v, k]);
      } else {
        runQuery(db, 'INSERT INTO relationship_settings (key, value) VALUES (?, ?);', [k, v]);
      }
    });
    res.json({ success: true, settings });
  });

  // 3. Story / Timeline API
  app.get('/api/story', (req, res) => {
    const events = queryAll(db, 'SELECT * FROM timeline_events ORDER BY date ASC;');
    res.json(events);
  });

  app.post('/api/story', (req, res) => {
    const { title, date, description, category, location, photo_url, favorite } = req.body;
    runQuery(
      db,
      'INSERT INTO timeline_events (title, date, description, category, location, photo_url, favorite) VALUES (?, ?, ?, ?, ?, ?, ?);',
      [title, date, description || '', category || 'Memory', location || '', photo_url || '', favorite ? 1 : 0]
    );
    res.json({ success: true });
  });

  app.put('/api/story/:id', (req, res) => {
    const { id } = req.params;
    const { title, date, description, category, location, photo_url, favorite } = req.body;
    runQuery(
      db,
      'UPDATE timeline_events SET title=?, date=?, description=?, category=?, location=?, photo_url=?, favorite=? WHERE id=?;',
      [title, date, description, category, location, photo_url, favorite ? 1 : 0, id]
    );
    res.json({ success: true });
  });

  app.delete('/api/story/:id', (req, res) => {
    const { id } = req.params;
    runQuery(db, 'DELETE FROM timeline_events WHERE id = ?;', [id]);
    res.json({ success: true });
  });

  // 4. Gallery API
  app.get('/api/gallery', (req, res) => {
    const items = queryAll(db, 'SELECT * FROM gallery_items ORDER BY id DESC;');
    res.json(items);
  });

  app.post('/api/gallery', (req, res) => {
    const { type, url, caption, date, favorite } = req.body;
    runQuery(
      db,
      'INSERT INTO gallery_items (type, url, caption, date, favorite) VALUES (?, ?, ?, ?, ?);',
      [type || 'photo', url, caption || '', date || new Date().toISOString().slice(0, 10), favorite ? 1 : 0]
    );
    res.json({ success: true });
  });

  app.put('/api/gallery/:id', (req, res) => {
    const { id } = req.params;
    const { type, url, caption, date, favorite } = req.body;
    runQuery(
      db,
      'UPDATE gallery_items SET type=?, url=?, caption=?, date=?, favorite=? WHERE id=?;',
      [type || 'photo', url, caption || '', date, favorite ? 1 : 0, id]
    );
    res.json({ success: true });
  });

  app.post('/api/gallery/:id/favorite', (req, res) => {
    const { id } = req.params;
    const item = queryOne(db, 'SELECT favorite FROM gallery_items WHERE id = ?;', [id]);
    if (item) {
      const newFav = item.favorite === 1 ? 0 : 1;
      runQuery(db, 'UPDATE gallery_items SET favorite = ? WHERE id = ?;', [newFav, id]);
    }
    res.json({ success: true });
  });

  app.delete('/api/gallery/:id', (req, res) => {
    const { id } = req.params;
    runQuery(db, 'DELETE FROM gallery_items WHERE id = ?;', [id]);
    res.json({ success: true });
  });

  // 5. Music API
  app.get('/api/music', (req, res) => {
    const tracks = queryAll(db, 'SELECT * FROM music_tracks ORDER BY id DESC;');
    res.json(tracks);
  });

  app.post('/api/music', (req, res) => {
    const { title, artist, file_url, album_art, duration, favorite } = req.body;
    runQuery(
      db,
      'INSERT INTO music_tracks (title, artist, file_url, album_art, duration, favorite) VALUES (?, ?, ?, ?, ?, ?);',
      [title, artist || 'Unknown Artist', file_url, album_art || '', duration || '03:00', favorite ? 1 : 0]
    );
    res.json({ success: true });
  });

  app.put('/api/music/:id', (req, res) => {
    const { id } = req.params;
    const { title, artist, file_url, album_art, duration, favorite } = req.body;
    runQuery(
      db,
      'UPDATE music_tracks SET title=?, artist=?, file_url=?, album_art=?, duration=?, favorite=? WHERE id=?;',
      [title, artist || 'Unknown Artist', file_url, album_art || '', duration || '03:00', favorite ? 1 : 0, id]
    );
    res.json({ success: true });
  });

  app.post('/api/music/:id/favorite', (req, res) => {
    const { id } = req.params;
    const item = queryOne(db, 'SELECT favorite FROM music_tracks WHERE id = ?;', [id]);
    if (item) {
      const newFav = item.favorite === 1 ? 0 : 1;
      runQuery(db, 'UPDATE music_tracks SET favorite = ? WHERE id = ?;', [newFav, id]);
    }
    res.json({ success: true });
  });

  app.delete('/api/music/:id', (req, res) => {
    const { id } = req.params;
    runQuery(db, 'DELETE FROM music_tracks WHERE id = ?;', [id]);
    res.json({ success: true });
  });

  // 6. Love Notes API
  app.get('/api/notes', (req, res) => {
    const notes = queryAll(db, 'SELECT * FROM love_notes ORDER BY is_pinned DESC, id DESC;');
    res.json(notes);
  });

  app.post('/api/notes', (req, res) => {
    const { sender, receiver, message, emoji, is_pinned } = req.body;
    runQuery(
      db,
      'INSERT INTO love_notes (sender, receiver, message, emoji, is_pinned) VALUES (?, ?, ?, ?, ?);',
      [sender || 'Alex', receiver || 'Sophia', message, emoji || '❤️', is_pinned ? 1 : 0]
    );
    res.json({ success: true });
  });

  app.put('/api/notes/:id', (req, res) => {
    const { id } = req.params;
    const { sender, receiver, message, emoji, is_pinned } = req.body;
    runQuery(
      db,
      'UPDATE love_notes SET sender=?, receiver=?, message=?, emoji=?, is_pinned=? WHERE id=?;',
      [sender, receiver, message, emoji || '❤️', is_pinned ? 1 : 0, id]
    );
    res.json({ success: true });
  });

  app.post('/api/notes/:id/pin', (req, res) => {
    const { id } = req.params;
    const note = queryOne(db, 'SELECT is_pinned FROM love_notes WHERE id = ?;', [id]);
    if (note) {
      const newPinned = note.is_pinned === 1 ? 0 : 1;
      runQuery(db, 'UPDATE love_notes SET is_pinned = ? WHERE id = ?;', [newPinned, id]);
    }
    res.json({ success: true });
  });

  app.delete('/api/notes/:id', (req, res) => {
    const { id } = req.params;
    runQuery(db, 'DELETE FROM love_notes WHERE id = ?;', [id]);
    res.json({ success: true });
  });

  // 7. Memory Calendar API
  app.get('/api/calendar', (req, res) => {
    const memories = queryAll(db, 'SELECT * FROM calendar_memories ORDER BY date DESC;');
    res.json(memories);
  });

  app.post('/api/calendar', (req, res) => {
    const { date, title, note, media_url, event_type } = req.body;
    runQuery(
      db,
      'INSERT INTO calendar_memories (date, title, note, media_url, event_type) VALUES (?, ?, ?, ?, ?);',
      [date, title, note || '', media_url || '', event_type || 'memory']
    );
    res.json({ success: true });
  });

  app.put('/api/calendar/:id', (req, res) => {
    const { id } = req.params;
    const { date, title, note, media_url, event_type } = req.body;
    runQuery(
      db,
      'UPDATE calendar_memories SET date=?, title=?, note=?, media_url=?, event_type=? WHERE id=?;',
      [date, title, note || '', media_url || '', event_type || 'memory', id]
    );
    res.json({ success: true });
  });

  app.delete('/api/calendar/:id', (req, res) => {
    const { id } = req.params;
    runQuery(db, 'DELETE FROM calendar_memories WHERE id = ?;', [id]);
    res.json({ success: true });
  });

  // 8. Secret Love Letters API
  app.get('/api/letters', (req, res) => {
    const letters = queryAll(db, 'SELECT * FROM love_letters ORDER BY id DESC;');
    res.json(letters);
  });

  app.post('/api/letters', (req, res) => {
    const { title, content, date } = req.body;
    runQuery(
      db,
      'INSERT INTO love_letters (title, content, date, is_opened, is_archived) VALUES (?, ?, ?, 0, 0);',
      [title, content, date || new Date().toISOString().slice(0, 10)]
    );
    res.json({ success: true });
  });

  app.put('/api/letters/:id', (req, res) => {
    const { id } = req.params;
    const { title, content, is_opened, is_archived } = req.body;
    runQuery(
      db,
      'UPDATE love_letters SET title=?, content=?, is_opened=?, is_archived=? WHERE id=?;',
      [title, content, is_opened ? 1 : 0, is_archived ? 1 : 0, id]
    );
    res.json({ success: true });
  });

  app.delete('/api/letters/:id', (req, res) => {
    const { id } = req.params;
    runQuery(db, 'DELETE FROM love_letters WHERE id = ?;', [id]);
    res.json({ success: true });
  });

  // 9. File Upload Endpoints
  app.post('/api/upload/photos', upload.single('file'), (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    const fileUrl = `/uploads/photos/${req.file.filename}`;
    res.json({ success: true, url: fileUrl });
  });

  app.post('/api/upload/videos', upload.single('file'), (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    const fileUrl = `/uploads/videos/${req.file.filename}`;
    res.json({ success: true, url: fileUrl });
  });

  app.post('/api/upload/music', upload.single('file'), (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    const fileUrl = `/uploads/music/${req.file.filename}`;
    res.json({ success: true, url: fileUrl });
  });

  // --- VITE MIDDLEWARE / STATIC SERVING ---
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`SABRIANISA server running on http://0.0.0.0:${PORT}`);
  });
}

main().catch((err) => {
  console.error('Failed to start SABRIANISA server:', err);
});
