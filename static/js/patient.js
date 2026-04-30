// ── AUTH STATE ────────────────────────────────────────────────────────────────

(function () {
  const user = getUser();
  if (!user) return;
  if (user.role === 'specialist') window.location.href = '/specialist';
  else if (user.role === 'admin') window.location.href = '/admin-panel';
})();

let selectedSlot = null;
let selectedDate = null;
let availableSlots = [];
let specialistsData = [];
let calendarYear = new Date().getFullYear();
let calendarMonth = new Date().getMonth();

const BIO_LIMIT = 180;
const MONTH_NAMES = ['Janvier','Février','Mars','Avril','Mai','Juin',
                     'Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
const DAY_NAMES = ['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'];

// ── CHARGEMENT GÉOGRAPHIQUE ───────────────────────────────────────────────────

async function loadCommunes() {
  try {
    const list = await apiFetch('/communes');
    const sel = document.getElementById('selCommune');
    sel.innerHTML = '<option value="">-- Choisir une commune --</option>' +
      list.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
  } catch (e) { showToast('Erreur chargement communes', 'error'); }
}

document.getElementById('selCommune').addEventListener('change', async e => {
  const id = e.target.value;
  const selVillage = document.getElementById('selVillage');
  selVillage.innerHTML = '<option value="">-- Choisir d\'abord une commune --</option>';
  selVillage.disabled = true;
  document.getElementById('selClinic').innerHTML = '<option value="">-- Choisir d\'abord un village --</option>';
  document.getElementById('selSpecialist').innerHTML = '<option value="">-- Choisir d\'abord une clinique --</option>';
  resetSlots();
  if (!id) return;
  try {
    const villages = await apiFetch(`/communes/${id}/villages`);
    selVillage.innerHTML = '<option value="">-- Choisir un village --</option>' +
      villages.map(v => `<option value="${v.id}">${v.name}</option>`).join('');
    selVillage.disabled = false;
  } catch (e) { showToast('Erreur chargement villages', 'error'); }
});

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
  specialistsData = [];
  resetSlots();
  if (!id) return;
  try {
    specialistsData = await apiFetch(`/clinics/${id}/specialists`);
    document.getElementById('selSpecialist').innerHTML =
      '<option value="">-- Choisir un spécialiste --</option>' +
      specialistsData.map(s =>
        `<option value="${s.id}">${s.full_name} (${s.specialty}) — ${s.free_slots} créneau(x)</option>`
      ).join('');
  } catch (e) { showToast('Erreur chargement spécialistes', 'error'); }
});

// ── BIO SPÉCIALISTE ───────────────────────────────────────────────────────────

function showSpecialistBio(sp) {
  const parts = sp.full_name.trim().split(/\s+/);
  const initials = (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase();
  const avatarEl = document.getElementById('bioAvatar');
  if (sp.photo_url) {
    avatarEl.style.backgroundImage = `url('${sp.photo_url}')`;
    avatarEl.style.backgroundSize = 'cover';
    avatarEl.style.backgroundPosition = 'center';
    avatarEl.textContent = '';
  } else {
    avatarEl.style.backgroundImage = '';
    avatarEl.textContent = initials;
  }
  document.getElementById('bioName').textContent = sp.full_name;
  document.getElementById('bioSpecialty').textContent = sp.specialty;

  const bioText = document.getElementById('bioText');
  const bioToggle = document.getElementById('bioToggle');
  const bio = (sp.bio || '').trim();

  if (!bio) {
    bioText.textContent = 'Aucune biographie disponible pour ce spécialiste.';
    bioText.className = 'text-sm text-slate-400 italic leading-relaxed';
    bioToggle.classList.add('hidden');
  } else if (bio.length > BIO_LIMIT) {
    bioText.textContent = bio.slice(0, BIO_LIMIT) + '…';
    bioText.className = 'text-sm text-slate-600 leading-relaxed';
    bioToggle.textContent = 'Voir plus';
    bioToggle.classList.remove('hidden');
    bioToggle.onclick = () => {
      const collapsed = bioToggle.textContent === 'Voir plus';
      bioText.textContent = collapsed ? bio : bio.slice(0, BIO_LIMIT) + '…';
      bioToggle.textContent = collapsed ? 'Voir moins' : 'Voir plus';
    };
  } else {
    bioText.textContent = bio;
    bioText.className = 'text-sm text-slate-600 leading-relaxed';
    bioToggle.classList.add('hidden');
  }

  document.getElementById('specialistBio').classList.remove('hidden');
}

document.getElementById('selSpecialist').addEventListener('change', async e => {
  const id = e.target.value;
  resetSlots();
  if (!id) return;
  const sp = specialistsData.find(s => String(s.id) === id);
  if (sp) showSpecialistBio(sp);
  try {
    const slots = await apiFetch(`/specialists/${id}/slots`);
    availableSlots = slots.filter(s => s.status === 'available');

    if (!availableSlots.length) {
      showToast('Aucun créneau disponible pour ce spécialiste', 'error');
      return;
    }

    // Positionner le calendrier sur le mois du premier créneau disponible
    const firstDate = new Date(availableSlots[0].slot_date + 'T00:00:00');
    calendarYear = firstDate.getFullYear();
    calendarMonth = firstDate.getMonth();

    renderCalendar();
  } catch (e) { showToast('Erreur chargement créneaux', 'error'); }
});

function resetSlots() {
  selectedSlot = null;
  selectedDate = null;
  availableSlots = [];
  document.getElementById('specialistBio').classList.add('hidden');
  document.getElementById('calendarSection').classList.add('hidden');
  document.getElementById('bookForm').classList.add('hidden');
}

// ── CALENDRIER ────────────────────────────────────────────────────────────────

function renderCalendar() {
  const availableDates = new Set(availableSlots.map(s => s.slot_date));

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const firstDay = new Date(calendarYear, calendarMonth, 1);
  const lastDay = new Date(calendarYear, calendarMonth + 1, 0);

  // Semaine commence lundi : 0=Lun … 6=Dim
  let startDow = firstDay.getDay();
  startDow = (startDow + 6) % 7;

  let gridHtml = '';

  for (let i = 0; i < startDow; i++) {
    gridHtml += '<div></div>';
  }

  for (let d = 1; d <= lastDay.getDate(); d++) {
    const dateStr = `${calendarYear}-${String(calendarMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const dayDate = new Date(calendarYear, calendarMonth, d);
    const isPast = dayDate < today;
    const hasSlot = availableDates.has(dateStr);
    const isSelected = dateStr === selectedDate;

    if (isSelected) {
      gridHtml += `<div class="text-center py-2 text-sm bg-sky-700 text-white rounded-lg font-bold cursor-pointer select-none" onclick="selectCalendarDate('${dateStr}')">${d}</div>`;
    } else if (hasSlot && !isPast) {
      gridHtml += `<div class="text-center py-2 text-sm bg-sky-100 text-sky-800 rounded-lg cursor-pointer hover:bg-sky-200 font-medium select-none" onclick="selectCalendarDate('${dateStr}')">${d}</div>`;
    } else {
      gridHtml += `<div class="text-center py-2 text-sm text-slate-300 rounded-lg select-none">${d}</div>`;
    }
  }

  document.getElementById('calendarGrid').innerHTML = `
    <div class="flex items-center justify-between mb-4">
      <button id="calPrev" type="button"
        class="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center hover:bg-sky-100 hover:text-sky-700 font-bold text-xl leading-none">&#8249;</button>
      <span class="font-bold text-slate-700">${MONTH_NAMES[calendarMonth]} ${calendarYear}</span>
      <button id="calNext" type="button"
        class="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center hover:bg-sky-100 hover:text-sky-700 font-bold text-xl leading-none">&#8250;</button>
    </div>
    <div class="grid grid-cols-7 gap-1 mb-2">
      ${DAY_NAMES.map(d => `<div class="text-center text-xs font-semibold text-slate-400 py-1">${d}</div>`).join('')}
    </div>
    <div class="grid grid-cols-7 gap-1">
      ${gridHtml}
    </div>
  `;

  document.getElementById('calPrev').addEventListener('click', () => {
    calendarMonth--;
    if (calendarMonth < 0) { calendarMonth = 11; calendarYear--; }
    renderCalendar();
  });
  document.getElementById('calNext').addEventListener('click', () => {
    calendarMonth++;
    if (calendarMonth > 11) { calendarMonth = 0; calendarYear++; }
    renderCalendar();
  });

  document.getElementById('calendarSection').classList.remove('hidden');
  renderTimePicker();
}

function selectCalendarDate(dateStr) {
  selectedDate = dateStr;
  selectedSlot = null;
  document.getElementById('bookForm').classList.add('hidden');
  renderCalendar();
}

function renderTimePicker() {
  const picker = document.getElementById('timePicker');
  if (!selectedDate) {
    picker.innerHTML = '';
    picker.classList.add('hidden');
    return;
  }

  const slots = availableSlots.filter(s => s.slot_date === selectedDate);
  if (!slots.length) {
    picker.innerHTML = '';
    picker.classList.add('hidden');
    return;
  }

  const buttonsHtml = slots.map(s => {
    const isSelected = selectedSlot === String(s.id);
    const cls = isSelected
      ? 'px-4 py-2 rounded-xl bg-sky-700 text-white font-semibold text-sm'
      : 'px-4 py-2 rounded-xl bg-sky-100 text-sky-800 font-medium text-sm hover:bg-sky-200 cursor-pointer';
    return `<button type="button" class="${cls}"
      onclick="selectTimeSlot(${s.id}, '${s.start_time}', '${s.end_time}')">
      ${s.start_time.slice(0, 5)}–${s.end_time.slice(0, 5)}
    </button>`;
  }).join('');

  picker.innerHTML = `
    <p class="text-sm font-medium text-slate-600 mb-3">Heures disponibles :</p>
    <div class="flex flex-wrap gap-2">${buttonsHtml}</div>
  `;
  picker.classList.remove('hidden');
}

function selectTimeSlot(id, startTime, endTime) {
  selectedSlot = String(id);
  document.getElementById('slotInfo').textContent =
    `${selectedDate} · ${startTime.slice(0, 5)} – ${endTime.slice(0, 5)}`;
  document.getElementById('bookForm').classList.remove('hidden');
  document.getElementById('guestFields').style.display = getUser() ? 'none' : 'block';
  document.getElementById('formBook').reset();
  renderTimePicker();
}

// ── FORMULAIRE DE RÉSERVATION ─────────────────────────────────────────────────

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
    const email = (fd.get('patient_email') || '').trim();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showToast('Veuillez indiquer une adresse email valide', 'error');
      return;
    }
    body.patient_name = name;
    body.patient_phone = (fd.get('patient_phone') || '').trim() || undefined;
    body.patient_email = email;
  }

  try {
    await apiFetch('/appointments', {
      method: 'POST',
      body: JSON.stringify(body)
    });
    showToast('Demande envoyée avec succès !');
    e.target.reset();
    document.getElementById('bookForm').classList.add('hidden');
    document.getElementById('selSpecialist').dispatchEvent(new Event('change'));
  } catch (err) { showToast(err.message, 'error'); }
});

loadCommunes();
