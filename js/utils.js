/* ============================================================================
   SPORTV — Utilidades de estado y hora de los eventos
   Se cargan antes que app.js / player.js / admin.js. No modifiques este archivo
   salvo para ajustes puntuales en SPORTV_CONFIG (js/config.js).
   ========================================================================== */

// Hora de inicio de un evento (epoch ms) convertida a la hora local del
// visitante para mostrarla en tarjetas.
function formatLocal(ms) {
  if (!ms) return '';
  return new Date(ms).toLocaleString('es-ES', {
    weekday: 'short', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
  });
}

// Calcula el estado de un evento según la hora actual:
//   - sin hora: usa el campo manual (status) o 'HOY'.
//   - con hora: PROXIMO → EN VIVO (desde 5 min antes) → FINALIZADO.
function stateOf(evento) {
  const now = Date.now();
  const hasStart = evento && Number(evento.start) > 0;

  if (!hasStart) {
    return { status: (evento && evento.status) || 'HOY', hasStart: false };
  }

  const start = Number(evento.start);
  const end = start + SPORTV_CONFIG.LIVE_MS;
  const atLive = now >= (start - SPORTV_CONFIG.PRE_ROLL_MS);
  const finished = now > end;

  let status = 'PROXIMO';
  if (finished) status = 'FINALIZADO';
  else if (atLive) status = 'EN VIVO';

  return { status, hasStart: true, start, end, atLive, finished };
}

// Convierte un valor datetime-local (hora Colombia "AAAA-MM-DDTHH:MM") a
// epoch ms en UTC (para guardar). Devuelve null si está vacío.
function colombiaToUTC(wall) {
  if (!wall) return null;
  const m = String(wall).match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/);
  if (!m) return null;
  const [, y, mo, d, h, mi] = m.map(Number);
  // Colombia es UTC-5 → el instante UTC real es hora local + 5.
  return Date.UTC(y, mo - 1, d, h + 5, mi, 0);
}

// Convierte un epoch ms (UTC) a string datetime-local en hora Colombia.
function utcToColombiaInput(ms) {
  if (!ms) return '';
  return new Date(ms - SPORTV_CONFIG.COL_OFFSET_MS).toISOString().slice(0, 16);
}

// Formatea una cantidad de milisegundos como HH:MM:SS (soporta más de 23 h).
function formatHMS(ms) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = String(Math.floor(total / 3600)).padStart(2, '0');
  const m = String(Math.floor((total % 3600) / 60)).padStart(2, '0');
  const s = String(total % 60).padStart(2, '0');
  return `${h}:${m}:${s}`;
}