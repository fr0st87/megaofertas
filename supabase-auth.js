/**
 * Autenticación de administrador con Supabase.
 * 
 * Este módulo reemplaza el sistema de autenticación local por uno basado en Supabase.
 * El usuario debe iniciar sesión con su correo y contraseña de Supabase.
 */
(function () {
  const SESSION_KEY = 'electrostore_admin_exp';
  const SESSION_MS = 8 * 60 * 60 * 1000;
  const USER_KEY = 'electrostore_admin_user';

  // Verificar si Supabase está configurado
  function isSupabaseConfigured() {
    const config = window.SUPABASE_CONFIG;
    return config && 
           typeof config.url === 'string' && 
           config.url !== '' && 
           config.url.includes('supabase.co') &&
           typeof config.anonKey === 'string' && 
           config.anonKey !== '' &&
           config.anonKey.length > 20;
  }

  // Inicializar cliente de Supabase
  function getSupabaseClient() {
    if (!window.supabase) {
      console.error('Supabase no está cargado. Asegúrate de incluir el script.');
      return null;
    }
    const config = window.SUPABASE_CONFIG;
    return window.supabase.createClient(config.url, config.anonKey);
  }

  function isLocalDev() {
    const h = location.hostname;
    return h === 'localhost' || h === '127.0.0.1' || h === '';
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
    sessionStorage.removeItem(USER_KEY);
  }

  function saveUser(user) {
    sessionStorage.setItem(USER_KEY, JSON.stringify({
      email: user.email,
      id: user.id
    }));
  }

  function getUser() {
    try {
      const raw = sessionStorage.getItem(USER_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  async function signInWithEmail(email, password) {
    const supabase = getSupabaseClient();
    if (!supabase) {
      throw new Error('Supabase no está configurado correctamente.');
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: password
    });

    if (error) {
      throw error;
    }

    return data.user;
  }

  async function signOut() {
    const supabase = getSupabaseClient();
    if (supabase) {
      await supabase.auth.signOut();
    }
    clearSession();
  }

  // Elementos del DOM
  const gate = document.getElementById('admin-gate');
  const authed = document.getElementById('admin-authed');
  const form = document.getElementById('admin-login-form');
  const emailInput = document.getElementById('admin-login-email');
  const passInput = document.getElementById('admin-login-pass');
  const msgEl = document.getElementById('admin-login-msg');

  function attachLogout() {
    const btn = document.getElementById('admin-logout');
    if (btn && !btn.dataset.bound) {
      btn.dataset.bound = '1';
      btn.addEventListener('click', async () => {
        await signOut();
        location.reload();
      });
    }
  }

  function showMain() {
    gate.classList.add('hidden');
    if (authed) authed.classList.remove('hidden');
    
    // Mostrar información del usuario logueado
    const user = getUser();
    if (user) {
      const userInfo = document.getElementById('admin-user-info');
      if (userInfo) {
        userInfo.textContent = `Conectado como: ${user.email}`;
        userInfo.classList.remove('hidden');
      }
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
      showMain();
      return;
    }

    if (!isSupabaseConfigured()) {
      showGate(
        '<strong>Falta configurar Supabase.</strong><br><br>' +
        'Editá <code>supabase-config.js</code> y agregá la URL y clave de tu proyecto Supabase.<br><br>' +
        'También asegurate de incluir el script de Supabase en <code>admin.html</code>.'
      );
      if (form) form.classList.add('hidden');
      return;
    }

    // Cambiar label de contraseña a email
    if (emailInput) emailInput.closest('.gate-label')?.classList.remove('hidden');
    form.classList.remove('hidden');
    showGate('');

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      msgEl.textContent = '';
      
      const email = emailInput ? emailInput.value.trim() : '';
      const password = passInput.value;

      if (!email) {
        msgEl.textContent = 'Ingresá tu correo electrónico.';
        return;
      }

      if (!password) {
        msgEl.textContent = 'Ingresá la contraseña.';
        return;
      }

      try {
        msgEl.textContent = 'Iniciando sesión...';
        const user = await signInWithEmail(email, password);
        
        if (user) {
          passInput.value = '';
          setSession();
          saveUser(user);
          showMain();
        }
      } catch (err) {
        console.error('Error de autenticación:', err);
        
        let errorMsg = 'Error al iniciar sesión.';
        
        if (err.message) {
          if (err.message.includes('Invalid login credentials')) {
            errorMsg = 'Correo o contraseña incorrectos.';
          } else if (err.message.includes('Email not confirmed')) {
            errorMsg = 'Tu correo no ha sido confirmado. Revisá tu bandeja de entrada.';
          } else if (err.message.includes('Too many requests')) {
            errorMsg = 'Demasiados intentos. Esperá un momento y volvé a intentar.';
          } else {
            errorMsg = err.message;
          }
        }
        
        msgEl.textContent = errorMsg;
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
