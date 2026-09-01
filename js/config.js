/* ============================================================================
   SPORTV — CONFIGURACIÓN FIREBASE
   ============================================================================
   Pega aquí los datos de tu app web de Firebase (Consola Firebase →
   Configuración del proyecto → "Tus apps" → app web). Deja estos campos
   vacíos hasta terminar la configuración (ver GUIA-ADMIN.md).
   ========================================================================== */

const FIREBASE = {
  apiKey: 'AIzaSyDksOPdCP6hXOLnxGdoE5XddzKsRCbqjFI',
  authDomain: 'sportv-a5ca9.firebaseapp.com',
  projectId: 'sportv-a5ca9',
  storageBucket: 'sportv-a5ca9.firebasestorage.app',
  messagingSenderId: '128017262899',
  appId: '1:128017262899:web:2b5ddd16c219fe2706b646'
};

/* ============================================================================
   Configuración del comportamiento de eventos:
   - COL_OFFSET_MS: Colombia es UTC-5 (sin cambio de horario). La hora que
     pongas en el panel es SIEMPRE hora de Colombia.
   - LIVE_MS: duración del evento en vivo (se vuelve "Finalizado" después).
   - PRE_ROLL_MS: cuánto antes de la hora de inicio se descubre la pantalla de
     cuenta regresiva y se muestra el reproductor (5 minutos).
   ========================================================================== */
const SPORTV_CONFIG = {
  COL_OFFSET_MS: 5 * 3600 * 1000,
  LIVE_MS: 3 * 3600 * 1000,
  PRE_ROLL_MS: 5 * 60 * 1000
};