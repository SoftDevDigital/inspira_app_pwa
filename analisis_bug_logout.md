# 🔍 Análisis del Bug de Auto-Deslogueo — Proyecto INSPIRA

**Fecha:** 5 de junio de 2026
**Archivos analizados:** `src/App.tsx`, `src/services/userService.ts`, `src/services/firestoreErrorHandler.ts`, `src/services/firebase.ts`, `src/components/Login.tsx`
**Estado:** Solo análisis — NO se aplicaron correcciones.

---

## 🎯 Resumen ejecutivo (TL;DR)

El auto-deslogueo **NO** se debe a que falten datos en `localStorage`. Es **al revés**: la app está **borrando con `localStorage.clear()` el propio token de sesión de Firebase Auth**, porque Firebase está configurado para guardar la sesión en `localStorage` (`browserLocalPersistence`).

La cadena exacta del bug es:

1. Firebase Auth guarda la sesión en `localStorage` (clave `firebase:authUser:...`).
2. Al re-loguearse, el listener `onAuthStateChanged` intenta leer/escribir el perfil en Firestore.
3. La conexión a Firestore en la nube está fallando/colgándose (errores de canal `Write`/`Listen` visibles en consola).
4. Como la carga (`authLoading`) queda colgada, un **"timer de emergencia"** se dispara a los 15 segundos y ejecuta **`localStorage.clear()` + `window.location.reload()`**.
5. Al borrar `localStorage`, **se elimina el token de sesión de Firebase** → tras el reload, `onAuthStateChanged` se dispara con `null` → **el usuario queda deslogueado automáticamente**.

Es decir: el sistema diseñado para "recuperarse de una carga colgada" es justamente lo que **destruye la sesión**.

---

## 🔴 Causa raíz A (PRINCIPAL): `localStorage.clear()` destruye la sesión de Firebase Auth

### Dónde
- **`src/services/firebase.ts`, líneas 37-41** → Firebase Auth se configura con persistencia en `localStorage`:
```ts
setPersistence(auth, browserLocalPersistence)  // ← guarda el token en localStorage
```
- **`src/App.tsx`, línea 167** (timer de emergencia):
```ts
localStorage.clear();      // ← BORRA el token "firebase:authUser:..."
window.location.reload();
```
- **`src/App.tsx`, línea 1152** (logout):
```ts
localStorage.clear();      // mismo problema, aunque aquí es intencional
```

### Por qué causa el deslogueo
`browserLocalPersistence` significa que Firebase Auth almacena el usuario autenticado en `window.localStorage`, bajo una clave del tipo `firebase:authUser:<apiKey>:[DEFAULT]`. Cualquier `localStorage.clear()` **elimina esa clave** y, por lo tanto, **mata la sesión**. Cuando el timer de emergencia hace `clear()` y recarga, Firebase ya no encuentra el token → `onAuthStateChanged` recibe `null` → la app muestra el login (auto-deslogueo).

---

## 🔴 Causa raíz B: El "timer de emergencia" se dispara y reinicia la app

### Dónde — `src/App.tsx`, líneas 159-172
```ts
useEffect(() => {
  let emergencyTimer: NodeJS.Timeout;
  if (authLoading && !needsOnboarding) {
    emergencyTimer = setTimeout(() => {
      console.warn('Emergency: Auth loading stuck, forcing reset...');
      localStorage.clear();      // ← (ver Causa A)
      window.location.reload();  // ← provoca recarga y pérdida de sesión
    }, 15000);
  }
  return () => clearTimeout(emergencyTimer);
}, [authLoading, needsOnboarding]);
```

### Por qué causa el problema
Este efecto se arma cada vez que `authLoading === true`. Si la resolución de la sesión tarda más de 15 segundos (porque Firestore está lento/colgado), ejecuta el `clear()` + `reload()`. Tras recargar, vuelve a intentar, vuelve a colgarse, vuelve a borrar la sesión → **bucle de "queda cargando y se desloguea"** exactamente como reporta el usuario.

---

## 🔴 Causa raíz C: `await userService.updateUser(...)` SIN timeout deja `authLoading` colgado

### Dónde — `src/App.tsx`, líneas 218-230 (dentro del handler de `onAuthStateChanged`)
```ts
const shouldForceAdmin = isSuperAdmin && (...);
const shouldMarkOnboardingCompleted = !!resolvedUser.current_rank && resolvedUser.onboardingCompleted !== true;

if (shouldForceAdmin || shouldMarkOnboardingCompleted) {
  const patch: Partial<User> = { ... };
  const persisted = await userService.updateUser(firebaseUser.uid, patch);  // ← SIN timeout
  ...
}
```

### Por qué causa el problema
La lectura del perfil (línea 201) está protegida con un `Promise.race` y timeout de 6 s. Pero esta **escritura** (`updateUser`, línea 226) **NO tiene timeout**. Los screenshots muestran que el canal de escritura de Firestore (`WebChannelConnection RPC 'Write'`) está fallando/colgándose. Si esta escritura se cuelga:
- El handler **nunca llega** al bloque `finally { setAuthLoading(false) }` (línea 291-293).
- `authLoading` se queda en `true` indefinidamente.
- A los 15 s se dispara el timer de emergencia (Causa B) → `localStorage.clear()` (Causa A) → **deslogueo**.

---

## 🟠 Causa raíz D: `getDocFromServer` fuerza ida y vuelta al servidor

### Dónde — `src/services/userService.ts`, líneas 70-98 (función `getUser`)
```ts
async getUser(userId: string): Promise<User | null> {
  ...
  const serverSnap = await getDocFromServer(docRef);  // ← fuerza lectura del SERVIDOR, ignora caché
  ...
}
```

### Por qué contribuye
`getDocFromServer` **omite la caché local** y exige una conexión viva con el servidor. Con los problemas de conexión a la nube (CORS / canal Firestore bloqueado que se ven en consola), esta llamada es lenta o falla. Eso:
- Alarga `authLoading` (alimenta las Causas B y C).
- Cuando finalmente falla, cae al bloque `catch` (App.tsx línea 269) que arma un **usuario de fallback con `onboardingCompleted: false`** (ver Causa E).

> Nota: el `catch` interno de `getUser` (líneas 92-96) llama a `handleFirestoreError`, que **vuelve a lanzar** la excepción (`throw new Error(jsonError)` en `firestoreErrorHandler.ts` línea 60). Por eso `getUser` puede propagar el error hacia el handler de auth.

---

## 🟠 Causa raíz E: El fallback manda al usuario de vuelta al onboarding

### Dónde — `src/App.tsx`, líneas 269-290 (bloque `catch` del handler)
```ts
} catch (error: any) {
  const fallbackUser: User = {
    ...
    onboardingCompleted: false,   // ← siempre false, aunque el usuario YA hizo onboarding
  };
  setUser(fallbackUser);
  setIsAuthenticated(true);
  setNeedsOnboarding(!(fallbackUser.role === 'Admin' || fallbackUser.onboardingCompleted === true)); // → true
  setError('No pudimos cargar tu perfil desde Firestore. ...');
}
```

### Por qué causa confusión
Cuando Firestore no responde, el usuario que **ya completó el onboarding** es tratado como si no lo hubiera hecho (`onboardingCompleted: false`) y se le muestra de nuevo el formulario, o ve el error "No se pudo guardar el onboarding en Firestore" (imagen aportada). No usa ningún dato cacheado del perfil real.

---

## 🧭 Diagrama de la cadena del bug

```
Re-login
  │
  ▼
onAuthStateChanged(firebaseUser)  ──►  authLoading = true
  │
  ▼
userService.getUser()  →  getDocFromServer()   (Causa D: lento/falla por conexión a la nube)
  │                                   │
  │ (si "éxito" pero requiere patch)  │ (si falla)
  ▼                                   ▼
updateUser() SIN timeout (Causa C)    catch → fallback onboardingCompleted:false (Causa E)
  │ (se cuelga por canal Write roto)
  ▼
authLoading queda en TRUE  ───────────────────────►  (15 s)
                                                       │
                                                       ▼
                              Timer de emergencia (Causa B)
                                 localStorage.clear()  (Causa A → borra token Firebase)
                                 window.location.reload()
                                                       │
                                                       ▼
                              onAuthStateChanged(null)  →  AUTO-DESLOGUEO  🔴
                                                       │
                                                       └──► (bucle: vuelve a cargar y a desloguear)
```

---

## ✅ Qué debe corregirse (recomendaciones — pendientes de aplicar)

1. **No usar `localStorage.clear()` indiscriminado.** Es la causa directa del deslogueo porque borra el token de Firebase Auth.
   - En el timer de emergencia (línea 167): eliminar el `clear()` por completo, o borrar solo claves propias de la app (p. ej. `inspira_*`), nunca las `firebase:authUser:*`.
   - En `handleLogout` (línea 1152): tras `signOut(auth)`, borrar únicamente claves propias de la app con un prefijo, no todo `localStorage`.

2. **Eliminar o suavizar el timer de emergencia (líneas 159-172).** Como mínimo, que **no** ejecute `localStorage.clear()` ni `window.location.reload()`. Si se quiere un "escape", que solo haga `setAuthLoading(false)` para mostrar el login/un mensaje, sin destruir la sesión.

3. **Poner timeout a `updateUser` en el handler de auth (línea 226).** Envolver la escritura en un `Promise.race` con timeout (como ya se hace con `getUser`), o ejecutarla en segundo plano (sin `await`) para que **nunca** bloquee la resolución de `authLoading`. Garantizar que `setAuthLoading(false)` siempre se alcance.

4. **Revisar `getDocFromServer` (userService.ts línea 76).** Considerar `getDoc` (que usa caché y luego servidor) o un `getDocFromCache` como primer intento con respaldo al servidor, para no depender de una conexión perfecta en cada re-login.

5. **Mejorar el fallback (líneas 272-288).** En lugar de forzar `onboardingCompleted: false`, conservar/usar datos cacheados del perfil real (o el último `onboardingCompleted` conocido) para no reenviar al onboarding a un usuario que ya lo completó.

6. **(Causa de fondo) Resolver la conexión a Firestore en la nube.** Los errores de canal `Write`/`Listen` (CORS) indican que la Cloud Firestore API / reglas / configuración del proyecto `inspira-bbe1e` deben quedar operativas; de lo contrario, las lecturas/escrituras seguirán colgándose y alimentando toda la cadena anterior.

---

## 📌 Conclusión

El auto-deslogueo es causado por la **interacción de cinco piezas**: persistencia de Auth en `localStorage` (A) + timer de emergencia que hace `localStorage.clear()` + reload (B) + una escritura `updateUser` sin timeout que cuelga `authLoading` (C) + `getDocFromServer` que depende de conexión perfecta (D) + un fallback que descarta el perfil real (E).

**La línea más crítica y el "smoking gun" es la 167 de `App.tsx`** (`localStorage.clear()` dentro del timer de emergencia), combinada con `browserLocalPersistence` en `firebase.ts` línea 38: juntas borran la sesión de Firebase y provocan el deslogueo automático.
