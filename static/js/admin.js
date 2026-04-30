const user = getUser();
if (!user || user.role !== 'admin') window.location.href = '/';

document.getElementById('userName').textContent = user.full_name;

function showTab(tab) {
  ['patients', 'specialists', 'clinics', 'donnees'].forEach(t => {
    document.getElementById(`tab_${t}`).classList.toggle('tab-active', t === tab);
    document.getElementById(`section_${t}`).classList.toggle('hidden', t !== tab);
  });
  if (tab === 'patients') loadPatients();
  else if (tab === 'specialists') loadSpecialists();
  else if (tab === 'donnees') loadDonnees();
  else loadClinics();
}

async function loadStats() {
  try {
    const s = await apiFetch('/admin/stats');
    document.getElementById('statPatients').textContent = s.patients;
    document.getElementById('statSpecialists').textContent = s.specialists;
    document.getElementById('statTotal').textContent = s.appointments;
    document.getElementById('statPending').textContent = s.pending;
    document.getElementById('statConfirmed').textContent = s.confirmed;
  } catch (e) {}
}

async function loadPatients() {
  const tbody = document.getElementById('patientsBody');
  tbody.innerHTML = '<tr><td colspan="4" class="text-center text-slate-500 py-4">Chargement...</td></tr>';
  try {
    const rows = await apiFetch('/admin/patients');
    tbody.innerHTML = rows.length ? rows.map(p => `
      <tr class="border-t border-slate-100">
        <td class="py-2 px-3">${p.full_name}</td>
        <td class="py-2 px-3 text-slate-500">${p.email}</td>
        <td class="py-2 px-3 text-slate-500">${p.phone || '—'}</td>
        <td class="py-2 px-3">
          <button onclick="deleteUser(${p.id})" class="text-xs text-rose-600 hover:underline">Supprimer</button>
        </td>
      </tr>`).join('')
      : '<tr><td colspan="4" class="text-center text-slate-500 py-4">Aucun patient.</td></tr>';
  } catch (e) {
    tbody.innerHTML = '<tr><td colspan="4" class="text-center text-rose-500 py-4">Erreur.</td></tr>';
  }
}

let clinicsList = [];
let specialistsList = [];

async function loadSpecialists() {
  const tbody = document.getElementById('specialistsBody');
  tbody.innerHTML = '<tr><td colspan="6" class="text-center text-slate-500 py-4">Chargement...</td></tr>';
  try {
    specialistsList = await apiFetch('/admin/specialists');
    tbody.innerHTML = specialistsList.length ? specialistsList.map(s => `
      <tr class="border-t border-slate-100">
        <td class="py-2 px-3">${s.full_name}</td>
        <td class="py-2 px-3 text-slate-500">${s.specialty}</td>
        <td class="py-2 px-3 text-slate-500">${s.clinic_name}</td>
        <td class="py-2 px-3 text-slate-500">${s.village_name}</td>
        <td class="py-2 px-3">
          <button onclick="openEditProfile(${s.id})" class="text-xs text-sky-600 hover:underline">Modifier profil</button>
        </td>
        <td class="py-2 px-3">
          <button onclick="deleteUser(${s.user_id})" class="text-xs text-rose-600 hover:underline">Supprimer</button>
        </td>
      </tr>`).join('')
      : '<tr><td colspan="6" class="text-center text-slate-500 py-4">Aucun spécialiste.</td></tr>';
  } catch (e) {
    tbody.innerHTML = '<tr><td colspan="6" class="text-center text-rose-500 py-4">Erreur.</td></tr>';
  }

  if (!clinicsList.length) {
    try {
      clinicsList = await apiFetch('/admin/clinics');
      const sel = document.getElementById('spClinic');
      sel.innerHTML = '<option value="">-- Choisir --</option>' +
        clinicsList.map(c => `<option value="${c.id}">${c.name} (${c.village_name})</option>`).join('');
    } catch (e) {}
  }
}

function openEditProfile(spId) {
  const sp = specialistsList.find(s => s.id === spId);
  if (!sp) return;
  document.getElementById('editProfileId').value = sp.id;
  document.getElementById('editProfileName').textContent = sp.full_name;
  document.getElementById('editProfileSpecialty').textContent = sp.specialty;
  document.getElementById('editProfileBio').value = sp.bio || '';
  document.getElementById('editPhotoInput').value = '';
  document.getElementById('editPhotoPreview').classList.add('hidden');

  const parts = sp.full_name.trim().split(/\s+/);
  const initials = (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase();
  const wrap = document.getElementById('editProfileAvatarWrap');
  if (sp.photo_url) {
    wrap.innerHTML = `<img src="${sp.photo_url}" class="w-16 h-16 rounded-full object-cover border-2 border-sky-200" alt="Photo" />`;
  } else {
    wrap.innerHTML = `<div class="w-16 h-16 rounded-full bg-gradient-to-br from-sky-500 to-emerald-500 text-white flex items-center justify-center text-xl font-bold select-none">${initials}</div>`;
  }

  document.getElementById('editProfileModal').classList.add('show');
}

function closeEditProfile() {
  document.getElementById('editProfileModal').classList.remove('show');
}

document.getElementById('editPhotoInput').addEventListener('change', e => {
  const file = e.target.files[0];
  const preview = document.getElementById('editPhotoPreview');
  if (file) {
    preview.src = URL.createObjectURL(file);
    preview.classList.remove('hidden');
  } else {
    preview.classList.add('hidden');
  }
});

document.getElementById('editProfileForm').addEventListener('submit', async e => {
  e.preventDefault();
  const spId = document.getElementById('editProfileId').value;
  const fd = new FormData(e.target);
  try {
    await apiFetchMultipart(`/admin/specialists/${spId}/profile`, { method: 'PATCH', body: fd });
    showToast('Profil mis à jour !');
    closeEditProfile();
    loadSpecialists();
  } catch (err) { showToast(err.message, 'error'); }
});

document.getElementById('addSpecialistForm').addEventListener('submit', async e => {
  e.preventDefault();
  const fd = new FormData(e.target);
  try {
    await apiFetch('/admin/specialists', {
      method: 'POST',
      body: JSON.stringify({
        full_name: fd.get('full_name'),
        email: fd.get('email'),
        phone: fd.get('phone'),
        password: fd.get('password'),
        specialty: fd.get('specialty'),
        clinic_id: parseInt(fd.get('clinic_id')),
        bio: fd.get('bio')
      })
    });
    showToast('Spécialiste ajouté !');
    e.target.reset();
    loadSpecialists();
  } catch (err) { showToast(err.message, 'error'); }
});

async function loadClinics() {
  const tbody = document.getElementById('clinicsBody');
  tbody.innerHTML = '<tr><td colspan="4" class="text-center text-slate-500 py-4">Chargement...</td></tr>';
  try {
    const rows = await apiFetch('/admin/clinics');
    tbody.innerHTML = rows.length ? rows.map(c => `
      <tr class="border-t border-slate-100">
        <td class="py-2 px-3">${c.name}</td>
        <td class="py-2 px-3 text-slate-500">${c.village_name}</td>
        <td class="py-2 px-3 text-slate-500">${c.address || '—'}</td>
        <td class="py-2 px-3 text-slate-500">${c.phone || '—'}</td>
      </tr>`).join('')
      : '<tr><td colspan="4" class="text-center text-slate-500 py-4">Aucune clinique.</td></tr>';
  } catch (e) {
    tbody.innerHTML = '<tr><td colspan="4" class="text-center text-rose-500 py-4">Erreur.</td></tr>';
  }
}

async function deleteUser(id) {
  if (!confirm('Supprimer cet utilisateur définitivement ?')) return;
  try {
    await apiFetch(`/admin/users/${id}`, { method: 'DELETE' });
    showToast('Utilisateur supprimé');
    loadStats();
    loadPatients();
  } catch (err) { showToast(err.message, 'error'); }
}

loadStats();
loadPatients();

// ── GESTION DES DONNÉES (Communes / Villages / Cliniques) ─────────────────────

let _communes = [];
let _villages = [];

async function loadDonnees() {
  await Promise.all([loadCommunesData(), loadVillagesData(), loadClinicsData()]);
}

// ── Communes ──────────────────────────────────────────────────────────────────

async function loadCommunesData() {
  const tbody = document.getElementById('communesListBody');
  tbody.innerHTML = '<tr><td colspan="2" class="text-center text-slate-500 py-4">Chargement…</td></tr>';
  try {
    _communes = await apiFetch('/admin/data/communes');
    // Met aussi à jour le select du formulaire Village
    const sel = document.getElementById('selectVillageCommune');
    sel.innerHTML = '<option value="">-- Choisir --</option>' +
      _communes.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
    // Tableau
    tbody.innerHTML = _communes.length
      ? _communes.map(c => `
          <tr class="border-t border-slate-100 hover:bg-slate-50/50">
            <td class="py-2 px-4">${c.name}</td>
            <td class="py-2 px-4 text-slate-500" id="commune_village_count_${c.id}">—</td>
          </tr>`).join('')
      : '<tr><td colspan="2" class="text-center text-slate-500 py-4">Aucune commune.</td></tr>';
  } catch (e) {
    tbody.innerHTML = '<tr><td colspan="2" class="text-center text-rose-500 py-4">Erreur de chargement.</td></tr>';
  }
}

document.getElementById('formAddCommune').addEventListener('submit', async e => {
  e.preventDefault();
  const name = document.getElementById('inputCommuneName').value.trim();
  try {
    await apiFetch('/admin/data/communes', { method: 'POST', body: JSON.stringify({ name }) });
    showToast('Commune ajoutée !', 'success');
    document.getElementById('inputCommuneName').value = '';
    loadCommunesData();
  } catch (err) { showToast(err.message, 'error'); }
});

// ── Villages ──────────────────────────────────────────────────────────────────

async function loadVillagesData() {
  const tbody = document.getElementById('villagesListBody');
  tbody.innerHTML = '<tr><td colspan="2" class="text-center text-slate-500 py-4">Chargement…</td></tr>';
  try {
    _villages = await apiFetch('/admin/data/villages');
    // Met à jour le select du formulaire Clinique
    const sel = document.getElementById('selectClinicVillage');
    sel.innerHTML = '<option value="">-- Choisir --</option>' +
      _villages.map(v => `<option value="${v.id}">${v.name} (${v.commune_name})</option>`).join('');
    // Tableau
    tbody.innerHTML = _villages.length
      ? _villages.map(v => `
          <tr class="border-t border-slate-100 hover:bg-slate-50/50">
            <td class="py-2 px-4">${v.name}</td>
            <td class="py-2 px-4 text-slate-500">${v.commune_name}</td>
          </tr>`).join('')
      : '<tr><td colspan="2" class="text-center text-slate-500 py-4">Aucun village.</td></tr>';
  } catch (e) {
    tbody.innerHTML = '<tr><td colspan="2" class="text-center text-rose-500 py-4">Erreur de chargement.</td></tr>';
  }
}

document.getElementById('formAddVillage').addEventListener('submit', async e => {
  e.preventDefault();
  const name       = document.getElementById('inputVillageName').value.trim();
  const commune_id = document.getElementById('selectVillageCommune').value;
  try {
    await apiFetch('/admin/data/villages', { method: 'POST', body: JSON.stringify({ name, commune_id }) });
    showToast('Village ajouté !', 'success');
    document.getElementById('inputVillageName').value = '';
    document.getElementById('selectVillageCommune').value = '';
    loadVillagesData();
  } catch (err) { showToast(err.message, 'error'); }
});

// ── Cliniques ─────────────────────────────────────────────────────────────────

async function loadClinicsData() {
  const tbody = document.getElementById('clinicsListBody');
  tbody.innerHTML = '<tr><td colspan="4" class="text-center text-slate-500 py-4">Chargement…</td></tr>';
  try {
    const rows = await apiFetch('/admin/clinics');
    tbody.innerHTML = rows.length
      ? rows.map(c => `
          <tr class="border-t border-slate-100 hover:bg-slate-50/50">
            <td class="py-2 px-4">${c.name}</td>
            <td class="py-2 px-4 text-slate-500">${c.village_name}</td>
            <td class="py-2 px-4 text-slate-500">${c.address || '—'}</td>
            <td class="py-2 px-4 text-slate-500">${c.phone || '—'}</td>
          </tr>`).join('')
      : '<tr><td colspan="4" class="text-center text-slate-500 py-4">Aucune clinique.</td></tr>';
  } catch (e) {
    tbody.innerHTML = '<tr><td colspan="4" class="text-center text-rose-500 py-4">Erreur de chargement.</td></tr>';
  }
}

document.getElementById('formAddClinic').addEventListener('submit', async e => {
  e.preventDefault();
  const payload = {
    name:       document.getElementById('inputClinicName').value.trim(),
    village_id: document.getElementById('selectClinicVillage').value,
    address:    document.getElementById('inputClinicAddress').value.trim(),
    phone:      document.getElementById('inputClinicPhone').value.trim(),
  };
  try {
    await apiFetch('/admin/data/clinics', { method: 'POST', body: JSON.stringify(payload) });
    showToast('Clinique ajoutée !', 'success');
    document.getElementById('formAddClinic').reset();
    loadClinicsData();
    // Rafraîchit aussi le select clinique du formulaire Spécialiste
    clinicsList = [];
  } catch (err) { showToast(err.message, 'error'); }
});
