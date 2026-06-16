# INSTRUCCIONES DE DESPLIEGUE – INSPIRA PWA

## 1) Prerrequisitos

Antes de desplegar, valida que tengas:

- Node.js 18+ y npm instalado
- Acceso al proyecto Firebase `inspira-app-oficial`
- Permisos de Firebase Hosting para ese proyecto

Verificación rápida:

```bash
node -v
npm -v
```

---

## 2) Instalar Firebase CLI (si no está instalado)

### Opción recomendada (global)

```bash
npm install -g firebase-tools
```

Verifica instalación:

```bash
firebase --version
```

### Alternativa sin instalación global

Si no quieres instalar globalmente, puedes ejecutar con npx:

```bash
npx firebase-tools --version
```

---

## 3) Autenticación en Firebase

Inicia sesión:

```bash
firebase login
```

Esto abrirá navegador para autenticación.

Verifica sesión y proyecto activo:

```bash
firebase login:list
firebase use
```

Debe apuntar a:

- **Proyecto por defecto:** `inspira-app-oficial`

---

## 4) Verificación de configuración del proyecto

Dentro de la carpeta del proyecto (`inspira_app_pwa/inspira_app_pwa`), confirma:

### `.firebaserc`
- `default: inspira-app-oficial`

### `firebase.json`
- `hosting.public: dist`
- `hosting.rewrites`: `** -> /index.html` (SPA)
- `hosting.ignore` incluye `node_modules`

Esto es correcto para despliegue de una app React/Vite en Firebase Hosting.

---

## 5) Preparar build de producción

Desde la raíz del proyecto:

```bash
npm install
npm run build
```

El build exitoso debe generar/actualizar carpeta `dist/`.

---

## 6) Desplegar cambios

Comando estándar:

```bash
firebase deploy
```

Comando solo para Hosting (recomendado cuando no quieres tocar otros servicios):

```bash
firebase deploy --only hosting
```

Si deseas forzar explícitamente el proyecto:

```bash
firebase deploy --only hosting --project inspira-app-oficial
```

---

## 7) Verificación post-despliegue

Después del deploy:

1. Revisa en consola el URL publicado por Firebase
2. Abre la URL productiva:
   - https://appinspira.com.mx/
3. Validaciones mínimas funcionales:
   - Home carga contenido real (sin mocks)
   - Mentorías visibles cuando existan en Firestore
   - Startalent con speakers reales
   - Calendario mostrando eventos desde colección `events`
   - Botón PWA visible para usuarios autenticados
4. Prueba en incógnito para evitar caché local
5. Si hay dudas de caché del navegador:
   - Hard refresh (Ctrl/Cmd + Shift + R)

---

## 8) Troubleshooting común

### Error: `firebase: command not found`
Solución:

```bash
npm install -g firebase-tools
# o usar npx firebase-tools
```

### Error de permisos (`Permission denied` / `Missing or insufficient permissions`)
Causa probable: usuario autenticado sin rol suficiente en Firebase.
Solución:
- Verificar cuenta activa con `firebase login:list`
- Solicitar rol adecuado (Editor/Owner/Firebase Admin según política interna)

### Error de proyecto equivocado
Solución:

```bash
firebase use inspira-app-oficial
```

### Deploy exitoso pero no se ven cambios
Posibles causas:
- Caché del navegador
- Build viejo
- Se desplegó otro directorio/proyecto

Checklist de corrección:

```bash
npm run build
firebase deploy --only hosting --project inspira-app-oficial
```

Luego abrir en incógnito y hacer hard refresh.

### Error de build TypeScript/Vite
Solución:
1. Revisar errores en consola
2. Ejecutar `npm run build` localmente hasta dejarlo en verde
3. Recién entonces volver a desplegar

### Problemas de datos (contenido TEST visible)
Usar script de limpieza (primero en dry-run):

```bash
FIREBASE_ADMIN_EMAIL="tu_email_admin" FIREBASE_ADMIN_PASSWORD="tu_password" node scripts/cleanup-test-data.mjs --dry-run
```

Ejecutar borrado real solo después de validar:

```bash
FIREBASE_ADMIN_EMAIL="tu_email_admin" FIREBASE_ADMIN_PASSWORD="tu_password" node scripts/cleanup-test-data.mjs --execute
```

---

## 9) Flujo recomendado final (rápido)

```bash
npm install
npm run build
firebase login
firebase use inspira-app-oficial
firebase deploy --only hosting
```

Con esto, el despliegue queda listo en Firebase Hosting para `inspira-app-oficial`.
