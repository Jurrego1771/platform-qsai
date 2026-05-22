# Agente UX: Page Crawler (02)

## Rol

Navegar cada ruta del scope con Playwright MCP y capturar todo lo necesario para el análisis posterior.

## Input

`context/scope.json` — lista de rutas a auditar.

## Proceso por cada ruta

### 1. Autenticación

Antes de navegar cualquier ruta, verificar si la sesión existe.
Si hay redirect al login → autenticar con credenciales del `.env`.
Reusar la misma sesión para todas las rutas del scope.

### 2. Resolver rutas paramétricas

Para rutas con `:param` (ej. `/ad/:ad_id`):
1. Navegar al listing primero (`/ad`)
2. Extraer el primer ID del DOM: buscar atributos `data-id`, `data-media-id`, o el primer link a una ruta de detalle
3. Si no hay IDs en el DOM, verificar `memory/coverage.json` → campo `sampleIds`
4. Construir la URL con el ID real
5. Si no hay ningún ID disponible: marcar la ruta como `"noData": true` y continuar con la siguiente

### 3. Navegar y esperar

```
Navegar a la URL → waitUntil: 'networkidle' (con fallback a 'domcontentloaded')
Esperar 2 segundos adicionales para que Bootstrap/jQuery terminen de renderizar
```

### 4. Captura desktop (1280x800)

Tomar screenshot fullPage. Guardar en `reports/baseline/screenshots/<módulo>-<nombre>-desktop.png`.

### 5. Captura HTML

Capturar el HTML del body (máximo 50,000 caracteres):
```
document.body.innerHTML.slice(0, 50000)
```

### 6. Captura mobile (375x812)

Cambiar viewport a 375x812, esperar 400ms, tomar screenshot.
Guardar en `reports/baseline/screenshots/<módulo>-<nombre>-mobile.png`.

### 7. Capturar errores de consola

Capturar mensajes de error de JavaScript en la consola del browser.
Solo capturar level "error", no warnings ni info.

### 8. Restaurar viewport

Volver a 1280x800 para la siguiente ruta.

## Output: `context/ux-crawl-results.json`

```json
[
  {
    "route": "/ad",
    "url": "https://dev.platform.mediastre.am/ad",
    "module": "ads",
    "html": "<div class='container-fluid'>...",
    "screenshotDesktop": "reports/baseline/screenshots/ads-list-desktop.png",
    "screenshotMobile": "reports/baseline/screenshots/ads-list-mobile.png",
    "consoleErrors": [],
    "noData": false,
    "timestamp": "2026-05-22T10:05:00Z"
  },
  {
    "route": "/ad/:ad_id",
    "url": "https://dev.platform.mediastre.am/ad/64abc123",
    "module": "ads",
    "html": "...",
    "screenshotDesktop": "...",
    "screenshotMobile": "...",
    "consoleErrors": ["TypeError: Cannot read property 'vast_url' of undefined"],
    "noData": false,
    "resolvedId": "64abc123",
    "timestamp": "2026-05-22T10:06:00Z"
  }
]
```

## Manejo de errores

- Si una ruta devuelve 404 o 500: registrar `"httpError": 404` y continuar
- Si hay redirect al login: re-autenticar y reintentar una vez
- Si la página tarda más de 30s: registrar `"timeout": true` y continuar
- Nunca abortar el crawl completo por un error en una ruta

## Notas de rendimiento

Para audits de múltiples rutas: reusar el mismo browser context (un solo login).
Añadir 800ms de delay entre rutas para no sobrecargar el servidor de desarrollo.
