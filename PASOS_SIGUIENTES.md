# PASOS_SIGUIENTES.md

## 1) Despliegue a producción (rápido)

Desde la raíz del proyecto:

```bash
cd /home/ubuntu/inspira_multimedia/inspira_app_pwa
npm install
npm run build
firebase login
firebase use inspira-bbe1e
firebase deploy --only hosting
```

> Si en tu CLI aparece otro proyecto por defecto, fuerza siempre:

```bash
firebase deploy --only hosting --project inspira-bbe1e
```

---

## 2) URLs Firebase configuradas (actuales)

- **Project ID:** `inspira-bbe1e`
- **Auth Domain:** `inspira-bbe1e.firebaseapp.com`
- **Storage Bucket (config):** `inspira-bbe1e.firebasestorage.app`
- **Consola Firebase:** https://console.firebase.google.com/project/inspira-bbe1e/overview
- **Firestore Console:** https://console.firebase.google.com/project/inspira-bbe1e/firestore
- **Storage Console:** https://console.firebase.google.com/project/inspira-bbe1e/storage
- **Auth Console:** https://console.firebase.google.com/project/inspira-bbe1e/authentication

---

## 3) Cómo probar con 3 tipos de usuario

## 3.1 Admin
- Usuario sugerido: `operaciones@inspiraapps.com`
- Flujo esperado:
  1. Iniciar sesión
  2. Abrir panel Admin
  3. Ver tabs de gestión (usuarios, mentorías, libros, talent, eventos, editorial)
  4. Subir/editar contenido sin bloqueos

## 3.2 Premium
- Usuario sugerido: `alexis.correa026@gmail.com`
- Flujo esperado:
  1. Iniciar sesión
  2. Reproducir mentorías en versión completa (`audioUrl`)
  3. Abrir eventos (Zoom/replay) sin modal de bloqueo
  4. Acceder a libros/etapas y rutas premium

## 3.3 Gratis
- Usuario sugerido: `userfree@gmail.com` (o cualquier cuenta con `plan: Gratis` en Firestore)
- Flujo esperado:
  1. Iniciar sesión
  2. En mentorías: escuchar `previewUrl` (o corte a 180s)
  3. En eventos: ver ficha pero bloquear apertura de URL con CTA a premium
  4. Ver bloqueos premium en libros/rutas/chat según pantalla

---

## 4) Qué debería verse en esta carga inicial ya configurada

Con los datos cargados en Firestore/Storage:

- Colección `audiobooks` con 3 docs (2 comerciales + 1 mentoría)
- Portada disponible en Storage
- En Home/Biblioteca deben aparecer audios reales
- Para usuario Gratis:
  - Comercial gratis reproducible
  - Contenido premium bloqueado o en preview
- Para usuario Premium:
  - Acceso completo a los 3 audios

---

## 5) Compatibilidad aplicada en código (importante)

Se aseguró compatibilidad de lectura/escritura para ambos formatos:

- `audioUrl` **y** `audio_url`
- `coverUrl` **y** `cover_url`
- `previewUrl` **y** `preview_url`
- `contentType` **y** `content_type`

Resultado: el frontend tolera datos históricos en snake_case y nuevos en camelCase.

---

## 6) Checklist final de validación

Antes de cerrar el despliegue:

1. `npm run build` en verde
2. Login admin/premium/gratis funcional
3. Reproducción de audio en los 3 documentos cargados
4. Bloqueos premium correctos para cuenta gratis
5. Firebase Console muestra docs y archivos en `inspira-bbe1e`
