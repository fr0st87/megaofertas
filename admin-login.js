/**
 * Acceso al panel: sesión en sessionStorage, límite de intentos, SHA-256.
 */
(function () {
  const SESSION_KEY = 'electrostore_admin_exp';
  const SESSION_MS = 8 * 60 * 60 * 1000;
  const ATT_KEY = 'electrostore_login_att_v1';

  function isLocalDev() {
    const h = location.hostname;
    return h === 'localhost' || h === '127.0.0.1' || h === '';
  }

  function configuredHash() {
    const h = window.ELECTROSTORE_ADMIN_PASSWORD_SHA256;
    return typeof h === 'string' && /^[a-f0-9]{64}$/i.test(h.trim());
  }

  function getHashHex() {
    return configuredHash() ? window.ELECTROSTORE_ADMIN_PASSWORD_SHA256.trim().toLowerCase() : '';
  }

  function isSessionValid() {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return false;
    const exp = parseInt(raw, 10);
    return !Number.isNaN(exp) && Date.now() < exp;
  }

  function setSession() {
    sessionStorage.setItem(SESSION_KEY, String(Date.now() + SESSION_MS));
  }

  function clearSession() {
    sessionStorage.removeItem(SESSION_KEY);
  }

  async function sha256Hex(text) {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
    return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
  }

  function getAttemptsState() {
    try {
      return JSON.parse(sessionStorage.getItem(ATT_KEY) || '{}') || {};
    } catch {
      return {};
    }
  }

  function canAttempt() {
    const w = 60 * 1000;
    const max = 8;
    const now = Date.now();
    let st = getAttemptsState();
    if (!st.windowStart || now - st.windowStart > w) {
      st = { windowStart: now, count: 0 };
    }
    if (st.count >= max) return { ok: false, waitMs: w - (now - st.windowStart) };
    return { ok: true, st };
  }

  function recordFailedAttempt() {
    const w = 60 * 1000;
    const now = Date.now();
    let st = getAttemptsState();
    if (!st.windowStart || now - st.windowStart > w) {
      st = { windowStart: now, count: 0 };
    }
    st.count += 1;
    sessionStorage.setItem(ATT_KEY, JSON.stringify(st));
  }

  function resetAttempts() {
    sessionStorage.removeItem(ATT_KEY);
  }

  const gate = document.getElementById('admin-gate');
  const authed = document.getElementById('admin-authed');
  const form = document.getElementById('admin-login-form');
  const passInput = document.getElementById('admin-login-pass');
  const msgEl = document.getElementById('admin-login-msg');

  function attachLogout() {
    const btn = document.getElementById('admin-logout');
    if (btn && !btn.dataset.bound) {
      btn.dataset.bound = '1';
      btn.addEventListener('click', () => {
        clearSession();
        location.reload();
      });
    }
  }

  function showMain(devInsecure) {
    gate.classList.add('hidden');
    if (authed) authed.classList.remove('hidden');
    if (devInsecure) {
      const bar = document.getElementById('admin-insecure-banner');
      if (bar) bar.classList.remove('hidden');
    }
    window.dispatchEvent(new CustomEvent('electrostore-admin-auth'));
  }

  function showGate(htmlMessage) {
    gate.classList.remove('hidden');
    if (authed) authed.classList.add('hidden');
    if (htmlMessage) msgEl.innerHTML = htmlMessage;
  }

  function init() {
    attachLogout();
    if (isSessionValid()) {
      showMain(false);
      return;
    }

    const hashHex = getHashHex();

    if (!hashHex) {
      if (isLocalDev()) {
        showMain(true);
        setSession();
        return;
      }
      showGate(
        '<strong>Falta configurar la contraseña.</strong><br><br>Editá <code>admin-auth.js</code> en el repositorio: generá el SHA-256 de tu contraseña con <code>tools/generar-hash.html</code> y pegá el valor en <code>ELECTROSTORE_ADMIN_PASSWORD_SHA256</code>. Volvé a desplegar en GitHub Pages.'
      );
      if (form) form.classList.add('hidden');
      return;
    }

    form.classList.remove('hidden');
    showGate('');

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      msgEl.textContent = '';
      const check = canAttempt();
      if (!check.ok) {
        msgEl.textContent =
          'Demasiados intentos. Esperá ' + Math.ceil(check.waitMs / 1000) + ' segundos.';
        return;
      }
      const pass = passInput.value;
      if (!pass) {
        msgEl.textContent = 'Ingresá la contraseña.';
        return;
      }
      try {
        const got = (await sha256Hex(pass)).toLowerCase();
        if (got === hashHex) {
          resetAttempts();
          passInput.value = '';
          setSession();
          showMain(false);
        } else {
          recordFailedAttempt();
          msgEl.textContent = 'Contraseña incorrecta.';
        }
      } catch (err) {
        msgEl.textContent = 'Tu navegador no permite cifrado (HTTPS o contexto seguro requerido).';
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
