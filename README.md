# INSPIRA — Sistema de Éxito Exclusivo

Aplicación web construida con **React 19 + TypeScript + Vite 6** y **Firebase** (Authentication, Firestore y Storage).

---

## 📋 Requisitos previos

- **Node.js** 18 o superior (recomendado 20+)
- **npm** 9 o superior

Verificá tu versión con:

```bash
node -v
npm -v
```

---

## 🚀 Cómo ejecutar el proyecto

### 1. Instalar dependencias

```bash
npm install
```

### 2. Ejecutar en modo desarrollo

```bash
npm run dev
```

La app queda disponible en: **http://localhost:3000**

(Modo desarrollo con recarga en caliente / hot reload.)

### 3. Crear el build de producción

```bash
npm run build
```

Esto genera la carpeta `dist/` con los archivos optimizados y minificados listos para desplegar.

### 4. Ejecutar / previsualizar el build de producción

```bash
npm run preview
```

(También podés usar `npm run start`, hace lo mismo.)

El build de producción queda disponible en: **http://localhost:4173**

---

## 🔥 Firebase

Las credenciales de Firebase **ya están configuradas** dentro del proyecto (`src/services/firebase.ts`), apuntando al proyecto en la nube `inspira-bbe1e`. No necesitás crear ni completar archivos `.env` para que la app conecte.

- **Authentication:** email/contraseña y Google OAuth habilitados.
- **Firestore:** configurado y funcionando. Los datos del usuario y el onboarding se guardan directamente en Firestore (NO en localStorage).
- **Storage:** configurado para archivos.

> ℹ️ La app se conecta **siempre a Firebase en la nube (producción)**. No usa emuladores locales, así que no necesitás levantar ningún emulador para que funcione.

### Reglas de seguridad de Firestore

Las reglas están en `firestore.rules`. Si necesitás re-desplegarlas:

```bash
firebase deploy --only firestore:rules
```

---

## 📱 PWA (Progressive Web App)

INSPIRA es una **PWA instalable**: se puede agregar a la pantalla de inicio del celular o al escritorio y funciona como una app nativa, incluso con soporte offline.

### Qué incluye
- **`public/manifest.json`** — metadatos de la app (nombre, colores, iconos, modo `standalone`, atajos).
- **`public/sw.js`** — Service Worker con estrategias de caché (precache, cache-first para estáticos, network-first para Firebase/Google, fallback offline y soporte de audio).
- **`public/icons/`** — iconos en todos los tamaños (72px → 512px), versiones *maskable*, Apple Touch Icon y favicon.
- **`src/registerSW.ts`** — registra el Service Worker y gestiona actualizaciones automáticas.
- **`src/components/InstallPWA.tsx`** — banner atractivo que invita a instalar la app (se muestra tras el login, respeta el descarte por 7 días).
- **`vite-plugin-pwa`** configurado en `vite.config.ts` (estrategia `injectManifest`).
- **`index.html`** con los meta tags de PWA (theme-color, apple-mobile-web-app, link al manifest).

### Cómo probar la PWA
La PWA requiere **HTTPS** o **localhost** para funcionar (es un requisito del navegador).

```bash
npm run build      # genera dist/ con el service worker
npm run preview    # sirve el build en localhost:4173 (PWA activa)
```

Abrí `http://localhost:4173` en Chrome/Edge: tras iniciar sesión aparecerá el banner **"¡Instala Inspira en tu dispositivo!"**, o podés instalarla desde el ícono de instalación en la barra de direcciones.

### Cómo instalarla
- **Android / Chrome / Edge:** tocá el banner "INSTALAR AHORA" o el menú → "Instalar app" / "Agregar a la pantalla principal".
- **iPhone / Safari:** botón **Compartir** → **"Agregar a inicio"** (en iOS la instalación es manual; `beforeinstallprompt` no está disponible en Safari).

> ⚠️ En producción la app **debe servirse por HTTPS** para que el Service Worker y la instalación funcionen. En `localhost` funciona sin HTTPS para pruebas.

---

## 📂 Scripts disponibles

| Script            | Descripción                                            |
|-------------------|--------------------------------------------------------|
| `npm run dev`     | Inicia el servidor de desarrollo en `localhost:3000`   |
| `npm run build`   | Genera el build de producción en `dist/`               |
| `npm run preview` | Sirve el build de producción en `localhost:4173`       |
| `npm run start`   | Alias de `preview`                                     |
| `npm run lint`    | Verificación de tipos con TypeScript (`tsc --noEmit`)  |
| `npm run clean`   | Borra la carpeta `dist/`                               |

---

## 🗂️ Estructura principal

```
inspira_project/
├── src/
│   ├── App.tsx                 # Componente raíz / estado global y auth
│   ├── components/             # Componentes de UI (Login, Onboarding, etc.)
│   ├── services/
│   │   ├── firebase.ts         # Inicialización de Firebase (config en la nube)
│   │   ├── dbService.ts        # Servicios de datos
│   │   ├── userService.ts      # Lógica de usuario / onboarding
│   │   └── firestoreErrorHandler.ts
│   └── hooks/                  # Custom hooks
├── firestore.rules             # Reglas de seguridad de Firestore
├── firebase.json               # Configuración de Firebase
├── package.json
├── vite.config.ts
└── README.md
```

---

## ✅ Estado del proyecto

- Login funcionando (email/contraseña + Google).
- Onboarding se guarda correctamente en **Firestore** y persiste entre sesiones.
- Re-login no vuelve a pedir el formulario de onboarding.
- Build de producción probado y funcionando (`npm run build` + `npm run preview`).

Para más detalles técnicos de los cambios aplicados, ver **`CAMBIOS_PRODUCCION.md`**.
