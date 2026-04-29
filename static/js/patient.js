const user = getUser();
if (!user || user.role !== 'patient') window.location.href = '/';

document.getElementById('userName').textContent = user.full_name;

let selectedSlot = null;
let availableSlots = [];

function showTab(tab) {
  document.getElementById('tabBook').classList.toggle('tab-active', tab === 'book');
  document.getElementById('tabMine').classList.toggle('tab-active', tab === 'mine');
  document.getElementById('sectionBook').classList.toggle('hidden', tab !== 'book');
  document.getElementById('sectionMine').classList.toggle('hidden', tab !== 'mine');
  if (tab === 'mine') loadMyAppointments();
}

async function loadVillages() {
  try {
    const villages = await apiFetch('/villages');
    const sel = document.getElementById('selVillage');
    sel.innerHTML = '<option value="">-- Choisir un village --</option>' +
      villages.map(v => `<option value="${v.id}">${v.name}</option>`).join('');
  } catch (e) { showToast('Erreur chargement villages', 'error'); }
}

document.getElementById('selVillage').addEventListener('change', async e => {
  const id = e.target.value;
  document.getElementById('selClinic').innerHTML = '<option value="">-- Choisir --</option>';
  document.getElementById('selSpecialist').innerHTML = '<option value="">-- Choisir --</option>';
  resetSlots();
  if (!id) return;
  try {
    const clinics = await apiFetch(`/villages/${id}/clinics`);
    document.getElementById('selClinic').innerHTML =
      '<option value="">-- Choisir une clinique --</option>' +
      clinics.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
  } catch (e) { showToast('Erreur chargement cliniques', 'error'); }
});

document.getElementById('selClinic').addEventListener('change', async e => {
  const id = e.target.value;
  document.getElementById('selSpecialist').innerHTML = '<option value="">-- Choisir --</option>';
  resetSlots();
  if (!id) return;
  try {
    const specialists = await apiFetch(`/clinics/${id}/specialists`);
    document.getElementById('selSpecialist').innerHTML =
      '<option value="">-- Choisir un spécialiste --</option>' +
      specialists.map(s => `<option value="${s.id}">${s.full_name} (${s.specialty}) — ${s.free_slots} créneau(x)</option>`).join('');
  } catch (e) { showToast('Erreur chargement spécialistes', 'error'); }
});

document.getElementById('selSpecialist').addEventListener('change', async e => {
  const id = e.target.value;
  resetSlots();
  if (!id) return;
  try {
    const slots = await apiFetch(`/specialists/${id}/slots`);
    availableSlots = slots.filter(s => s.status === 'available');

    if (!availableSlots.length) {
      showToast('Aucun créneau disponible pour ce spécialiste', 'error');
      return;
    }

    // Affichage lecture seule des créneaux disponibles
    document.getElementById('availableSlotsList').innerHTML = availableSlots.map(s =>
      `<span class="px-3 py-1 rounded-lg bg-white border border-slate-200 text-sm text-slate-600">
        📅 ${s.slot_date} &nbsp;⏰ ${s.start_time.slice(0,5)} – ${s.end_time.slice(0,5)}
      </span>`
    ).join('');
    document.getElementById('availableSlotsInfo').classList.remove('hidden');
    document.getElementById('dateTimeSection').classList.remove('hidden');

    // Pré-remplir la date avec la première date disponible
    document.getElementById('inputDate').value = availableSlots[0].slot_date;
    document.getElementById('inputTime').value = '';
    hideVerifyMessage();
  } catch (e) { showToast('Erreur chargement créneaux', 'error'); }
});

function resetSlots() {
  selectedSlot = null;
  availableSlots = [];
  document.getElementById('availableSlotsInfo').classList.add('hidden');
  document.getElementById('dateTimeSection').classList.add('hidden');
  document.getElementById('bookForm').classList.add('hidden');
  hideVerifyMessage();
}

function showVerifyMessage(msg, success) {
  const el = document.getElementById('verifyMessage');
  el.textContent = msg;
  el.className = `mt-3 text-sm px-3 py-2 rounded-lg ${success ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`;
  el.classList.remove('hidden');
}

function hideVerifyMessage() {
  document.getElementById('verifyMessage').classList.add('hidden');
}

document.getElementById('btnVerify').addEventListener('click', () => {
  const date = document.getElementById('inputDate').value;
  const time = document.getElementById('inputTime').value;

  if (!date || !time) {
    showVerifyMessage('Veuillez saisir une date et une heure.', false);
    return;
  }

  // Chercher un créneau dont la plage horaire contient l'heure choisie
  const match = availableSlots.find(s => {
    if (s.slot_date !== date) return false;
    return time >= s.start_time.slice(0, 5) && time < s.end_time.slice(0, 5);
  });

  if (!match) {
    showVerifyMessage(
      `Aucun créneau disponible le ${date} à ${time}. Consultez les créneaux disponibles ci-dessus.`,
      false
    );
    document.getElementById('bookForm').classList.add('hidden');
    selectedSlot = null;
    return;
  }

  selectedSlot = String(match.id);
  document.getElementById('slotInfo').textContent =
    `${match.slot_date} · ${match.start_time.slice(0,5)} – ${match.end_time.slice(0,5)}`;
  showVerifyMessage(`Créneau disponible ! Vous pouvez confirmer votre demande.`, true);
  document.getElementById('bookForm').classList.remove('hidden');
  document.getElementById('formBook').reset();
});

document.getElementById('formBook').addEventListener('submit', async e => {
  e.preventDefault();
  if (!selectedSlot) return;
  const fd = new FormData(e.target);
  try {
    await apiFetch('/appointments', {
      method: 'POST',
      body: JSON.stringify({
        slot_id: parseInt(selectedSlot),
        reason: fd.get('reason'),
        consultation_type: fd.get('consultation_type')
      })
    });
    showToast('Demande envoyée avec succès !');
    e.target.reset();
    document.getElementById('bookForm').classList.add('hidden');
    hideVerifyMessage();
    // Recharger les créneaux pour mettre à jour la liste
    document.getElementById('selSpecialist').dispatchEvent(new Event('change'));
  } catch (err) { showToast(err.message, 'error'); }
});

async function loadMyAppointments() {
  const container = document.getElementById('myAppointments');
  container.innerHTML = '<p class="text-slate-500">Chargement...</p>';
  try {
    const apts = await apiFetch('/appointments/mine');
    if (!apts.length) {
      container.innerHTML = '<p class="text-slate-500">Aucun rendez-vous pour l\'instant.</p>';
      return;
    }
    container.innerHTML = apts.map(a => `
      <div class="bg-white/90 backdrop-blur rounded-2xl border border-slate-100 shadow-sm p-5">
        <div class="flex justify-between items-start">
          <div>
            <div class="font-bold">${a.specialty} — Dr. ${a.specialist_name}</div>
            <div class="text-sm text-slate-500">${a.clinic_name}</div>
            <div class="text-sm text-slate-600 mt-1">${a.slot_date} · ${a.start_time.slice(0,5)}–${a.end_time.slice(0,5)}</div>
            <div class="text-sm mt-1 text-slate-600">Motif : ${a.reason} · ${a.consultation_type}</div>
          </div>
          <div class="flex flex-col items-end gap-2">
            <span class="pill-${a.status} px-2 py-0.5 rounded-full text-xs font-semibold">${a.status}</span>
            ${a.status === 'pending' ? `<button onclick="cancelApt(${a.id})" class="text-xs text-rose-600 hover:underline">Annuler</button>` : ''}
          </div>
        </div>
      </div>`).join('');
  } catch (e) { container.innerHTML = '<p class="text-rose-500">Erreur lors du chargement.</p>'; }
}

async function cancelApt(id) {
  if (!confirm('Annuler ce rendez-vous ?')) return;
  try {
    await apiFetch(`/appointments/${id}/cancel`, { method: 'POST' });
    showToast('Rendez-vous annulé');
    loadMyAppointments();
  } catch (err) { showToast(err.message, 'error'); }
}

loadVillages();
