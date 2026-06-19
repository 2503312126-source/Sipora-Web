// ============================================================
// SIPORA v3.0 — Node.js Server + MySQL Backend
// ============================================================
// Run: node server.js
// Access: http://localhost:3000
// ============================================================

const express = require('express');
const mysql = require('mysql2/promise');
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = 3000;

// Config
const DB_CONFIG = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'sipora_db',
  waitForConnections: true,
  charset: 'utf8mb4',
};

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.static(__dirname));

// CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

// ─── DB Connection Pool ──────────────────────────────────────
let pool;

async function getPool() {
  if (!pool) {
    pool = mysql.createPool(DB_CONFIG);
  }
  return pool;
}

// Helper: SHA2
function sha2(str) {
  return crypto.createHash('sha256').update(str).digest('hex');
}

// Helper: JSON response
function jsonRes(res, data, code = 200) {
  res.status(code).json(data);
}
function jsonErr(res, msg, code = 400) {
  res.status(code).json({ error: msg });
}

// ─── ROUTES ────────────────────────────────────────────────────

// Login
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return jsonErr(res, 'Username dan password wajib diisi');
    const db = await getPool();
    const [rows] = await db.query(
      "SELECT id, nama, username, role, status FROM users WHERE username = ? AND password = ? AND status = 'Aktif'",
      [username, sha2(password)]
    );
    if (!rows.length) return jsonErr(res, 'Username atau password salah', 401);
    await db.query("UPDATE users SET last_login = NOW() WHERE id = ?", [rows[0].id]);
    jsonRes(res, { user: rows[0], token: 'session-' + rows[0].id });
  } catch (e) { jsonErr(res, e.message, 500); }
});

// ─── ORANGUTAN ─────────────────────────────────────────────────
app.get('/api/orangutan', async (req, res) => {
  try {
    const db = await getPool();
    const [rows] = await db.query("SELECT * FROM orangutan ORDER BY nama ASC");
    jsonRes(res, rows);
  } catch (e) { jsonErr(res, e.message, 500); }
});

app.get('/api/orangutan/:id', async (req, res) => {
  try {
    const db = await getPool();
    const [rows] = await db.query("SELECT * FROM orangutan WHERE id = ?", [req.params.id]);
    if (!rows.length) return jsonErr(res, 'Not found', 404);
    jsonRes(res, rows[0]);
  } catch (e) { jsonErr(res, e.message, 500); }
});

app.post('/api/orangutan', async (req, res) => {
  try {
    const { nama, jenis_kelamin, usia, berat, habitat, status_konservasi, lokasi, foto_url, deskripsi, kondisi, tgl_masuk } = req.body;
    if (!nama) return jsonErr(res, 'Nama wajib diisi');
    const db = await getPool();
    const [result] = await db.query(
      "INSERT INTO orangutan (nama, jenis_kelamin, usia, berat, habitat, status_konservasi, lokasi, foto_url, deskripsi, kondisi, tgl_masuk) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [nama, jenis_kelamin||'Jantan', usia||0, berat||0, habitat||'Sumatera', status_konservasi||'Kritis (CR)', lokasi||'', foto_url||null, deskripsi||null, kondisi||null, tgl_masuk||null]
    );
    jsonRes(res, { id: result.insertId, message: 'Data berhasil ditambahkan' }, 201);
  } catch (e) { jsonErr(res, e.message, 500); }
});

app.put('/api/orangutan/:id', async (req, res) => {
  try {
    const db = await getPool();
    const fields = [];
    const vals = [];
    const map = { nama:1, jenis_kelamin:1, usia:1, berat:1, habitat:1, status_konservasi:1, lokasi:1, foto_url:1, deskripsi:1, kondisi:1, tgl_masuk:1 };
    for (const [key, val] of Object.entries(req.body)) {
      if (map[key]) { fields.push(`${key}=?`); vals.push(val); }
    }
    if (!fields.length) return jsonErr(res, 'Tidak ada data yang diupdate');
    vals.push(req.params.id);
    await db.query(`UPDATE orangutan SET ${fields.join(',')} WHERE id=?`, vals);
    jsonRes(res, { message: 'Data berhasil diperbarui' });
  } catch (e) { jsonErr(res, e.message, 500); }
});

app.delete('/api/orangutan/:id', async (req, res) => {
  try {
    const db = await getPool();
    await db.query("DELETE FROM orangutan WHERE id = ?", [req.params.id]);
    jsonRes(res, { message: 'Data berhasil dihapus' });
  } catch (e) { jsonErr(res, e.message, 500); }
});

// ─── REHABILITASI ──────────────────────────────────────────────
app.get('/api/rehabilitasi', async (req, res) => {
  try {
    const db = await getPool();
    const [rows] = await db.query("SELECT r.*, o.foto_url as orangutan_foto FROM rehabilitasi r LEFT JOIN orangutan o ON r.orangutan_id = o.id ORDER BY r.tanggal DESC");
    jsonRes(res, rows);
  } catch (e) { jsonErr(res, e.message, 500); }
});

app.post('/api/rehabilitasi', async (req, res) => {
  try {
    const { orangutan_id, nama, tanggal, program, status, petugas, deskripsi, progress } = req.body;
    if (!nama || !tanggal || !program || !petugas) return jsonErr(res, 'nama, tanggal, program, petugas wajib diisi');
    const db = await getPool();
    const [result] = await db.query(
      "INSERT INTO rehabilitasi (orangutan_id, nama, tanggal, program, status, petugas, deskripsi, progress) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [orangutan_id||null, nama, tanggal, program, status||'Aktif', petugas, deskripsi||null, progress||0]
    );
    jsonRes(res, { id: result.insertId, message: 'Data rehabilitasi ditambahkan' }, 201);
  } catch (e) { jsonErr(res, e.message, 500); }
});

app.put('/api/rehabilitasi/:id', async (req, res) => {
  try {
    const db = await getPool();
    const fields = []; const vals = [];
    const map = { nama:1, tanggal:1, program:1, status:1, petugas:1, deskripsi:1, progress:1 };
    for (const [key, val] of Object.entries(req.body)) {
      if (map[key]) { fields.push(`${key}=?`); vals.push(val); }
    }
    if (!fields.length) return jsonErr(res, 'Tidak ada data yang diupdate');
    vals.push(req.params.id);
    await db.query(`UPDATE rehabilitasi SET ${fields.join(',')} WHERE id=?`, vals);
    jsonRes(res, { message: 'Data rehabilitasi diperbarui' });
  } catch (e) { jsonErr(res, e.message, 500); }
});

app.delete('/api/rehabilitasi/:id', async (req, res) => {
  try {
    const db = await getPool();
    await db.query("DELETE FROM rehabilitasi WHERE id = ?", [req.params.id]);
    jsonRes(res, { message: 'Data rehabilitasi dihapus' });
  } catch (e) { jsonErr(res, e.message, 500); }
});

// ─── LAPORAN ───────────────────────────────────────────────────
app.get('/api/laporan', async (req, res) => {
  try {
    const db = await getPool();
    const [rows] = await db.query("SELECT * FROM laporan ORDER BY created_at DESC");
    jsonRes(res, rows);
  } catch (e) { jsonErr(res, e.message, 500); }
});

app.post('/api/laporan', async (req, res) => {
  try {
    const { nama, hp, tanggal, lokasi, jenis, kondisi, keterangan, foto_url, status } = req.body;
    if (!nama || !hp || !tanggal || !lokasi) return jsonErr(res, 'Nama, HP, tanggal, lokasi wajib diisi');
    const db = await getPool();
    const [result] = await db.query(
      "INSERT INTO laporan (nama, hp, tanggal, lokasi, jenis, kondisi, keterangan, foto_url, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [nama, hp, tanggal, lokasi, jenis||null, kondisi||null, keterangan||null, foto_url||null, status||'Menunggu']
    );
    jsonRes(res, { id: result.insertId, message: 'Laporan berhasil dikirim' }, 201);
  } catch (e) { jsonErr(res, e.message, 500); }
});

app.put('/api/laporan/:id', async (req, res) => {
  try {
    const db = await getPool();
    const fields = []; const vals = [];
    const map = { status:1, nama:1, hp:1, tanggal:1, lokasi:1, jenis:1, kondisi:1, keterangan:1 };
    for (const [key, val] of Object.entries(req.body)) {
      if (map[key]) { fields.push(`${key}=?`); vals.push(val); }
    }
    if (!fields.length) return jsonErr(res, 'Tidak ada data yang diupdate');
    vals.push(req.params.id);
    await db.query(`UPDATE laporan SET ${fields.join(',')} WHERE id=?`, vals);
    jsonRes(res, { message: 'Laporan diperbarui' });
  } catch (e) { jsonErr(res, e.message, 500); }
});

app.delete('/api/laporan/:id', async (req, res) => {
  try {
    const db = await getPool();
    await db.query("DELETE FROM laporan WHERE id = ?", [req.params.id]);
    jsonRes(res, { message: 'Laporan dihapus' });
  } catch (e) { jsonErr(res, e.message, 500); }
});

// ─── USERS ─────────────────────────────────────────────────────
app.get('/api/users', async (req, res) => {
  try {
    const db = await getPool();
    const [rows] = await db.query("SELECT id, nama, username, role, status, last_login FROM users ORDER BY id ASC");
    jsonRes(res, rows);
  } catch (e) { jsonErr(res, e.message, 500); }
});

app.post('/api/users', async (req, res) => {
  try {
    const { nama, username, password, role } = req.body;
    if (!nama || !username || !password) return jsonErr(res, 'Semua field wajib diisi');
    const db = await getPool();
    const [dup] = await db.query("SELECT id FROM users WHERE username = ?", [username]);
    if (dup.length) return jsonErr(res, 'Username sudah dipakai');
    const [result] = await db.query(
      "INSERT INTO users (nama, username, password, role, status) VALUES (?, ?, ?, ?, 'Aktif')",
      [nama, username, sha2(password), role||'Viewer']
    );
    jsonRes(res, { id: result.insertId, message: 'Pengguna berhasil ditambahkan' }, 201);
  } catch (e) { jsonErr(res, e.message, 500); }
});

app.delete('/api/users/:id', async (req, res) => {
  try {
    const db = await getPool();
    // Prevent deleting admin
    const [user] = await db.query("SELECT username FROM users WHERE id = ?", [req.params.id]);
    if (user.length && user[0].username === 'admin') return jsonErr(res, 'Akun admin tidak bisa dihapus');
    await db.query("DELETE FROM users WHERE id = ?", [req.params.id]);
    jsonRes(res, { message: 'Pengguna dihapus' });
  } catch (e) { jsonErr(res, e.message, 500); }
});

// ─── DASHBOARD ─────────────────────────────────────────────────
app.get('/api/dashboard', async (req, res) => {
  try {
    const db = await getPool();
    const [[{ total }]] = await db.query("SELECT COUNT(*) as total FROM orangutan");
    const [[{ cr }]] = await db.query("SELECT COUNT(*) as cr FROM orangutan WHERE status_konservasi = 'Kritis (CR)'");
    const [[{ en }]] = await db.query("SELECT COUNT(*) as en FROM orangutan WHERE status_konservasi = 'Terancam (EN)'");
    const [[{ vu }]] = await db.query("SELECT COUNT(*) as vu FROM orangutan WHERE status_konservasi = 'Rentan (VU)'");
    const [[{ rehab }]] = await db.query("SELECT COUNT(*) as rehab FROM rehabilitasi WHERE status = 'Aktif'");
    const [[{ laporan }]] = await db.query("SELECT COUNT(*) as laporan FROM laporan");
    const [[{ laporanM }]] = await db.query("SELECT COUNT(*) as laporanM FROM laporan WHERE status = 'Menunggu'");
    const [[{ users }]] = await db.query("SELECT COUNT(*) as users FROM users");
    const [rehabRecent] = await db.query("SELECT r.*, o.foto_url FROM rehabilitasi r LEFT JOIN orangutan o ON r.orangutan_id = o.id ORDER BY r.created_at DESC LIMIT 6");
    jsonRes(res, {
      total_orangutan: total, kritis: cr, terancam: en, rentan: vu,
      rehab_aktif: rehab, laporan_total: laporan, laporan_menunggu: laporanM,
      total_users: users, rehab_recent: rehabRecent,
    });
  } catch (e) { jsonErr(res, e.message, 500); }
});

// ─── SPA fallback: all other routes serve index.html ──────────
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// ─── START ─────────────────────────────────────────────────────
async function start() {
  try {
    // Test DB connection
    const db = await getPool();
    await db.query("SELECT 1");
    console.log('✓ MySQL connected to sipora_db');
  } catch (e) {
    console.error('✗ MySQL connection failed:', e.message);
    console.log('  The app will still serve static files but database features will be disabled.');
    console.log('  Make sure MySQL is running and sipora_db exists.');
  }

  app.listen(PORT, () => {
    console.log('');
    console.log('  ╔══════════════════════════════════════╗');
    console.log('  ║     SIPORA v3.0 — Server Ready      ║');
    console.log('  ╠══════════════════════════════════════╣');
    console.log(`  ║  http://localhost:${PORT}                ║`);
    console.log('  ║  Login: admin / admin123             ║');
    console.log('  ╚══════════════════════════════════════╝');
    console.log('');
  });
}

start();
