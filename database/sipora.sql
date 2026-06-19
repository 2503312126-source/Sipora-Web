-- ============================================================
-- SIPORA Database Schema
-- Sistem Informasi Pengelolaan Orangutan
-- MySQL 8.0+
-- ============================================================

CREATE DATABASE IF NOT EXISTS sipora_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE sipora_db;

-- ============================================================
-- USERS
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nama VARCHAR(100) NOT NULL,
  username VARCHAR(50) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role ENUM('Admin','Petugas','Viewer') NOT NULL DEFAULT 'Viewer',
  status ENUM('Aktif','Nonaktif') NOT NULL DEFAULT 'Aktif',
  last_login DATETIME DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ============================================================
-- ORANGUTAN (data dari Orangutan Haven)
-- ============================================================
CREATE TABLE IF NOT EXISTS orangutan (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nama VARCHAR(100) NOT NULL,
  jenis_kelamin ENUM('Jantan','Betina') NOT NULL,
  usia INT NOT NULL DEFAULT 0 COMMENT 'perkiraan usia dalam tahun',
  berat DECIMAL(5,1) NOT NULL DEFAULT 0 COMMENT 'berat dalam kg',
  habitat VARCHAR(100) NOT NULL DEFAULT 'Sumatera',
  status_konservasi ENUM('Kritis (CR)','Terancam (EN)','Rentan (VU)') NOT NULL DEFAULT 'Kritis (CR)',
  lokasi VARCHAR(200) NOT NULL DEFAULT 'Orangutan Haven',
  foto_url VARCHAR(500) DEFAULT NULL,
  deskripsi TEXT DEFAULT NULL,
  tgl_lahir_est INT DEFAULT NULL COMMENT 'tahun estimasi lahir',
  tgl_rescue DATE DEFAULT NULL,
  kondisi VARCHAR(255) DEFAULT NULL,
  tgl_masuk DATE DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ============================================================
-- REHABILITASI
-- ============================================================
CREATE TABLE IF NOT EXISTS rehabilitasi (
  id INT AUTO_INCREMENT PRIMARY KEY,
  orangutan_id INT DEFAULT NULL,
  nama VARCHAR(100) NOT NULL,
  tanggal DATE NOT NULL,
  program VARCHAR(200) NOT NULL,
  status ENUM('Aktif','Selesai','Dihentikan') NOT NULL DEFAULT 'Aktif',
  petugas VARCHAR(100) NOT NULL,
  deskripsi TEXT DEFAULT NULL,
  progress INT DEFAULT 0 COMMENT '0-100',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (orangutan_id) REFERENCES orangutan(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ============================================================
-- LAPORAN
-- ============================================================
CREATE TABLE IF NOT EXISTS laporan (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nama VARCHAR(100) NOT NULL,
  hp VARCHAR(20) NOT NULL,
  tanggal DATETIME NOT NULL,
  lokasi VARCHAR(200) NOT NULL,
  jenis VARCHAR(100) DEFAULT NULL,
  kondisi VARCHAR(50) DEFAULT NULL,
  keterangan TEXT DEFAULT NULL,
  foto_url VARCHAR(500) DEFAULT NULL,
  status ENUM('Menunggu','Diproses','Selesai') NOT NULL DEFAULT 'Menunggu',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ============================================================
-- SEED DATA
-- ============================================================

-- Users (password hashed with SHA2 for simplicity; use bcrypt in production)
INSERT INTO users (nama, username, password, role, status) VALUES
  ('Administrator', 'admin', SHA2('admin123', 256), 'Admin', 'Aktif'),
  ('Dr. Rina Sari', 'rina', SHA2('rina123', 256), 'Petugas', 'Aktif'),
  ('Budi Santoso', 'budi', SHA2('budi123', 256), 'Petugas', 'Aktif'),
  ('Viewer Guest', 'viewer', SHA2('viewer123', 256), 'Viewer', 'Aktif');

-- Orangutan (data real dari Orangutan Haven)
INSERT INTO orangutan (nama, jenis_kelamin, usia, berat, habitat, status_konservasi, lokasi, foto_url, deskripsi, tgl_lahir_est, kondisi) VALUES
  ('Krismon', 'Jantan', 30, 75.0, 'Sumatera', 'Kritis (CR)',
   'Orangutan Haven, Sumatera Utara',
   'https://orangutanhaven.com/wp-content/uploads/2025/10/Krismon-scaled.jpg',
   'Krismon disita pada 2016 sebagai hewan peliharaan ilegal. Ia dipelihara selama 19 tahun dalam kandang logam yang hanya sedikit lebih besar dari tubuhnya. Namanya singkatan dari "Krisis Moneter" merujuk pada krisis keuangan Indonesia 1997. Masih menunjukkan kelemahan fisik dan mental yang parah. Sejak disita, ia menjalani pelatihan fisioterapi bersama pawang.',
   1996, 'Trauma dan kelemahan fisik'),

  ('Leuser', 'Jantan', 27, 80.0, 'Sumatera', 'Kritis (CR)',
   'Orangutan Haven, Sumatera Utara',
   'https://orangutanhaven.com/wp-content/uploads/brizy/imgs/Leuser-Island-Haven23-scaled-914x609x205x136x505x337x1773990661.jpg',
   'Leuser disita sebagai hewan peliharaan ilegal saat berusia 5 tahun dan dilepasliarkan di Taman Nasional Bukit Tigapuluh, Jambi. Ia berkembang biak di alam liar hingga ia memasuki lahan pertanian dan ditembak 62 kali oleh penduduk desa. Akibatnya, ia mengalami kebutaan 100% dan tidak bisa lagi bernavigasi atau mencari makanan di hutan.',
   1999, 'Buta total (ditembak 62 kali)'),

  ('Fahzren', 'Jantan', 28, 85.0, 'Sumatera', 'Terancam (EN)',
   'Orangutan Haven, Sumatera Utara',
   'https://orangutanhaven.com/wp-content/uploads/2025/10/Fahzren_Armin_Dett_6-scaled.jpg',
   'Fahzren diselundupkan secara ilegal ke Malaysia sebagai bayi dan tumbuh besar tampil dalam "pertunjukan hewan" (naik sepeda, main golf, dll). Peraturan perdagangan hewan internasional mengharuskan repatriasinya ke Indonesia pada 2013. Ia sudah terbiasa berinteraksi dengan manusia sehingga tidak bisa dilepasliarkan.',
   1998, 'Terlalu terbiasa dengan manusia'),

  ('Dina', 'Betina', 11, 45.0, 'Sumatera', 'Kritis (CR)',
   'Orangutan Haven, Sumatera Utara',
   'https://orangutanhaven.com/wp-content/uploads/2025/10/Dina-scaled.jpg',
   'Dina adalah orangutan termuda di Orangutan Haven. Ia diselamatkan dari perdagangan satwa liar ilegal saat berusia kurang dari 1 tahun. Saat pertama tiba, ia didiagnosis malaria yang menyebabkan infeksi otak sehingga hampir lumpuh total dari leher ke bawah. Setelah perawatan intensif, ia pulih 100% namun kehilangan penglihatannya.',
   2015, 'Buta (akibat infeksi otak)'),

  ('Lewis', 'Jantan', 35, 82.0, 'Sumatera', 'Kritis (CR)',
   'Orangutan Haven, Sumatera Utara',
   'https://orangutanhaven.com/wp-content/uploads/brizy/imgs/Lewis-scaled-823x463x159x63x505x338x1773990435.jpg',
   'Lewis ditangkap dan diselamatkan dari konflik manusia-satwa liar pada 2016 setelah ditembak sekitar 40 kali oleh petani lokal di tepi hutan. Ia buta akibat luka-lukanya. Lewis adalah orangutan yang sangat tinggi dengan lengan sangat panjang, dan kadang berjalan tegak lurus seperti manusia.',
   1991, 'Buta (ditembak ~40 kali)'),

  ('Dek Nong', 'Betina', 27, 50.0, 'Sumatera', 'Rentan (VU)',
   'Orangutan Haven, Sumatera Utara',
   'https://orangutanhaven.com/wp-content/uploads/2025/10/Dek-Nong-scaled.jpg',
   'Dek Nong diselamatkan pada 2007 dari pemeliharaan ilegal sebagai hewan peliharaan. Ia dilepasliarkan setahun kemudian namun menghadapi tantangan di hutan, termasuk kelumpuhan misterius pada 2009. Meskipun pulih dengan baik, pergelangan tangan kirinya tetap bengkok pada sudut yang tidak wajar. Ia sangat pintar dan selalu mengamati sekelilingnya.',
   1999, 'Masalah sendi arthritic');

-- Rehabilitasi Programs
INSERT INTO rehabilitasi (orangutan_id, nama, tanggal, program, status, petugas, deskripsi, progress) VALUES
  (1, 'Krismon', '2024-06-01', 'Fisioterapi & Penguatan Otot', 'Aktif', 'Dr. Rina Sari', 'Program fisioterapi rutin untuk mengatasi kelemahan fisik akibat 19 tahun di kandang sempit.', 65),
  (2, 'Leuser', '2024-06-10', 'Adaptasi Lingkungan', 'Aktif', 'Budi Santoso', 'Program adaptasi untuk orangutan buta total agar dapat bernavigasi di lingkungan baru.', 70),
  (3, 'Fahzren', '2024-05-15', 'Pengurangan Ketergantungan Manusia', 'Selesai', 'Dr. Rina Sari', 'Program mengurangi interaksi dengan manusia dan meningkatkan kemandirian.', 100),
  (4, 'Dina', '2024-07-01', 'Nutrisi Khusus & Perawatan', 'Aktif', 'Budi Santoso', 'Program nutrisi khusus untuk Dina yang buta dan membutuhkan perawatan ekstra.', 60),
  (5, 'Lewis', '2024-07-15', 'Eksplorasi & Mobilitas', 'Aktif', 'Dr. Rina Sari', 'Program eksplorasi untuk Lewis yang buta agar percaya diri bergerak di lingkungan baru.', 55),
   (6, 'Dek Nong', '2024-08-01', 'Terapi Sendi & Pengayaan', 'Aktif', 'Budi Santoso', 'Program terapi untuk masalah sendi dan pengayaan lingkungan bagi Dek Nong.', 75);

-- Laporan (sample data for dashboard)
INSERT INTO laporan (nama, hp, tanggal, lokasi, jenis, kondisi, keterangan, status) VALUES
  ('Siti Rahmawati', '081234567890', '2025-06-01 09:30:00', 'Desa Meranti, Kecamatan Tualang, Kabupaten Siak', 'Pongo pygmaeus (Borneo)', 'Terluka', 'Ditemukan di kebun sawit dengan luka di kaki kiri. Kondisi lemas dan dehidrasi.', 'Menunggu'),
  ('Ahmad Fauzi', '087654321098', '2025-06-05 14:15:00', 'Kampung Durian, Kecamatan Bahorok, Kabupaten Langkat', 'Pongo abelii (Sumatera)', 'Sakit', 'Orangutan terlihat kurus dan lesu di pinggir hutan. Diduga sakit.', 'Diproses'),
  ('Putri Ayu', '082233445566', '2025-05-28 10:00:00', 'Desa Sungai Hitam, Kecamatan Ketapang, Kabupaten Ketapang', 'Pongo pygmaeus (Borneo)', 'Sehat', 'Orangutan terlihat sehat, sedang mencari makan di area konservasi.', 'Selesai'),
  ('Bambang Suprapto', '085577889900', '2025-06-10 16:45:00', 'Desa Batu Layar, Kecamatan Batang Serangan', '', 'Mati', 'Ditemukan orangutan mati di pinggir sungai. Diduga terkena jerat. Mohon segera ditindaklanjuti.', 'Menunggu'),
  ('Dewi Sartika', '081198877665', '2025-06-12 08:20:00', 'Dusun Rimba Jaya, Kecamatan Bukit Lawang', 'Pongo abelii (Sumatera)', 'Terluka', 'Orangutan betina dengan anak terlihat terluka di bagian punggung. Masyarakat sekitar melaporkan sejak 3 hari lalu.', 'Menunggu');
