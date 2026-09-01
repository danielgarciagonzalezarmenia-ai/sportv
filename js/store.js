/* ============================================================================
   SPORTV — CAPA DE DATOS (Google Sheets vía Apps Script)
   Todas las lecturas/escrituras pasan por aquí. No modifiques este archivo.
   ========================================================================== */

const Store = {
  // Devuelve la lista completa de eventos (array).
  async list() {
    if (!CONFIG.GOOGLE_APP_URL) throw new Error('SinGoogApp');
    const res = await fetch(CONFIG.GOOGLE_APP_URL, { cache: 'no-store' });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return res.json();
  },

  // Envía una acción al script (add / update / delete).
  async send(action, payload) {
    if (!CONFIG.GOOGLE_APP_URL) throw new Error('SinGoogApp');
    const res = await fetch(CONFIG.GOOGLE_APP_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({
        action,
        pass: CONFIG.ADMIN_PASS,
        ...payload
      })
    });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return res.json();
  },

  async add(evento) { return this.send('add', { evento }); },
  async update(evento) { return this.send('update', { evento }); },
  async remove(id) { return this.send('delete', { id }); }
};