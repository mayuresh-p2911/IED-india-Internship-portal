// ═══════════════════════════════════════════════════════════
// IED India IMS — Auth Module
// ═══════════════════════════════════════════════════════════

const Auth = (() => {
  let _user = null;
  let _token = null;

  const init = () => {
    _token = localStorage.getItem('ied_token');
    const userStr = localStorage.getItem('ied_user');
    if (userStr) { try { _user = JSON.parse(userStr); } catch { _user = null; } }
  };

  const login = async (email, password) => {
    const data = await API.post('/auth/login', { email, password });
    _token = data.token;
    _user = data.user;
    localStorage.setItem('ied_token', _token);
    localStorage.setItem('ied_user', JSON.stringify(_user));
    return _user;
  };

  const register = async (userData) => {
    const data = await API.post('/auth/register', userData);
    _token = data.token;
    _user = data.user;
    localStorage.setItem('ied_token', _token);
    localStorage.setItem('ied_user', JSON.stringify(_user));
    return _user;
  };

  const logout = () => {
    _token = null; _user = null;
    localStorage.removeItem('ied_token');
    localStorage.removeItem('ied_user');
    window.location.reload();
  };

  const isAuthenticated = () => !!_token && !!_user;

  const refreshUser = async () => {
    try {
      const data = await API.get('/auth/me');
      _user = data.user;
      localStorage.setItem('ied_user', JSON.stringify(_user));
    } catch { logout(); }
  };

  return {
    init, login, register, logout, isAuthenticated, refreshUser,
    get user() { return _user; },
    set user(u) { _user = u; localStorage.setItem('ied_user', JSON.stringify(u)); },
    get token() { return _token; },
    get role() { return _user?.role; },
    is: (...roles) => roles.includes(_user?.role)
  };
})();

window.Auth = Auth;

// Captcha State
let isCaptchaVerified = false;
let isCaptchaVerifying = false;

const resetCaptcha = () => {
  isCaptchaVerified = false;
  isCaptchaVerifying = false;
  const checkbox = document.getElementById('captcha-checkbox');
  if (checkbox) {
    checkbox.innerHTML = '';
    checkbox.style.background = '#ffffff';
    checkbox.style.borderColor = 'rgba(255,255,255,0.2)';
  }
};

// Handle Captcha Click
const captchaTrigger = document.getElementById('captcha-trigger');
if (captchaTrigger) {
  captchaTrigger.addEventListener('click', () => {
    if (isCaptchaVerified || isCaptchaVerifying) return;

    isCaptchaVerifying = true;
    const checkbox = document.getElementById('captcha-checkbox');
    checkbox.style.background = 'transparent';
    checkbox.innerHTML = '<div class="spinner" style="width: 14px; height: 14px; border: 2px solid var(--accent-blue); border-top-color: transparent; border-radius: 50%; animation: spin 0.8s linear infinite;"></div>';

    setTimeout(() => {
      isCaptchaVerified = true;
      isCaptchaVerifying = false;
      checkbox.style.background = '#00e676';
      checkbox.style.borderColor = '#00e676';
      checkbox.innerHTML = '<i data-lucide="check" style="width: 16px; height: 16px; color: white;"></i>';
      lucide.createIcons();
    }, 1000);
  });
}

// ── Login Form ────────────────────────────────────────────
document.getElementById('login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = document.getElementById('login-btn');
  const errEl = document.getElementById('login-error');
  errEl.classList.add('hidden');

  if (!isCaptchaVerified) {
    errEl.textContent = 'Please verify that you are not a robot.';
    errEl.classList.remove('hidden');
    return;
  }

  btn.disabled = true; btn.innerHTML = '<div class="spinner" style="width:20px;height:20px;border-width:2px"></div>';
  try {
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    await Auth.login(email, password);
    window.App.boot();
  } catch (err) {
    errEl.textContent = err.message || 'Login failed. Check your credentials.';
    errEl.classList.remove('hidden');
    // Optional: reset captcha on failed login attempt
    resetCaptcha();
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<span>Sign In</span><i data-lucide="arrow-right"></i>';
    lucide.createIcons();
  }
});


// ── Signup Form ───────────────────────────────────────────
document.getElementById('signup-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = document.getElementById('signup-btn');
  const errEl = document.getElementById('signup-error');
  errEl.classList.add('hidden');
  btn.disabled = true; btn.innerHTML = '<div class="spinner" style="width:20px;height:20px;border-width:2px"></div>';
  try {
    const userData = {
      name: document.getElementById('signup-name').value,
      email: document.getElementById('signup-email').value,
      password: document.getElementById('signup-password').value,
      phone: document.getElementById('signup-phone').value,
      college: document.getElementById('signup-college').value,
      department: document.getElementById('signup-department').value,
    };
    await Auth.register(userData);
    window.App.boot();
  } catch (err) {
    errEl.textContent = err.message || 'Registration failed. Please try again.';
    errEl.classList.remove('hidden');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<span>Create Account</span><i data-lucide="arrow-right"></i>';
    lucide.createIcons();
  }
});

// Demo credential buttons
document.querySelectorAll('.demo-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.getElementById('login-email').value = btn.dataset.email;
    document.getElementById('login-password').value = btn.dataset.pass;
  });
});

// Toggle password visibility
document.getElementById('toggle-pass').addEventListener('click', () => {
  const input = document.getElementById('login-password');
  const icon = document.querySelector('#toggle-pass i');
  input.type = input.type === 'password' ? 'text' : 'password';
  icon.setAttribute('data-lucide', input.type === 'password' ? 'eye' : 'eye-off');
  lucide.createIcons();
});

// ── Page Navigation (Login / Signup / Apply) ──────────────
document.getElementById('show-signup')?.addEventListener('click', (e) => {
  e.preventDefault();
  resetCaptcha();
  document.getElementById('login-page').classList.add('hidden');
  document.getElementById('signup-page').classList.remove('hidden');
  lucide.createIcons();
});

document.getElementById('back-to-login-from-signup').addEventListener('click', (e) => {
  e.preventDefault();
  resetCaptcha();
  document.getElementById('signup-page').classList.add('hidden');
  document.getElementById('login-page').classList.remove('hidden');
  lucide.createIcons();
});

document.getElementById('show-apply').addEventListener('click', (e) => {
  e.preventDefault();
  resetCaptcha();
  document.getElementById('login-page').classList.add('hidden');
  document.getElementById('apply-page').classList.remove('hidden');
});

document.getElementById('back-to-login').addEventListener('click', () => {
  resetCaptcha();
  document.getElementById('apply-page').classList.add('hidden');
  document.getElementById('login-page').classList.remove('hidden');
});

// Public application form submission
document.getElementById('apply-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const msgEl = document.getElementById('apply-msg');
  const btn = e.target.querySelector('[type="submit"]');
  btn.disabled = true; btn.textContent = 'Submitting...';
  try {
    const fd = new FormData(e.target);
    await fetch('/api/applications', { method: 'POST', body: fd });
    msgEl.innerHTML = '<div class="toast success" style="position:static;animation:none">Application submitted successfully! We will get back to you soon.</div>';
    msgEl.classList.remove('hidden');
    e.target.reset();
  } catch (err) {
    msgEl.innerHTML = `<div class="error-msg">${err.message}</div>`;
    msgEl.classList.remove('hidden');
  } finally {
    btn.disabled = false; btn.innerHTML = 'Submit Application <i data-lucide="send"></i>';
    lucide.createIcons();
  }
});
