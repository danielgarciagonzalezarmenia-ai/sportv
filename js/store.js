/* ============================================================================
   SPORTV — CAPA DE DATOS (Firebase Firestore)
   Todas las lecturas/escrituras pasan por aquí. La portada y el reproductor
   solo leen (acceso público); el panel admin escribe autenticado con Firebase.
   No modifiques este archivo.
   ========================================================================== */

const COL_EVENTS = 'eventos';

const Store = {
  db: null,

  // Prepara la conexión (idempotente).
  init() {
    if (this.db) return this.db;
    if (!window.firebase || !window.firebase.firestore) throw new Error('SinFirebase');
    if (!FIREBASE.apiKey) throw new Error('SinConfFirebase');
    if (!window.__spvApp) window.__spvApp = firebase.initializeApp(FIREBASE);
    this.db = firebase.firestore();
    return this.db;
  },

  // Devuelve todos los eventos ordenados por id.
  async list() {
    const db = this.init();
    const snap = await db.collection(COL_EVENTS).orderBy('id').get();
    return snap.docs
      .map((d) => d.data())
      .filter((e) => e && e.id != null);
  },

  // Calcula el siguiente id numérico disponible.
  async nextId() {
    const snap = await this.init().collection(COL_EVENTS).get();
    let max = 0;
    snap.forEach((d) => {
      const n = Number(d.data().id);
      if (isFinite(n) && n > max) max = n;
    });
    return max + 1;
  },

  // Agrega un evento nuevo (el id numérico se asigna solo).
  async add(evento) {
    const db = this.init();
    const id = await this.nextId();
    await db.collection(COL_EVENTS).add(sanitize({ ...evento, id }));
    return this.list();
  },

  // Actualiza un evento existente (localiza por id numérico).
  async update(evento) {
    const db = this.init();
    const snap = await db.collection(COL_EVENTS).where('id', '==', Number(evento.id)).get();
    const clean = sanitize(evento);
    snap.forEach((doc) => doc.ref.update(clean));
    return this.list();
  },

  // Borra un evento por id numérico.
  async remove(id) {
    const db = this.init();
    const snap = await db.collection(COL_EVENTS).where('id', '==', Number(id)).get();
    snap.forEach((doc) => doc.ref.delete());
    return this.list();
  }
};

// Normaliza los campos del evento (cadenas seguras) antes de guardar.
function sanitize(e) {
  const out = {};
  if (e.id !== undefined) out.id = Number(e.id);
  if (e.title !== undefined) out.title = String(e.title);
  if (e.category !== undefined) out.category = String(e.category);
  if (e.status !== undefined) out.status = String(e.status);
  if (e.embed !== undefined) out.embed = String(e.embed);
  if (e.image !== undefined) out.image = String(e.image);
  return out;
}