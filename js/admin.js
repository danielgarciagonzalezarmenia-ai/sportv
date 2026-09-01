/* ============================================================================
   SPORTV — Lógica del panel admin (admin.html)
   Lista, agrega, edita y borra eventos contra el store (Google Sheets).
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  const loginView = document.getElementById('loginView');
  const panelView = document.getElementById('panelView');
  const loginPass = document.getElementById('loginPass');
  const loginError = document.getElementById('loginError');
  const loginBtn = document.getElementById('loginBtn');
  const logoutBtn = document.getElementById('logoutBtn');

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
  const eventList = document.getElementById('eventList');
  const listCount = document.getElementById('listCount');
  const flash = document.getElementById('flash');

  const fallbackImg = 'img/placeholder.svg';
  let events = [];

  const msg = (text, ok = true) => {
    flash.textContent = text;
    flash.className = 'msg show ' + (ok ? 'msg--ok' : 'msg--err');
    setTimeout(() => { flash.className = 'msg'; }, 4000);
  };

  const isLive = (s) => /en vivo|live|directo/i.test(s || '');
  const preview = (e) => e.image || fallbackImg;

  // Sesión (simple, en memoria).
  function checkLogin() {
    const ok = sessionStorage.getItem('spv_admin') === CONFIG.ADMIN_PASS;
    loginView.hidden = ok;
    panelView.hidden = !ok;
    return ok;
  }

  loginBtn.addEventListener('click', () => {
    if (loginPass.value === CONFIG.ADMIN_PASS) {
      sessionStorage.setItem('spv_admin', CONFIG.ADMIN_PASS);
      loginError.classList.remove('show');
      loginPass.value = '';
      load();
    } else {
      loginError.classList.add('show');
    }
  });

  logoutBtn.addEventListener('click', () => {
    sessionStorage.removeItem('spv_admin');
    checkLogin();
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
        : await Store.add({ ...evento, id: 0 }); // el script asigna el id nuevo
      msg(editing ? 'Evento actualizado.' : 'Evento agregado.');
      resetForm();
      renderList();
    } catch (err) {
      console.error(err);
      msg('No se pudo guardar: ' + (CONFIG.GOOGLE_APP_URL ? 'revisa tu conexión/URL.' : 'falta configurar js/config.js.'), false);
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
          <div class="list__item-title">${e.title}</div>
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
      msg(CONFIG.GOOGLE_APP_URL
        ? 'No se pudo conectar con la hoja de Google.'
        : 'Falta tu URL en js/config.js (ver GUIA-ADMIN.md).', false);
    }
  }

  if (!checkLogin()) return;
  load();
});