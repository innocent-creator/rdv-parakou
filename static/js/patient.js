// ── AUTH STATE ────────────────────────────────────────────────────────────────

(function () {
  const user = getUser();
  if (user) {
    if (user.role === 'specialist') { window.location.href = '/specialist'; return; }
    if (user.role === 'admin') { window.location.href = '/admin-panel'; return; }
    document.getElementById('navUser').style.display = 'flex';
    document.getElementById('userName').textContent = user.full_name;
  } else {
    document.getElementById('navGuest').style.display = 'flex';
  }
})();

let selectedSlot = null;
let availableSlots = [];

// ── TABS ──────────────────────────────────────────────────────────────────────

function showTab(tab) {
  if (tab === 'mine' && !getUser()) {
    openPatientAuth('login');
    return;
  }
  document.getElementById('tabBook').classList.toggle('tab-active', tab === 'book');
  document.getElementById('tabMine').classList.toggle('tab-active', tab === 'mine');
  document.getElementById('sectionBook').classList.toggle('hidden', tab !== 'book');
  document.getElementById('sectionMine').classList.toggle('hidden', tab !== 'mine');
  if (tab === 'mine') loadMyAppointments();
}

// ── AUTH MODAL ────────────────────────────────────────────────────────────────

function openPatientAuth(tab) {
  document.getElementById('patientAuthModal').classList.add('show');
  switchPatientTab(tab);
}

function closePatientAuth() {
  document.getElementById('patientAuthModal').classList.remove('show');
  document.getElementById('patientAuthError').classList.add('hidden');
}

function switchPatientTab(tab) {
  const isLogin = tab === 'login';
  document.getElementById('patientLoginForm').classList.toggle('hidden', !isLogin);
  document.getElementById('patientRegisterForm').classList.toggle('hidden', isLogin);
  document.getElementById('patientTabLogin').classList.toggle('tab-active', isLogin);
  document.getElementById('patientTabRegister').classList.toggle('tab-active', !isLogin);
}

function showAuthError(msg) {
  const el = document.getElementById('patientAuthError');
  el.textContent = msg;
  el.classList.remove('hidden');
}

document.getElementById('patientTabLogin').addEventListener('click', () => switchPatientTab('login'));
document.getElementById('patientTabRegister').addEventListener('click', () => switchPatientTab('register'));

document.getElementById('patientLoginForm').addEventListener('submit', async e => {
  e.preventDefault();
  document.getElementById('patientAuthError').classList.add('hidden');
  const fd = new FormData(e.target);
  try {
    const data = await apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: fd.get('email'), password: fd.get('password') })
    });
    if (data.user.role !== 'patient') {
      showAuthError('Ce compte n\'est pas un compte patient.');
      return;
    }
    setToken(data.token);
    setUser(data.user);
    closePatientAuth();
    document.getElementById('navGuest').style.display = 'none';
    document.getElementById('navUser').style.display = 'flex';
    document.getElementById('userName').textContent = data.user.full_name;
    showToast('Connecté avec succès !');
  } catch (err) { showAuthError(err.message); }
});

document.getElementById('patientRegisterForm').addEventListener('submit', async e => {
  e.preventDefault();
  document.getElementById('patientAuthError').classList.add('hidden');
  const fd = new FormData(e.target);
  try {
    const data = await apiFetch('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        full_name: fd.get('full_name'),
        email: fd.get('email'),
        phone: fd.get('phone'),
        password: fd.get('password')
      })
    });
    setToken(data.token);
    setUser(data.user);
    closePatientAuth();
    document.getElementById('navGuest').style.display = 'none';
    document.getElementById('navUser').style.display = 'flex';
    document.getElementById('userName').textContent = data.user.full_name;
    showToast('Compte créé avec succès !');
  } catch (err) { showAuthError(err.message); }
});

// ── BOOKING FLOW ──────────────────────────────────────────────────────────────

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

    document.getElementById('availableSlotsList').innerHTML = availableSlots.map(s =>
      `<span class="px-3 py-1 rounded-lg bg-white border border-slate-200 text-sm text-slate-600">
        📅 ${s.slot_date} &nbsp;⏰ ${s.start_time.slice(0,5)} – ${s.end_time.slice(0,5)}
      </span>`
    ).join('');
    document.getElementById('availableSlotsInfo').classList.remove('hidden');
    document.getElementById('dateTimeSection').classList.remove('hidden');

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
  showVerifyMessage('Créneau disponible ! Vous pouvez confirmer votre demande.', true);
  document.getElementById('bookForm').classList.remove('hidden');
  document.getElementById('guestFields').style.display = getUser() ? 'none' : 'block';
  document.getElementById('formBook').reset();
});

document.getElementById('formBook').addEventListener('submit', async e => {
  e.preventDefault();
  if (!selectedSlot) return;

  const fd = new FormData(e.target);
  const user = getUser();

  const body = {
    slot_id: parseInt(selectedSlot),
    reason: fd.get('reason'),
    consultation_type: fd.get('consultation_type'),
  };

  if (!user) {
    const name = (fd.get('patient_name') || '').trim();
    if (!name) {
      showToast('Veuillez indiquer votre nom', 'error');
      return;
    }
    body.patient_name = name;
    body.patient_phone = (fd.get('patient_phone') || '').trim() || undefined;
  }

  try {
    await apiFetch('/appointments', {
      method: 'POST',
      body: JSON.stringify(body)
    });
    showToast('Demande envoyée avec succès !');
    e.target.reset();
    document.getElementById('bookForm').classList.add('hidden');
    hideVerifyMessage();
    document.getElementById('selSpecialist').dispatchEvent(new Event('change'));
  } catch (err) { showToast(err.message, 'error'); }
});

// ── MY APPOINTMENTS ───────────────────────────────────────────────────────────

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
