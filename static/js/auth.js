(function () {
  const user = getUser();
  if (user) {
    if (user.role === 'patient') window.location.href = '/patient';
    else if (user.role === 'specialist') window.location.href = '/specialist';
    else if (user.role === 'admin') window.location.href = '/admin-panel';
  }
})();

function openAuth(tab) {
  document.getElementById('authModal').classList.add('show');
  switchTab(tab);
}

function closeAuth() {
  document.getElementById('authModal').classList.remove('show');
  hideError();
}

function switchTab(tab) {
  const isLogin = tab === 'login';
  document.getElementById('loginForm').classList.toggle('hidden', !isLogin);
  document.getElementById('registerForm').classList.toggle('hidden', isLogin);
  document.getElementById('tabLogin').classList.toggle('tab-active', isLogin);
  document.getElementById('tabRegister').classList.toggle('tab-active', !isLogin);
}

document.getElementById('tabLogin').addEventListener('click', () => switchTab('login'));
document.getElementById('tabRegister').addEventListener('click', () => switchTab('register'));

function showError(msg) {
  const el = document.getElementById('authError');
  el.textContent = msg;
  el.classList.remove('hidden');
}
function hideError() {
  document.getElementById('authError').classList.add('hidden');
}

document.getElementById('loginForm').addEventListener('submit', async e => {
  e.preventDefault();
  hideError();
  const fd = new FormData(e.target);
  try {
    const data = await apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: fd.get('email'), password: fd.get('password') })
    });
    setToken(data.token);
    setUser(data.user);
    if (data.user.role === 'patient') window.location.href = '/patient';
    else if (data.user.role === 'specialist') window.location.href = '/specialist';
    else window.location.href = '/admin-panel';
  } catch (err) {
    showError(err.message);
  }
});

document.getElementById('registerForm').addEventListener('submit', async e => {
  e.preventDefault();
  hideError();
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
    window.location.href = '/patient';
  } catch (err) {
    showError(err.message);
  }
});
