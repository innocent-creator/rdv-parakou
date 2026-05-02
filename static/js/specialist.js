const user = getUser();
if (!user || user.role !== 'specialist') window.location.href = '/';

document.getElementById('userName').textContent = user.full_name;

function showTab(tab) {
  ['slots', 'appointments', 'profile'].forEach(t => {
    document.getElementById(`tab_${t}`).classList.toggle('tab-active', t === tab);
    document.getElementById(`section_${t}`).classList.toggle('hidden', t !== tab);
  });
  if (tab === 'slots') loadSlots();
  else if (tab === 'appointments') loadAppointments();
  else loadProfileTab();
}

function _initials(fullName) {
  const parts = fullName.trim().split(/\s+/);
  return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase();
}

function _bigAvatar(photoUrl, initials) {
  if (photoUrl) return `<img src="${photoUrl}" style="width:88px;height:88px;border-radius:50%;object-fit:cover;border:3px solid #e2e8f0;" alt="Photo" />`;
  return `<div style="width:88px;height:88px;border-radius:50%;background:linear-gradient(135deg,#2563eb,#10b981);color:white;display:flex;align-items:center;justify-content:center;font-size:2rem;font-weight:700;user-select:none;">${initials}</div>`;
}

function _smallAvatar(photoUrl, initials) {
  if (photoUrl) return `<img src="${photoUrl}" style="width:60px;height:60px;border-radius:50%;object-fit:cover;" alt="Photo" />`;
  return `<div style="width:60px;height:60px;border-radius:50%;background:linear-gradient(135deg,#2563eb,#10b981);color:white;display:flex;align-items:center;justify-content:center;font-size:1.2rem;font-weight:700;user-select:none;">${initials}</div>`;
}

function _navAvatar(photoUrl, initials) {
  if (photoUrl) return `<img src="${photoUrl}" class="sp-nav-avatar" alt="Photo" />`;
  return `<div style="width:40px;height:40px;border-radius:50%;background:linear-gradient(135deg,#2563eb,#10b981);color:white;display:flex;align-items:center;justify-content:center;font-size:0.9rem;font-weight:700;user-select:none;">${initials}</div>`;
}

async function loadProfile() {
  try {
    const p = await apiFetch('/specialist/me');
    document.getElementById('profileInfo').textContent = `${p.specialty} — ${p.clinic_name}`;
    const initials = _initials(p.full_name);
    const navWrap = document.getElementById('navAvatarWrap');
    if (navWrap) navWrap.innerHTML = _navAvatar(p.photo_url, initials);
  } catch (e) {}
}

async function loadProfileTab() {
  document.getElementById('profileLoading').classList.remove('hidden');
  document.getElementById('profileContent').classList.add('hidden');
  document.getElementById('profileSuccess').classList.add('hidden');

  try {
    const p = await apiFetch('/specialist/me');
    const initials = _initials(p.full_name);

    document.getElementById('profileFullName').textContent = p.full_name;
    document.getElementById('profileSpecialty').textContent = p.specialty;
    document.getElementById('profileClinic').textContent = `${p.clinic_name} — ${p.village_name}`;
    document.getElementById('profileBio').value = p.bio || '';

    document.getElementById('profileAvatarWrap').innerHTML = _bigAvatar(p.photo_url, initials);
    document.getElementById('profilePhotoThumb').innerHTML = _smallAvatar(p.photo_url, initials);

    document.getElementById('profileLoading').classList.add('hidden');
    document.getElementById('profileContent').classList.remove('hidden');
  } catch (e) {
    document.getElementById('profileLoading').textContent = 'Erreur lors du chargement du profil.';
  }
}

document.getElementById('profilePhotoInput').addEventListener('change', e => {
  const file = e.target.files[0];
  const errEl = document.getElementById('profilePhotoError');
  errEl.classList.add('hidden');
  if (!file) return;
  if (file.size > 2 * 1024 * 1024) {
    errEl.textContent = 'La photo ne doit pas dépasser 2 Mo.';
    errEl.classList.remove('hidden');
    e.target.value = '';
    return;
  }
  const thumb = document.getElementById('profilePhotoThumb');
  thumb.innerHTML = `<img src="${URL.createObjectURL(file)}" style="width:60px;height:60px;border-radius:50%;object-fit:cover;" alt="Aperçu" />`;
});

document.getElementById('profileForm').addEventListener('submit', async e => {
  e.preventDefault();
  const btn = document.getElementById('profileSaveBtn');
  btn.disabled = true;
  btn.textContent = 'Enregistrement…';
  document.getElementById('profileSuccess').classList.add('hidden');

  try {
    const updated = await apiFetchMultipart('/specialist/me', { method: 'PATCH', body: new FormData(e.target) });
    document.getElementById('profileSuccess').classList.remove('hidden');
    document.getElementById('profilePhotoInput').value = '';
    const initials = _initials(document.getElementById('profileFullName').textContent);
    document.getElementById('profileAvatarWrap').innerHTML = _bigAvatar(updated.photo_url, initials);
    document.getElementById('profilePhotoThumb').innerHTML = _smallAvatar(updated.photo_url, initials);
    const navWrap = document.getElementById('navAvatarWrap');
    if (navWrap) navWrap.innerHTML = _navAvatar(updated.photo_url, initials);
    loadProfile();
  } catch (err) {
    showToast(err.message || 'Erreur lors de la sauvegarde', 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Enregistrer les modifications';
  }
});

async function loadSlots() {
  const container = document.getElementById('slotsList');
  container.innerHTML = '<p style="color:#94a3b8;font-size:0.875rem;padding:8px 0;">Chargement...</p>';
  try {
    const slots = await apiFetch('/specialist/slots');
    if (!slots.length) {
      container.innerHTML = '<p style="color:#94a3b8;font-size:0.875rem;padding:8px 0;">Aucun créneau ajouté.</p>';
      return;
    }
    container.innerHTML = slots.map(s => `
      <div class="slot-card">
        <div style="display:flex;align-items:center;gap:20px;">
          <div>
            <div class="slot-label">📅 Date</div>
            <div class="slot-value">${s.slot_date}</div>
          </div>
          <div class="slot-divider"></div>
          <div>
            <div class="slot-label">🕐 Horaire</div>
            <div class="slot-value">${s.start_time.slice(0,5)} – ${s.end_time.slice(0,5)}</div>
          </div>
        </div>
        <div style="display:flex;align-items:center;gap:10px;">
          <span class="status-badge pill-${s.status}">${statusFr(s.status)}</span>
          ${s.status === 'available'
            ? `<button onclick="deleteSlot(${s.id})" class="btn-delete">Supprimer</button>`
            : ''}
        </div>
      </div>`).join('');
  } catch (e) {
    container.innerHTML = '<p style="color:#ef4444;font-size:0.875rem;">Erreur lors du chargement.</p>';
  }
}

document.getElementById('addSlotForm').addEventListener('submit', async e => {
  e.preventDefault();
  const fd = new FormData(e.target);
  try {
    await apiFetch('/specialist/slots', {
      method: 'POST',
      body: JSON.stringify({
        slot_date:  fd.get('slot_date'),
        start_time: fd.get('start_time'),
        end_time:   fd.get('end_time')
      })
    });
    showToast('Créneau ajouté !');
    e.target.reset();
    loadSlots();
  } catch (err) { showToast(err.message, 'error'); }
});

async function deleteSlot(id) {
  if (!confirm('Supprimer ce créneau ?')) return;
  try {
    await apiFetch(`/specialist/slots/${id}`, { method: 'DELETE' });
    showToast('Créneau supprimé');
    loadSlots();
  } catch (err) { showToast(err.message, 'error'); }
}

async function loadAppointments() {
  const container = document.getElementById('appointmentsList');
  container.innerHTML = '<p style="color:#94a3b8;font-size:0.875rem;padding:8px 0;">Chargement...</p>';
  try {
    const apts = await apiFetch('/specialist/appointments');
    if (!apts.length) {
      container.innerHTML = '<p style="color:#94a3b8;font-size:0.875rem;padding:8px 0;">Aucun rendez-vous.</p>';
      return;
    }
    container.innerHTML = apts.map(a => `
      <div class="apt-card">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px;">
          <div style="flex:1;">
            <div style="font-weight:700;font-size:0.95rem;color:#1e293b;margin-bottom:2px;">${a.patient_name}</div>
            <div style="font-size:0.78rem;color:#64748b;margin-bottom:6px;">
              ${a.patient_email}${a.patient_phone ? ' · ' + a.patient_phone : ''}
            </div>
            <div style="display:flex;gap:16px;flex-wrap:wrap;">
              <div>
                <div class="slot-label">📅 Date</div>
                <div style="font-weight:600;font-family:monospace;font-size:0.875rem;color:#1e293b;">${a.slot_date}</div>
              </div>
              <div>
                <div class="slot-label">🕐 Horaire</div>
                <div style="font-weight:600;font-family:monospace;font-size:0.875rem;color:#1e293b;">${a.start_time.slice(0,5)} – ${a.end_time.slice(0,5)}</div>
              </div>
              <div>
                <div class="slot-label">Motif</div>
                <div style="font-size:0.8rem;color:#475569;">${a.reason} · ${a.consultation_type}</div>
              </div>
            </div>
          </div>
          <div style="display:flex;flex-direction:column;align-items:flex-end;gap:8px;flex-shrink:0;">
            <span class="status-badge pill-${a.status}">${statusFr(a.status)}</span>
            ${a.status === 'pending' ? `
              <button onclick="confirmApt(${a.id})"
                style="font-size:0.78rem;color:#059669;background:#ecfdf5;border:1px solid #a7f3d0;padding:5px 12px;border-radius:7px;cursor:pointer;"
                onmouseover="this.style.background='#d1fae5'" onmouseout="this.style.background='#ecfdf5'">
                Confirmer
              </button>
              <button onclick="rejectApt(${a.id})" class="btn-delete">Rejeter</button>` : ''}
          </div>
        </div>
      </div>`).join('');
  } catch (e) {
    container.innerHTML = '<p style="color:#ef4444;font-size:0.875rem;">Erreur lors du chargement.</p>';
  }
}

async function confirmApt(id) {
  try {
    await apiFetch(`/specialist/appointments/${id}/confirm`, { method: 'POST' });
    showToast('Rendez-vous confirmé');
    loadAppointments();
  } catch (err) { showToast(err.message, 'error'); }
}

async function rejectApt(id) {
  try {
    await apiFetch(`/specialist/appointments/${id}/reject`, { method: 'POST' });
    showToast('Rendez-vous rejeté');
    loadAppointments();
  } catch (err) { showToast(err.message, 'error'); }
}

loadProfile();
loadSlots();
