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

    // Ouvrir sur le mois actuel (correction 3)
    const now = new Date();
    calendarYear = now.getFullYear();
    calendarMonth = now.getMonth();

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
  const todayYear = today.getFullYear();
  const todayMonth = today.getMonth();
  const isCurrentMonth = calendarYear === todayYear && calendarMonth === todayMonth;

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

    // Correction 3 : dates passées masquées (placeholder vide pour conserver l'alignement)
    if (isPast) {
      gridHtml += '<div></div>';
      continue;
    }

    const hasSlot = availableDates.has(dateStr);
    const isSelected = dateStr === selectedDate;

    if (isSelected) {
      // Date sélectionnée : fond bleu foncé
      gridHtml += `<div class="text-center py-2 text-sm bg-sky-700 text-white rounded-lg font-bold cursor-pointer select-none" onclick="selectCalendarDate('${dateStr}')">${d}</div>`;
    } else if (hasSlot) {
      // Correction 1 : créneau disponible → couleur bleue conservée
      gridHtml += `<div class="text-center py-2 text-sm bg-sky-100 text-sky-800 rounded-lg cursor-pointer hover:bg-sky-200 font-medium select-none" onclick="selectCalendarDate('${dateStr}')">${d}</div>`;
    } else {
      // Correction 1 : jour sans créneau → gris visible (#94a3b8)
      gridHtml += `<div class="text-center py-2 text-sm text-slate-400 rounded-lg select-none">${d}</div>`;
    }
  }

  // Correction 2 : menu déroulant mois
  const monthsHtml = MONTH_NAMES.map((m, i) => {
    const active = i === calendarMonth;
    return `<div class="px-2 py-1 text-xs rounded text-center cursor-pointer select-none ${active ? 'bg-sky-600 text-white font-semibold' : 'text-slate-700 hover:bg-sky-50'}" onclick="calSetMonth(${i})">${m.slice(0, 4)}</div>`;
  }).join('');

  // Correction 2 : menu déroulant année (année courante + 3 ans)
  const baseYear = todayYear;
  const yearsHtml = [baseYear, baseYear + 1, baseYear + 2, baseYear + 3].map(y => {
    const active = y === calendarYear;
    return `<div class="px-4 py-1.5 text-sm cursor-pointer select-none ${active ? 'bg-sky-600 text-white font-semibold' : 'text-slate-700 hover:bg-sky-50'}" onclick="calSetYear(${y})">${y}</div>`;
  }).join('');

  // Correction 3 : flèche gauche désactivée sur le mois actuel
  const prevClass = isCurrentMonth
    ? 'w-8 h-8 rounded-full bg-slate-100 text-slate-300 flex items-center justify-center font-bold text-xl leading-none cursor-not-allowed'
    : 'w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center hover:bg-sky-100 hover:text-sky-700 font-bold text-xl leading-none';

  document.getElementById('calendarGrid').innerHTML = `
    <div class="flex items-center justify-between mb-4">
      <button id="calPrev" type="button" ${isCurrentMonth ? 'disabled' : ''} class="${prevClass}">&#8249;</button>

      <div class="flex items-center gap-1">
        <!-- Correction 2 : bouton mois cliquable -->
        <div class="relative">
          <button id="calMonthBtn" type="button"
            class="font-bold text-slate-700 hover:text-sky-600 px-1.5 py-0.5 rounded hover:bg-sky-50 transition-colors">
            ${MONTH_NAMES[calendarMonth]} <span class="text-slate-400 text-xs">▾</span>
          </button>
          <div id="calMonthMenu" class="hidden absolute top-full left-1/2 -translate-x-1/2 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-50 grid grid-cols-3 gap-1 p-2 w-48">
            ${monthsHtml}
          </div>
        </div>
        <!-- Correction 2 : bouton année cliquable -->
        <div class="relative">
          <button id="calYearBtn" type="button"
            class="font-bold text-slate-700 hover:text-sky-600 px-1.5 py-0.5 rounded hover:bg-sky-50 transition-colors">
            ${calendarYear} <span class="text-slate-400 text-xs">▾</span>
          </button>
          <div id="calYearMenu" class="hidden absolute top-full left-1/2 -translate-x-1/2 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-50 overflow-hidden w-24">
            ${yearsHtml}
          </div>
        </div>
      </div>

      <button id="calNext" type="button"
        class="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center hover:bg-sky-100 hover:text-sky-700 font-bold text-xl leading-none">&#8250;</button>
    </div>
    <div class="grid grid-cols-7 gap-1 mb-2">
      ${DAY_NAMES.map(n => `<div class="text-center text-xs font-semibold text-slate-400 py-1">${n}</div>`).join('')}
    </div>
    <div class="grid grid-cols-7 gap-1">
      ${gridHtml}
    </div>
  `;

  if (!isCurrentMonth) {
    document.getElementById('calPrev').addEventListener('click', () => {
      calendarMonth--;
      if (calendarMonth < 0) { calendarMonth = 11; calendarYear--; }
      renderCalendar();
    });
  }
  document.getElementById('calNext').addEventListener('click', () => {
    calendarMonth++;
    if (calendarMonth > 11) { calendarMonth = 0; calendarYear++; }
    renderCalendar();
  });

  // Correction 2 : toggle menus déroulants
  document.getElementById('calMonthBtn').addEventListener('click', e => {
    e.stopPropagation();
    const menu = document.getElementById('calMonthMenu');
    document.getElementById('calYearMenu').classList.add('hidden');
    menu.classList.toggle('hidden');
  });
  document.getElementById('calYearBtn').addEventListener('click', e => {
    e.stopPropagation();
    const menu = document.getElementById('calYearMenu');
    document.getElementById('calMonthMenu').classList.add('hidden');
    menu.classList.toggle('hidden');
  });

  document.getElementById('calendarSection').classList.remove('hidden');
  renderTimePicker();
}

// Correction 2 : sélection mois depuis le menu déroulant
function calSetMonth(month) {
  const today = new Date();
  // Si retour sur l'année courante avec un mois passé, forcer le mois actuel
  if (calendarYear === today.getFullYear() && month < today.getMonth()) {
    month = today.getMonth();
  }
  calendarMonth = month;
  renderCalendar();
}

// Correction 2 : sélection année depuis le menu déroulant
function calSetYear(year) {
  const today = new Date();
  // Si on sélectionne l'année courante et que le mois est passé, forcer le mois actuel
  if (year === today.getFullYear() && calendarMonth < today.getMonth()) {
    calendarMonth = today.getMonth();
  }
  calendarYear = year;
  renderCalendar();
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

function formatSlotLabel(dateStr, start, end) {
  const [year, month, day] = dateStr.split('-');
  const monthName = MONTH_NAMES[parseInt(month, 10) - 1];
  const [sh, sm] = start.split(':');
  const [eh, em] = end.split(':');
  return `Le ${day} ${monthName} ${year} de ${sh}h${sm} à ${eh}h${em}`;
}

function selectTimeSlot(id, startTime, endTime) {
  selectedSlot = String(id);
  document.getElementById('slotInfo').textContent =
    formatSlotLabel(selectedDate, startTime, endTime);
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
    const data = await apiFetch('/appointments', {
      method: 'POST',
      body: JSON.stringify(body)
    });
    e.target.reset();
    document.getElementById('bookForm').classList.add('hidden');
    document.getElementById('selSpecialist').dispatchEvent(new Event('change'));

    const banner = document.getElementById('bookingSuccessBanner');
    document.getElementById('btnDownloadPdf').href = `/api/appointments/${data.id}/confirmation-pdf`;
    banner.classList.remove('hidden');
    banner.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    showToast('Demande envoyée avec succès !');
  } catch (err) { showToast(err.message, 'error'); }
});

document.getElementById('btnNewBooking').addEventListener('click', () => {
  document.getElementById('bookingSuccessBanner').classList.add('hidden');
});

// Fermer les menus déroulants du calendrier quand on clique ailleurs
document.addEventListener('click', () => {
  document.getElementById('calMonthMenu')?.classList.add('hidden');
  document.getElementById('calYearMenu')?.classList.add('hidden');
});

loadCommunes();
