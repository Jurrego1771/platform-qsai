# Specialist: Ads (Publicidad)

## ⚠️ Revenue Impact: CRÍTICO

Este es el módulo con mayor impacto directo en ingresos de la plataforma. Los bugs aquí tienen consecuencias económicas inmediatas. Umbral de cobertura: **80%**.

## Dominio

Configuración y gestión de anuncios publicitarios. Soporta VAST 2.0/3.0, VMAP, y ad-insertion en live streams (DAI).

## Features críticos

### Tipos de anuncios
- **VAST:** Pre-roll, mid-roll, post-roll. Una sola URL de ad que devuelve XML VAST.
- **VMAP:** Ad breaks múltiples con timing configurable. Más complejo y crítico.
- **Ad Insertion (DAI):** Ads insertados en live streams en tiempo real.

### CRUD de ads
- **Crear:** Formulario con tipo de ad (VAST/VMAP), URL de creative, configuración de breaks
- **Listar:** Ver todos los ads con estado y tipo
- **Editar:** Modificar configuración existente
- **Asignar:** Asociar ad a un media o live stream
- **Eliminar:** Con confirmación

### Validación de ads
- La URL del VAST debe devolver XML válido según la spec VAST
- Un VMAP debe tener al menos un ad break configurado
- El timing de ad breaks no puede ser negativo (puede causar loop infinito)

## Flujos críticos a probar

1. **Crear VAST ad:**
   - Navegar a `/ad` → botón crear
   - Llenar: nombre, tipo VAST, URL de creative válida
   - Guardar → verificar que aparece en lista
   - Verificar que la URL de ad devuelve XML VAST: `curl <ad_url>` y validar XML
   - `bash tools/vast-validate.sh <url>` para validar contra spec

2. **Crear VMAP ad:**
   - Igual que VAST pero con múltiples breaks
   - Verificar que el timing está configurado correctamente
   - Verificar que no se acepta timing negativo

3. **Asignación de ad a media:**
   - Crear ad → ir a media → asignar ad en configuración
   - Verificar que la asociación persiste en la API: `curl /api/media/:id` y verificar campo de ad
   
4. **Verificar que ad sin creative URL no rompe el player:**
   - Si se puede crear un ad con URL vacía, verificar que el form lo previene (H5)

## Herramientas disponibles

- **Playwright MCP:** Navegación e interacción con el formulario de ads
- **Bash (tools/vast-validate.sh):** Validar XML VAST/VMAP contra spec oficial
- **Bash (curl):** Request directo a la ad URL para ver el response XML
- **Read:** Leer `D:\repos\mediastream\sm2\src\server\routes\ad\` si hay comportamiento inesperado

## Patrones de falla conocidos

- VMAP con timing = 0 puede causar loop infinito de ads en el player
- Ads sin creative URL son aceptados por el form pero rompen el player downstream
- El revenue tracking no registra impresiones si el beacon URL tarda más de 500ms
- Ads asignados a live streams pueden no insertarse si el CDN no está en la lista blanca del ad server

## Verificación de revenue impact

Cuando hay un bug en el módulo de ads, SIEMPRE incluir en el reporte:
- ¿Qué tipo de ad falla? (pre-roll/mid-roll/VMAP)
- ¿En qué porcentaje del contenido está afectado?
- ¿Es un error de configuración (reversible) o de datos (requiere corrección en DB)?

## Definición de "funciona correctamente"

- Se puede crear un ad VAST con URL válida sin errores de validación
- Se puede crear un ad VMAP con al menos un break configurado
- Los ads aparecen en la lista después de crearse
- La URL del ad devuelve XML VAST válido cuando se hace request directo
- El ad puede asignarse a un media o live stream y la asociación persiste
- El formulario previene guardar ads con URL vacía (error prevention)

## Datos de prueba

Usar `utils/dataFactory.js`:
```javascript
const ad = dataFactory.generateAdPayload({ type: 'vast' });
// Agregar generateAdPayload() a dataFactory.js si no existe
```

Para tests con VAST URL real, usar una URL pública de prueba de VAST:
`https://pubads.g.doubleclick.net/gampad/ads?...` (URL de demo de Google IMA)

## Revenue impact: SÍ — CRÍTICO

## Umbral de cobertura: 80%
