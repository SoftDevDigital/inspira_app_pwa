# CAMBIOS.md

## 1) Análisis inicial del proyecto

### Stack detectado
- **Framework UI:** React 19 + TypeScript
- **Build tool:** Vite 6
- **Backend/BaaS:** Firebase (Auth, Firestore, Storage)
- **Animaciones/UI:** motion/react, lucide-react
- **Estilos:** CSS + Tailwind (dependencias presentes)

### Estructura principal
- `src/App.tsx`: orquestador global de autenticación, onboarding, navegación por tabs, audio player y modales.
- `src/components/*`: vistas funcionales (Home, Library, Books, Calendar, Login, Onboarding, AdminPanel, etc.).
- `src/services/firebase.ts`: inicialización Firebase y Firestore.
- `src/services/dbService.ts`: capa de acceso a Firestore (users, audiobooks, playlists, config, etc.).
- `src/hooks/*`: hooks de soporte (playlists, gamification).
- `package.json`, `vite.config.ts`, `tsconfig.json`: configuración de proyecto.

### Rutas y navegación detectadas
- No usa React Router tradicional.
- Navegación interna por estado `activeTab` (`home`, `library`, `books`, `calendar`, `chat`, `fame`, `success-path`, etc.).
- Entrada especial por URL compartida:
  - `/audio/:audioId`
  - query param `?pass=<audioId>`

### Servicios mapeados
- `userService`: create/get/update/subscribe de usuarios.
- `audioService`: CRUD y contador de reproducciones.
- `playlistService`: playlists de usuario.
- `speakerService`, `eventService`, `bookService`, `configService`, `successPathService`, `telemetryService`.

---

## 2) Investigación de mejores prácticas aplicadas

### Sesión (Firebase Auth)
- Se debe usar `onAuthStateChanged` como fuente de verdad de sesión.
- Evitar bootstrap duplicado de auth desde `localStorage` que compita con Firebase.
- Configurar persistencia explícita (`browserLocalPersistence`).

### Evitar renderizados/bucles
- Evitar efectos que actualizan estado de auth desde múltiples fuentes simultáneas.
- Reducir efectos que pisan `isAuthenticated/user` por fuera del listener oficial.
- Mostrar login solo cuando `authLoading` termina (evita flicker y estados intermedios).

### OAuth Google
- Manejar `signInWithPopup` + fallback a `signInWithRedirect` si el popup es bloqueado.
- Manejar específicamente `auth/popup-closed-by-user` con mensaje claro.

### Persistencia de datos
- Cada actualización local relevante de usuario debe intentar persistirse en Firestore (con `userService.updateUser`).

---

## 3) Problemas encontrados y causa raíz

### A) Formulario de perfil/onboarding reaparecía
**Causa raíz:**
- Estado de sesión y usuario se inicializaba en más de un flujo (listener Firebase + efecto de carga local), generando sobrescrituras.
- En fallback por conexión inestable se forzaba onboarding sin reutilizar correctamente estado ya completado.

### B) Manejo de sesión defectuoso
**Causa raíz:**
- Mezcla de `localStorage` como “fuente principal” + Firebase Auth.
- `logout` no cerraba sesión real en Firebase (solo limpiaba localStorage + reload).

### C) Login Google inestable
**Causa raíz:**
- Flujo solo con popup; sin fallback para popup bloqueado.
- Lógica de fallback a usuario QA mock (no confiable para producción).

### D) Guardado de información inconsistente
**Causa raíz:**
- Múltiples cambios de usuario se guardaban solo localmente y no en Firestore.

### E) Renders/flujo de navegación inconsistentes
**Causa raíz:**
- Login podía mostrarse antes de que Firebase terminara restaurar sesión.

---

## 4) Correcciones implementadas

### `src/services/firebase.ts`
1. Se agregó persistencia explícita de auth:
   - `setPersistence(auth, browserLocalPersistence)`

### `src/components/Login.tsx`
2. OAuth Google robustecido:
   - `signInWithPopup` + fallback a `signInWithRedirect` en `auth/popup-blocked`.
   - Manejo explícito de `auth/popup-closed-by-user`.
3. Eliminado fallback de usuarios mock QA para login/signup por red.
4. Mensajes de error más precisos para fallas de red/autenticación.

### `src/App.tsx`
5. Reescrito el flujo principal de `onAuthStateChanged`:
   - Firebase es la fuente de verdad de sesión.
   - Normalización de `resolvedUser`.
   - Auto-corrección de `onboardingCompleted` cuando existe `current_rank`.
   - Fallback local más seguro cuando hay error de red.
6. Eliminado bootstrap duplicado de auth en efecto de “Simulate loading user data”.
   - Ese efecto ahora solo carga preferencias no críticas y splash.
7. Mejor experiencia de navegación:
   - Login se renderiza solo cuando `!authLoading`.
   - Se agregó pantalla de “Restaurando sesión...”.
8. `handleLogout` corregido:
   - Ahora usa `signOut(auth)` y limpia estado local sin hard reload.
9. Persistencia de usuario reforzada en Firestore:
   - `handleGiveGift`
   - `handleSharePass`
   - `handleOnPassUsed`
   - lógica de `streak`
   - `daily reset`
   - `handleRetryPermission` / `handlePostponeRetry`
10. Se removió log de render global (`APP RENDERIZANDO`) para reducir ruido.

---

## 5) Validación técnica

### Checks ejecutados
- `npm run lint` ✅
- `npm run build` ✅

### Resultado
- Compilación y tipado correctos.
- Flujo de sesión simplificado y consistente.
- Menor riesgo de reaparición errática del onboarding.
- OAuth Google más resistente a bloqueos de popup.
- Persistencia de datos de usuario mejorada.

---

## 6) Notas de mejora futura (recomendadas)
- Extraer la lógica de sesión/auth a un `AuthProvider` + hook dedicado para reducir complejidad de `App.tsx`.
- Introducir `React.memo/useCallback` selectivamente en componentes de alto costo tras perf profiling.
- Migrar navegación por tabs a router formal para facilitar deep links y guards.
- Revisar warnings de chunk grande en Vite (code splitting por secciones).
