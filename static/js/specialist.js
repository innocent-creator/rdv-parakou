const user = getUser();
if (!user || user.role !== 'specialist') window.location.href = '/';

document.getElementById('userName').textContent = user.full_name;

function showTab(tab) {
  ['slots', 'appointments'].forEach(t => {
    document.getElementById(`tab_${t}`).classList.toggle('tab-active', t === tab);
    document.getElementById(`section_${t}`).classList.toggle('hidden', t !== tab);
  });
  if (tab === 'slots') loadSlots();
  else loadAppointments();
}

async function loadProfile() {
  try {
    const p = await apiFetch('/specialist/me');
    document.getElementById('profileInfo').textContent = `${p.specialty} — ${p.clinic_name}, ${p.village_name}`;
  } catch (e) {}
}

async function loadSlots() {
  const container = document.getElementById('slotsList');
  container.innerHTML = '<p class="text-slate-500">Chargement...</p>';
  try {
    const slots = await apiFetch('/specialist/slots');
    if (!slots.length) { container.innerHTML = '<p class="text-slate-500">Aucun créneau ajouté.</p>'; return; }
    container.innerHTML = slots.map(s => `
      <div class="flex items-center justify-between bg-white/90 backdrop-blur rounded-xl border border-slate-100 shadow-sm px-4 py-3">
        <div>
          <span class="font-medium">${s.slot_date}</span>
          <span class="text-slate-500 ml-2">${s.start_time.slice(0,5)}–${s.end_time.slice(0,5)}</span>
        </div>
        <div class="flex items-center gap-3">
          <span class="pill-${s.status} px-2 py-0.5 rounded-full text-xs font-semibold">${s.status}</span>
          ${s.status === 'available' ? `<button onclick="deleteSlot(${s.id})" class="text-xs text-rose-600 hover:underline">Supprimer</button>` : ''}
        </div>
      </div>`).join('');
  } catch (e) { container.innerHTML = '<p class="text-rose-500">Erreur lors du chargement.</p>'; }
}

document.getElementById('addSlotForm').addEventListener('submit', async e => {
  e.preventDefault();
  const fd = new FormData(e.target);
  try {
    await apiFetch('/specialist/slots', {
      method: 'POST',
      body: JSON.stringify({
        slot_date: fd.get('slot_date'),
        start_time: fd.get('start_time'),
        end_time: fd.get('end_time')
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
  container.innerHTML = '<p class="text-slate-500">Chargement...</p>';
  try {
    const apts = await apiFetch('/specialist/appointments');
    if (!apts.length) { container.innerHTML = '<p class="text-slate-500">Aucun rendez-vous.</p>'; return; }
    container.innerHTML = apts.map(a => `
      <div class="bg-white/90 backdrop-blur rounded-2xl border border-slate-100 shadow-sm p-5">
        <div class="flex justify-between items-start">
          <div>
            <div class="font-bold">${a.patient_name}</div>
            <div class="text-sm text-slate-500">${a.patient_email}${a.patient_phone ? ' · ' + a.patient_phone : ''}</div>
            <div class="text-sm text-slate-600 mt-1">${a.slot_date} · ${a.start_time.slice(0,5)}–${a.end_time.slice(0,5)}</div>
            <div class="text-sm mt-1 text-slate-600">Motif : ${a.reason} · ${a.consultation_type}</div>
          </div>
          <div class="flex flex-col items-end gap-2">
            <span class="pill-${a.status} px-2 py-0.5 rounded-full text-xs font-semibold">${a.status}</span>
            ${a.status === 'pending' ? `
              <button onclick="confirmApt(${a.id})" class="text-xs text-emerald-600 hover:underline">Confirmer</button>
              <button onclick="rejectApt(${a.id})" class="text-xs text-rose-600 hover:underline">Rejeter</button>` : ''}
          </div>
        </div>
      </div>`).join('');
  } catch (e) { container.innerHTML = '<p class="text-rose-500">Erreur lors du chargement.</p>'; }
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
