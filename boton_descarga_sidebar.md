# 📲 Botón "Descargar App" en el menú lateral (Sidebar)

**Fecha:** 9 de junio de 2026
**Archivo modificado:** `src/components/Sidebar.tsx`
**Archivo ajustado (robustez):** `src/components/InstallPWA.tsx`
**Estado:** ✅ Implementado y validado (`npm run lint` + `npm run build` OK).

---

## 🎯 Objetivo

Añadir un botón **"Descargar App"** dentro del menú lateral (drawer de perfil) que permite instalar la PWA de Inspira con un solo toque. El botón solo aparece cuando la instalación es posible y la app **no** está ya instalada.

---

## 📍 Ubicación del botón

El botón se colocó **justo debajo de "Compartir INSPIRA 🚀"** y **encima de "Configuración"**, dentro de la lista de opciones del menú lateral (`Sidebar.tsx`). Es una posición destacada y visible sin necesidad de hacer scroll.

---

## 🛠️ Cambios realizados

### 1. `src/components/Sidebar.tsx`

- **Imports añadidos:**
  ```ts
  import { ..., Download } from 'lucide-react';
  import { useInstallPWA } from './InstallPWA';
  ```
- **Uso del hook** (reutiliza la lógica PWA ya existente):
  ```ts
  const { canInstall, isInstalled, install } = useInstallPWA();
  ```
- **Botón añadido** (solo se renderiza si se puede instalar y no está instalada):
  ```tsx
  {canInstall && !isInstalled && (
    <button
      onClick={async () => { await install(); onClose(); }}
      className={`${menuButtonStyle} border-accent/40 bg-accent/10 shadow-[0_0_20px_rgba(255,140,0,0.15)]`}
      id="install-pwa-btn"
    >
      <div className={iconTextStyle}>
        <Download size={18} className="text-accent" />
        <span className={`${labelStyle} text-accent`}>Descargar App</span>
      </div>
      <Sparkles size={14} className="text-accent shrink-0" />
    </button>
  )}
  ```

#### Diseño
- **Ícono:** `Download` (⬇️) de `lucide-react`, en color **acento naranja** (`#ff8c00`).
- **Texto:** "Descargar App" en mayúsculas (igual estilo que el resto de botones del menú).
- **Estilo:** reutiliza `menuButtonStyle` (mismo formato de píldora que los demás botones) pero con borde y fondo naranja translúcido + un glow suave para destacarlo.
- **Detalle:** un ícono `Sparkles` a la derecha para darle un toque atractivo, coherente con el banner de instalación.
- **Comportamiento al hacer clic:** lanza el prompt nativo de instalación (`install()`) y luego cierra el menú (`onClose()`).

### 2. `src/components/InstallPWA.tsx` (robustez del hook compartido)

El evento `beforeinstallprompt` lo dispara el navegador **una sola vez**. Como ahora el hook `useInstallPWA` se usa en **dos lugares** (el banner inferior y el botón del menú lateral), se añadió una **caché a nivel de módulo** del evento para que ambas instancias lo reciban sin importar cuál se montó primero:

- `cachedPrompt`: guarda el evento `beforeinstallprompt` capturado.
- `promptListeners` (`Set`): lista de suscriptores; cada instancia del hook se suscribe y recibe el prompt en cuanto está disponible.
- Cada hook escucha además `appinstalled` para marcar la app como instalada y ocultarse.
- Tras usar el prompt (`install()`), se limpia la caché global porque es de **un solo uso**.

Esto garantiza que el botón del menú lateral funcione de forma fiable aunque el menú se abra después de que el navegador haya disparado el evento.

---

## 🔍 Reglas de visibilidad

El botón **"Descargar App"** aparece únicamente si:
1. ✅ `canInstall` → el navegador soporta y permite instalar (evento `beforeinstallprompt` disponible).
2. ✅ `!isInstalled` → la app **no** está corriendo ya en modo instalado (standalone).

Si la app ya está instalada, o el navegador no permite instalar (p. ej. iOS/Safari), el botón no se muestra.

---

## 🧪 Validación

| Comprobación | Comando | Resultado |
|--------------|---------|-----------|
| Tipado / lint | `npm run lint` (`tsc --noEmit`) | ✅ Sin errores |
| Build de producción | `npm run build` | ✅ Compila + `sw.js` generado |

---

## 📌 Notas

- En **iOS/Safari** no existe el evento `beforeinstallprompt`, por lo que el botón no aparecerá ahí (comportamiento esperado). En ese caso la instalación es manual: **Compartir → "Agregar a inicio"**.
- En **Chrome/Edge/Brave** (Android y escritorio) bajo **HTTPS** (o `localhost`), el botón aparece y dispara el cuadro de instalación nativo.
- El botón comparte la misma lógica que el banner inferior `InstallPWA`, así que ambos quedan sincronizados.
