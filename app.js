/* ============================================================
   SIPORA v3.0 — app.js
   Enhanced: Charts, Timeline, Notifications, Cards
   ============================================================ */

// ─── DATA STORE ──────────────────────────────────────────────
let db = {
  users: [
    { id: 1, nama: 'Administrator', username: 'admin', password: 'admin123', role: 'Admin', status: 'Aktif' },
    { id: 2, nama: 'Dr. Rina Sari', username: 'rina', password: 'rina123', role: 'Petugas', status: 'Aktif' },
    { id: 3, nama: 'Budi Santoso', username: 'budi', password: 'budi123', role: 'Petugas', status: 'Aktif' },
    { id: 4, nama: 'Viewer Guest', username: 'viewer', password: 'viewer123', role: 'Viewer', status: 'Aktif' },
  ],
  orangutan: [],
  rehabilitasi: [],
  laporan: [],
  currentUser: null,
  selectedLaporanId: null,
  notifications: [],
  activities: [],
  charts: {},
};

// ─── DATABASE CONFIG ───────────────────────────────────────────
// ─── AUTO-DETECT API ──────────────────────────────────────────
// Jika server.js berjalan di port 3000, API otomatis terdeteksi
// Jika tidak, app jalan dengan data lokal (in-memory)
const API_URL = (() => {
  const hint = localStorage.getItem('sipora_api_url');
  if (hint) return hint;
  // Detect if running via server.js on port 3000
  if (window.location.port === '3000' || window.location.hostname === 'localhost') {
    return window.location.origin + '/api';
  }
  return '';
})();

function isDBMode() { return API_URL && API_URL.length > 0; }
function isViewer() { return db.currentUser && db.currentUser.role === 'Viewer'; }

async function apiFetch(endpoint, options = {}) {
  if (!isDBMode()) return null;
  try {
    const url = `${API_URL}${endpoint}`;
    const res = await fetch(url, {
      headers: { 'Content-Type': 'application/json', ...options.headers },
      ...options,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(err.error || 'API request failed');
    }
    return await res.json();
  } catch (e) {
    console.warn(`API ${endpoint}: ${e.message}. Using local data.`);
    return null;
  }
}
async function apiGet(endpoint) { return apiFetch(endpoint); }
async function apiPost(endpoint, data) {
  return apiFetch(endpoint, { method: 'POST', body: JSON.stringify(data) });
}
async function apiPut(endpoint, data) {
  return apiFetch(endpoint, { method: 'PUT', body: JSON.stringify(data) });
}
async function apiDelete(endpoint) {
  return apiFetch(endpoint, { method: 'DELETE' });
}

async function loadOrangutanFromDB() {
  if (!isDBMode()) return false;
  const data = await apiGet('/orangutan');
  if (data && Array.isArray(data)) {
    db.orangutan = data.map(o => ({
      id: o.id,
      nama: o.nama,
      jenisKelamin: o.jenis_kelamin,
      usia: o.usia,
      berat: o.berat,
      habitat: o.habitat,
      status: o.status_konservasi,
      lokasi: o.lokasi,
      tglMasuk: o.tgl_masuk || '',
      fotoUrl: o.foto_url || '',
      deskripsi: o.deskripsi || '',
      kondisi: o.kondisi || '',
    }));
    return true;
  }
  return false;
}

async function loadRehabFromDB() {
  if (!isDBMode()) return false;
  const data = await apiGet('/rehabilitasi');
  if (data && Array.isArray(data)) {
    db.rehabilitasi = data.map(r => ({
      id: r.id,
      nama: r.nama,
      tanggal: r.tanggal,
      program: r.program,
      status: r.status,
      petugas: r.petugas,
      progress: r.progress || 0,
    }));
    return true;
  }
  return false;
}

async function loadLaporanFromDB() {
  if (!isDBMode()) return false;
  const data = await apiGet('/laporan');
  if (data && Array.isArray(data)) {
    db.laporan = data;
    return true;
  }
  return false;
}

async function loadUsersFromDB() {
  if (!isDBMode()) return false;
  const data = await apiGet('/users');
  if (data && Array.isArray(data)) {
    const localPasswords = {};
    db.users.forEach(u => { localPasswords[u.username] = u.password; });
    db.users = data.map(u => ({
      id: u.id,
      nama: u.nama,
      username: u.username,
      password: localPasswords[u.username] || 'password',
      role: u.role,
      status: u.status,
      lastLogin: u.last_login,
    }));
    return true;
  }
  return false;
}

// ─── DEFAULTS ─────────────────────────────────────────────────
const defaultOrangutan = [
  { id: 101, nama: 'Krismon', jenisKelamin: 'Jantan', usia: 30, berat: 75, habitat: 'Sumatera', status: 'Kritis (CR)', lokasi: 'Orangutan Haven', tglMasuk: '2016-05-30', fotoUrl: 'https://orangutanhaven.com/wp-content/uploads/2025/10/Krismon-scaled.jpg', deskripsi: 'Krismon disita pada 2016 sebagai hewan peliharaan ilegal. Dipelihara 19 tahun dalam kandang logam.', kondisi: 'Trauma dan kelemahan fisik' },
  { id: 102, nama: 'Leuser', jenisKelamin: 'Jantan', usia: 27, berat: 80, habitat: 'Sumatera', status: 'Kritis (CR)', lokasi: 'Orangutan Haven', tglMasuk: '2004-02-20', fotoUrl: 'https://orangutanhaven.com/wp-content/uploads/brizy/imgs/Leuser-Island-Haven23-scaled-914x609x205x136x505x337x1773990661.jpg', deskripsi: 'Ditembak 62 kali oleh penduduk desa. Mengalami kebutaan 100%.', kondisi: 'Buta total' },
  { id: 103, nama: 'Fahzren', jenisKelamin: 'Jantan', usia: 28, berat: 85, habitat: 'Sumatera', status: 'Terancam (EN)', lokasi: 'Orangutan Haven', tglMasuk: '2013-10-09', fotoUrl: 'https://orangutanhaven.com/wp-content/uploads/2025/10/Fahzren_Armin_Dett_6-scaled.jpg', deskripsi: 'Diselundupkan ke Malaysia, tumbuh besar tampil dalam pertunjukan hewan. Direpatriasi 2013.', kondisi: 'Terbiasa dengan manusia' },
  { id: 104, nama: 'Dina', jenisKelamin: 'Betina', usia: 11, berat: 45, habitat: 'Sumatera', status: 'Kritis (CR)', lokasi: 'Orangutan Haven', tglMasuk: '2016-07-27', fotoUrl: 'https://orangutanhaven.com/wp-content/uploads/2025/10/Dina-scaled.jpg', deskripsi: 'Diselamatkan dari perdagangan ilegal saat <1 tahun. Malaria menyebabkan infeksi otak dan kebutaan.', kondisi: 'Buta (akibat infeksi otak)' },
  { id: 105, nama: 'Lewis', jenisKelamin: 'Jantan', usia: 35, berat: 82, habitat: 'Sumatera', status: 'Kritis (CR)', lokasi: 'Orangutan Haven', tglMasuk: '2016-08-30', fotoUrl: 'https://orangutanhaven.com/wp-content/uploads/brizy/imgs/Lewis-scaled-823x463x159x63x505x338x1773990435.jpg', deskripsi: 'Ditembak ~40 kali oleh petani. Buta akibat luka. Orangutan sangat tinggi dengan lengan panjang.', kondisi: 'Buta (ditembak 40 kali)' },
  { id: 106, nama: 'Dek Nong', jenisKelamin: 'Betina', usia: 27, berat: 50, habitat: 'Sumatera', status: 'Rentan (VU)', lokasi: 'Orangutan Haven', tglMasuk: '2007-09-07', fotoUrl: 'https://orangutanhaven.com/wp-content/uploads/2025/10/Dek-Nong-scaled.jpg', deskripsi: 'Diselamatkan dari pemeliharaan ilegal. Pernah alami kelumpuhan, pulih dengan masalah sendi.', kondisi: 'Masalah sendi arthritic' },
];

const defaultRehab = [
  { id: 201, nama: 'Krismon', tanggal: '2024-06-01', program: 'Fisioterapi & Penguatan Otot', status: 'Aktif', petugas: 'Dr. Rina Sari', progress: 65 },
  { id: 202, nama: 'Leuser', tanggal: '2024-06-10', program: 'Adaptasi Lingkungan', status: 'Aktif', petugas: 'Budi Santoso', progress: 70 },
  { id: 203, nama: 'Fahzren', tanggal: '2024-05-15', program: 'Pengurangan Ketergantungan Manusia', status: 'Selesai', petugas: 'Dr. Rina Sari', progress: 100 },
  { id: 204, nama: 'Dina', tanggal: '2024-07-01', program: 'Nutrisi Khusus & Perawatan', status: 'Aktif', petugas: 'Budi Santoso', progress: 60 },
  { id: 205, nama: 'Lewis', tanggal: '2024-07-15', program: 'Eksplorasi & Mobilitas', status: 'Aktif', petugas: 'Dr. Rina Sari', progress: 55 },
  { id: 206, nama: 'Dek Nong', tanggal: '2024-08-01', program: 'Terapi Sendi & Pengayaan', status: 'Aktif', petugas: 'Budi Santoso', progress: 75 },
];

const defaultLaporan = [
  { id: 301, nama: 'Siti Rahmawati', hp: '081234567890', tanggal: '2025-06-01T09:30', lokasi: 'Desa Meranti / Kecamatan Tualang / Kabupaten Siak', jenis: 'Pongo pygmaeus (Borneo)', kondisi: 'Terluka', keterangan: 'Ditemukan di kebun sawit dengan luka di kaki kiri. Kondisi lemas dan dehidrasi.', status: 'Menunggu' },
  { id: 302, nama: 'Ahmad Fauzi', hp: '087654321098', tanggal: '2025-06-05T14:15', lokasi: 'Kampung Durian / Kecamatan Bahorok / Kabupaten Langkat', jenis: 'Pongo abelii (Sumatera)', kondisi: 'Sakit', keterangan: 'Orangutan terlihat kurus dan lesu di pinggir hutan. Diduga sakit.', status: 'Diproses' },
  { id: 303, nama: 'Putri Ayu', hp: '082233445566', tanggal: '2025-05-28T10:00', lokasi: 'Desa Sungai Hitam / Kecamatan Ketapang / Kabupaten Ketapang', jenis: 'Pongo pygmaeus (Borneo)', kondisi: 'Sehat', keterangan: 'Orangutan terlihat sehat, sedang mencari makan di area konservasi.', status: 'Selesai' },
  { id: 304, nama: 'Bambang Suprapto', hp: '085577889900', tanggal: '2025-06-10T16:45', lokasi: 'Desa Batu Layar / Kecamatan Batang Serangan', jenis: '', kondisi: 'Mati', keterangan: 'Ditemukan orangutan mati di pinggir sungai. Diduga terkena jerat. Mohon segera ditindaklanjuti.', status: 'Menunggu' },
  { id: 305, nama: 'Dewi Sartika', hp: '081198877665', tanggal: '2025-06-12T08:20', lokasi: 'Dusun Rimba Jaya / Kecamatan Bukit Lawang', jenis: 'Pongo abelii (Sumatera)', kondisi: 'Terluka', keterangan: 'Orangutan betina dengan anak terlihat terluka di bagian punggung. Masyarakat sekitar melaporkan sejak 3 hari lalu.', status: 'Menunggu' },
];

const defaultActivities = [
  { text: 'Laporan baru dari <strong>Siti Rahmawati</strong> — Desa Meranti', time: '10 menit lalu', type: 'blue' },
  { text: '<strong>Dr. Rina Sari</strong> memulai program Fisioterapi untuk Krismon', time: '1 jam lalu', type: 'green' },
  { text: 'Status laporan <strong>Ahmad Fauzi</strong> diubah menjadi "Diproses"', time: '3 jam lalu', type: 'blue' },
  { text: 'Orangutan baru: <strong>Dek Nong</strong> ditambahkan ke database', time: '1 hari lalu', type: 'green' },
  { text: 'Program Rehabilitasi <strong>Fahzren</strong> selesai 100%', time: '2 hari lalu', type: 'green' },
  { text: 'Pengguna baru: <strong>Viewer Guest</strong> ditambahkan', time: '3 hari lalu', type: 'yellow' },
];

if (!localStorage.getItem('sipora_initialized')) {
  db.orangutan = JSON.parse(JSON.stringify(defaultOrangutan));
  db.rehabilitasi = JSON.parse(JSON.stringify(defaultRehab));
  db.laporan = JSON.parse(JSON.stringify(defaultLaporan));
  db.activities = JSON.parse(JSON.stringify(defaultActivities));
  localStorage.setItem('sipora_initialized', 'true');
}

// ─── INIT ─────────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
  const now = new Date();
  const pad = n => String(n).padStart(2,'0');
  const dt = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
  const el = document.getElementById('lTanggal');
  if (el) el.value = dt;

  const saved = sessionStorage.getItem('sipora_user');
  if (saved) {
    db.currentUser = JSON.parse(saved);
    showApp();
  }

  updateCurrentDate();
  setInterval(updateCurrentDate, 60000);
  document.addEventListener('click', e => {
    const dd = document.getElementById('profileDropdown');
    if (dd && dd.classList.contains('show') && !e.target.closest('.topbar-profile')) {
      dd.classList.remove('show');
    }
  });
  document.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      const gs = document.getElementById('globalSearch');
      if (gs) gs.focus();
    }
  });
});

// ─── AUTH ──────────────────────────────────────────────────────
async function doLogin() {
  const u = document.getElementById('loginUser').value.trim();
  const p = document.getElementById('loginPass').value.trim();
  const err = document.getElementById('loginError');

  // Try database login first
  if (isDBMode()) {
    const res = await apiPost('/login', { username: u, password: p });
    if (res && res.user) {
      db.currentUser = res.user;
      db.currentUser.password = p;
      sessionStorage.setItem('sipora_user', JSON.stringify(db.currentUser));
      await loadUsersFromDB();
      showApp();
      return;
    }
  }

  // Fallback to local login
  const user = db.users.find(x => x.username === u && x.password === p);
  if (!user) {
    err.style.display = 'flex';
    setTimeout(() => { err.style.display = 'none'; }, 3000);
    return;
  }
  db.currentUser = user;
  sessionStorage.setItem('sipora_user', JSON.stringify(user));
  showApp();
}

function doLogout() {
  db.currentUser = null;
  sessionStorage.removeItem('sipora_user');
  document.getElementById('mainApp').style.display = 'none';
  document.getElementById('loginPage').style.display = 'flex';
  document.getElementById('loginUser').value = '';
  document.getElementById('loginPass').value = '';
}

async function showApp() {
  document.getElementById('loginPage').style.display = 'none';
  document.getElementById('mainApp').style.display = 'flex';
  updateUserDisplay();

  // Try loading from database
  if (isDBMode()) {
    await Promise.all([
      loadOrangutanFromDB(),
      loadRehabFromDB(),
      loadLaporanFromDB(),
      loadUsersFromDB(),
    ]);
  }

  updateDashboard();
  renderInformasiTable();
  renderInfoCards();
  renderLaporanList();
  updateLaporanQuickStats();
  renderRehabTable();
  renderRehabCards();
  renderUserTable();
  renderUserCards();
  renderLaporanTableAdmin();
  renderPenangananPage();
  initCharts();
  updateActivityTimeline();
  updateSidebarUserCount();

  const total = db.laporan.length;
  if (total > 0 && !document.querySelector('#notifBadge')?.textContent !== '0') {
    document.getElementById('notifBadge').textContent = total;
    document.getElementById('notifBadge').style.display = 'flex';
  }
}

function applyRoleRestrictions() {
  const isViewerRole = isViewer();
  // Sidebar: hide Admin and Penanganan nav
  const navAdmin = document.getElementById('navAdmin');
  if (navAdmin) navAdmin.style.display = isViewerRole ? 'none' : '';
  const navPenanganan = document.getElementById('navPenanganan');
  if (navPenanganan) navPenanganan.style.display = (isViewerRole || db.currentUser?.role !== 'Admin') ? 'none' : '';
  // Profile dropdown: hide Settings
  const ddSettings = document.getElementById('profileDropdownSettings');
  if (ddSettings) ddSettings.style.display = isViewerRole ? 'none' : '';
  // Dashboard hero: hide Buat Laporan button
  const heroBtn = document.getElementById('heroBtnLaporan');
  if (heroBtn) heroBtn.style.display = isViewerRole ? 'none' : '';
  // Laporan page: hide form panel (read-only list only)
  const lapForm = document.getElementById('laporanFormPanel');
  if (lapForm) lapForm.style.display = isViewerRole ? 'none' : '';
  // Informasi toolbar: hide edit/hapus/tambah
  const infoEdit = document.getElementById('btnInfoEdit');
  const infoHapus = document.getElementById('btnInfoHapus');
  const infoTambah = document.getElementById('btnInfoTambah');
  if (infoEdit) infoEdit.style.display = isViewerRole ? 'none' : '';
  if (infoHapus) infoHapus.style.display = isViewerRole ? 'none' : '';
  if (infoTambah) infoTambah.style.display = isViewerRole ? 'none' : '';
  // Rehab toolbar: hide edit/hapus/tambah
  const rehabEdit = document.getElementById('btnRehabEdit');
  const rehabHapus = document.getElementById('btnRehabHapus');
  const rehabTambah = document.getElementById('btnRehabTambah');
  if (rehabEdit) rehabEdit.style.display = isViewerRole ? 'none' : '';
  if (rehabHapus) rehabHapus.style.display = isViewerRole ? 'none' : '';
  if (rehabTambah) rehabTambah.style.display = isViewerRole ? 'none' : '';
  // Admin page: hide entire toolbar and laporan management
  const adminToolbar = document.getElementById('toolbarAdminActions');
  if (adminToolbar) adminToolbar.style.display = isViewerRole ? 'none' : '';
  const adminLapMgmt = document.getElementById('adminLaporanManagement');
  if (adminLapMgmt) adminLapMgmt.style.display = isViewerRole ? 'none' : '';
  // Hide admin user table action column (Hapus buttons rendered by JS)
  // Handled in renderUserTable via isViewerRole check
  // Hide checkbox column headers for viewers
  const checkAllInfo = document.getElementById('checkAllInfo');
  const checkAllLap = document.getElementById('checkAllLap');
  if (checkAllInfo) checkAllInfo.style.display = isViewerRole ? 'none' : '';
  if (checkAllLap) checkAllLap.style.display = isViewerRole ? 'none' : '';
  // Hide the th wrapping the info checkbox
  const thCheckAllInfo = document.getElementById('thCheckAllInfo');
  if (thCheckAllInfo) thCheckAllInfo.style.display = isViewerRole ? 'none' : '';
  // Hide the th wrapping the laporan checkbox
  const thCheckAllLap = document.getElementById('thCheckAllLap');
  if (thCheckAllLap) thCheckAllLap.style.display = isViewerRole ? 'none' : '';
  // Hide laporan Detail button (requires checkbox selection)
  const btnLapDetail = document.getElementById('btnLapDetail');
  if (btnLapDetail) btnLapDetail.style.display = isViewerRole ? 'none' : '';
  // Rehab table: hide checkbox header
  const thCheckAllRehab = document.getElementById('thCheckAllRehab');
  if (thCheckAllRehab) thCheckAllRehab.style.display = isViewerRole ? 'none' : '';
  // Admin table: hide # and Aksi column headers
  const thUserNo = document.getElementById('thUserNo');
  const thUserAksi = document.getElementById('thUserAksi');
  if (thUserNo) thUserNo.style.display = isViewerRole ? 'none' : '';
  if (thUserAksi) thUserAksi.style.display = isViewerRole ? 'none' : '';
}

function updateUserDisplay() {
  if (!db.currentUser) return;
  const initial = db.currentUser.nama.charAt(0).toUpperCase();
  document.getElementById('userAvatar').textContent = initial;
  document.getElementById('userDisplayName').textContent = db.currentUser.nama;
  document.getElementById('userDisplayRole').textContent = db.currentUser.role;
  document.getElementById('topbarAvatar').textContent = initial;
  document.getElementById('topbarProfileName').textContent = db.currentUser.nama;
  document.getElementById('topbarProfileRole').textContent = db.currentUser.role;
  document.getElementById('dropdownAvatar').textContent = initial;
  document.getElementById('dropdownName').textContent = db.currentUser.nama;
  document.getElementById('dropdownRole').textContent = db.currentUser.role;
  applyRoleRestrictions();
}

// ─── DATE ──────────────────────────────────────────────────────
function updateCurrentDate() {
  const el = document.getElementById('currentDate');
  if (!el) return;
  const now = new Date();
  const opts = { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' };
  el.textContent = now.toLocaleDateString('en-US', opts);
}

// ─── NAVIGATION ───────────────────────────────────────────────
function showPage(name, el) {
  // Redirect viewers from admin; redirect non-admin from penanganan
  if (name === 'admin' && isViewer()) {
    showToast('Akses ditolak: Anda tidak memiliki izin untuk halaman ini', 'error');
    const dashboardNav = document.querySelector('[data-page="dashboard"]');
    if (dashboardNav) return showPage('dashboard', dashboardNav);
    return;
  }
  if (name === 'penanganan' && (!db.currentUser || db.currentUser.role !== 'Admin')) {
    showToast('Akses ditolak: Anda tidak memiliki izin untuk halaman ini', 'error');
    const dashboardNav = document.querySelector('[data-page="dashboard"]');
    if (dashboardNav) return showPage('dashboard', dashboardNav);
    return;
  }
  if (el) {
    document.querySelectorAll('.nav-item').forEach(a => a.classList.remove('active'));
    el.classList.add('active');
  }
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const page = document.getElementById('page-' + name);
  if (page) page.classList.add('active');

  const titles = {
    dashboard: ['Dashboard', 'Conservation overview & system stats'],
    informasi: ['Informasi', 'Data orangutan terdaftar'],
    laporan: ['Laporan', 'Conservation overview & system stats'],
    rehabilitasi: ['Rehabilitasi', 'Program rehabilitasi aktif'],
    admin: ['Admin', 'Manajemen pengguna sistem'],
    penanganan: ['Penanganan Laporan', 'Manajemen & monitoring laporan masyarakat'],
  };
  const t = titles[name] || ['SIPORA', ''];
  document.getElementById('pageTitle').innerHTML = `<h2>${t[0]}</h2><p>${t[1]}</p>`;

  if (name === 'dashboard') {
    updateDashboard();
    initCharts();
    updateActivityTimeline();
  }
  if (name === 'informasi') {
    if (isDBMode()) loadOrangutanFromDB().then(() => { renderInfoCards(); renderInformasiTable(); });
    else { renderInfoCards(); renderInformasiTable(); }
  }
  if (name === 'laporan') { renderLaporanList(); updateLaporanQuickStats(); }
  if (name === 'rehabilitasi') { renderRehabCards(); renderRehabTable(); }
  if (name === 'admin') { renderUserCards(); renderUserTable(); renderLaporanTableAdmin(); }
  if (name === 'penanganan') { renderPenangananPage(); }

  const dd = document.getElementById('profileDropdown');
  if (dd) dd.classList.remove('show');

  if (window.innerWidth <= 768) {
    document.getElementById('sidebar')?.classList.remove('open');
    document.querySelector('.sidebar-overlay')?.classList.remove('show');
  }
}

// ─── SIDEBAR ───────────────────────────────────────────────────
function toggleSidebar() {
  const s = document.getElementById('sidebar');
  const o = document.querySelector('.sidebar-overlay');
  if (!s) return;
  s.classList.toggle('open');
  if (o) o.classList.toggle('show');
  else {
    const overlay = document.createElement('div');
    overlay.className = 'sidebar-overlay show';
    overlay.onclick = () => { document.getElementById('sidebar')?.classList.remove('open'); overlay.classList.remove('show'); };
    document.body.appendChild(overlay);
  }
}

// ─── PROFILE DROPDOWN ─────────────────────────────────────────
function toggleProfileDropdown() {
  const dd = document.getElementById('profileDropdown');
  if (dd) dd.classList.toggle('show');
}

// ─── GLOBAL SEARCH ──────────────────────────────────────────────
function handleGlobalSearch(val) {
  const q = val.toLowerCase().trim();
  if (!q) return;
  const targets = [
    { page: 'informasi', items: db.orangutan.map(o => o.nama + ' ' + o.habitat + ' ' + o.lokasi + ' ' + o.status) },
    { page: 'rehabilitasi', items: db.rehabilitasi.map(r => r.nama + ' ' + r.program + ' ' + r.petugas + ' ' + r.status) },
    { page: 'laporan', items: db.laporan.map(l => l.nama + ' ' + l.lokasi + ' ' + l.status + ' ' + l.jenis) },
    ...(isViewer() ? [] : [
      { page: 'admin', items: db.users.map(u => u.nama + ' ' + u.username + ' ' + u.role) },
      { page: 'penanganan', items: db.laporan.map(l => l.nama + ' ' + l.lokasi + ' ' + l.status + ' ' + (l.prioritas||'')) },
    ]),
  ];
  for (const t of targets) {
    for (let i = 0; i < t.items.length; i++) {
      if (t.items[i].toLowerCase().includes(q)) {
        const nav = document.querySelector(`[data-page="${t.page}"]`);
        if (nav) showPage(t.page, nav);
        document.getElementById('globalSearch').value = '';
        return;
      }
    }
  }
}

// ─── NOTIFICATIONS ──────────────────────────────────────────────
function toggleNotifications() {
  const total = db.laporan.length;
  const menunggu = db.laporan.filter(l => l.status === 'Menunggu').length;
  showToast(`📋 ${total} laporan (${menunggu} menunggu diproses)`, total > 0 ? 'success' : 'warning');
}

function updateNotifBadge() {
  const badge = document.getElementById('notifBadge');
  if (!badge) return;
  const count = db.laporan.filter(l => l.status === 'Menunggu').length;
  if (count > 0) {
    badge.textContent = count;
    badge.style.display = 'flex';
  } else {
    badge.style.display = 'none';
  }
}

// ─── ACTIVITY TIMELINE ─────────────────────────────────────────
function addActivity(text, type) {
  const now = new Date();
  const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  db.activities.unshift({ text, time: timeStr, type: type || 'default' });
  updateActivityTimeline();
}

function updateActivityTimeline() {
  const container = document.getElementById('activityTimeline');
  if (!container) return;
  const items = db.activities.length > 0 ? db.activities : [
    { text: 'Sistem siap digunakan — Dashboard SIPORA v3.0', time: 'Sekarang', type: 'default' }
  ];
  container.innerHTML = items.slice(0, 8).map(a => `
    <div class="timeline-item">
      <div class="timeline-dot ${a.type || ''}"></div>
      <div class="timeline-content">
        <div class="timeline-text">${a.text}</div>
        <div class="timeline-time">${a.time}</div>
      </div>
    </div>
  `).join('');
}

// ─── THEME ────────────────────────────────────────────────────
function toggleTheme() {
  document.body.classList.toggle('light');
  const isLight = document.body.classList.contains('light');
  document.getElementById('themeIcon').innerHTML = isLight
    ? '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>'
    : '<circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>';
}

// ─── TOAST ────────────────────────────────────────────────────
function showToast(msg, type='success') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'toast' + (type !== 'success' ? ` ${type}` : '');
  t.style.display = 'flex';
  t.style.alignItems = 'center';
  t.style.gap = '8px';
  setTimeout(() => { t.style.display = 'none'; }, 2800);
}

// ─── MODAL ────────────────────────────────────────────────────
function openModal(id) { document.getElementById(id).style.display = 'flex'; }
function closeModal(id) { document.getElementById(id).style.display = 'none'; }

// ─── CHARTS ─────────────────────────────────────────────────────
function initCharts() {
  if (typeof Chart === 'undefined') return;
  const isDark = !document.body.classList.contains('light');
  const textColor = isDark ? '#9CA3AF' : '#64748B';
  const gridColor = isDark ? 'rgba(55, 65, 81, 0.3)' : 'rgba(203, 213, 225, 0.5)';

  Chart.defaults.color = textColor;
  Chart.defaults.font.family = "'Inter','Segoe UI',sans-serif";

  const months = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];

  // Population Chart
  const popCtx = document.getElementById('populationChart')?.getContext('2d');
  if (popCtx) {
    if (db.charts.population) db.charts.population.destroy();
    const popData = months.map((m,i) => {
      const base = db.orangutan.length || 5;
      return Math.max(0, base + Math.round(Math.sin(i * 0.8) * 3 + (i * 0.4)));
    });
    db.charts.population = new Chart(popCtx, {
      type: 'line',
      data: {
        labels: months,
        datasets: [{
          label: 'Populasi',
          data: popData,
          borderColor: '#10B981',
          backgroundColor: 'rgba(16, 185, 129, 0.08)',
          borderWidth: 2.5,
          fill: true,
          tension: 0.4,
          pointBackgroundColor: '#10B981',
          pointBorderColor: '#1A2332',
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { color: gridColor }, ticks: { font: { size: 10 } } },
          y: { grid: { color: gridColor }, ticks: { font: { size: 10 }, stepSize: 2 }, beginAtZero: true }
        }
      }
    });
  }

  // Rehab Chart
  const rehabCtx = document.getElementById('rehabChart')?.getContext('2d');
  if (rehabCtx) {
    if (db.charts.rehab) db.charts.rehab.destroy();
    const rehabData = months.map((m,i) => {
      const active = db.rehabilitasi.filter(r => r.status === 'Aktif').length || 2;
      return Math.max(0, active + Math.round(Math.sin(i * 0.6) * 1.5 + (i * 0.2)));
    });
    db.charts.rehab = new Chart(rehabCtx, {
      type: 'bar',
      data: {
        labels: months,
        datasets: [{
          label: 'Rehabilitasi',
          data: rehabData,
          backgroundColor: 'rgba(245, 158, 11, 0.6)',
          borderColor: '#F59E0B',
          borderWidth: 1.5,
          borderRadius: 4,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { color: gridColor }, ticks: { font: { size: 10 } } },
          y: { grid: { color: gridColor }, ticks: { font: { size: 10 }, stepSize: 1 }, beginAtZero: true }
        }
      }
    });
  }

  // Conservation Chart (Doughnut)
  const consCtx = document.getElementById('conservationChart')?.getContext('2d');
  if (consCtx) {
    if (db.charts.conservation) db.charts.conservation.destroy();
    const cr = db.orangutan.filter(o => o.status === 'Kritis (CR)').length || 1;
    const en = db.orangutan.filter(o => o.status === 'Terancam (EN)').length || 1;
    const vu = db.orangutan.filter(o => o.status === 'Rentan (VU)').length || 1;
    db.charts.conservation = new Chart(consCtx, {
      type: 'doughnut',
      data: {
        labels: ['Kritis (CR)', 'Terancam (EN)', 'Rentan (VU)'],
        datasets: [{
          data: [cr, en, vu],
          backgroundColor: ['#EF4444', '#F59E0B', '#3B82F6'],
          borderColor: isDark ? '#1A2332' : '#FFFFFF',
          borderWidth: 3,
          hoverOffset: 6,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '65%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: { padding: 14, usePointStyle: true, pointStyle: 'circle', font: { size: 11 } }
          }
        }
      }
    });
  }

  // Pie Chart
  const pieCtx = document.getElementById('pieChart')?.getContext('2d');
  if (pieCtx) {
    if (db.charts.pie) db.charts.pie.destroy();
    const total = db.orangutan.length || 1;
    const cr = db.orangutan.filter(o => o.status === 'Kritis (CR)').length || 1;
    const en = db.orangutan.filter(o => o.status === 'Terancam (EN)').length || 1;
    const vu = db.orangutan.filter(o => o.status === 'Rentan (VU)').length || 1;
    db.charts.pie = new Chart(pieCtx, {
      type: 'pie',
      data: {
        labels: ['CR', 'EN', 'VU'],
        datasets: [{
          data: [cr, en, vu],
          backgroundColor: ['#EF4444', '#F59E0B', '#3B82F6'],
          borderColor: isDark ? '#1A2332' : '#FFFFFF',
          borderWidth: 3,
          hoverOffset: 6,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: { padding: 14, usePointStyle: true, pointStyle: 'circle', font: { size: 11 } }
          }
        }
      }
    });
  }
}

// ─── DASHBOARD ────────────────────────────────────────────────
function updateDashboard() {
  const total = db.orangutan.length;
  const rehabActive = db.rehabilitasi.filter(r => r.status === 'Aktif').length;
  const laporanTotal = db.laporan.length;
  const userTotal = db.users.length;

  document.getElementById('statTotal').textContent = total;
  document.getElementById('statRehab').textContent = rehabActive;
  document.getElementById('statLaporan').textContent = laporanTotal;
  document.getElementById('statUser').textContent = userTotal;

  document.getElementById('statTotalGrowth').innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><polygon points="12 5 19 19 5 19"/></svg> +${total || 0}%`;

  const cr = db.orangutan.filter(o => o.status === 'Kritis (CR)').length;
  const en = db.orangutan.filter(o => o.status === 'Terancam (EN)').length;
  const vu = db.orangutan.filter(o => o.status === 'Rentan (VU)').length;
  const pct = n => total > 0 ? Math.round(n/total*100) : 0;

  const elCR = document.getElementById('statCR');
  const elEN = document.getElementById('statEN');
  const elVU = document.getElementById('statVU');
  const elTrack = document.getElementById('statTracked');
  if (elCR) elCR.textContent = `${cr} · ${pct(cr)}%`;
  if (elEN) elEN.textContent = `${en} · ${pct(en)}%`;
  if (elVU) elVU.textContent = `${vu} · ${pct(vu)}%`;
  if (elTrack) elTrack.textContent = total;

  const container = document.getElementById('recentRehab');
  const recent = db.rehabilitasi.slice(-6).reverse();
  if (recent.length === 0) {
    container.innerHTML = '<div class="empty-state"><div class="empty-icon"><svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#6B7280" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg></div><p>No rehabilitation entries yet</p></div>';
  } else {
    container.innerHTML = `<table class="data-table"><thead><tr><th>NAMA</th><th>PROGRAM</th><th>STATUS</th><th>PETUGAS</th></tr></thead><tbody>
      ${recent.map(r => `<tr><td><strong>${r.nama}</strong></td><td>${r.program}</td><td>${pillStatus(r.status)}</td><td>${r.petugas}</td></tr>`).join('')}
    </tbody></table>`;
  }

  updateNotifBadge();
  updateLaporanQuickStats();
  updateSidebarUserCount();
}

function updateSidebarUserCount() {
  const el = document.getElementById('activeUserCount');
  if (el) el.textContent = db.users.filter(u => u.status === 'Aktif').length;
}

// ─── INFORMASI ────────────────────────────────────────────────
let selectedInfoIds = new Set();

function openModalInfo(editId) {
  document.getElementById('modalInfoTitle').textContent = editId ? 'Edit Data Orangutan' : 'Tambah Data Orangutan';
  document.getElementById('infoEditId').value = editId || '';
  if (editId) {
    const o = db.orangutan.find(x => x.id == editId);
    if (o) {
      document.getElementById('iNama').value = o.nama;
      document.getElementById('iJK').value = o.jenisKelamin;
      document.getElementById('iUsia').value = o.usia;
      document.getElementById('iBerat').value = o.berat;
      document.getElementById('iHabitat').value = o.habitat;
      document.getElementById('iStatus').value = o.status;
      document.getElementById('iLokasi').value = o.lokasi;
      document.getElementById('iTgl').value = o.tglMasuk;
    }
  } else {
    ['iNama','iUsia','iBerat','iLokasi'].forEach(id => document.getElementById(id).value = '');
    document.getElementById('iTgl').value = new Date().toISOString().slice(0,10);
  }
  openModal('modalInfo');
}

async function saveInfo() {
  if (isViewer()) { showToast('Akses ditolak', 'error'); return; }
  const nama = document.getElementById('iNama').value.trim();
  if (!nama) { showToast('Nama wajib diisi!', 'error'); return; }
  const editId = document.getElementById('infoEditId').value;
  const data = {
    nama,
    jenisKelamin: document.getElementById('iJK').value,
    usia: document.getElementById('iUsia').value || 0,
    berat: document.getElementById('iBerat').value || 0,
    habitat: document.getElementById('iHabitat').value,
    status: document.getElementById('iStatus').value,
    lokasi: document.getElementById('iLokasi').value,
    tglMasuk: document.getElementById('iTgl').value,
  };
  if (editId) {
    const idx = db.orangutan.findIndex(x => x.id == editId);
    if (idx >= 0) db.orangutan[idx] = { ...db.orangutan[idx], ...data };
    if (isDBMode()) await apiPut(`/orangutan/${editId}`, {
      nama, jenis_kelamin: data.jenisKelamin, usia: data.usia,
      berat: data.berat, habitat: data.habitat, status_konservasi: data.status,
      lokasi: data.lokasi, tgl_masuk: data.tglMasuk,
    });
    showToast('Data berhasil diperbarui!');
    addActivity(`<strong>${nama}</strong> diperbarui dalam database`, 'green');
  } else {
    data.id = Date.now();
    db.orangutan.push(data);
    if (isDBMode()) {
      const res = await apiPost('/orangutan', {
        nama, jenis_kelamin: data.jenisKelamin, usia: data.usia,
        berat: data.berat, habitat: data.habitat, status_konservasi: data.status,
        lokasi: data.lokasi, tgl_masuk: data.tglMasuk,
      });
      if (res && res.id) data.id = res.id;
    }
    showToast('Data berhasil ditambahkan!');
    addActivity(`Orangutan baru: <strong>${nama}</strong> ditambahkan`, 'green');
  }
  closeModal('modalInfo');
  renderInformasiTable();
  renderInfoCards();
  updateDashboard();
}

function renderInformasiTable() { filterInformasi(); }

function renderInfoCards() {
  const container = document.getElementById('infoCardsContainer');
  if (!container) return;
  const data = db.orangutan;
  const total = data.length;
  const cr = data.filter(o => o.status === 'Kritis (CR)').length;
  const en = data.filter(o => o.status === 'Terancam (EN)').length;
  const vu = data.filter(o => o.status === 'Rentan (VU)').length;

  document.getElementById('qsTotal').textContent = total;
  document.getElementById('qsCR').textContent = cr;
  document.getElementById('qsEN').textContent = en;
  document.getElementById('qsVU').textContent = vu;

  if (data.length === 0) {
    container.innerHTML = '';
    return;
  }
  container.innerHTML = data.map(o => {
    const initial = o.nama.charAt(0).toUpperCase();
    const cls = o.status === 'Kritis (CR)' ? 'cr' : o.status === 'Terancam (EN)' ? 'en' : 'vu';
    const avatarStyle = o.fotoUrl
      ? `background-image:url('${o.fotoUrl}');background-size:cover;background-position:center`
      : '';
    return `
      <div class="info-card" onclick="document.getElementById('searchInfo').value='${o.nama}';filterInformasi()">
        <div class="info-card-avatar ${cls}" style="${avatarStyle}">${!o.fotoUrl ? initial : ''}</div>
        <div class="info-card-name">${o.nama}</div>
        <div class="info-card-detail">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
          ${o.habitat}
        </div>
        <div class="info-card-detail">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          ${o.usia} th · ${o.berat} kg
        </div>
        <div class="info-card-bottom">
          <span>${o.lokasi}</span>
          ${pillStatus(o.status)}
        </div>
      </div>
    `;
  }).join('');
}

function filterInformasi() {
  const q = (document.getElementById('searchInfo')?.value || '').toLowerCase();
  const filtered = db.orangutan.filter(o =>
    o.nama.toLowerCase().includes(q) ||
    o.habitat.toLowerCase().includes(q) ||
    o.lokasi.toLowerCase().includes(q)
  );
  const tbody = document.getElementById('infoTableBody');
  const empty = document.getElementById('infoEmpty');
  const viewer = isViewer();
  if (filtered.length === 0) {
    tbody.innerHTML = '';
    empty.style.display = 'block';
  } else {
    empty.style.display = 'none';
    tbody.innerHTML = filtered.map(o => {
      const initial = o.nama.charAt(0).toUpperCase();
      const cls = o.status === 'Kritis (CR)' ? 'cr' : o.status === 'Terancam (EN)' ? 'en' : 'vu';
    const avatarStyle2 = o.fotoUrl
      ? `background-image:url('${o.fotoUrl}');background-size:cover;background-position:center`
      : '';
    return `
      <tr>
        ${viewer ? '' : `<td><input type="checkbox" class="check-info" value="${o.id}" onchange="trackCheck('info','${o.id}',this.checked)"></td>`}
        <td>
          <div style="display:flex;align-items:center;gap:10px">
            <div class="info-card-avatar ${cls}" style="width:32px;height:32px;font-size:12px;margin:0;${avatarStyle2}">${!o.fotoUrl ? initial : ''}</div>
            <strong>${o.nama}</strong>
          </div>
        </td>
        <td>${o.jenisKelamin}</td>
        <td>${o.usia}</td>
        <td>${o.berat}</td>
        <td>${o.habitat}</td>
        <td>${pillStatus(o.status)}</td>
        <td>${o.lokasi}</td>
        <td>${o.tglMasuk}</td>
      </tr>`;
    }).join('');
  }
}

function editInfoSelected() {
  if (isViewer()) { showToast('Akses ditolak', 'error'); return; }
  if (selectedInfoIds.size !== 1) { showToast('Pilih tepat 1 data untuk diedit', 'warning'); return; }
  openModalInfo([...selectedInfoIds][0]);
}

async function hapusInfoSelected() {
  if (isViewer()) { showToast('Akses ditolak', 'error'); return; }
  if (selectedInfoIds.size === 0) { showToast('Pilih data yang ingin dihapus', 'warning'); return; }
  if (!confirm(`Hapus ${selectedInfoIds.size} data?`)) return;
  const names = [];
  selectedInfoIds.forEach(id => {
    const o = db.orangutan.find(x => x.id == id);
    if (o) names.push(o.nama);
    if (isDBMode()) apiDelete(`/orangutan/${id}`);
  });
  db.orangutan = db.orangutan.filter(o => !selectedInfoIds.has(String(o.id)));
  selectedInfoIds.clear();
  renderInformasiTable();
  renderInfoCards();
  updateDashboard();
  showToast('Data berhasil dihapus!');
  if (names.length > 0) addActivity(`<strong>${names.join(', ')}</strong> dihapus dari database`, 'yellow');
}

// ─── LAPORAN ──────────────────────────────────────────────────
let selectedLapIds = new Set();

function updateLaporanQuickStats() {
  const total = db.laporan.length;
  const menunggu = db.laporan.filter(l => l.status === 'Menunggu').length;
  const diproses = db.laporan.filter(l => l.status === 'Diproses').length;
  const selesai = db.laporan.filter(l => l.status === 'Selesai').length;
  const qs = id => document.getElementById(id);
  if (qs('qsLaporanTotal')) qs('qsLaporanTotal').textContent = total;
  if (qs('qsLaporanMenunggu')) qs('qsLaporanMenunggu').textContent = menunggu;
  if (qs('qsLaporanDiproses')) qs('qsLaporanDiproses').textContent = diproses;
  if (qs('qsLaporanSelesai')) qs('qsLaporanSelesai').textContent = selesai;
}

async function kirimLaporan() {
  if (isViewer()) { showToast('Akses ditolak', 'error'); return; }
  const nama = document.getElementById('lNama').value.trim();
  const hp = document.getElementById('lHP').value.trim();
  const tgl = document.getElementById('lTanggal').value;
  const lokasi = document.getElementById('lLokasi').value.trim();
  if (!nama || !hp || !lokasi) { showToast('Nama, HP, dan Lokasi wajib diisi!', 'error'); return; }
  const laporan = {
    id: Date.now(),
    nama, hp,
    tanggal: tgl,
    lokasi,
    jenis: document.getElementById('lJenis').value,
    kondisi: document.getElementById('lKondisi').value,
    keterangan: document.getElementById('lKet').value,
    status: 'Menunggu',
  };
  db.laporan.push(laporan);
  if (isDBMode()) {
    const res = await apiPost('/laporan', {
      nama, hp, tanggal: tgl, lokasi,
      jenis: laporan.jenis, kondisi: laporan.kondisi,
      keterangan: laporan.keterangan, status: 'Menunggu',
    });
    if (res && res.id) laporan.id = res.id;
  }
  resetLaporan();
  renderLaporanList();
  updateLaporanQuickStats();
  updateDashboard();
  addActivity(`Laporan baru dari <strong>${nama}</strong> — ${lokasi}`, 'blue');
  showToast('Laporan berhasil dikirim!');
}

function resetLaporan() {
  ['lNama','lHP','lLokasi','lKet'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('lJenis').value = '';
  document.getElementById('lKondisi').value = '';
  const now = new Date();
  const pad = n => String(n).padStart(2,'0');
  document.getElementById('lTanggal').value = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
  document.getElementById('uploadPreview').style.display = 'none';
  document.getElementById('uploadPlaceholder').style.display = 'flex';
  document.getElementById('photoInput').value = '';
}

function previewPhoto(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(e) {
    document.getElementById('previewImage').src = e.target.result;
    document.getElementById('uploadPreview').style.display = 'flex';
    document.getElementById('uploadPlaceholder').style.display = 'none';
  };
  reader.readAsDataURL(file);
}

function removePhoto(event) {
  event.stopPropagation();
  document.getElementById('uploadPreview').style.display = 'none';
  document.getElementById('uploadPlaceholder').style.display = 'flex';
  document.getElementById('photoInput').value = '';
}

function renderLaporanList() {
  const tbody = document.getElementById('laporanTableBody');
  const empty = document.getElementById('laporanEmpty');
  const viewer = isViewer();
  if (db.laporan.length === 0) {
    tbody.innerHTML = '';
    empty.style.display = 'block';
  } else {
    empty.style.display = 'none';
    tbody.innerHTML = db.laporan.map(l => `
      <tr>
        ${viewer ? '' : `<td><input type="checkbox" class="check-lap" value="${l.id}" onchange="trackCheck('lap','${l.id}',this.checked)"></td>`}
        <td><strong>${l.nama.split(' ')[0]}</strong></td>
        <td>${l.lokasi.split('/')[0].trim()}</td>
        <td>${l.tanggal ? l.tanggal.slice(0,10) : ''}</td>
        <td>${pillLaporan(l.status)}</td>
      </tr>
    `).join('');
  }
  updateLaporanQuickStats();
}

function detailLaporanSelected() {
  if (isViewer()) { showToast('Akses ditolak', 'error'); return; }
  if (selectedLapIds.size !== 1) { showToast('Pilih 1 laporan untuk melihat detail', 'warning'); return; }
  const id = [...selectedLapIds][0];
  const l = db.laporan.find(x => String(x.id) === id);
  if (!l) return;
  db.selectedLaporanId = l.id;
  document.getElementById('detailLaporanContent').innerHTML = `
    <div class="detail-grid">
      <div class="detail-item"><label>Nama Pelapor</label><span>${l.nama}</span></div>
      <div class="detail-item"><label>No. HP / WA</label><span>${l.hp}</span></div>
      <div class="detail-item"><label>Tanggal & Jam</label><span>${l.tanggal}</span></div>
      <div class="detail-item"><label>Lokasi Temuan</label><span>${l.lokasi}</span></div>
      <div class="detail-item"><label>Jenis Orang Utan</label><span>${l.jenis || '-'}</span></div>
      <div class="detail-item"><label>Kondisi</label><span>${l.kondisi || '-'}</span></div>
    </div>
    <div class="form-group"><label>Keterangan</label><div style="padding:10px 14px;background:var(--bg-input);border:1px solid var(--border);border-radius:var(--radius-sm);font-size:13px;color:var(--text)">${l.keterangan || '-'}</div></div>
    <div class="detail-select">
      <label>Update Status</label>
      <select id="updateStatusVal" class="form-select">
        <option ${l.status==='Menunggu'?'selected':''}>Menunggu</option>
        <option ${l.status==='Diproses'?'selected':''}>Diproses</option>
        <option ${l.status==='Selesai'?'selected':''}>Selesai</option>
      </select>
    </div>
  `;
  openModal('modalDetailLaporan');
}

async function updateStatusLaporan() {
  if (isViewer()) { showToast('Akses ditolak', 'error'); return; }
  const val = document.getElementById('updateStatusVal').value;
  const idx = db.laporan.findIndex(x => x.id === db.selectedLaporanId);
  if (idx >= 0) {
    const oldStatus = db.laporan[idx].status;
    db.laporan[idx].status = val;
    if (oldStatus !== val) {
      const l = db.laporan[idx];
      addActivity(`Laporan <strong>${l.nama}</strong> berstatus "${val}"`, val === 'Selesai' ? 'green' : val === 'Diproses' ? 'blue' : 'yellow');
    }
    if (isDBMode()) await apiPut(`/laporan/${db.selectedLaporanId}`, { status: val });
  }
  closeModal('modalDetailLaporan');
  renderLaporanList();
  updateDashboard();
  showToast('Status laporan diperbarui!');
}

// ─── ADMIN LAPORAN MANAGEMENT ─────────────────────────────────
let selectedLapAdminIds = new Set();

function renderLaporanTableAdmin() {
  const tbody = document.getElementById('laporanAdminTableBody');
  const empty = document.getElementById('laporanAdminEmpty');
  const q = (document.getElementById('searchLaporanAdmin')?.value || '').toLowerCase();
  if (!tbody) return;
  const filtered = q ? db.laporan.filter(l =>
    l.nama.toLowerCase().includes(q) || l.lokasi.toLowerCase().includes(q) || l.hp.includes(q)
  ) : db.laporan;
  const total = db.laporan.length;
  const menunggu = db.laporan.filter(l => l.status === 'Menunggu').length;
  const diproses = db.laporan.filter(l => l.status === 'Diproses').length;
  const selesai = db.laporan.filter(l => l.status === 'Selesai').length;
  for (const [id, val] of [['qsAdminLapTotal',total],['qsAdminLapMenunggu',menunggu],['qsAdminLapDiproses',diproses],['qsAdminLapSelesai',selesai]]) {
    const el = document.getElementById(id); if (el) el.textContent = val;
  }
  if (filtered.length === 0) {
    tbody.innerHTML = '';
    if (empty) empty.style.display = 'block';
  } else {
    if (empty) empty.style.display = 'none';
    tbody.innerHTML = filtered.map(l => {
      const statusColors = { 'Menunggu': 'pill-yellow', 'Diproses': 'pill-blue', 'Selesai': 'pill-green' };
      return `<tr>
        <td><input type="checkbox" class="check-lap-admin" value="${l.id}" onchange="toggleLapAdminCheck(this,'${l.id}')"></td>
        <td><strong>${l.nama.split(' ')[0]}</strong></td>
        <td>${l.hp}</td>
        <td>${l.lokasi.split('/')[0].trim()}</td>
        <td>${l.tanggal ? l.tanggal.slice(0,10) : ''}</td>
        <td>${l.kondisi || '-'}</td>
        <td><span class="status-pill ${statusColors[l.status]}" style="cursor:pointer" onclick="cycleLaporanStatus(${l.id})">${l.status}</span></td>
        <td>
          <div style="display:flex;gap:4px">
            <button class="btn-icon-sm" style="padding:4px 8px;font-size:11px" onclick="detailLaporanById(${l.id})" title="Detail">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
            </button>
            ${l.status !== 'Diproses' ? `<button class="btn-icon-sm" style="padding:4px 8px;font-size:11px;background:var(--primary-glow);color:var(--primary);border-color:rgba(16,185,129,0.3)" onclick="updateLaporanStatusSingle(${l.id},'Diproses')" title="Proses">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
            </button>` : ''}
            ${l.status !== 'Selesai' ? `<button class="btn-icon-sm" style="padding:4px 8px;font-size:11px;background:var(--success-bg);color:var(--success);border-color:rgba(34,197,94,0.3)" onclick="updateLaporanStatusSingle(${l.id},'Selesai')" title="Selesaikan">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            </button>` : ''}
          </div>
        </td>
      </tr>`;
    }).join('');
  }
  selectedLapAdminIds.clear();
}

function toggleCheckAllLapAdmin(checked) {
  document.querySelectorAll('.check-lap-admin').forEach(cb => { cb.checked = checked; });
  selectedLapAdminIds.clear();
  if (checked) document.querySelectorAll('.check-lap-admin').forEach(cb => selectedLapAdminIds.add(cb.value));
}

function toggleLapAdminCheck(el, id) {
  if (el.checked) selectedLapAdminIds.add(id); else selectedLapAdminIds.delete(id);
}

function getSelectedLapAdminIds() {
  return [...selectedLapAdminIds].map(Number);
}

async function prosesLaporanBatch() {
  if (isViewer()) { showToast('Akses ditolak', 'error'); return; }
  const ids = getSelectedLapAdminIds();
  if (!ids.length) { showToast('Pilih laporan yang akan diproses', 'warning'); return; }
  if (!confirm(`Proses ${ids.length} laporan?`)) return;
  for (const id of ids) {
    const idx = db.laporan.findIndex(l => l.id === id);
    if (idx >= 0 && db.laporan[idx].status === 'Menunggu') {
      db.laporan[idx].status = 'Diproses';
      if (isDBMode()) await apiPut(`/laporan/${id}`, { status: 'Diproses' });
    }
  }
  renderLaporanTableAdmin();
  renderLaporanList();
  updateDashboard();
  addActivity(`<strong>${ids.length}</strong> laporan diproses oleh admin`, 'blue');
  showToast(`${ids.length} laporan diproses!`);
}

async function selesaikanLaporanBatch() {
  if (isViewer()) { showToast('Akses ditolak', 'error'); return; }
  const ids = getSelectedLapAdminIds();
  if (!ids.length) { showToast('Pilih laporan yang akan diselesaikan', 'warning'); return; }
  if (!confirm(`Selesaikan ${ids.length} laporan?`)) return;
  for (const id of ids) {
    const idx = db.laporan.findIndex(l => l.id === id);
    if (idx >= 0 && db.laporan[idx].status !== 'Selesai') {
      db.laporan[idx].status = 'Selesai';
      if (isDBMode()) await apiPut(`/laporan/${id}`, { status: 'Selesai' });
    }
  }
  renderLaporanTableAdmin();
  renderLaporanList();
  updateDashboard();
  addActivity(`<strong>${ids.length}</strong> laporan diselesaikan oleh admin`, 'green');
  showToast(`${ids.length} laporan selesai!`);
}

function detailLaporanById(id) {
  const l = db.laporan.find(x => x.id === id);
  if (!l) return;
  db.selectedLaporanId = l.id;
  document.getElementById('detailLaporanContent').innerHTML = `
    <div class="detail-grid">
      <div class="detail-item"><label>Nama Pelapor</label><span>${l.nama}</span></div>
      <div class="detail-item"><label>No. HP / WA</label><span>${l.hp}</span></div>
      <div class="detail-item"><label>Tanggal & Jam</label><span>${l.tanggal}</span></div>
      <div class="detail-item"><label>Lokasi Temuan</label><span>${l.lokasi}</span></div>
      <div class="detail-item"><label>Jenis Orang Utan</label><span>${l.jenis || '-'}</span></div>
      <div class="detail-item"><label>Kondisi</label><span>${l.kondisi || '-'}</span></div>
    </div>
    <div class="form-group"><label>Keterangan</label><div style="padding:10px 14px;background:var(--bg-input);border:1px solid var(--border);border-radius:var(--radius-sm);font-size:13px;color:var(--text)">${l.keterangan || '-'}</div></div>
    <div class="detail-select">
      <label>Update Status</label>
      <select id="updateStatusVal" class="form-select">
        <option ${l.status==='Menunggu'?'selected':''}>Menunggu</option>
        <option ${l.status==='Diproses'?'selected':''}>Diproses</option>
        <option ${l.status==='Selesai'?'selected':''}>Selesai</option>
      </select>
    </div>
  `;
  openModal('modalDetailLaporan');
}

async function cycleLaporanStatus(id) {
  const idx = db.laporan.findIndex(l => l.id === id);
  if (idx < 0) return;
  const cycle = { 'Menunggu': 'Diproses', 'Diproses': 'Selesai', 'Selesai': 'Menunggu' };
  const newStatus = cycle[db.laporan[idx].status] || 'Menunggu';
  db.laporan[idx].status = newStatus;
  if (isDBMode()) await apiPut(`/laporan/${id}`, { status: newStatus });
  renderLaporanTableAdmin();
  renderLaporanList();
  updateDashboard();
  addActivity(`Laporan #${id} berstatus "${newStatus}"`, newStatus === 'Selesai' ? 'green' : newStatus === 'Diproses' ? 'blue' : 'yellow');
  showToast(`Status laporan #${id}: ${newStatus}`);
}

async function updateLaporanStatusSingle(id, newStatus) {
  const idx = db.laporan.findIndex(l => l.id === id);
  if (idx < 0) return;
  const oldStatus = db.laporan[idx].status;
  if (oldStatus === newStatus) return;
  db.laporan[idx].status = newStatus;
  if (isDBMode()) await apiPut(`/laporan/${id}`, { status: newStatus });
  renderLaporanTableAdmin();
  renderLaporanList();
  updateDashboard();
  addActivity(`Laporan <strong>${db.laporan[idx].nama}</strong> → "${newStatus}"`, newStatus === 'Selesai' ? 'green' : 'blue');
  showToast(`Laporan ${newStatus === 'Diproses' ? 'diproses' : 'diselesaikan'}!`);
}

// ─── REHABILITASI ─────────────────────────────────────────────
let selectedRehabIds = new Set();

function openModalRehab(editId) {
  document.getElementById('modalRehabTitle').textContent = editId ? 'Edit Rehabilitasi' : 'Tambah Rehabilitasi';
  document.getElementById('rehabEditId').value = editId || '';
  if (editId) {
    const r = db.rehabilitasi.find(x => x.id == editId);
    if (r) {
      document.getElementById('rNama').value = r.nama;
      document.getElementById('rTanggal').value = r.tanggal;
      document.getElementById('rProgram').value = r.program;
      document.getElementById('rStatus').value = r.status;
      document.getElementById('rPetugas').value = r.petugas;
    }
  } else {
    ['rNama','rProgram','rPetugas'].forEach(id => document.getElementById(id).value = '');
    document.getElementById('rTanggal').value = new Date().toISOString().slice(0,10);
  }
  openModal('modalRehab');
}

async function saveRehab() {
  if (isViewer()) { showToast('Akses ditolak', 'error'); return; }
  const nama = document.getElementById('rNama').value.trim();
  if (!nama) { showToast('Nama wajib diisi!', 'error'); return; }
  const editId = document.getElementById('rehabEditId').value;
  const data = {
    nama,
    tanggal: document.getElementById('rTanggal').value,
    program: document.getElementById('rProgram').value,
    status: document.getElementById('rStatus').value,
    petugas: document.getElementById('rPetugas').value,
  };
  if (editId) {
    const idx = db.rehabilitasi.findIndex(x => x.id == editId);
    if (idx >= 0) db.rehabilitasi[idx] = { ...db.rehabilitasi[idx], ...data };
    if (isDBMode()) await apiPut(`/rehabilitasi/${editId}`, data);
    showToast('Data rehabilitasi diperbarui!');
    addActivity(`Program <strong>${data.program}</strong> untuk ${nama} diperbarui`, 'green');
  } else {
    data.id = Date.now();
    data.progress = 0;
    db.rehabilitasi.push(data);
    if (isDBMode()) {
      const res = await apiPost('/rehabilitasi', data);
      if (res && res.id) data.id = res.id;
    }
    showToast('Data rehabilitasi ditambahkan!');
    addActivity(`Rehabilitasi baru: <strong>${data.program}</strong> — ${nama}`, 'blue');
  }
  closeModal('modalRehab');
  renderRehabTable();
  renderRehabCards();
  updateDashboard();
}

function renderRehabCards() {
  const container = document.getElementById('rehabCards');
  if (!container) return;
  const data = db.rehabilitasi;
  if (data.length === 0) { container.innerHTML = ''; return; }
  container.innerHTML = data.map(r => {
    const progressMap = { 'Aktif': 65, 'Selesai': 100, 'Dihentikan': 30 };
    const pct = progressMap[r.status] || 50;
    const cls = r.status === 'Aktif' ? 'aktif' : r.status === 'Selesai' ? 'selesai' : 'dihentikan';
    return `
      <div class="rehab-card">
        <div class="rehab-card-header">
          <div>
            <div class="rehab-card-name">${r.nama}</div>
            <div class="rehab-card-program">${r.program}</div>
          </div>
          ${pillRehab(r.status)}
        </div>
        <div class="rehab-card-body">
          <div class="rehab-card-detail">
            <span>Tanggal</span>
            <span>${r.tanggal}</span>
          </div>
          <div class="rehab-card-detail">
            <span>Petugas</span>
            <span>${r.petugas}</span>
          </div>
          <div class="rehab-progress-bar">
            <div class="rehab-progress-fill ${cls}" style="width:${pct}%"></div>
          </div>
          <div class="rehab-progress-label">
            <span>Progress</span>
            <span>${pct}%</span>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function renderRehabTable() { filterRehabilitasi(); }

function filterRehabilitasi() {
  const q = (document.getElementById('searchRehab')?.value || '').toLowerCase();
  const filtered = db.rehabilitasi.filter(r =>
    r.nama.toLowerCase().includes(q) ||
    r.program.toLowerCase().includes(q) ||
    r.petugas.toLowerCase().includes(q)
  );
  const tbody = document.getElementById('rehabTableBody');
  const empty = document.getElementById('rehabEmpty');
  if (filtered.length === 0) {
    tbody.innerHTML = '';
    empty.style.display = 'block';
  } else {
    empty.style.display = 'none';
    tbody.innerHTML = filtered.map(r => {
      const progressMap = { 'Aktif': 65, 'Selesai': 100, 'Dihentikan': 30 };
      const pct = progressMap[r.status] || 50;
      const cls = r.status === 'Aktif' ? 'aktif' : r.status === 'Selesai' ? 'selesai' : 'dihentikan';
      const viewer = isViewer();
      return `
      <tr>
        ${viewer ? '' : `<td><input type="checkbox" class="check-rehab" value="${r.id}" onchange="trackCheck('rehab','${r.id}',this.checked)"></td>`}
        <td><strong>${r.nama}</strong></td>
        <td>${r.tanggal}</td>
        <td>${r.program}</td>
        <td>
          <div style="display:flex;align-items:center;gap:10px;max-width:160px">
            <div class="rehab-progress-bar" style="flex:1;margin:0">
              <div class="rehab-progress-fill ${cls}" style="width:${pct}%"></div>
            </div>
            <span style="font-size:11px;color:var(--text-dim);white-space:nowrap">${pct}%</span>
          </div>
        </td>
        <td>${pillRehab(r.status)}</td>
        <td>${r.petugas}</td>
      </tr>`;
    }).join('');
  }
}

function editRehabSelected() {
  if (isViewer()) { showToast('Akses ditolak', 'error'); return; }
  if (selectedRehabIds.size !== 1) { showToast('Pilih tepat 1 data untuk diedit', 'warning'); return; }
  openModalRehab([...selectedRehabIds][0]);
}

async function hapusRehabSelected() {
  if (isViewer()) { showToast('Akses ditolak', 'error'); return; }
  if (selectedRehabIds.size === 0) { showToast('Pilih data yang ingin dihapus', 'warning'); return; }
  if (!confirm(`Hapus ${selectedRehabIds.size} data rehabilitasi?`)) return;
  selectedRehabIds.forEach(id => {
    if (isDBMode()) apiDelete(`/rehabilitasi/${id}`);
  });
  db.rehabilitasi = db.rehabilitasi.filter(r => !selectedRehabIds.has(String(r.id)));
  selectedRehabIds.clear();
  renderRehabTable();
  renderRehabCards();
  updateDashboard();
  showToast('Data berhasil dihapus!');
}

// ─── ADMIN / USERS ────────────────────────────────────────────
function openModalUser() {
  ['uNama','uUser','uPass'].forEach(id => document.getElementById(id).value = '');
  openModal('modalUser');
}

async function saveUser() {
  if (isViewer()) { showToast('Akses ditolak', 'error'); return; }
  const nama = document.getElementById('uNama').value.trim();
  const username = document.getElementById('uUser').value.trim();
  const password = document.getElementById('uPass').value.trim();
  if (!nama || !username || !password) { showToast('Semua field wajib diisi!', 'error'); return; }
  if (db.users.find(u => u.username === username)) { showToast('Username sudah dipakai!', 'error'); return; }
  const newUser = {
    id: Date.now(),
    nama, username, password,
    role: document.getElementById('uRole').value,
    status: 'Aktif',
  };
  db.users.push(newUser);
  if (isDBMode()) {
    const res = await apiPost('/users', { nama, username, password, role: newUser.role });
    if (res && res.id) newUser.id = res.id;
  }
  closeModal('modalUser');
  renderUserTable();
  renderUserCards();
  updateDashboard();
  addActivity(`Pengguna baru: <strong>${nama}</strong> (${username})`, 'green');
  showToast('Pengguna berhasil ditambahkan!');
}

function renderUserCards() {
  const container = document.getElementById('userCards');
  if (!container) return;
  const total = db.users.length;
  const aktif = db.users.filter(u => u.status === 'Aktif').length;
  const petugas = db.users.filter(u => u.role === 'Petugas').length;
  const viewer = db.users.filter(u => u.role === 'Viewer').length;
  document.getElementById('qsAdminTotal').textContent = total;
  document.getElementById('qsAdminAktif').textContent = aktif;
  document.getElementById('qsAdminPetugas').textContent = petugas;
  document.getElementById('qsAdminViewer').textContent = viewer;

  container.innerHTML = db.users.map(u => {
    const initial = u.nama.charAt(0).toUpperCase();
    const roleClass = u.role.toLowerCase();
    const statusClass = u.status === 'Aktif' ? 'aktif' : 'nonaktif';
    return `
      <div class="user-card">
        <div class="user-card-avatar ${roleClass}">${initial}</div>
        <div class="user-card-info">
          <div class="user-card-name">${u.nama}</div>
          <div class="user-card-meta">@${u.username}</div>
          <div class="user-card-role role-${roleClass}">${u.role}</div>
        </div>
        <div class="user-card-status">
          <span class="user-status-dot ${statusClass}" title="${u.status}"></span>
        </div>
      </div>
    `;
  }).join('');
}

function renderUserTable() {
  const tbody = document.getElementById('userTableBody');
  const viewer = isViewer();
  tbody.innerHTML = db.users.map((u, i) => {
    const initial = u.nama.charAt(0).toUpperCase();
    const roleClass = u.role.toLowerCase();
    return `
    <tr>
      ${viewer ? '' : `<td>${i+1}</td>`}
      <td>
        <div style="display:flex;align-items:center;gap:10px">
          <div class="user-card-avatar ${roleClass}" style="width:32px;height:32px;font-size:12px">${initial}</div>
          <strong>${u.nama}</strong>
        </div>
      </td>
      <td>${u.username}</td>
      <td><span class="user-card-role role-${roleClass}">${u.role}</span></td>
      <td style="color:var(--text-dim);font-size:12px">${new Date().toLocaleDateString('id-ID', { day:'numeric', month:'short', year:'numeric' })}</td>
      <td><span class="status-pill pill-green">${u.status}</span></td>
      ${viewer ? '' : `<td>
        <button class="btn-danger" style="padding:4px 12px;font-size:12px" onclick="hapusUser(${u.id})">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
          Hapus
        </button>
      </td>`}
    </tr>`;
  }).join('');
}

async function hapusUser(id) {
  if (isViewer()) { showToast('Akses ditolak', 'error'); return; }
  if (db.users.find(u => u.id === id)?.username === 'admin') { showToast('Akun admin tidak bisa dihapus!', 'error'); return; }
  if (!confirm('Hapus pengguna ini?')) return;
  const u = db.users.find(x => x.id === id);
  db.users = db.users.filter(u => u.id !== id);
  if (isDBMode()) await apiDelete(`/users/${id}`);
  renderUserTable();
  renderUserCards();
  updateDashboard();
  showToast('Pengguna dihapus!');
  if (u) addActivity(`Pengguna <strong>${u.nama}</strong> dihapus dari sistem`, 'yellow');
}

// ─── CHECKBOX HELPERS ─────────────────────────────────────────
function trackCheck(type, id, checked) {
  if (isViewer()) return;
  const sets = { info: selectedInfoIds, lap: selectedLapIds, rehab: selectedRehabIds };
  const set = sets[type];
  if (checked) set.add(id); else set.delete(id);
}

function toggleCheckAll(type) {
  if (isViewer()) return;
  const configs = {
    info: { checkboxClass: '.check-info', set: selectedInfoIds, allId: 'checkAllInfo' },
    lap:  { checkboxClass: '.check-lap',  set: selectedLapIds,  allId: 'checkAllLap' },
    rehab:{ checkboxClass: '.check-rehab',set: selectedRehabIds,allId: 'checkAllRehab' },
  };
  const cfg = configs[type];
  const allChecked = document.getElementById(cfg.allId).checked;
  document.querySelectorAll(cfg.checkboxClass).forEach(cb => {
    cb.checked = allChecked;
    if (allChecked) cfg.set.add(cb.value); else cfg.set.delete(cb.value);
  });
}

// ─── PILL HELPERS ─────────────────────────────────────────────
function pillStatus(s) {
  const map = {
    'Kritis (CR)': 'pill-red',
    'Terancam (EN)': 'pill-yellow',
    'Rentan (VU)': 'pill-blue',
  };
  return `<span class="status-pill ${map[s]||'pill-blue'}">${s}</span>`;
}

function pillRehab(s) {
  const map = { 'Aktif': 'pill-green', 'Selesai': 'pill-blue', 'Dihentikan': 'pill-red' };
  return `<span class="status-pill ${map[s]||'pill-yellow'}">${s}</span>`;
}

function pillLaporan(s) {
  const map = { 'Menunggu': 'pill-yellow', 'Diproses': 'pill-blue', 'Selesai': 'pill-green' };
  return `<span class="status-pill ${map[s]||'pill-yellow'}">${s}</span>`;
}

// ─── LOGIN: Enter key ─────────────────────────────────────────
document.addEventListener('keydown', e => {
  if (e.key === 'Enter' && document.getElementById('loginPage').style.display !== 'none') {
    doLogin();
  }
});

// Re-init charts on theme change
const origToggle = toggleTheme;
toggleTheme = function() {
  origToggle();
  setTimeout(() => initCharts(), 100);
};
