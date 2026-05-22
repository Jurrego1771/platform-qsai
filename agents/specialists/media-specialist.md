# Specialist: Media

## Dominio

Gestión de video-on-demand (VOD) y audio. El módulo más usado de la plataforma.

## Features críticos

### CRUD de media
- **Crear:** Formulario con campos (título, descripción, categoría, visibilidad) + upload de archivo de video
- **Listar:** Paginación, filtros por estado/categoría/fecha, búsqueda por título
- **Editar:** Mismos campos del crear + configuración de player, DRM, acceso restringido
- **Publicar/Despublicar:** Cambio de estado visible en lista + confirmation de cambio
- **Eliminar:** Debe pedir confirmación

### Transcoding pipeline
- Al subir un video, el estado debe ser "Procesando" visible en la lista
- Después del transcoding: estado "Listo", thumbnail generado, URL de reproducción disponible
- Si falla el transcoding: estado "Error" visible con mensaje descriptivo

### CDN y reproducción
- La URL de reproducción debe ser accesible (HLS .m3u8 o MP4 directo)
- El thumbnail debe cargarse correctamente
- El embed code debe generarse correctamente

### Configuración avanzada
- Player config: selección de player, aspecto, controles
- DRM: habilitación/deshabilitación, no validar con DRM real en QA
- Thumbnails custom: upload y visualización

## Flujos críticos a probar

1. **Upload completo:**
   - Navegar a `/media/create`
   - Llenar título y descripción
   - Verificar que el form indica restricciones de archivo ANTES del upload
   - Upload de un video pequeño (usar fixture/test-video.mp4 si existe)
   - Verificar que aparece con estado "Procesando" en la lista
   - El transcoding puede tardar — verificar que el estado cambia (no esperar más de 5 min en E2E)

2. **CRUD de metadata:**
   - Crear media, editar título, verificar que persiste al recargar
   - Cambiar categoría, verificar en API con `curl /api/media/:id`
   - Publicar, verificar que `is_published: true` en API

3. **Verificación de reproducción:**
   - Obtener URL de reproducción desde la página de detalle
   - Verificar con `ffprobe` que la URL sirve contenido de video válido

## Herramientas disponibles

- **Playwright MCP:** Navegación, captura de screenshots, interacción con formularios
- **Bash (curl):** Verificar API response después de operaciones UI
- **Bash (tools/ffmpeg-check.sh):** Verificar que la URL de reproducción sirve video real
- **Read:** Leer código de `D:\repos\mediastream\sm2\src\server\routes\media\` si hay comportamiento inesperado

## Patrones de falla conocidos

- El estado "Procesando" a veces queda stuck (MongoDB no actualiza el estado de transcoding)
- Los thumbnails custom no se aplican si el video no está en estado "ready"
- La paginación falla silenciosamente con >200 items en la lista
- Upload de archivos muy grandes puede timeout sin feedback visual

## Definición de "funciona correctamente"

- Se puede crear un media con título y descripción sin errores
- El estado de transcoding cambia visualmente (no necesariamente completa en el tiempo del test)
- Editar y guardar metadata persiste en la API
- Publicar/despublicar cambia el estado visible en la lista
- Eliminar muestra confirmación y el recurso desaparece de la lista

## Datos de prueba

Usar `utils/dataFactory.js` para generar datos:
```javascript
const media = dataFactory.generateMediaPayload();
// { title: '[QA-E2E] Media 2026-...', description: '...', is_published: 'false' }
```

Para upload de archivo: usar el archivo `tests/fixtures/test-video.mp4` (crear uno de prueba de 5 segundos si no existe).

## Revenue impact: No

## Umbral de cobertura: 60%
