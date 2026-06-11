# INSPIRA APP - Documentación Técnica Completa

## 1. ARQUITECTURA Y STACK TECNOLÓGICO

### Frontend
- **Framework**: React 19.0.0 con TypeScript 5.8.2
- **Build Tool**: Vite 6.2.0
- **Estilos**: Tailwind CSS 4.1.14 + CSS personalizado
- **Animaciones**: Motion/React (Framer Motion) 12.23.24
- **Iconos**: Lucide React 0.546.0
- **Gráficos**: Recharts 3.8.1
- **PDF**: jsPDF 4.2.1 + jspdf-autotable 5.0.7

### Backend y Servicios
- **BaaS**: Firebase 12.12.1
  - **Auth**: Autenticación por email/contraseña y Google OAuth
  - **Firestore**: Base de datos NoSQL en tiempo real
  - **Storage**: Almacenamiento de archivos (audios, imágenes, PDFs)
- **AI**: Google Gemini API (@google/genai 1.29.0) para asistente NAYA

### Estructura de Carpetas
```
src/
├── components/           # 29 componentes React
│   ├── AdminPanel.tsx   # Panel de administración completo (228KB)
│   ├── App.tsx          # Orquestador principal (1855 líneas)
│   ├── Login.tsx        # Autenticación
│   ├── OnboardingForm.tsx # Formulario de perfil
│   ├── Home.tsx         # Home principal
│   ├── Library.tsx      # Biblioteca personal
│   ├── AudioPlayer.tsx  # Reproductor de audio
│   ├── NayaChat.tsx     # Chat con IA
│   └── ... (21 componentes más)
├── services/            # Capa de servicios
│   ├── firebase.ts      # Inicialización Firebase
│   ├── dbService.ts     # CRUD Firestore (807 líneas)
│   ├── userService.ts   # Servicio de usuarios (162 líneas)
│   ├── storageService.ts # Subida de archivos
│   └── firestoreErrorHandler.ts # Manejo de errores
├── hooks/               # Custom hooks
│   ├── useUserPlaylists.ts # Playlists del usuario
│   ├── useGamification.ts    # Sistema de medallas
│   └── useGlobalPlaylists.ts # Playlists globales
├── types.ts             # Definiciones de TypeScript (255 líneas)
├── constants.ts         # Datos mock y constantes (336 líneas)
└── constants/medals.ts  # Catálogo de 30 medallas
```

---

## 2. ESTRUCTURA DE BASE DE DATOS (FIRESTORE)

### Colección: `users`
Documento por usuario con estructura:
```typescript
{
  id: string;                    // UID de Firebase Auth
  name: string;                  // Nombre completo
  email: string;                 // Email en minúsculas
  role: 'Admin' | 'User';        // Rol de usuario
  plan: 'Gratis' | 'Premium';    // Plan de suscripción
  subscriptionType?: 'Mensual' | 'Semestral' | 'Anual';
  expiryDate?: string;           // Fecha de expiración ISO
  
  // Perfil completo (Onboarding)
  current_rank?: UserRank;       // Rango actual en la empresa
  gender?: 'Mujer' | 'Hombre' | 'Otros';
  customAddress?: string;        // Cómo dirigirse a la usuaria
  country?: string;
  state?: string;
  city?: string;
  birthDate?: string;            // Fecha de nacimiento
  birthdate?: string;            // Alias para compatibilidad
  phone?: string;                // Teléfono de contacto
  
  // Gamificación
  streakCount?: number;          // Racha de días consecutivos
  lastActiveDate?: string;       // Última actividad
  xp?: number;                   // Puntos de experiencia (minutos)
  unlockedMedalIds: string[];    // IDs de medallas desbloqueadas
  completedAudios: string[];     // IDs de audios completados
  completedBooks?: string[];     // IDs de libros completados
  
  // Sistema de Regalos/Pases
  dailyPassesUsed?: number;      // Pases usados hoy
  lastPassUsageDate?: string;    // Fecha último uso de pase
  regalos_hoy?: number;          // Regalos recibidos hoy
  fecha_ultimo_regalo?: string;  // Fecha último regalo recibido
  
  // Notificaciones
  fcmToken?: string;             // Token Firebase Cloud Messaging
  notificationStatus?: 'granted' | 'denied' | 'postponed';
  lastNotificationPromptDate?: string;
  
  // Metadata
  createdAt: string;             // Fecha de creación ISO
  lastLogin?: string;            // Último login
  onboardingCompleted?: boolean; // Perfil completado
  isAdmin?: boolean;             // Flag de administrador
  permissions?: Permissions;     // Permisos granulares (Admin)
}
```

### Colección: `audiobooks`
```typescript
{
  id: string;
  title: string;                 // Título del audio/libro
  author: string;                // Autor/Star Talent
  tags?: string[];               // Categorías (Ventas, Motivación, etc.)
  description?: string;
  duration: number;              // Duración en segundos
  coverUrl: string;              // URL de portada
  audioUrl: string;              // URL del audio completo
  audioFullUrl?: string;         // URL específica para mentorías
  previewUrl?: string;           // Preview para usuarias gratis
  contentType?: 'audiobook' | 'mentoring';
  isPremium?: boolean;           // Contenido solo Premium
  plays?: number;                // Contador total de reproducciones
  weeklyPlays?: number;          // Reproducciones esta semana
  reproducciones?: number;       // Contador alternativo
  pendingPlays?: number;         // Reproducciones sin pagar (comisiones)
  isPendingDigest?: boolean;     // Pendiente de incluir en digest semanal
  uploadedAt?: string;           // Fecha de subida
  category?: string;
  rating?: number;
  nayaReasoned?: boolean;        // Analizado por IA
}
```

### Colección: `speakers` (Star Talent)
```typescript
{
  id: string;
  name: string;                  // Nombre del talento
  bio: string;                   // Biografía
  photoUrl: string;              // Foto de perfil
  role: string;                  // Título (Directora Nacional Elite)
  userEmail?: string;            // Email vinculado para acceso VIP
  totalPlays?: number;           // Total de reproducciones histórico
  pendingPlays?: number;         // Reproducciones pendientes de pago
  createdAt?: string;
}
```

### Colección: `events`
```typescript
{
  id: string;
  title: string;                 // Título del evento
  description: string;
  date: string;                  // Fecha y hora ISO
  url: string;                   // Link de Zoom
  status: 'live' | 'recorded';  // Estado del evento
  isPendingDigest?: boolean;
  createdAt?: string;
}
```

### Colección: `books`
```typescript
{
  id: string;
  title: string;
  author: string;
  review: string;                // Reseña del libro
  rating: number;                // Calificación 1-5
  coverUrl: string;
  type: string;                  // 'Resumen VIP' | 'Mentoría'
  category?: string;
  viewCount?: number;
  isPendingDigest?: boolean;
  etapas?: BookEtapa[];          // Audiolibros por etapas
  createdAt?: string;
}
```

### Colección: `userPlaylists`
```typescript
{
  id: string;
  userId: string;                // UID del propietario
  name: string;                // Nombre de la playlist
  audioIds: string[];            // IDs de audios incluidos
  bookIds?: string[];            // IDs de libros incluidos
  createdAt: string;
}
```

### Colección: `naya_memory`
```typescript
{
  id: string;
  user_id: string;               // UID de la usuaria
  last_interaction_timestamp: string;
  short_term_context: string[];  // Contexto reciente (últimos mensajes)
  long_term_summary: string;     // Resumen acumulado de la conversación
}
```

### Colección: `success_paths` (Rutas del Éxito)
```typescript
{
  id: string;
  name: string;                  // Nombre de la ruta
  levels: SuccessPathLevel[];   // Niveles Bronce, Plata, Oro
  updatedAt: string;
}

// Subtipo: SuccessPathLevel
{
  id: string;
  title: string;               // "Nivel 1", etc.
  rank: string;                // "Bronce", "Plata", "Oro"
  audioIds: string[];          // Audios recomendados para este nivel
  bookIds: string[];           // Libros recomendados
  description: string;
  color?: string;              // Color hexadecimal del nivel
}
```

### Colección: `editorial_calendar`
```typescript
{
  id: string;
  type: 'weekly_audio' | 'monthly_book';
  contentType: 'mentoring' | 'audiobook' | 'book';
  contentId: string;           // ID del audio/libro destacado
  startDate: string;           // Inicio de la semana/mes ISO
  endDate: string;             // Fin de la semana/mes ISO
  isPriority?: boolean;        // Si es prioritario (desplaza otros)
}
```

### Colección: `config/global`
```typescript
{
  id: 'global';
  whatsappVentas: string;      // Número para ventas Premium
  whatsappSoporte: string;     // Número de soporte técnico
  commissionRate: number;      // MXN/USD por reproducción válida
  bankDetails: {
    banco: string;
    titular: string;
    cuenta: string;
    clabe: string;
  };
  updatedAt?: string;
}
```

### Colección: `payments` (Comisiones)
```typescript
{
  id: string;
  talentId: string;            // ID del talento pagado
  talentName: string;
  amount: number;              // Monto pagado
  playsSettled: number;        // Reproducciones pagadas en esta transacción
  date: string;                // Fecha de pago ISO
}
```

### Colección: `usage_events` (Telemetría)
```typescript
{
  id?: string;
  userId: string;              // Quién usó la herramienta
  toolName: 'Chat Naya (IA)' | 'Audiolibros' | 'Mentorías (Start Talent)' | 'Eventos Zoom';
  timestamp: string;           // Cuándo
  duration?: number;           // Duración en segundos
  contextId?: string;          // audioId, bookId, etc.
}
```

### Colección: `talent_notifications`
```typescript
{
  id: string;
  talentName: string;          // Destinatario
  authorName: string;          // Autor del mensaje
  message: string;
  adminId: string;             // Admin que envió
  adminName: string;
  date: string;
  read: boolean;
  audioTitle?: string;
  rank?: number;
}
```

---

## 3. COMPONENTES DETALLADOS (29 COMPONENTES)

### App.tsx - Orquestador Principal
- **Estado Global**: Maneja autenticación, usuario actual, plan, tabs, audio player
- **Auth Listener**: `onAuthStateChanged` de Firebase como fuente de verdad
- **Real-time Subscriptions**: 7 suscripciones activas a Firestore
- **Lógica de Onboarding**: Detecta si usuaria completó perfil (`onboardingCompleted`)
- **Audio Player Global**: Estados de reproducción, cola, velocidad
- **Gamification**: XP por minuto escuchado, sistema de rachas
- **Gestión de Pases**: Sistema de regalos y cortesías
- **Navegación por Tabs**: `home`, `library`, `books`, `calendar`, `chat`, `fame`, `success-path`, `admin`

### Login.tsx - Autenticación
- **Login con Email**: `signInWithEmailAndPassword`
- **Login con Google**: `signInWithPopup` + fallback `signInWithRedirect` si popup bloqueado (DESHABILITADO ACTUALMENTE)
- **Registro**: `createUserWithEmailAndPassword` + `updateProfile`
- **Recuperación de Contraseña**: `sendPasswordResetEmail`
- **Creación automática en Firestore**: `ensureUserInFirestore()` crea documento de usuario

### OnboardingForm.tsx - Perfil de Usuaria
- **Campos Capturados**:
  - Género (Mujer/Hombre/Otros)
  - Forma de dirigirse (Directora, Líder, etc.)
  - Rango actual (Consultora → Star Talent)
  - País, Estado, Ciudad (con selector dinámico)
  - Fecha de nacimiento (selectores de día, mes, año)
  - Teléfono de contacto
- **Solicitud de Notificaciones**: Permiso de notificaciones push (opcional)
- **Persistencia**: Guarda en Firestore vía `userService.updateUser()`

### Home.tsx - Pantalla Principal (62KB)
- **Header Personalizado**: Saludo según género ("Directora", "Líder")
- **Audio Destacado de la Semana**: Algoritmo `getWeeklyAudio()`
- **Carruseles de Contenido**: Por categoría (Ventas, Motivación, etc.)
- **Banners Promocionales**: Eventos en vivo, suscripción Premium
- **Búsqueda**: Filtro por título, autor, tags
- **Filtros**: Por categoría, tipo (mentoría/audiolibro), gratuito/premium
- **Quick Player**: Mini reproductor en tarjetas
- **Acciones**: Favoritos, agregar a playlist, compartir

### Library.tsx - Biblioteca Personal (33KB)
- **Tabs**: Favoritos, Completados, Playlists, Historial
- **Playlists**: Crear, renombrar, eliminar playlists personales
- **Fila de Audio**: Progreso visual, menú de opciones
- **Grid de Contenido**: Visualización tipo Netflix
- **Empty States**: Mensajes motivacionales cuando no hay contenido

### AudioPlayer.tsx - Reproductor Premium (31KB)
- **Vista Expandida**: Portada grande, título, autor
- **Controles**: Play/Pause, siguiente, anterior, seek
- **Velocidad**: 1x, 1.25x, 1.5x, 2x
- **Cola de Reproducción**: Reordenar, eliminar, saltar
- **Regla del 30% Antifraude**: Solo cuenta reproducción válida si escucha 30%
- **Lógica de Preview**: Gratis = 3 minutos, Premium = completo
- **Background Audio**: Continúa reproduciendo al minimizar

### NayaChat.tsx - Asistente AI (23KB)
- **Integración Gemini**: Google GenAI SDK
- **Memoria de Conversación**: Contexto de últimos 10 mensajes
- **Sistema de Prompts**: Prompt optimizado para mentoría de negocios
- **Presets Rápidos**: "Motivación rápida", "Cierre de ventas", etc.
- **Typing Indicator**: Animación de "Naya está escribiendo..."
- **Persistencia**: Guarda conversación en `naya_memory` Firestore

### Books.tsx - Sección de Libros
- **Grid de Libros**: Portadas con rating
- **Detalle de Libro**: Reseña, autor, botón de lectura
- **Audiolibros por Etapas**: Si tiene `etapas`, muestra reproductor por capítulos

### Calendar.tsx - Eventos
- **Lista de Eventos**: Fecha, título, descripción
- **Estado en Vivo**: Indicador "LIVE" para eventos activos
- **Integración Zoom**: Botón para unirse al evento
- **Recordatorios**: Fechas próximas resaltadas

### HallOfFame.tsx - Top 10
- **Ranking**: Usuarias con más XP/racha
- **Visualización**: Podio con medallas
- **Filtros**: Por rango, por país

### SuccessPath.tsx - Ruta del Éxito
- **Niveles**: Bronce → Plata → Oro
- **Progreso Visual**: Barras de completitud por nivel
- **Contenido Recomendado**: Audios y libros asignados a cada nivel

### Sidebar.tsx - Menú Lateral
- **Perfil**: Foto, nombre, rango, plan
- **Navegación**: Accesos directos a secciones
- **Gamification**: Streak actual, XP total
- **Acciones Premium**: Upgrade, soporte, términos legales

### AdminPanel.tsx - Panel de Administración (228KB)
**Tabs de Administración**:
1. **Dashboard**: Métricas DAU, suscripciones, audios más escuchados
2. **Inventario**: Listado completo de todo el contenido
3. **Usuarios (CRM)**: Tabla con filtros, exportación a PDF, edición de usuarias
4. **Audiolibros**: Subir nuevos libros con portada, reseña, etapas
5. **Mentorías**: Subir audios de mentorías, asignar a Star Talent
6. **Start Talent**: Gestión de talentos, foto, biografía, comisiones
7. **Eventos y Zoom**: Crear/editar eventos, link de Zoom, fechas
8. **Calendario Editorial**: Programar audio semanal/libro mensual destacado
9. **Gestión Top 10**: Configurar ranking de usuarias
10. **Comisiones**: Ver plays pendientes, liquidar pagos a talentos
11. **Rutas del Éxito**: Crear/editar niveles y asignar contenido
12. **Equipo y Staff**: Crear colaboradores con permisos granulares
13. **Configuración**: WhatsApp, comisiones, datos bancarios

---

## 4. SERVICIOS (CAPA DE DATOS)

### firebase.ts - Inicialización
- **Configuración**: Usa `firebase-applet-config.json` o variables de entorno
- **Persistencia**: `browserLocalPersistence` para mantener sesión
- **Firestore**: Inicialización con `experimentalForceLongPolling` opcional
- **Test de Conexión**: `testConnection()` verifica Firestore al inicio

### userService.ts - CRUD de Usuarias
```typescript
createUser(user: User): Promise<boolean>     // Crea documento en Firestore
getUser(userId: string): Promise<User | null>  // Lee desde servidor (con fallback caché)
updateUser(userId: string, updates: Partial<User>): Promise<boolean>  // Actualiza
getAllUsers(): Promise<User[]>             // Lista todas (Admin)
subscribeToUsers(callback): Unsubscribe    // Tiempo real
subscribeToUser(userId, callback): Unsubscribe  // Tiempo real individual
```

### dbService.ts - Servicios Especializados
- **audioService**: CRUD de audios, `incrementPlayCount()` con regla del 30%
- **speakerService**: Gestión de Star Talent
- **eventService**: CRUD de eventos Zoom
- **bookService**: Gestión de libros y etapas
- **playlistService**: CRUD de playlists por usuario
- **configService**: Configuración global
- **commissionService**: Pagos y liquidaciones a talentos
- **editorialService**: Calendario editorial
- **successPathService**: Rutas del éxito
- **telemetryService**: Eventos de uso para analytics
- **nayaMemoryService**: Memoria del chatbot
- **talentNotificationService**: Mensajes a talentos

### storageService.ts - Subida de Archivos
```typescript
uploadAudio(file: File, path: string): Promise<string>     // Subida a Firebase Storage
uploadImage(file: File, path: string): Promise<string>    // Imágenes con compresión
uploadPDF(file: File, path: string): Promise<string>     // Documentos
```

---

## 5. HOOKS PERSONALIZADOS

### useUserPlaylists(userId?)
- Retorna: `{ playlists, loading }`
- Suscripción en tiempo real a playlists del usuario
- Se actualiza automáticamente cuando cambian en Firestore

### useGamification(user, onMedalUnlocked?)
- Retorna: `{ checkMedals }`
- Revisa medallas desbloqueables según progreso de usuaria
- Tipos de trigger:
  - `racha_dias`: Días consecutivos de login
  - `audios_completados`: Cantidad de audios escuchados
  - `compartir_app`: Pases de cortesía usados
  - `ruta_nivel_completado`: Niveles de ruta completados
- Persiste nuevas medallas en Firestore

### useGlobalPlaylists()
- Playlists almacenadas en `localStorage` (fallback local)
- Funciones: `addPlaylist`, `removePlaylist`, `renamePlaylist`, `toggleItemInPlaylist`
- Sincronización entre pestañas vía `window.dispatchEvent`

---

## 6. SISTEMA DE GAMIFICACIÓN

### Niveles de Usuaria (por XP)
| XP | Nivel |
|---|---|
| 0-59 | Mente en Apertura |
| 60-299 | Arquitecta de Hábitos |
| 300-999 | Estratega de Resultados |
| 1000-4999 | Maestría en Liderazgo |
| 5000+ | Referente de Éxito |

### Sistema de Medallas (30 medallas)

**Pilar 1 - Constancia (Racha)**:
- Primer Paso (1 día), Fuego Inicial (3 días), Semana Invencible (7 días), Quincena de Poder (15 días), Mes de Hierro (30 días), Trimestre Imparable (90 días), Leyenda Anual (365 días)

**Pilar 2 - Consumo de Audios**:
- Oído Curioso (1), Mente Abierta (5), Estudiante Estrella (20), Devoradora de Libros (50), Biblioteca Andante (100), Mente Maestra (250), Iluminada (500), Gurú del Audio (1000)

**Pilar 3 - Favoritos**:
- Cazadora de Joyas (1), Coleccionista (5), Curadora (10), Tesorera (25), Bóveda de Sabiduría (50)

**Pilar 4 - Difusión**:
- Evangelista (1), Conectora (5), Influencer (10), Embajadora (25), Líder de Masas (50)

**Pilar 5 - Ruta al Éxito**:
- Rompiendo el Cascarón (Nivel 1), Visión de Plata (2), Mente de Oro (3), Actitud Platino (4), Corona de Diamante (5)

---

## 7. FLUJOS DE AUTENTICACIÓN

### Login Email/Password
1. Usuaria ingresa email y contraseña
2. `signInWithEmailAndPassword(auth, email, password)`
3. `onAuthStateChanged` detecta usuario autenticado
4. `userService.getUser(uid)` busca documento en Firestore
5. Si no existe → `userService.createUser()` crea perfil básico
6. Si `onboardingCompleted === false` → muestra OnboardingForm
7. Si `onboardingCompleted === true` → entra directo a Home

### Login Google (Deshabilitado Actualmente)
1. `signInWithPopup` (o `signInWithRedirect` si popup bloqueado)
2. Mismo flujo que email a partir de paso 3

### Logout
1. `signOut(auth)` cierra sesión Firebase
2. Limpia estado local (`setUser(null)`)
3. Limpia `localStorage`
4. Redirige a pantalla de login

---

## 8. REGLAS DE SEGURIDAD FIRESTORE

### Usuarios (`/users/{userId}`)
```javascript
allow get: if isOwner(userId) || isAdmin();
allow list: if isAdmin();
allow create: if isSignedIn() && userId == request.auth.uid && isValidUser(incoming());
allow update: if isOwner(userId) && (
  affectedKeys.hasAny(['name', 'gender', 'current_rank', 'customAddress', 
    'country', 'state', 'city', 'birthDate', 'phone', 'fcmToken', 
    'notificationStatus', 'onboardingCompleted', 'streakCount', 
    'lastActiveDate', 'xp', 'dailyPassesUsed', 'completedAudios'])
) || isAdmin();
```

### Audiolibros (`/audiobooks/{id}`)
```javascript
allow read: if isSignedIn();
allow write: if isAdmin();
```

### Playlists (`/userPlaylists/{id}`)
```javascript
allow read, write: if isSignedIn() && (resource.data.userId == request.auth.uid);
```

---

## 9. SISTEMA DE SUSCRIPCIÓN Y FREEMIUM

### Plan Gratis
- Acceso a audios gratuitos (marcados `isPremium: false`)
- 3 minutos de preview en audios Premium
- 1 pase de cortesía por día (para escuchar audio completo)
- Acceso a chat con NAYA (con límites)
- Ver eventos pero no unirse a todos

### Plan Premium
- Acceso ilimitado a toda la biblioteca
- 20 pases de regalo diarios para compartir
- Eventos exclusivos
- Sin límites en NAYA
- Soporte prioritario por WhatsApp

### Modelo de Comisiones (Star Talent)
- Comisión por reproducción válida (30% del audio escuchado)
- Sistema de acumulación de `pendingPlays`
- Panel de liquidación en Admin
- Exportación de pagos a PDF

---

## 10. FLUJOS DE DATOS CLAVE

### Flujo de Audio
1. Admin sube audio en AdminPanel → Firebase Storage
2. Metadatos guardados en `audiobooks` collection
3. Usuaria ve audio en Home/Library
4. Al reproducir → `audioService.incrementPlayCount()`
5. Si 30% escuchado → marca como válido para comisiones
6. Si usuaria Premium → cuenta completo; Gratis → 3 min preview

### Flujo de Onboarding
1. Primera vez login → `onboardingCompleted: false`
2. Se muestra OnboardingForm
3. Usuaria completa datos → `handleOnboardingComplete()`
4. Guarda en Firestore: `userService.updateUser(uid, { ...datos, onboardingCompleted: true })`
5. Próximo login → detecta `onboardingCompleted: true` → salta onboarding

### Flujo de Gamificación
1. Usuaria escucha audio → `telemetryService.logUsageEvent()`
2. XP incrementa +1 por minuto
3. Al completar audio → agrega a `completedAudios`
4. `useGamification` detecta cambios → verifica medallas
5. Si metas alcanzadas → desbloquea medalla → notificación visual

### Flujo de Regalo/Pase
1. Usuaria Premium toca "Regalar Audio"
2. Genera link único: `/audio/{audioId}?pass={audioId}`
3. Amiga Gratis recibe link → redirige a login
4. Post-login → `handleRedeemGift()` verifica si puede recibir
5. Si es nuevo día → permite reproducir audio completo una vez

---

## CONFIGURACIÓN DE FIREBASE

### Archivos de Configuración
- **firebase-applet-config.json**: Configuración de Firebase (API key, project ID, etc.)
- **.firebaserc**: Proyecto por defecto para CLI de Firebase
- **firebase.json**: Configuración de hosting
- **firestore.rules**: Reglas de seguridad de la base de datos

### Variables de Entorno (Vite)
```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_FIREBASE_MEASUREMENT_ID=
VITE_FIREBASE_DATABASE_ID=
GEMINI_API_KEY=
```

---

**Documento generado el**: Mayo 2026
**Versión de la App**: 2.5 Premium
**Última actualización**: Corrección de reglas Firestore para onboarding + Deshabilitación de login Google
