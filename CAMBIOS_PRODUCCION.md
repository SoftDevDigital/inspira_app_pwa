# Cambios para dejar Inspira 100% listo para producción

Estas modificaciones preparan el proyecto para funcionar correctamente en cuanto
**Cloud Firestore sea habilitado** en el proyecto Firebase `inspira-bbe1e`.

## 1. Configuración del proyecto Firebase
- **`.firebaserc`**: ahora apunta al proyecto correcto `inspira-bbe1e`
  (antes apuntaba erróneamente a `inspira-app-oficial`). Esto asegura que
  `firebase deploy` despliegue las reglas en el proyecto que usa la app.
- **`firebase.json`**: se añadió la sección `firestore.rules` para que
  `firebase deploy --only firestore:rules` despliegue `firestore.rules`.

## 2. Gestión de errores clara (`src/services/firestoreErrorHandler.ts`)
- Se reescribió el handler para **dejar de lanzar un JSON crudo** y en su lugar:
  - Detectar el **código** del error (`permission-denied`, `unavailable`,
    `unauthenticated`, `not-found`, `failed-precondition`, etc.).
  - Devolver un **mensaje legible y accionable** (`friendlyMessage`).
  - Caso especial: si **Firestore no está habilitado** en la consola, el mensaje
    indica exactamente qué hacer y enlaza a la consola del proyecto.
  - Registrar logs claros con prefijo `[Firestore][operación] ruta -> mensaje`.

## 3. `src/services/userService.ts`
- `createUser` / `updateUser` ahora **retornan `false`** de forma fiable ante un
  error (antes el throw del handler hacía inalcanzable ese retorno).
- Se expone `getLastUserServiceError()` para que la UI muestre el último error real.
- `getUser` propaga un `Error` con el **mensaje claro** para que `App` lo muestre.

## 4. `src/App.tsx`
- El listener de `onAuthStateChanged` ahora muestra el **motivo específico** del
  fallo de Firestore (no un mensaje genérico) usando el mensaje propagado.
- `handleOnboardingComplete`:
  - Maneja estado de envío (`onboardingSubmitting`) para evitar doble guardado.
  - Muestra el **error real** de Firestore al usuario (`onboardingError`).
  - Logs claros del proceso de guardado y del resultado.
  - Garantiza `onboardingCompleted: true` al persistir el formulario.

## 5. `src/components/OnboardingForm.tsx`
- Validación defensiva de **todos los campos requeridos** (género, rango, país,
  estado, ciudad —incluida la ciudad personalizada—, fecha de nacimiento, teléfono).
- Muestra un **banner de error** (validación o error de Firestore).
- Botón con estado **"GUARDANDO…"** y deshabilitado mientras persiste.

## 6. Reglas de seguridad (`firestore.rules`) — endurecidas para producción
- Se cambió `hasAny([...])` por **`hasOnly([...])`** en la regla de actualización de
  `users`. Esto cierra una **escalada de privilegios**: antes un usuario podía
  modificar `role`/`isAdmin`/`plan` siempre que también tocara un campo permitido.
  Ahora solo puede modificar campos de perfil/gamificación de sí mismo.
- Se añadieron `lastLogin` y `sessionCount` a los campos permitidos del propietario.
- Se reconcilió la regla `create` para usar `plan == 'Gratis'` (coherente con la app).

## Pasos manuales pendientes (en Firebase Console)
1. **Habilitar Cloud Firestore** en el proyecto `inspira-bbe1e`:
   https://console.firebase.google.com/project/inspira-bbe1e/firestore
2. **Desplegar las reglas**: `firebase deploy --only firestore:rules`
3. **Sembrar el documento del super admin** (`users/{uid}` con `role: 'Admin'`)
   manualmente o vía Admin SDK, ya que las reglas (correctamente) no permiten que
   un cliente se autoasigne rol Admin.

## Validación técnica
- `npm run lint` (tsc --noEmit): ✅ sin errores.
- `npm run build` (vite build): ✅ compila correctamente.
