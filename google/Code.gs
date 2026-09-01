/* ============================================================================
   SPORTV — Google Apps Script (backend del panel admin)
   ----------------------------------------------------------------------------
   Este script convierte tu Google Sheet en una mini API:
     - GET  (visitando la URL)      -> devuelve la lista de eventos en JSON.
     - POST {action:'add'|'update'|'delete', ...} -> escribe en la hoja.

   CÓMO INSTALARLO (una sola vez):
   1. Ve a https://script.google.com/  -> "Nuevo proyecto".
   2. Borra el código que trae y pega TODO este archivo.
   3. Pulsa: Implementar > Nueva implementación.
      - Tipo: "Aplicación web"
      - Ejecutar como: "Yo"
      - Acceso: "Cualquier usuario"
   4. Copia la URL del Web App (termina en /exec) y pégala en js/config.js
      dentro de da variable CONFIG.GOOGLE_APP_URL.
   5. Recarga la web / el panel. Listo.

   NOTA DE "Cualquier usuario": al publicar aparecerá el aviso de Google sin
   verificar. Solo pulsa "acceder de forma no segura" y usa la URL. La
   contraseña (ADMIN_PASS) se valida aquí en el servidor para las escrituras.
   ========================================================================== */

const SHEET_NAME = 'Eventos';
const COLUMNS = ['id', 'title', 'category', 'status', 'embed', 'image'];

// ---------------------------------------------------------------- utilidades
function getSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) {
    sh = ss.insertSheet(SHEET_NAME);
    sh.getRange(1, 1, 1, COLUMNS.length).setValues([COLUMNS])
      .setFontWeight('bold').setBackground('#eeeeee');
  }
  if (sh.getLastRow() === 0) {
    sh.appendRow(COLUMNS);
  }
  return sh;
}

function jsonResponse_(data) {
  const out = ContentService.createTextOutput(JSON.stringify(data));
  out.setMimeType(ContentService.MimeType.JSON);
  return out;
}

function checkPass_(pass) {
  // Ajusta esta contraseña si quieres algo distinto a la de js/config.js.
  return (pass || '') === 'admin123';
}

function nextId_(sh, rows) {
  let max = 0;
  for (let i = 1; i < rows.length; i++) {
    const n = Number(rows[i][0]);
    if (isFinite(n) && n > max) max = n;
  }
  return max + 1;
}

// ---------------------------------------------------------------- lectura
function getEvents_() {
  const sh = getSheet_();
  const values = sh.getDataRange().getValues();
  const events = [];
  for (let i = 1; i < values.length; i++) {
    const row = values[i];
    if (row[0] === '' || row[0] === undefined || row[0] === null) continue;
    const e = {};
    COLUMNS.forEach((c, idx) => { e[c] = row[idx]; });
    e.id = Number(e.id);
    events.push(e);
  }
  return events;
}

// ---------------------------------------------------------------- escritura
function addEvent_(sh, evento) {
  const values = sh.getDataRange().getValues();
  const id = evento.id && evento.id > 0 ? Number(evento.id) : nextId_(sh, values);
  sh.appendRow([
    id,
    evento.title || '',
    evento.category || '',
    evento.status || 'HOY',
    evento.embed || '',
    evento.image || ''
  ]);
  return getEvents_();
}

function updateEvent_(sh, evento) {
  const values = sh.getDataRange().getValues();
  const target = Number(evento.id);
  for (let i = 1; i < values.length; i++) {
    if (Number(values[i][0]) === target) {
      sh.getRange(i + 1, 1, 1, COLUMNS.length).setValues([[
        target,
        evento.title || values[i][1],
        evento.category || values[i][2],
        evento.status || values[i][3],
        evento.embed || values[i][4],
        evento.image || values[i][5]
      ]]);
      break;
    }
  }
  return getEvents_();
}

function deleteEvent_(sh, id) {
  const values = sh.getDataRange().getValues();
  for (let i = 1; i < values.length; i++) {
    if (Number(values[i][0]) === Number(id)) {
      sh.deleteRow(i + 1);
      break;
    }
  }
  return getEvents_();
}

// ---------------------------------------------------------------- endpoints
function doGet() {
  return jsonResponse_(getEvents_());
}

function doPost(e) {
  if (!checkPass_()) {
    throw new Error('Contraseña de administrador inválida.');
  }
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const sh = getSheet_();
    const body = JSON.parse(e.postData.contents);
    const action = body.action;
    if (action === 'add') return jsonResponse_(addEvent_(sh, body.evento));
    if (action === 'update') return jsonResponse_(updateEvent_(sh, body.evento));
    if (action === 'delete') return jsonResponse_(deleteEvent_(sh, body.id));
    throw new Error('Acción no soportada: ' + action);
  } finally {
    lock.releaseLock();
  }
}