# SPORTV — Guía de configuración con Firebase

El panel admin ahora usa **Firebase**: **Authentication** para el inicio de
sesión y **Firestore** para guardar los eventos. Ya **no** se usa Google
Apps Script ni una hoja de cálculo. La web pública solo lee (acceso público);
el panel escribe autenticado.

Configúralo **una sola vez**.

---

## Paso 1 — Crear el proyecto en Firebase

1. Ve a <https://console.firebase.google.com/> → **Agregar proyecto**.
2. Ponle un nombre (ej: *Sportv*). Google Analytics: opcional (puedes
   desactivarlo). Pulsa **Crear proyecto**.

## Paso 2 — Registrar una app web

1. En la consola, entra a tu proyecto.
2. Clic en el ícono `</>` (**) Web**) para agregar una app web.
3. Ponle un apodo (ej: *sportv-web*).
4. Registra la app; **copia el bloque de configuración** que Firebase te
   muestra (es parecido a esto):

```js
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "tu-proyecto.firebaseapp.com",
  projectId: "tu-proyecto",
  storageBucket: "tu-proyecto.appspot.com",
  messagingSenderId: "123456",
  appId: "1:123456:web:abc123"
};
```

5. Abre **`js/config.js`** y pega esos valores dentro del objeto `FIREBASE`
   (sin `const firebaseConfig`, solo los campos clave-valor).

```js
const FIREBASE = {
  apiKey: 'AIza...',
  authDomain: 'tu-proyecto.firebaseapp.com',
  projectId: 'tu-proyecto',
  storageBucket: 'tu-proyecto.appspot.com',
  messagingSenderId: '123456',
  appId: '1:123456:web:abc123'
};
```

6. **Quita el bloque de código de la app web** en la consola para no tener
   interferencias si lo copiaste en tu HTML (opcional).

## Paso 3 — Habilitar el inicio de sesión por correo

1. En la consola Firebase: **Compilación → Authentication** → **Sign-in method**.
2. Si te lo pide, elige "Empezar" → activa el proveedor **Correo/Contraseña**.
3. Guarda.

## Paso 4 — Crear la cuenta de administrador

1. En **Authentication → Users → Agregar usuario**.
2. Pon el **correo y contraseña** que usarás para entrar al panel.
   Ejemplo: `admin@tudominio.com` / `UnaClaveSegura123`

## Paso 5 — Crear Firestore y publicar reglas

1. En la consola: **Compilación → Firestore Database → Crear base de datos**.
2. Modo de **producción** (recomendado). Zona: cualquiera (ej. `nam5`).
3. Cuando exista, ve a la pestaña **Reglas**.
4. Reemplaza las reglas por el contenido del archivo **`firestore.rules`**
   de este proyecto y pulsa **Publicar**.

Estas reglas permiten **leer a cualquiera** y **escribir solo a usuarios
autenticados** (los que tú creaste).

## Paso 6 — Comprobar

- Abre **`admin.html`** → entra con el correo/contraseña del **Paso 4**.
  (Ahora es un login real: también funciona con la tecla **Enter**.)
- Agrega un evento: título, deporte, estado y la **URL del iframe**.
- Abre **`index.html`** → el evento aparece como tarjeta.
- Pulsa la tarjeta → se abre **`player.html`** reproduciendo tu iframe.

---

## Notas de seguridad

- **Público lee, el panel escribe.** Las reglas requieren sesión para
  cualquier escritura, así que nadie puede modificar eventos sin entrar.
- La web pública necesita la `apiKey` para leer Firestore; Firebase usa eso
  más las reglas para el control real de acceso, así que tener "expuesto" el
  `apiKey` es normal y seguro en este esquema (las reglas hacen el trabajo).
- Si quieres restringir la escritura a un **único usuario** (más estricto),
  cambia en `firestore.rules` `allow write: if request.auth != null;` por
  `allow write: if request.auth.uid == 'UID_DEL_ADMIN';`, y pon ahí el UID que
  aparece en Authentication → usuario → ID de usuario.

## Subir cambios

Después de modificar `js/config.js` con tus datos, publica:

```
.\subir.ps1 "configurar firebase"
```