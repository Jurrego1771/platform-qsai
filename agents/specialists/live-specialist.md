# Specialist: Live Stream

## Dominio

Transmisiones en vivo via RTMP/HLS. Incluye DVR, live editor, fast channels y playout.

## Features críticos

### CRUD de live streams
- **Crear:** Formulario con nombre, tipo (video/audio), configuración de CDN
- **Listar:** Ver todos los streams con su estado actual (OFFLINE/STARTING/LIVE/ENDING)
- **Detalle:** Credenciales RTMP (endpoint + stream key), configuración de DVR, estado de salud
- **Eliminar:** Con confirmación

### Estados de un live stream
```
OFFLINE → STARTING → LIVE → ENDING → OFFLINE
```
Cada transición debe ser visible en la UI sin recargar la página (polling o websocket).

### Credenciales RTMP
- El endpoint RTMP y stream key deben ser visibles en la página de detalle
- Deben ser copiables con un botón o fácilmente seleccionables
- NO deben estar ocultos detrás de múltiples clics

### DVR (grabación)
- Si DVR está habilitado, al finalizar un live debe aparecer el VOD en media
- La duración del DVR debe ser configurable

### Live Editor
- Timeline de eventos durante el live
- Overlays y quizzes

## Flujos críticos a probar

1. **Crear live stream:**
   - Navegar a `/live-stream` → crear
   - Llenar nombre (requerido)
   - Guardar → verificar que aparece en lista con estado OFFLINE
   - Verificar que las credenciales RTMP son visibles en el detalle
   - Verificar que el estado OFFLINE es visible como label en la lista

2. **Verificar health status:**
   - El estado del stream en la LISTA debe reflejar el estado real sin entrar al detalle
   - Verificar que el polling/update del estado funciona (esperar cambio de estado si hay un encoder disponible)
   - Si no hay encoder: verificar que OFFLINE es el estado por defecto y visible

3. **Verificar credenciales:**
   - En el detalle, las credenciales RTMP deben estar presentes
   - `bash tools/rtmp-health.sh <endpoint>` para verificar que el endpoint responde

4. **Eliminar stream:**
   - Verificar confirmación modal antes de eliminar
   - Verificar que desaparece de la lista

## Herramientas disponibles

- **Playwright MCP:** Navegación y verificación de UI
- **Bash (tools/rtmp-health.sh):** Verificar si un endpoint RTMP está activo
- **Bash (curl):** Check del HLS endpoint (.m3u8) para verificar que sirve contenido
- **Read:** Leer `D:\repos\mediastream\sm2\src\server\routes\live-stream\` si hay comportamiento inesperado

## Patrones de falla conocidos

- El estado del live stream en la lista no se actualiza automáticamente (requiere reload manual)
- Las credenciales RTMP a veces no aparecen hasta que el stream está en estado STARTING o superior
- El DVR post-live puede tardar varios minutos en aparecer en media y no hay indicador de que está procesando
- El live editor puede perder cambios de timeline si se cierra sin guardar explícitamente

## Verificación de revenue impact

Los live streams pueden tener ads insertados (DAI). Si el bug afecta la disponibilidad del stream, el impacto en revenue es real pero secundario (es el módulo de ads el que gestiona los ingresos directos).

## Definición de "funciona correctamente"

- Se puede crear un live stream con nombre sin errores
- El estado OFFLINE es visible en la lista como label
- Las credenciales RTMP (endpoint + stream key) están visibles en el detalle
- Se puede eliminar un live stream con confirmación
- El stream key es copiable o fácilmente seleccionable

## Datos de prueba

Usar `utils/dataFactory.js`:
```javascript
const live = dataFactory.generateLiveStreamPayload();
// { name: '[QA-E2E] Live 2026-...', type: 'video', online: 'false' }
```

## Revenue impact: Parcial (si tiene ads)

## Umbral de cobertura: 60%
