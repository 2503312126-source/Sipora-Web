// ─── PENANGANAN LAPORAN — Admin Report Management ─────────────
function initPenangananData() {
  const now = new Date().toISOString().slice(0,16).replace('T',' ');
  if (!db.laporan || !db.laporan.length) return;
  db.laporan.forEach(l => {
    if (!l.prioritas) l.prioritas = 'Sedang';
    if (!l.assignedPetugas) l.assignedPetugas = '';
    if (!l.timeline) l.timeline = [{ status: 'Menunggu', date: l.tanggal || now, note: 'Laporan masuk' }];
    if (!l.catatan) l.catatan = [];
    if (!l.fotoPenanganan) l.fotoPenanganan = [];
    if (!l.riwayat) l.riwayat = [{ action: 'Laporan dibuat', user: 'Sistem', date: l.tanggal || now }];
  });
}

function tutupDrawer() {
  const drawer = document.getElementById('pnDrawer');
  const overlay = document.getElementById('pnOverlay');
  if (drawer) drawer.classList.remove('open');
  if (overlay) overlay.classList.remove('show');
  setTimeout(() => { selectedPenangananId = null; document.querySelectorAll('.pn-card.active').forEach(el => el.classList.remove('active')); }, 300);
}

function renderPenangananPage() {
  tutupDrawer();
  initPenangananData();
  renderPenangananStats();
  renderKanban();
  const petugas = db.users.filter(u => u.role === 'Petugas' || u.role === 'Admin');
  const optHtml = '<option value="">— Pilih —</option>' + petugas.map(u => `<option value="${u.nama}">${u.nama}</option>`).join('');
  const selAct = document.getElementById('pnActPetugas');
  if (selAct) selAct.innerHTML = optHtml;
  const selFilt = document.getElementById('pnFilterPetugas');
  if (selFilt) selFilt.innerHTML = '<option value="">Semua Petugas</option>' + petugas.map(u => `<option value="${u.nama}">${u.nama}</option>`).join('');
}

function renderPenangananStats() {
  const total = db.laporan.length;
  const byStatus = {};
  db.laporan.forEach(l => { byStatus[l.status] = (byStatus[l.status]||0)+1; });
  const el = id => document.getElementById(id);
  if (el('pnTotal')) el('pnTotal').textContent = total;
  if (el('pnMenunggu')) el('pnMenunggu').textContent = byStatus['Menunggu']||0;
  if (el('pnDiproses')) el('pnDiproses').textContent = byStatus['Diproses']||0;
  if (el('pnInvestigasi')) el('pnInvestigasi').textContent = byStatus['Investigasi']||0;
  if (el('pnRehab')) el('pnRehab').textContent = byStatus['Rehabilitasi']||0;
  if (el('pnSelesai')) el('pnSelesai').textContent = byStatus['Selesai']||0;
}

function renderKanban() {
  const q = (document.getElementById('pnSearch')?.value||'').toLowerCase();
  const fp = document.getElementById('pnFilterPrioritas')?.value||'';
  const fpet = document.getElementById('pnFilterPetugas')?.value||'';
  const statuses = ['Menunggu','Diproses','Investigasi','Rehabilitasi','Selesai'];
  const idMap = { 'Menunggu':'kanbanMenunggu','Diproses':'kanbanDiproses','Investigasi':'kanbanInvestigasi','Rehabilitasi':'kanbanRehabilitasi','Selesai':'kanbanSelesai' };
  const cntMap = { 'Menunggu':'cntMenunggu','Diproses':'cntDiproses','Investigasi':'cntInvestigasi','Rehabilitasi':'cntRehabilitasi','Selesai':'cntSelesai' };
  if (!db.laporan || !db.laporan.length) {
    statuses.forEach(s => {
      const count = document.getElementById(cntMap[s]);
      if (count) count.textContent = '0';
      const container = document.getElementById(idMap[s]);
      if (container) container.innerHTML = '<div class="pn-col-empty">Belum ada laporan</div>';
    });
    return;
  }
  statuses.forEach(s => {
    try {
      let items = db.laporan.filter(l => l && l.status === s);
      if (q) items = items.filter(l => (l.nama||'').toLowerCase().includes(q) || (l.lokasi||'').toLowerCase().includes(q));
      if (fp) items = items.filter(l => (l.prioritas||'Sedang') === fp);
      if (fpet) items = items.filter(l => l.assignedPetugas === fpet);
      const container = document.getElementById(idMap[s]);
      const count = document.getElementById(cntMap[s]);
      if (count) count.textContent = items.length;
      if (!container) return;
      if (items.length === 0) {
        container.innerHTML = '<div class="pn-col-empty">Tidak ada laporan</div>';
        return;
      }
      container.innerHTML = items.map(l => {
        const lokasi = (l.lokasi||'').split('/')[0].trim() || l.lokasi || '-';
        const prio = l.prioritas || 'Sedang';
        const prioClass = 'pn-card-prio-' + prio.toLowerCase();
        const assign = l.assignedPetugas ? `<span class="pn-card-assign"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> ${l.assignedPetugas}</span>` : '';
        const tgl = l.tanggal ? l.tanggal.slice(0,10) : '-';
        return `<div class="pn-card" onclick="pilihPenanganan(${l.id})" data-id="${l.id}">
          <div class="pn-card-name">${l.nama||'-'}</div>
          <div class="pn-card-loc">${lokasi}</div>
          <div class="pn-card-footer">
            <span class="pn-card-tgl">${tgl}</span>
            <span class="pn-card-prio ${prioClass}">${prio}</span>
          </div>
          ${assign}
        </div>`;
      }).join('');
    } catch (e) {
      console.error('renderKanban error for status:', s, e);
    }
  });
}

let selectedPenangananId = null;

function pilihPenanganan(id) {
  selectedPenangananId = id;
  document.querySelectorAll('.pn-card').forEach(el => el.classList.remove('active'));
  document.querySelectorAll(`[data-id="${id}"]`).forEach(el => el.classList.add('active'));
  document.getElementById('pnDrawer').classList.add('open');
  document.getElementById('pnOverlay').classList.add('show');
  renderPenangananDetail(id);
}

function renderPenangananDetail(id) {
  const l = db.laporan.find(x => x.id == id);
  if (!l) return;

  document.getElementById('pnDetId').textContent = '#' + String(l.id).padStart(3,'0');
  document.getElementById('pnDetTitle').textContent = l.nama;
  const statusBadge = document.getElementById('pnDetStatus');
  const statusColors = { 'Menunggu':['rgba(245,158,11,.15)','#FBBF24'], 'Diproses':['rgba(59,130,246,.15)','#60A5FA'], 'Investigasi':['rgba(139,92,246,.15)','#A78BFA'], 'Rehabilitasi':['rgba(16,185,129,.15)','#34D399'], 'Selesai':['rgba(107,114,128,.15)','#9CA3AF'] };
  const sc = statusColors[l.status]||statusColors['Menunggu'];
  statusBadge.textContent = l.status;
  statusBadge.style.background = sc[0];
  statusBadge.style.color = sc[1];

  const prioColors = { 'Rendah':'rgba(34,197,94,.15)','Sedang':'rgba(245,158,11,.15)','Tinggi':'rgba(249,115,22,.15)','Darurat':'rgba(239,68,68,.15)' };
  const prioText = { 'Rendah':'#4ADE80','Sedang':'#FBBF24','Tinggi':'#FB923C','Darurat':'#F87171' };
  const p = l.prioritas||'Sedang';
  document.getElementById('pnDetPrioritas').textContent = p;
  document.getElementById('pnDetPrioritas').style.background = prioColors[p]||prioColors['Sedang'];
  document.getElementById('pnDetPrioritas').style.color = prioText[p]||prioText['Sedang'];

  document.getElementById('pnDetHp').textContent = l.hp||'-';
  document.getElementById('pnDetTgl').textContent = l.tanggal?l.tanggal.slice(0,10):'-';
  document.getElementById('pnDetLokasi').textContent = l.lokasi;
  document.getElementById('pnDetJenis').textContent = l.jenis||'-';
  document.getElementById('pnDetKondisi').textContent = l.kondisi||'-';
  document.getElementById('pnDetDeskripsi').textContent = l.keterangan||'-';

  const fotoEl = document.getElementById('pnDetFoto');
  const fotoSection = document.getElementById('pnDetFotoSection');
  if (l.foto_url) { fotoSection.style.display = 'block'; fotoEl.innerHTML = `<img src="${l.foto_url}" alt="Foto Temuan" onerror="this.style.display='none'">`; }
  else { fotoSection.style.display = 'none'; }

  document.getElementById('pnActStatus').value = l.status;
  document.getElementById('pnActPrioritas').value = l.prioritas||'Sedang';
  document.getElementById('pnActPetugas').value = l.assignedPetugas||'';

  const timelineEl = document.getElementById('pnDetTimeline');
  if (l.timeline && l.timeline.length) {
    timelineEl.innerHTML = l.timeline.map(t => {
      const cls = (t.status||'').toLowerCase().replace(/[^a-z]/g,'');
      return `<div class="pn-tl-item ${cls}">
        <div class="pn-tl-status">${t.status}</div>
        <div class="pn-tl-date">${t.date}</div>
      </div>`;
    }).join('');
  } else timelineEl.innerHTML = '<div style="color:var(--text-dim);font-size:13px">Belum ada timeline</div>';

  renderCatatan(l);
  renderFotoBukti(l);

  const riwayatEl = document.getElementById('pnDetRiwayat');
  if (l.riwayat && l.riwayat.length) {
    riwayatEl.innerHTML = l.riwayat.map(r => {
      const dotClass = r.action.toLowerCase().includes('selesai')?'success':r.action.toLowerCase().includes('dibuat')?'info':'warning';
      return `<div class="pn-riw-item">
        <div class="pn-riw-dot ${dotClass}"></div>
        <span class="pn-riw-text">${r.action} ${r.user ? 'oleh <strong>'+r.user+'</strong>' : ''}</span>
        <span class="pn-riw-date">${r.date}</span>
      </div>`;
    }).join('');
  } else riwayatEl.innerHTML = '<div style="color:var(--text-dim);font-size:13px">Belum ada aktivitas</div>';
}

function renderCatatan(l) {
  const el = document.getElementById('pnDetCatatan');
  if (l.catatan && l.catatan.length) {
    el.innerHTML = l.catatan.map(c => `<div class="pn-cat-item">
      <div class="pn-cat-text">${c.text}</div>
      <div class="pn-cat-meta"><span>${c.author}</span><span>${c.date}</span></div>
    </div>`).join('');
  } else el.innerHTML = '<div style="color:var(--text-dim);font-size:13px">Belum ada catatan</div>';
}

function renderFotoBukti(l) {
  const el = document.getElementById('pnDetFotoBukti');
  if (l.fotoPenanganan && l.fotoPenanganan.length) {
    el.innerHTML = l.fotoPenanganan.map((f,i) => `<div class="pn-bukti-item">
      <img src="${f}" alt="Foto bukti">
      <button class="pn-bukti-del" onclick="hapusFotoPenanganan(${i})">✕</button>
    </div>`).join('');
  } else el.innerHTML = '';
}

async function simpanPenanganan() {
  if (isViewer()) { showToast('Akses ditolak', 'error'); return; }
  if (!selectedPenangananId) { showToast('Pilih laporan terlebih dahulu', 'warning'); return; }
  const l = db.laporan.find(x => x.id == selectedPenangananId);
  if (!l) return;
  const oldStatus = l.status;
  const newStatus = document.getElementById('pnActStatus').value;
  const newPrioritas = document.getElementById('pnActPrioritas').value;
  const newPetugas = document.getElementById('pnActPetugas').value;
  const now = new Date().toISOString().slice(0,16).replace('T',' ');
  let changed = false;
  if (newStatus !== oldStatus) {
    if (!l.timeline) l.timeline = [];
    l.timeline.push({ status: newStatus, date: now, note: 'Status diubah oleh ' + (db.currentUser?.nama||'Admin') });
    l.status = newStatus;
    if (!l.riwayat) l.riwayat = [];
    l.riwayat.push({ action: `Status diubah ke "${newStatus}"`, user: db.currentUser?.nama||'Admin', date: now });
    changed = true;
  }
  if (newPrioritas !== (l.prioritas||'Sedang')) {
    l.prioritas = newPrioritas;
    if (!l.riwayat) l.riwayat = [];
    l.riwayat.push({ action: `Prioritas diubah ke "${newPrioritas}"`, user: db.currentUser?.nama||'Admin', date: now });
    changed = true;
  }
  if (newPetugas !== (l.assignedPetugas||'')) {
    l.assignedPetugas = newPetugas;
    if (!l.riwayat) l.riwayat = [];
    l.riwayat.push({ action: `Ditugaskan ke ${newPetugas||'[unassigned]'}`, user: db.currentUser?.nama||'Admin', date: now });
    changed = true;
  }
  if (changed) {
    if (isDBMode()) await apiPut(`/laporan/${selectedPenangananId}`, { status: l.status, prioritas: l.prioritas, assignedPetugas: l.assignedPetugas });
    addActivity(`Laporan <strong>${l.nama}</strong> diperbarui oleh ${db.currentUser?.nama||'Admin'}`, 'blue');
    showToast('Perubahan disimpan!');
    renderPenangananPage();
  } else showToast('Tidak ada perubahan', 'info');
}

function tambahCatatan() {
  if (isViewer()) { showToast('Akses ditolak', 'error'); return; }
  if (!selectedPenangananId) { showToast('Pilih laporan terlebih dahulu', 'warning'); return; }
  const l = db.laporan.find(x => x.id == selectedPenangananId);
  if (!l) return;
  const input = document.getElementById('pnCatInput');
  const text = input.value.trim();
  if (!text) { showToast('Tulis catatan terlebih dahulu', 'warning'); return; }
  if (!l.catatan) l.catatan = [];
  const now = new Date().toISOString().slice(0,16).replace('T',' ');
  l.catatan.push({ text, author: db.currentUser?.nama||'Admin', date: now });
  if (!l.riwayat) l.riwayat = [];
  l.riwayat.push({ action: 'Catatan ditambahkan', user: db.currentUser?.nama||'Admin', date: now });
  input.value = '';
  addActivity(`Catatan ditambahkan ke laporan <strong>${l.nama}</strong>`, 'yellow');
  renderCatatan(l);
  renderPenangananDetail(selectedPenangananId);
  showToast('Catatan ditambahkan!');
}

function uploadFotoPenanganan(e) {
  if (isViewer()) { showToast('Akses ditolak', 'error'); return; }
  if (!selectedPenangananId) { showToast('Pilih laporan terlebih dahulu', 'warning'); return; }
  const l = db.laporan.find(x => x.id == selectedPenangananId);
  if (!l) return;
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(ev) {
    if (!l.fotoPenanganan) l.fotoPenanganan = [];
    l.fotoPenanganan.push(ev.target.result);
    if (!l.riwayat) l.riwayat = [];
    const now = new Date().toISOString().slice(0,16).replace('T',' ');
    l.riwayat.push({ action: 'Foto bukti ditambahkan', user: db.currentUser?.nama||'Admin', date: now });
    renderFotoBukti(l);
    addActivity(`Foto bukti ditambahkan ke laporan <strong>${l.nama}</strong>`, 'green');
    showToast('Foto berhasil diupload!');
  };
  reader.readAsDataURL(file);
  e.target.value = '';
}

function hapusFotoPenanganan(idx) {
  if (isViewer()) { showToast('Akses ditolak', 'error'); return; }
  if (!selectedPenangananId) return;
  const l = db.laporan.find(x => x.id == selectedPenangananId);
  if (!l || !l.fotoPenanganan) return;
  l.fotoPenanganan.splice(idx, 1);
  renderFotoBukti(l);
}
