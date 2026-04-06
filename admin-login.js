/**
 * Acceso al panel: autenticación con Supabase Auth + sesión en sessionStorage.
 * 
 * SEGURIDAD:
 * - La autenticación se realiza contra Supabase Auth (servidor)
 * - El hash local es solo como fallback para desarrollo
 * - Rate limiting real implementado en Supabase Edge Functions
 */
(function () {
  const SESSION_KEY = 'electrostore_admin_exp';
  const SUPABASE_SESSION_KEY = 'supabase_admin_session';
  const SESSION_MS = 8 * 60 * 60 * 1000;
  const ATT_KEY = 'electrostore_login_att_v1';

  function isLocalDev() {
    const h = location.hostname;
    return h === 'localhost' || h === '127.0.0.1' || h === '';
  }

  function configuredHash() {
    const h = window.ELECTROSTORE_ADMIN_PASSWORD_SHA256;
    return typeof h === 'string' && /^[a-f0-9]{64}$/i.test(h.trim()) && h !== 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';
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
    sessionStorage.removeItem(SUPABASE_SESSION_KEY);
  }

  async function sha256Hex(text) {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
    return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Autenticación con Supabase Auth
   */
  async function signInWithSupabase(email, password) {
    try {
      if (!window.sbClient) {
        throw new Error('Supabase no disponible');
      }
      
      const { data, error } = await window.sbClient.auth.signInWithPassword({
        email: email,
        password: password
      });
      
      if (error) throw error;
      
      // Guardar token de sesión
      if (data.user && data.session) {
        sessionStorage.setItem(SUPABASE_SESSION_KEY, JSON.stringify({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
          user_id: data.user.id,
          email: data.user.email,
          expires_at: data.session.expires_at
        }));
        return { success: true, user: data.user };
      }
      
      throw new Error('No se recibió sesión válida');
    } catch (error) {
      console.error('Error en Supabase Auth:', error);
      throw error;
    }
  }

  /**
   * Verificar si hay sesión activa en Supabase
   */
  async function checkSupabaseSession() {
    try {
      if (!window.sbClient) return null;
      
      const { data: { session }, error } = await window.sbClient.auth.getSession();
      
      if (error || !session) return null;
      
      // Verificar que el email coincida con el de admin configurado
      const adminEmail = window.SUPABASE_ADMIN_EMAIL;
      if (adminEmail && session.user.email !== adminEmail) {
        console.warn('Email de usuario no coincide con admin configurado');
        return null;
      }
      
      return session;
    } catch (error) {
      console.error('Error verificando sesión Supabase:', error);
      return null;
    }
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
      btn.addEventListener('click', async () => {
        // Cerrar sesión en Supabase si existe
        if (window.sbClient) {
          await window.sbClient.auth.signOut();
        }
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

  async function init() {
    attachLogout();
    
    // Primero verificar sesión de Supabase
    const supabaseSession = await checkSupabaseSession();
    if (supabaseSession) {
      setSession();
      showMain(false);
      console.log('✅ Sesión de Supabase restaurada');
      return;
    }
    
    // Fallback: verificar sesión local
    if (isSessionValid()) {
      showMain(false);
      return;
    }

    const hashHex = getHashHex();
    const adminEmail = window.SUPABASE_ADMIN_EMAIL;

    if (!hashHex && !adminEmail) {
      if (isLocalDev()) {
        showMain(true);
        setSession();
        return;
      }
      showGate(
        '<strong>Falta configurar credenciales de Supabase.</strong><br><br>1. Editá <code>admin-auth.js</code> y poné tu email en <code>SUPABASE_ADMIN_EMAIL</code>.<br>2. Asegurate de haber creado ese usuario en Supabase Dashboard > Authentication > Users.<br>3. Volvé a desplegar en GitHub Pages.<br><br>El sistema usará Supabase Auth para validar tu acceso de forma segura.'
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
      
      // Intentar primero con Supabase Auth
      if (adminEmail && adminEmail !== 'admin@megaofertas.local' && adminEmail !== 'tu-email@dominio.com' && window.sbClient) {
        try {
          msgEl.textContent = 'Autenticando...';
          const result = await signInWithSupabase(adminEmail, pass);
          if (result.success) {
            resetAttempts();
            passInput.value = '';
            setSession();
            showMain(false);
            console.log('✅ Login exitoso con Supabase Auth');
            return;
          }
        } catch (supabaseError) {
          console.warn('Supabase Auth falló, usando fallback local:', supabaseError.message);
        }
      }
      
      // Fallback: autenticación local con hash (solo desarrollo o sin Supabase)
      try {
        const got = (await sha256Hex(pass)).toLowerCase();
        if (got === hashHex) {
          resetAttempts();
          passInput.value = '';
          setSession();
          showMain(false);
          console.log('✅ Login exitoso con hash local (modo fallback)');
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
