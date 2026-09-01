/* ============================================================================
   SPORTV — Lógica del panel admin (admin.html)
   Login con Firebase Auth + CRUD de eventos en Firestore.
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  // --- Login ---
  const loginView = document.getElementById('loginView');
  const panelView = document.getElementById('panelView');
  const loginForm = document.getElementById('loginForm');
  const loginEmail = document.getElementById('loginEmail');
  const loginPass = document.getElementById('loginPass');
  const loginError = document.getElementById('loginError');
  const loginBtn = document.getElementById('loginBtn');
  const logoutBtn = document.getElementById('logoutBtn');

  // --- Formulario de eventos ---
  const form = document.getElementById('eventForm');
  const formTitle = document.getElementById('formTitle');
  const fldId = document.getElementById('fldId');
  const fldTitle = document.getElementById('fldTitle');
  const fldCategory = document.getElementById('fldCategory');
  const fldStatus = document.getElementById('fldStatus');
  const fldEmbed = document.getElementById('fldEmbed');
  const fldImage = document.getElementById('fldImage');
  const saveBtn = document.getElementById('saveBtn');
  const resetBtn = document.getElementById('resetBtn');

  // --- Lista ---
  const eventList = document.getElementById('eventList');
  const listCount = document.getElementById('listCount');
  const flash = document.getElementById('flash');

  const fallbackImg = 'img/placeholder.svg';
  let events = [];
  let auth = null;

  // Mensaje flash reutilizable.
  const msg = (text, ok = true) => {
    flash.textContent = text;
    flash.className = 'msg show ' + (ok ? 'msg--ok' : 'msg--err');
    setTimeout(() => { flash.className = 'msg'; }, 4000);
  };

  const isLive = (s) => /en vivo|live|directo/i.test(s || '');
  const preview = (e) => e.image || fallbackImg;

  // --- Autenticación Firebase ---
  function ensureAuth() {
    if (!auth) {
      if (!firebase || !firebase.auth) throw new Error('SinFirebase');
      if (!FIREBASE.apiKey) throw new Error('SinConfFirebase');
      firebase.initializeApp(FIREBASE);
      auth = firebase.auth();
    }
    return auth;
  }

  // Estado de sesión: muestra login o panel según haya usuario logueado.
  ensureAuth();
  auth.onAuthStateChanged((user) => {
    const ok = !!user;
    loginView.hidden = ok;
    panelView.hidden = !ok;
    if (ok) load();
  });

  function mapAuthError(err) {
    const code = err && err.code;
    if (code === 'auth/invalid-email') return 'Correo con formato inválido.';
    if (code === 'auth/user-not-found' || code === 'auth/wrong-password' || code === 'auth/invalid-credential') return 'Correo o contraseña incorrectos.';
    if (code === 'auth/too-many-requests') return 'Demasiados intentos. Espera unos minutos y reintenta.';
    if (code === 'auth/network-request-failed') return 'Sin conexión. Revisa tu internet.';
    return 'No se pudo iniciar sesión (' + (err && err.code) + ').';
  }

  loginForm.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    loginError.classList.remove('show');
    loginBtn.disabled = true;
    try {
      await auth.signInWithEmailAndPassword(loginEmail.value.trim(), loginPass.value);
      loginPass.value = '';
    } catch (err) {
      loginError.textContent = mapAuthError(err);
      loginError.classList.add('show');
    } finally {
      loginBtn.disabled = false;
    }
  });

  logoutBtn.addEventListener('click', () => {
    auth.signOut().catch(() => {});
  });

  // --- Formulario ---
  resetBtn.addEventListener('click', resetForm);

  function resetForm() {
    form.reset();
    fldId.value = '';
    formTitle.textContent = 'Nuevo evento';
    saveBtn.textContent = 'Guardar evento';
    fldStatus.value = 'EN VIVO';
  }

  form.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const evento = {
      id: fldId.value ? Number(fldId.value) : null,
      title: fldTitle.value.trim(),
      category: fldCategory.value.trim(),
      status: fldStatus.value,
      embed: fldEmbed.value.trim(),
      image: fldImage.value.trim()
    };
    const editing = !!evento.id;

    try {
      events = editing
        ? await Store.update(evento)
        : await Store.add(evento);
      msg(editing ? 'Evento actualizado.' : 'Evento agregado.');
      resetForm();
      renderList();
    } catch (err) {
      console.error(err);
      msg((err && err.code === 'permission-denied')
        ? 'Sin permisos. Inicia sesión o ajusta las reglas de Firestore.'
        : 'No se pudo guardar el evento.', false);
    }
  });

  // --- Lista ---
  function renderList() {
    listCount.textContent = events.length + ' evento(s)';
    if (!events.length) {
      eventList.innerHTML = '<div class="grid__empty">No hay eventos. Agrega el primero.</div>';
      return;
    }
    eventList.innerHTML = events.map((e) => `
      <div class="list__item">
        <img src="${preview(e)}" alt="" onerror="this.src='${fallbackImg}'">
        <div class="list__item-body">
          <div class="list__item-title">${e.title || ''}</div>
          <div class="list__item-cat">${e.category || 'Deportes'} · <span class="${isLive(e.status) ? 'badge-live' : 'badge-prox'}">${e.status || 'HOY'}</span></div>
        </div>
        <div class="list__actions">
          <button class="btn btn--ghost btn--sm" data-edit="${e.id}" type="button">Editar</button>
          <button class="btn btn--danger btn--sm" data-del="${e.id}" type="button">Borrar</button>
        </div>
      </div>
    `).join('');
  }

  eventList.addEventListener('click', (ev) => {
    const editBtn = ev.target.closest('[data-edit]');
    const delBtn = ev.target.closest('[data-del]');
    if (editBtn) {
      const e = events.find((x) => x.id === Number(editBtn.dataset.edit));
      if (e) fillForm(e);
    } else if (delBtn) {
      confirmDelete(Number(delBtn.dataset.del));
    }
  });

  function fillForm(e) {
    fldId.value = e.id;
    fldTitle.value = e.title || '';
    fldCategory.value = e.category || '';
    fldStatus.value = e.status || 'EN VIVO';
    fldEmbed.value = e.embed || '';
    fldImage.value = e.image || '';
    formTitle.textContent = 'Editar evento';
    saveBtn.textContent = 'Guardar cambios';
    flash.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  async function confirmDelete(id) {
    const e = events.find((x) => x.id === id);
    if (!e) return;
    if (!confirm(`¿Eliminar "${e.title}"?`)) return;
    try {
      events = await Store.remove(id);
      msg('Evento eliminado.');
    } catch (err) {
      console.error(err);
      msg('No se pudo eliminar el evento.', false);
    }
    renderList();
  }

  // --- Carga ---
  async function load() {
    try {
      events = await Store.list();
      renderList();
    } catch (err) {
      console.error(err);
      msg(FIREBASE.apiKey
        ? 'No se pudo conectar con Firestore.'
        : 'Configura Firebase en js/config.js (ver GUIA-ADMIN.md).', false);
    }
  }
});