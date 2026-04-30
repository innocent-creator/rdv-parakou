function getToken() { return localStorage.getItem('rdv_token'); }
function setToken(t) { localStorage.setItem('rdv_token', t); }
function removeToken() { localStorage.removeItem('rdv_token'); }
function getUser() { const u = localStorage.getItem('rdv_user'); return u ? JSON.parse(u) : null; }
function setUser(u) { localStorage.setItem('rdv_user', JSON.stringify(u)); }
function removeUser() { localStorage.removeItem('rdv_user'); }

async function apiFetch(path, options = {}) {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  if (token) headers['Authorization'] = 'Bearer ' + token;
  const res = await fetch('/api' + path, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw { status: res.status, message: data.error || 'Erreur serveur' };
  return data;
}

async function apiFetchMultipart(path, options = {}) {
  const token = getToken();
  const headers = { ...(options.headers || {}) };
  if (token) headers['Authorization'] = 'Bearer ' + token;
  const res = await fetch('/api' + path, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw { status: res.status, message: data.error || 'Erreur serveur' };
  return data;
}

function showToast(msg, type = 'success') {
  const t = document.createElement('div');
  t.className = 'toast' + (type === 'error' ? ' error' : type === 'success' ? ' success' : '');
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 3500);
}

function logout() {
  removeToken();
  removeUser();
  window.location.href = '/';
}

function statusFr(status) {
  const map = {
    confirmed: 'Confirmé', pending: 'En attente', rejected: 'Rejeté', cancelled: 'Rejeté',
    available: 'Disponible', booked: 'Réservé'
  };
  return map[status] || status;
}
