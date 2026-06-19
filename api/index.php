<?php
// ============================================================
// SIPORA REST API — Router
// ============================================================
// Endpoints:
//   GET    /api/orangutan         — List all orangutan
//   GET    /api/orangutan/:id     — Get one orangutan
//   POST   /api/orangutan         — Create orangutan
//   PUT    /api/orangutan/:id     — Update orangutan
//   DELETE /api/orangutan/:id     — Delete orangutan
//
//   GET    /api/rehabilitasi      — List all rehabilitasi
//   POST   /api/rehabilitasi      — Create rehabilitasi
//   PUT    /api/rehabilitasi/:id   — Update rehabilitasi
//   DELETE /api/rehabilitasi/:id   — Delete rehabilitasi
//
//   GET    /api/laporan           — List all laporan
//   POST   /api/laporan           — Create laporan
//   PUT    /api/laporan/:id       — Update laporan status
//   DELETE /api/laporan/:id       — Delete laporan
//
//   GET    /api/users             — List all users
//   POST   /api/users             — Create user
//   POST   /api/login             — Authenticate user
//   DELETE /api/users/:id         — Delete user
//
//   GET    /api/dashboard         — Dashboard statistics
// ============================================================

require_once __DIR__ . '/config.php';

// Parse request
$method = $_SERVER['REQUEST_METHOD'];
$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$uri = rtrim($uri, '/');

// Strip base path (adjust if in subdirectory)
$base = '/api';
if (strpos($uri, $base) === 0) {
  $uri = substr($uri, strlen($base));
}

$parts = array_values(array_filter(explode('/', $uri)));
$resource = $parts[0] ?? null;
$id = $parts[1] ?? null;

// Get JSON body
$body = json_decode(file_get_contents('php://input'), true) ?? [];

// ============================================================
// ROUTES
// ============================================================

try {
  switch ($resource) {

    // ─── ORANGUTAN ──────────────────────────────────────────
    case 'orangutan':
      switch ($method) {
        case 'GET':
          if ($id) {
            $stmt = $pdo->prepare("SELECT * FROM orangutan WHERE id = ?");
            $stmt->execute([$id]);
            $data = $stmt->fetch();
            $data ? jsonResponse($data) : jsonError('Not found', 404);
          } else {
            $stmt = $pdo->query("SELECT * FROM orangutan ORDER BY nama ASC");
            jsonResponse($stmt->fetchAll());
          }
          break;

        case 'POST':
          $fields = ['nama','jenis_kelamin','usia','berat','habitat','status_konservasi','lokasi','foto_url','deskripsi','kondisi','tgl_masuk'];
          $insert = [];
          foreach ($fields as $f) {
            if (isset($body[$f])) $insert[$f] = $body[$f];
          }
          if (empty($insert['nama'])) jsonError('Nama wajib diisi');
          $cols = implode(',', array_keys($insert));
          $vals = implode(',', array_fill(0, count($insert), '?'));
          $stmt = $pdo->prepare("INSERT INTO orangutan ($cols) VALUES ($vals)");
          $stmt->execute(array_values($insert));
          jsonResponse(['id' => $pdo->lastInsertId(), 'message' => 'Data berhasil ditambahkan'], 201);
          break;

        case 'PUT':
          if (!$id) jsonError('ID diperlukan');
          $fields = ['nama','jenis_kelamin','usia','berat','habitat','status_konservasi','lokasi','foto_url','deskripsi','kondisi','tgl_masuk'];
          $sets = [];
          $vals = [];
          foreach ($fields as $f) {
            if (isset($body[$f])) {
              $sets[] = "$f = ?";
              $vals[] = $body[$f];
            }
          }
          if (empty($sets)) jsonError('Tidak ada data yang diupdate');
          $vals[] = $id;
          $stmt = $pdo->prepare("UPDATE orangutan SET " . implode(',', $sets) . " WHERE id = ?");
          $stmt->execute($vals);
          jsonResponse(['message' => 'Data berhasil diperbarui']);
          break;

        case 'DELETE':
          if (!$id) jsonError('ID diperlukan');
          $stmt = $pdo->prepare("DELETE FROM orangutan WHERE id = ?");
          $stmt->execute([$id]);
          jsonResponse(['message' => 'Data berhasil dihapus']);
          break;

        default:
          jsonError('Method not allowed', 405);
      }
      break;

    // ─── REHABILITASI ───────────────────────────────────────
    case 'rehabilitasi':
      switch ($method) {
        case 'GET':
          if ($id) {
            $stmt = $pdo->prepare("SELECT r.*, o.foto_url as orangutan_foto FROM rehabilitasi r LEFT JOIN orangutan o ON r.orangutan_id = o.id WHERE r.id = ?");
            $stmt->execute([$id]);
            $data = $stmt->fetch();
            $data ? jsonResponse($data) : jsonError('Not found', 404);
          } else {
            $stmt = $pdo->query("SELECT r.*, o.foto_url as orangutan_foto FROM rehabilitasi r LEFT JOIN orangutan o ON r.orangutan_id = o.id ORDER BY r.tanggal DESC");
            jsonResponse($stmt->fetchAll());
          }
          break;

        case 'POST':
          $required = ['nama','tanggal','program','petugas'];
          foreach ($required as $r) {
            if (empty($body[$r])) jsonError("$r wajib diisi");
          }
          $stmt = $pdo->prepare("INSERT INTO rehabilitasi (orangutan_id, nama, tanggal, program, status, petugas, deskripsi, progress) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
          $stmt->execute([
            $body['orangutan_id'] ?? null,
            $body['nama'],
            $body['tanggal'],
            $body['program'],
            $body['status'] ?? 'Aktif',
            $body['petugas'],
            $body['deskripsi'] ?? null,
            $body['progress'] ?? 0,
          ]);
          jsonResponse(['id' => $pdo->lastInsertId(), 'message' => 'Data rehabilitasi ditambahkan'], 201);
          break;

        case 'PUT':
          if (!$id) jsonError('ID diperlukan');
          $fields = ['nama','tanggal','program','status','petugas','deskripsi','progress'];
          $sets = [];
          $vals = [];
          foreach ($fields as $f) {
            if (isset($body[$f])) {
              $sets[] = "$f = ?";
              $vals[] = $body[$f];
            }
          }
          if (empty($sets)) jsonError('Tidak ada data yang diupdate');
          $vals[] = $id;
          $stmt = $pdo->prepare("UPDATE rehabilitasi SET " . implode(',', $sets) . " WHERE id = ?");
          $stmt->execute($vals);
          jsonResponse(['message' => 'Data rehabilitasi diperbarui']);
          break;

        case 'DELETE':
          if (!$id) jsonError('ID diperlukan');
          $stmt = $pdo->prepare("DELETE FROM rehabilitasi WHERE id = ?");
          $stmt->execute([$id]);
          jsonResponse(['message' => 'Data rehabilitasi dihapus']);
          break;

        default:
          jsonError('Method not allowed', 405);
      }
      break;

    // ─── LAPORAN ────────────────────────────────────────────
    case 'laporan':
      switch ($method) {
        case 'GET':
          if ($id) {
            $stmt = $pdo->prepare("SELECT * FROM laporan WHERE id = ?");
            $stmt->execute([$id]);
            $data = $stmt->fetch();
            $data ? jsonResponse($data) : jsonError('Not found', 404);
          } else {
            $stmt = $pdo->query("SELECT * FROM laporan ORDER BY created_at DESC");
            jsonResponse($stmt->fetchAll());
          }
          break;

        case 'POST':
          $required = ['nama','hp','tanggal','lokasi'];
          foreach ($required as $r) {
            if (empty($body[$r])) jsonError("$r wajib diisi");
          }
          $stmt = $pdo->prepare("INSERT INTO laporan (nama, hp, tanggal, lokasi, jenis, kondisi, keterangan, foto_url, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
          $stmt->execute([
            $body['nama'], $body['hp'], $body['tanggal'], $body['lokasi'],
            $body['jenis'] ?? null, $body['kondisi'] ?? null, $body['keterangan'] ?? null,
            $body['foto_url'] ?? null, $body['status'] ?? 'Menunggu',
          ]);
          jsonResponse(['id' => $pdo->lastInsertId(), 'message' => 'Laporan berhasil dikirim'], 201);
          break;

        case 'PUT':
          if (!$id) jsonError('ID diperlukan');
          $fields = ['status','nama','hp','tanggal','lokasi','jenis','kondisi','keterangan'];
          $sets = [];
          $vals = [];
          foreach ($fields as $f) {
            if (isset($body[$f])) {
              $sets[] = "$f = ?";
              $vals[] = $body[$f];
            }
          }
          if (empty($sets)) jsonError('Tidak ada data yang diupdate');
          $vals[] = $id;
          $stmt = $pdo->prepare("UPDATE laporan SET " . implode(',', $sets) . " WHERE id = ?");
          $stmt->execute($vals);
          jsonResponse(['message' => 'Laporan diperbarui']);
          break;

        case 'DELETE':
          if (!$id) jsonError('ID diperlukan');
          $stmt = $pdo->prepare("DELETE FROM laporan WHERE id = ?");
          $stmt->execute([$id]);
          jsonResponse(['message' => 'Laporan dihapus']);
          break;

        default:
          jsonError('Method not allowed', 405);
      }
      break;

    // ─── USERS ──────────────────────────────────────────────
    case 'users':
      switch ($method) {
        case 'GET':
          if ($id === 'current') {
            session_start();
            if (!isset($_SESSION['user_id'])) jsonError('Not authenticated', 401);
            $stmt = $pdo->prepare("SELECT id, nama, username, role, status, last_login FROM users WHERE id = ?");
            $stmt->execute([$_SESSION['user_id']]);
            jsonResponse($stmt->fetch());
          } else {
            $stmt = $pdo->query("SELECT id, nama, username, role, status, last_login FROM users ORDER BY id ASC");
            jsonResponse($stmt->fetchAll());
          }
          break;

        case 'POST':
          $required = ['nama','username','password'];
          foreach ($required as $r) {
            if (empty($body[$r])) jsonError("$r wajib diisi");
          }
          // Check duplicate
          $chk = $pdo->prepare("SELECT id FROM users WHERE username = ?");
          $chk->execute([$body['username']]);
          if ($chk->fetch()) jsonError('Username sudah dipakai');
          $stmt = $pdo->prepare("INSERT INTO users (nama, username, password, role, status) VALUES (?, ?, SHA2(?, 256), ?, 'Aktif')");
          $stmt->execute([$body['nama'], $body['username'], $body['password'], $body['role'] ?? 'Viewer']);
          jsonResponse(['id' => $pdo->lastInsertId(), 'message' => 'Pengguna berhasil ditambahkan'], 201);
          break;

        case 'DELETE':
          if (!$id) jsonError('ID diperlukan');
          $stmt = $pdo->prepare("DELETE FROM users WHERE id = ? AND username != 'admin'");
          $stmt->execute([$id]);
          jsonResponse(['message' => 'Pengguna dihapus']);
          break;

        default:
          jsonError('Method not allowed', 405);
      }
      break;

    // ─── LOGIN ──────────────────────────────────────────────
    case 'login':
      if ($method !== 'POST') jsonError('Method not allowed', 405);
      $username = $body['username'] ?? '';
      $password = $body['password'] ?? '';
      if (!$username || !$password) jsonError('Username dan password wajib diisi');
      $stmt = $pdo->prepare("SELECT id, nama, username, role, status FROM users WHERE username = ? AND password = SHA2(?, 256) AND status = 'Aktif'");
      $stmt->execute([$username, $password]);
      $user = $stmt->fetch();
      if (!$user) jsonError('Username atau password salah', 401);
      // Update last login
      $pdo->prepare("UPDATE users SET last_login = NOW() WHERE id = ?")->execute([$user['id']]);
      session_start();
      $_SESSION['user_id'] = $user['id'];
      $_SESSION['user'] = $user;
      jsonResponse(['user' => $user, 'token' => session_id()]);
      break;

    // ─── DASHBOARD ──────────────────────────────────────────
    case 'dashboard':
      $total = $pdo->query("SELECT COUNT(*) FROM orangutan")->fetchColumn();
      $cr = $pdo->query("SELECT COUNT(*) FROM orangutan WHERE status_konservasi = 'Kritis (CR)'")->fetchColumn();
      $en = $pdo->query("SELECT COUNT(*) FROM orangutan WHERE status_konservasi = 'Terancam (EN)'")->fetchColumn();
      $vu = $pdo->query("SELECT COUNT(*) FROM orangutan WHERE status_konservasi = 'Rentan (VU)'")->fetchColumn();
      $rehab = $pdo->query("SELECT COUNT(*) FROM rehabilitasi WHERE status = 'Aktif'")->fetchColumn();
      $laporan = $pdo->query("SELECT COUNT(*) FROM laporan")->fetchColumn();
      $laporanMenunggu = $pdo->query("SELECT COUNT(*) FROM laporan WHERE status = 'Menunggu'")->fetchColumn();
      $users = $pdo->query("SELECT COUNT(*) FROM users")->fetchColumn();
      $rehabRecent = $pdo->query("SELECT r.*, o.foto_url FROM rehabilitasi r LEFT JOIN orangutan o ON r.orangutan_id = o.id ORDER BY r.created_at DESC LIMIT 6")->fetchAll();
      jsonResponse([
        'total_orangutan' => (int)$total,
        'kritis' => (int)$cr,
        'terancam' => (int)$en,
        'rentan' => (int)$vu,
        'rehab_aktif' => (int)$rehab,
        'laporan_total' => (int)$laporan,
        'laporan_menunggu' => (int)$laporanMenunggu,
        'total_users' => (int)$users,
        'rehab_recent' => $rehabRecent,
      ]);
      break;

    // ─── LOGOUT ─────────────────────────────────────────────
    case 'logout':
      session_start();
      session_destroy();
      jsonResponse(['message' => 'Logged out']);
      break;

    default:
      jsonError('Endpoint not found', 404);
  }
} catch (PDOException $e) {
  jsonError('Database error: ' . $e->getMessage(), 500);
} catch (Exception $e) {
  jsonError('Server error: ' . $e->getMessage(), 500);
}
