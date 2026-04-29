const user = getUser();
if (!user || user.role !== 'admin') window.location.href = '/';

document.getElementById('userName').textContent = user.full_name;

function showTab(tab) {
  ['patients', 'specialists', 'clinics'].forEach(t => {
    document.getElementById(`tab_${t}`).classList.toggle('tab-active', t === tab);
    document.getElementById(`section_${t}`).classList.toggle('hidden', t !== tab);
  });
  if (tab === 'patients') loadPatients();
  else if (tab === 'specialists') loadSpecialists();
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
