# SPORTV — Guía para configurar el panel admin (Google Sheets)

La web ahora lee y escribe sus eventos en un **Google Sheet** mediante un
**Google Apps Script** (funciona como una mini API). Hace falta configurarlo
**una sola vez**.

Esto es estático y hosteado gratis (vía `subir.ps1` / GitHub Pages). No hay
servidor propio, por eso usamos Google Sheets como base de datos.

---

## Paso 1 — Crear el Google Apps Script

1. Ve a <https://script.google.com/> → botón **Nuevo proyecto**.
2. Reemplaza todo el código que trae por el contenido del archivo
   **`google/Code.gs`** de este proyecto.
3. Dale un nombre al proyecto (ej: *Sportv Eventos*).

## Paso 2 — Publicarlo como Web App

1. En el editor pulsa **Implementar → Nueva implementación**.
2. Tipo de implementación: **Aplicación web**.
3. Configuración:
   - **Descripción**: lo que quieras (ej: "v1").
   - **Ejecutar como**: **Yo** (es tu hoja de cálculo).
   - **Acceso**: **Cualquier usuario**.
4. Pulsa **Implementar**.
5. Te pedirá autorización: pulsa *Permitir* (aunque anuncie que no está
   verificado).
6. Al final copia la **URL del Web App** (termina en `/exec`).

> Google mostrará la pantalla de "Proyecto no verificado / aplicación no
> segura". Es normal para scripts personales. Pulsa **Avanzado → Acceder a
> [tu proyecto]** para completar.

## Paso 3 — Conectar la web

1. Abre **`js/config.js`**.
2. Pega la URL copiada en `GOOGLE_APP_URL` entre comillas:

```js
const CONFIG = {
  GOOGLE_APP_URL: 'https://script.google.com/macros/s/TU_ID/exec',
  ADMIN_PASS: 'admin123'
};
```

3. Guarda.

> Si estabas corriendo la web desde un servidor local, **recarga con Ctrl+F5**
> para saltarte la caché (hay Service Worker + anti-caché).

## Paso 4 — Probar

- Abre **`admin.html`** → entra con la contraseña de `ADMIN_PASS`
  (por defecto `admin123`).
- Agrega un evento: título, deporte, estado, y la **URL del iframe** (el
  *embed* del canal).
- Abre **`index.html`** → verás el evento publicado como tarjeta.
- Pulsa la tarjeta → se abre **`player.html`** reproduciendo tu iframe.

---

## Notas útiles

- **Cambiar contraseña**: edítala en `js/config.js` (`ADMIN_PASS`) **y**
  también en `google/Code.gs` (función `checkPass_`). Deben coincidir.
- **La hoja que se usa** es la que venga "activa" en el spreadsheet vinculado
  al script. Puedes abrirla desde Vínculos de Cloud / Ejecutar para ver/editar
  los eventos a mano si quieres.
- **La URL final quedaría expuesta** (la web pública la necesita para leer).
  Escribir nuevos eventos requiere la contraseña, que se valida en el script.
  Si pones el panel en tu web pública, cualquiera podría *leer* (necesario)
  pero no *escribir* sin contraseña.
- Si un día quieres **ocultar** el panel, no subas `admin.html` con
  `subir.ps1` o protégelo con una página que requiera algo antes de redirigir.