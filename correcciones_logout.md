# 🔧 Correcciones del Bug de Auto-Deslogueo — Proyecto INSPIRA

**Fecha:** 5 de junio de 2026
**Archivos modificados:** `src/App.tsx`, `src/services/userService.ts`
**Estado:** ✅ Correcciones aplicadas, compiladas y validadas (`npm run lint` + `npm run build` OK).

---

## 🎯 Objetivo

Eliminar el **auto-deslogueo** que ocurría al re-loguearse o cuando Firestore respondía lento/fallaba. El problema NO era falta de datos en `localStorage`, sino que la app **borraba el propio token de sesión de Firebase** (`localStorage.clear()`) y, además, dejaba la carga (`authLoading`) colgada hasta disparar un timer destructivo.

---

## ✅ Cambios realizados

### 1. `src/App.tsx`

#### a) Helpers nuevos a nivel de módulo
Se agregaron utilidades para manejar `localStorage` de forma **selectiva** y cachear el perfil:

- **`APP_LOCAL_STORAGE_KEYS`**: lista blanca de claves propias de la app que sí se pueden borrar (`inspira_cached_profile`, `inspira_auth`, `inspira_user`, `inspira_theme`, `last_weekly_update_seen`, `pending_audio_id`). **Nunca** incluye las claves `firebase:authUser:*`.
- **`clearAppLocalStorage()`**: borra **solo** esas claves con `localStorage.removeItem()`. Reemplaza al peligroso `localStorage.clear()`.
- **`cacheUserProfile(profile)`**: guarda el último perfil resuelto en `inspira_cached_profile`.
- **`readCachedProfile(uid)`**: recupera el perfil cacheado (validando que el `id` coincida) para usarlo como respaldo offline.

#### b) Timer de emergencia — YA NO destruye la sesión
**Antes** (causa directa del bug):
```ts
emergencyTimer = setTimeout(() => {
  localStorage.clear();      // ← borraba el token de Firebase
  window.location.reload();  // ← recarga → onAuthStateChanged(null) → deslogueo
}, 15000);
```
**Ahora**:
```ts
emergencyTimer = setTimeout(() => {
  console.warn('[Auth] Carga demasiado lenta; liberando authLoading sin destruir la sesión.');
  setAuthLoading(false);     // ← solo libera la carga; la sesión queda intacta
}, 15000);
```

#### c) Handler `onAuthStateChanged` — sin bloqueos y con fallback inteligente
- **Lectura del perfil:** se eliminó el `Promise.race` manual (ahora el timeout vive dentro de `userService.getUser`).
- **Escritura del patch (`updateUser`)**: ahora se ejecuta en **segundo plano (sin `await`)** con `.catch()`. Aunque el canal *Write* de Firestore se cuelgue, `authLoading` **nunca** queda bloqueado (se eliminó la Causa C).
- **Creación de usuario nuevo (`createUser`)**: también en segundo plano, sin bloquear la resolución de auth.
- **Caché del perfil**: cada vez que se resuelve un usuario (`applyResolvedUser`) se guarda en `localStorage` como respaldo.
- **Documento ausente**: antes de crear un usuario nuevo, se revisa si hay un perfil cacheado con `onboardingCompleted: true` para **no reenviar al formulario** a un usuario que ya lo completó.
- **Fallback ante error de red**: en vez de crear un usuario con `onboardingCompleted: false`, ahora se usa el **perfil cacheado** (preservando `onboardingCompleted`). Solo si no hay caché se muestra un perfil mínimo, y el mensaje aclara que **la sesión sigue activa**. **Nunca** se hace logout.

#### d) `handleLogout` — limpieza selectiva
**Antes:** `localStorage.clear()` → borraba todo, incluido el token de Firebase.
**Ahora:** `clearAppLocalStorage()` → `signOut(auth)` se encarga del token de Firebase y solo se borran las claves propias de la app.

### 2. `src/services/userService.ts`

#### a) `getDoc` en lugar de `getDocFromServer`
**Antes:** `getDocFromServer(docRef)` forzaba ida y vuelta al servidor e **ignoraba la caché**, haciendo el login frágil ante problemas de red.
**Ahora:** `getDoc(docRef)` usa la **caché local como respaldo automático** (si el servidor no responde y hay datos cacheados, los devuelve). Se reporta el origen del dato (`caché local` vs `servidor`).

#### b) Helper `withTimeout(promise, ms, label)`
Envuelve cualquier promesa de Firestore en un timeout para que **nunca** se quede colgada:
- `getUser`: timeout de **8 s**.
- `updateUser`: timeout de **8 s**.

#### c) Manejo de errores que distingue "no existe" de "error de red"
- Si el documento **no existe** → devuelve `null` (la capa superior decide crear usuario).
- Si hubo **error de red/timeout** → **lanza un error limpio** (sin pasar por `handleFirestoreError`, que relanzaba), para que `App.tsx` use el perfil cacheado en su `catch`.
- Esto evita crear un "usuario temporal" innecesariamente y asegura que un usuario existente se cargue correctamente.

---

## 🔄 Lógica final garantizada

1. El usuario inicia sesión → **Firebase Auth** funciona (token intacto en `localStorage`).
2. Se busca el perfil en **Firestore** con `getUser` (caché + servidor, con timeout de 8 s).
3. Si el perfil existe y tiene `onboardingCompleted: true` (o es Admin) → **dashboard**.
4. Si el perfil existe pero **sin** `onboardingCompleted` → **formulario de onboarding**.
5. Si Firestore falla → se usa el **perfil cacheado** (preservando `onboardingCompleted`); si no hay caché, se muestra un perfil mínimo **sin cerrar sesión**.
6. **NUNCA** se hace logout automático por errores de red, ni se borra el token de Firebase, ni se recarga la página.

---

## 🧪 Validación

| Comprobación | Comando | Resultado |
|--------------|---------|-----------|
| Tipado / lint | `npm run lint` (`tsc --noEmit`) | ✅ Sin errores |
| Build de producción | `npm run build` | ✅ Compila correctamente |
| `localStorage.clear()` en código | `grep` | ✅ Eliminado (solo queda en comentarios explicativos) |
| `getDocFromServer` en uso | `grep` | ✅ Eliminado del flujo (solo en comentario) |

---

## 📌 Nota de fondo (no es código)

Los errores de canal `Write`/`Listen` (CORS) que se ven en consola indican que conviene verificar que la **Cloud Firestore API**, las **reglas de seguridad** y la configuración del proyecto `inspira-bbe1e` estén operativas. Con estas correcciones, aunque la conexión falle temporalmente, **la app ya no desloguea al usuario**: degrada con gracia usando la caché y mantiene la sesión activa.
