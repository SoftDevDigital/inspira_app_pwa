# 📲 Componente de Instalación PWA — Inspira

**Fecha:** 9 de junio de 2026
**Archivo creado:** `src/components/InstallPWA.tsx`
**Archivo modificado:** `src/App.tsx`
**Estado:** ✅ Implementado, integrado y validado (`npm run lint` + `npm run build` OK).

---

## 🎯 Objetivo

Mostrar un banner moderno y atractivo que invite al usuario a instalar Inspira como PWA en su dispositivo, manejando el evento `beforeinstallprompt`, detectando si ya está instalada y respetando las preferencias del usuario.

---

## 📦 `src/components/InstallPWA.tsx`

### Hook `useInstallPWA()`
Encapsula toda la lógica de instalación:

| Responsabilidad | Implementación |
|-----------------|----------------|
| **Detectar `beforeinstallprompt`** | Escucha el evento, hace `e.preventDefault()` y guarda el prompt diferido (`deferredPrompt`). |
| **Detectar si ya está instalada** | `isAppInstalled()` revisa `display-mode: standalone` y `navigator.standalone` (iOS). |
| **Controlar visibilidad del banner** | Estado `isVisible`; solo se vuelve `true` tras un retardo de **4 s** (no aparece inmediatamente). |
| **Función de instalación** | `install()` lanza el prompt nativo (`prompt()` + `userChoice`). Si se acepta marca instalada; si se rechaza, aplica la regla de 7 días. |
| **Función de cierre / posponer** | `dismiss()` guarda el timestamp en `localStorage` y oculta el banner. |
| **Detectar instalación completada** | Escucha el evento `appinstalled` para ocultar el banner. |

### Reglas de aparición
El banner **solo** se muestra cuando se cumplen TODAS:
1. ✅ `beforeinstallprompt` está disponible (el navegador soporta y permite instalar).
2. ✅ La app **no** está ya instalada (standalone).
3. ✅ El usuario **no** la pospuso en los últimos **7 días** (`inspira_pwa_install_dismissed_at` en `localStorage`).
4. ✅ Han pasado **4 segundos** desde que el evento estuvo disponible.

### Constantes configurables
```ts
const DISMISS_KEY = 'inspira_pwa_install_dismissed_at';
const DISMISS_DAYS = 7;      // días que se oculta tras "Ahora no"
const SHOW_DELAY_MS = 4000;  // retardo antes de mostrar
```

### Diseño del banner
- **Posición:** fijo en la parte **inferior** de la pantalla (`fixed inset-x-0 bottom-0`), centrado, con `max-w-md`/`max-w-lg`.
- **Estilo Inspira:** fondo negro (`#0d0d0d`) con `backdrop-blur`, borde y glow en color **acento naranja** (`accent` = `#ff8c00`), sombra naranja difusa.
- **Contenido:**
  - Ícono de la app (`/icons/icon-192x192.png`, con fallback a `/logo_app.png`) con badge de `Sparkles`.
  - Título: **"¡Instala Inspira en tu dispositivo!"**
  - Descripción: **"Accede más rápido y escucha audios en segundo plano."**
  - Botón principal: **"INSTALAR AHORA"** (con ícono `Download`).
  - Botón secundario: **"Ahora no"** (ejecuta `dismiss`).
  - Botón **X** para cerrar (esquina superior derecha).
- **Animación:** entrada/salida suave con `motion/react` (`spring`, deslizando desde abajo con fade).
- **Responsive:** tamaños y paddings adaptados para móvil y desktop; respeta `safe-area-inset-bottom` (notch iOS).
- **Accesibilidad:** `role="dialog"`, `aria-label` en el contenedor y en los botones de ícono.

---

## 🔌 Integración en `src/App.tsx`

1. **Import** añadido:
   ```ts
   import InstallPWA from './components/InstallPWA';
   ```
2. **Render** colocado después del bloque de `Login`, condicionado para que aparezca en **todas las páginas** cuando corresponde, sin interferir con el splash, el login ni el onboarding:
   ```tsx
   {!isSplashVisible && isAuthenticated && !needsOnboarding && <InstallPWA />}
   ```
   El propio componente decide internamente si se muestra (según las 4 reglas de aparición), por lo que esta condición solo limita el contexto (usuario logueado y fuera del onboarding).

---

## 🎨 Estilos

Se usa **Tailwind CSS** (igual que el resto del proyecto), aprovechando los tokens del tema ya definidos en `src/index.css`:
- `--color-accent: #ff8c00` → clases `bg-accent`, `text-accent`, `border-accent/30`, etc.
- Fondo negro y vidrio (`backdrop-blur-xl`) coherente con el tema "Elegant" de Inspira.

No se añadió CSS adicional: todo el estilado es vía utilidades Tailwind + `motion/react` para animación.

---

## 🧪 Validación

| Comprobación | Comando | Resultado |
|--------------|---------|-----------|
| Tipado / lint | `npm run lint` (`tsc --noEmit`) | ✅ Sin errores |
| Build de producción | `npm run build` | ✅ Compila + PWA `sw.js` generado |

---

## 📌 Notas

- El evento `beforeinstallprompt` solo lo disparan navegadores basados en Chromium (Chrome, Edge, Brave, etc.) y **requiere HTTPS** (o `localhost`). En iOS/Safari no existe ese evento: la instalación es manual ("Compartir → Añadir a pantalla de inicio"), por lo que el banner no aparecerá allí (comportamiento esperado).
- La regla de 7 días evita molestar al usuario que ya dijo "Ahora no".
- Si la app ya está instalada (standalone), el banner nunca se muestra.
