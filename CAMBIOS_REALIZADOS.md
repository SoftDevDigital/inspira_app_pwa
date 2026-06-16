# CAMBIOS_REALIZADOS.md

## Resumen
Se aplicaron correcciones en el código fuente de **INSPIRA PWA** para atender los 7 problemas reportados, priorizando uso de datos reales de Firestore/Firebase Storage y eliminando dependencias de contenido mock en vistas críticas.

---

## 1) Problema: Carga de libros / audiolibros

### Cambios realizados
- **Archivo:** `src/services/dbService.ts`
- Se agregaron normalizadores robustos para datos Firestore:
  - `normalizeAudioDoc(...)`
  - `normalizeBookDoc(...)`
- Se incorporó inferencia y compatibilidad de campos para estructuras reales/mixtas:
  - Audio: `contentType`, `content_type`, `audioUrl`, `audio_url`, `coverUrl`, `cover_url`, `previewUrl`, etc.
  - Libros: `etapas[]`, `stages[]`, `capitulos[]`, y fallback a `etapa1Url`/`etapa2Url`.
- Se actualizó `audioService.getAudiobooks/subscribeToAudiobooks` y `bookService.getBooks/subscribeToBooks` para usar los normalizadores.

### Impacto
- Se evita que variaciones de esquema en Firestore rompan la visualización.
- Los libros pueden renderizar etapas aunque los campos lleguen con nombres alternativos.

---

## 2) Problema: Mentorías no cargan

### Cambios realizados
- **Archivo:** `src/services/dbService.ts`
- Se añadió `inferContentType(...)` para mapear correctamente valores inconsistentes de `contentType` (por ejemplo: `mentoria`, `mentor`, etc.).
- **Archivo:** `src/components/Home.tsx`
- Se robusteció el filtro de mentorías para contemplar:
  - `contentType === 'mentoring'`
  - o inferencia por `category/tags/title` cuando contienen "mentor".

### Impacto
- Mentorías no dependen de un único valor exacto; cargan con mayor tolerancia a inconsistencias en datos productivos.

---

## 3) Problema: Fotos Startalent

### Cambios realizados
- **Archivos:**
  - `src/components/HallOfFame.tsx`
  - `src/components/StarTalent.tsx`
  - `src/components/StarTalentWall.tsx`
  - `src/services/dbService.ts`
- Se retiró dependencia de `SPEAKERS` y `MOCK_AUDIOS` en estas vistas.
- Se configuró carga dinámica desde props/Firebase.
- Se normalizaron speakers para soportar `photoUrl`, `photo_url`, `fotoUrl`, etc.

### Impacto
- Las fotos y datos de Startalent ahora provienen de Firestore/Storage en lugar de mock local.

---

## 4) Problema: Calendario de eventos

### Cambios realizados
- **Archivo:** `src/components/Calendar.tsx`
- Se eliminó la dependencia a `MOCK_EVENTS`.
- El calendario ahora recibe `events` por props y calcula eventos por día usando fechas reales.
- **Archivo:** `src/App.tsx`
- Se pasa `events={events}` al componente Calendar.

### Impacto
- El calendario refleja eventos reales de la colección `events` en Firestore.

---

## 5) Problema: Diferencia Gratis/Premium para nuevos usuarios

### Cambios realizados
- **Archivo:** `src/App.tsx`
- Se mantuvo la creación de usuarios nuevos en plan **Gratis** por defecto (flujo existente en Login + createUser).
- Se evitó sobreescritura involuntaria en `handleIdentityComplete`:
  - ya no promueve automáticamente a Premium por detección de talento.
  - conserva el plan existente en Firestore (`user.plan || 'Gratis'`).
- Se removió fallback a audios mock en flujos de canje/reproducción (`handleRedeemGift`).

### Impacto
- Se reduce el riesgo de promoción automática de plan por lógica de cliente.
- Nuevos registros conservan comportamiento esperado de plan Gratis por defecto.

---

## 6) Problema: Botón PWA

### Cambios realizados
- **Archivo:** `src/App.tsx`
- `InstallPWA` ahora se renderiza siempre que exista sesión autenticada, incluso durante onboarding (`!isSplashVisible && isAuthenticated`).
- Se conserva la lógica interna del hook (`beforeinstallprompt`, cooldown 7 días, app instalada).

### Impacto
- Mejora consistencia visual del botón/banner PWA para usuarios gratis y premium.

---

## 7) Problema: Eliminar contenido de prueba (sin tocar BD manualmente desde aquí)

### Cambios realizados
- Se documenta que **NO** se modificó ni limpió la BD directamente durante esta corrección.
- Se creó script opcional de soporte administrativo:
  - **Archivo:** `scripts/cleanup-test-data.mjs`
  - Modo seguro por defecto: `--dry-run`
  - Ejecución real: `--execute`

### Uso del script (opcional admin)
```bash
# Simulación (recomendado primero)
FIREBASE_ADMIN_EMAIL="tu_email" FIREBASE_ADMIN_PASSWORD="tu_password" node scripts/cleanup-test-data.mjs --dry-run

# Borrado real
FIREBASE_ADMIN_EMAIL="tu_email" FIREBASE_ADMIN_PASSWORD="tu_password" node scripts/cleanup-test-data.mjs --execute
```

### Qué detecta
Busca marcadores de prueba comunes (ej: `test`, `prueba`, `demo`, `mock`, `Franco`, `Nirvana`, `test no vip`, `test05`, etc.) en:
- `users`
- `speakers`
- `audiobooks`
- `books`
- `events`

---

## Archivos modificados
- `src/services/dbService.ts`
- `src/App.tsx`
- `src/components/Calendar.tsx`
- `src/components/Home.tsx`
- `src/components/Books.tsx`
- `src/components/Library.tsx`
- `src/components/HallOfFame.tsx`
- `src/components/StarTalent.tsx`
- `src/components/StarTalentWall.tsx`
- `scripts/cleanup-test-data.mjs` (nuevo)
- `CAMBIOS_REALIZADOS.md` (nuevo)

---

## Validación ejecutada
- `npm install`
- `npm run build` ✅

Notas de build:
- Existen warnings de chunks grandes y dynamic imports (no bloqueantes).
- La compilación de producción finalizó correctamente.
