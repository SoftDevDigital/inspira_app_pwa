# ESTRUCTURA_FIREBASE.md

## Resumen ejecutivo

Se analizó el código extraído en:

- `/home/ubuntu/inspira_multimedia/inspira_app_pwa`

y la arquitectura actual **sí está preparada para datos reales** en Firestore/Storage, pero hay inconsistencias de configuración y esquemas que explican los fallos reportados (libros, mentorías, fotos Startalent, calendario).

---

## 1) Configuración actual de Firebase

## 1.1 Config runtime (aplicación)

Archivo: `src/services/firebase.ts`

```ts
const firebaseConfig = {
  projectId: 'inspira-bbe1e',
  storageBucket: 'inspira-bbe1e.firebasestorage.app',
  ...
}
```

También `firebase-applet-config.json` apunta a `inspira-bbe1e`.

## 1.2 Config CLI (deploy)

Archivo: `.firebaserc`

```json
{
  "projects": {
    "default": "inspira-app-oficial"
  }
}
```

### Hallazgo crítico
Hay **desalineación de proyectos**:
- App web conectada a: `inspira-bbe1e`
- Deploy CLI por defecto: `inspira-app-oficial`

Si Firestore/Storage se cargan en un proyecto pero la app lee del otro, parecerá que “no carga nada”.

## 1.3 Reglas Firestore

- `firestore.rules` existe y restringe lectura/escritura por auth/admin.
- `firestore-debug.rules` permite read/write a cualquier autenticado (solo debug).

## 1.4 Reglas Storage

No existe `storage.rules` en el repo.

---

## 2) Colecciones Firestore detectadas

Desde `src/services/dbService.ts` y reglas:

- `users`
- `audiobooks`
- `books`
- `speakers`
- `events`
- `config`
- `editorial_calendar`
- `userPlaylists`
- `success_paths`
- `naya_memory`
- `usage_events`
- `payments`
- `talent_notifications`

> Nota: **no existe colección `mentorings`** separada. Las mentorías viven en `audiobooks` con `contentType = 'mentoring'`.

---

## 3) Esquema esperado por colección (multimedia)

## 3.1 `audiobooks` (mentorías + audios generales)

Campos principales (según `types.ts`, normalizador y AdminPanel):

- `id: string`
- `title: string`
- `author: string` (nombre de speaker)
- `description?: string`
- `category?: string`
- `tags?: string[]`
- `duration: number`
- `coverUrl: string`
- `audioUrl: string` (full)
- `previewUrl?: string` (clip gratis)
- `audioFullUrl?: string` (opcional)
- `contentType?: 'mentoring' | 'audiobook'`
- `isPremium?: boolean`
- `plays?: number`
- `weeklyPlays?: number`
- `reproducciones?: number`
- `pendingPlays?: number`
- `isPendingDigest?: boolean`
- `uploadedAt?: string`
- `createdAt?: string`
- `nayaReasoned?: boolean`

Compatibilidades soportadas por normalizador:
- `audio_url`, `cover_url`, `preview_url`, `content_type`, etc.

## 3.2 `books` (audiolibros por etapas)

- `id: string`
- `title: string`
- `author: string`
- `review: string`
- `rating: number`
- `type: string` (ej. `Audiolibro`)
- `category?: string`
- `coverUrl: string`
- `viewCount?: number`
- `isPendingDigest?: boolean`
- `createdAt?: string`
- `etapas?: Array<{ nombre: string; url: string | null }>`

También soporta variantes:
- `stages`, `capitulos`, `etapa1Url`, `etapa2Url`.

## 3.3 `mentorings`

Actualmente **no se usa colección propia**.

Modelo real:
- Guardar en `audiobooks` con:
  - `contentType = 'mentoring'`
  - `audioUrl` (full premium)
  - `previewUrl` (free)
  - `coverUrl`

## 3.4 `speakers` (Startalent)

- `id: string`
- `name: string`
- `role: string`
- `bio: string`
- `photoUrl: string`
- `userEmail?: string`
- `totalPlays?: number`
- `pendingPlays?: number`
- `createdAt?: string`

Compatibilidades soportadas:
- `photo_url`, `fotoUrl`, `avatarUrl`, `email`.

## 3.5 `events`

- `id: string`
- `title: string`
- `description: string`
- `date: string` (ISO)
- `url: string` (Zoom/replay)
- `status: 'live' | 'recorded'`
- `isPendingDigest?: boolean`
- `createdAt?: string`

Compatibilidades soportadas:
- `fecha`, `startDate`, `estado`, `link`, `zoomUrl`.

---

## 4) Rutas actuales de Firebase Storage (según código)

Archivo: `src/services/storageService.ts`

- `uploadAudio(...)` -> `audiobooks/audio/<timestamp>_<name>`
- `uploadCover(...)` -> `audiobooks/covers/<timestamp>_<name>`

### Importante
Hoy se reutiliza `uploadCover` también para:
- portadas de libros
- fotos de speakers

por lo tanto **todo termina mezclado** en `audiobooks/covers/`.

---

## 5) Estructura recomendada de Storage (objetivo limpio)

Se recomienda separar por dominio:

- `mentorings/full/`
- `mentorings/preview/`
- `mentorings/covers/`
- `books/covers/`
- `books/stages/`
- `speakers/photos/`
- `events/assets/` (si luego suben posters/videos)

> Para esto conviene extender `storageService` con funciones específicas y dejar de usar `audiobooks/covers` para todo.

---

## 6) Flujo de carga multimedia desde AdminPanel

## 6.1 Mentorías (`activeTab === 'mentoring'`)

Formulario exige:
- título
- speaker (author)
- categoría
- premium toggle
- prioridad editorial toggle
- archivo audio full
- archivo preview
- portada

Flujo:
1. Sube archivos a Storage (`uploadAudio`/`uploadCover`)
2. Crea/actualiza doc en `audiobooks`
3. Marca `contentType: 'mentoring'`
4. Si prioridad alta, agenda slot en `editorial_calendar`

## 6.2 Audiolibros (`activeTab === 'audiobooks'`)

Formulario:
- título
- autor
- reseña
- portada
- etapa 1 (audio)
- etapa 2 (audio)

Flujo:
1. Sube portada + etapas
2. Crea/actualiza `books` con `etapas[]`

## 6.3 Startalent (`activeTab === 'talent'`)

Formulario:
- name
- role
- userEmail
- bio
- foto

Flujo:
1. Sube foto
2. Crea/actualiza `speakers`

## 6.4 Eventos (`activeTab === 'events'`)

Formulario:
- title
- date
- status
- url
- description

Flujo:
- Crea/actualiza `events` (sin upload de archivos por ahora)

---

## 7) Lógica free vs premium (contenido visible)

## Usuario Gratis

- Mentorías:
  - usa `previewUrl` si existe
  - si no hay preview, se corta a 180s
- Calendario:
  - puede ver detalle del evento, pero al abrir URL muestra modal premium
- Libros/BookDetail/Library/SuccessPath:
  - muestran bloqueo y CTA premium según pantalla

## Usuario Premium

- Acceso completo a `audioUrl` full
- Acceso completo a eventos (abre URL)
- Acceso a libros/etapas y rutas premium

## Bypass especial
- Existe lógica de “pase/cortesía” para reproducir contenido bloqueado en gratis en casos específicos.

---

## 8) Causas probables de los 4 problemas reportados

## 8.1 Libros no cargan

- Datos en Firestore sin `coverUrl` o `etapas` consistentes.
- O cargados en proyecto Firebase distinto (`inspira-app-oficial` vs `inspira-bbe1e`).

## 8.2 Mentorías no cargan

- Registros sin `audioUrl` (App filtra audios sin URL).
- Datos creados con campos alternos y/o proyecto incorrecto.

## 8.3 Fotos Startalent no cargan

- `photoUrl` faltante o inválida.
- En Home aún hay uso de `SPEAKERS` hardcodeado para algunas búsquedas/fotos (`Home.tsx`), no 100% dinámico.

## 8.4 Eventos no aparecen en calendario

- `date` ausente/formato inválido.
- Eventos guardados en otro proyecto de Firebase.
- Registros con nombre de campo alterno no normalizado en origen.

---

## 9) Configuración faltante en Firebase Console (obligatoria)

## 9.1 Unificar proyecto activo

Decidir uno solo (recomendado: el mismo en runtime y CLI) y alinear:
- `src/services/firebase.ts`
- `firebase-applet-config.json`
- `.firebaserc`

## 9.2 Storage Rules

Crear y desplegar reglas de Storage (faltan en repo). Sugerencia:
- lectura: usuarios autenticados
- escritura: solo admin

## 9.3 Completar reglas Firestore para colecciones usadas

`firestore.rules` actualmente no contempla explícitamente algunas colecciones usadas por código:
- `usage_events`
- `payments`
- `talent_notifications`

Agregar `match` con permisos coherentes para evitar errores silenciosos.

## 9.4 Firebase Console: habilitar servicios

- Authentication (Email/Password)
- Firestore Database
- Storage

## 9.5 Deploy config

`firebase.json` sólo tiene `hosting`. Recomendado agregar despliegue de reglas:
- `firestore.rules`
- `storage.rules`

---

## 10) Mapeo de archivos multimedia entregados (propuesta)

Archivos subidos en `/home/ubuntu/Uploads`:

- `COMERCIAL 1 MASTERIZADO.mp3`
- `COMERCIAL 2 MASTERIZADO.mp3`
- `CLIP DEL AUDIO LOS HABITOS HACEN UN NEGOCIO EXITOSO.mpeg`
- `porque el mundo debe conocer mi historia (1).mpeg`
- `Gemini_Generated_Image_3b0dfp3b0dfp3b0d.png`

Uso recomendado:
- Mentoría full -> `COMERCIAL 1 MASTERIZADO.mp3` / `COMERCIAL 2 MASTERIZADO.mp3`
- Preview/clip gratis -> `CLIP DEL AUDIO ...` (si se convierte a audio compatible)
- Portada -> `Gemini_Generated_Image_...png`
- Video de mentoría (`.mpeg`) -> almacenar como asset complementario (si se habilita reproductor de video) o extraer audio para `previewUrl`.

---

## 11) Checklist operativo para dejar multimedia 100% funcional

1. Unificar proyecto Firebase (runtime + CLI)
2. Crear/deploy `storage.rules`
3. Completar/deploy `firestore.rules` para todas las colecciones usadas
4. Cargar contenido real desde AdminPanel con campos obligatorios:
   - `audiobooks`: `title`, `author`, `audioUrl`, `coverUrl`, `contentType`, `isPremium`
   - `books`: `title`, `author`, `coverUrl`, `etapas[]`
   - `speakers`: `name`, `role`, `bio`, `photoUrl`
   - `events`: `title`, `description`, `date`, `url`, `status`
5. Validar con usuarios:
   - Admin: `operaciones@inspiraapps.com`
   - Premium: `alexis.correa026@gmail.com`
   - Free: `userfree@gmail.com`
6. Confirmar en UI:
   - libros cargan
   - mentorías cargan (preview/free y full/premium)
   - fotos de Startalent visibles
   - eventos visibles en calendario
