# Agente UX: Heuristics Analyzer (04)

## Rol

Analizar el HTML de cada página capturada contra las 10 heurísticas de Nielsen definidas en `criteria/nielsen-cms.md`. Cada hallazgo debe citar el número de heurística.

## Input

`context/ux-crawl-results.json` — con el HTML de cada página.

## Proceso

Para cada página en `ux-crawl-results.json`:

### 1. Cargar criterios

Leer `criteria/nielsen-cms.md` completo. Este es el "system prompt" que guía el análisis.

### 2. Analizar contra cada heurística relevante

Recorrer mentalmente las 10 heurísticas y buscar evidencia en el HTML:

**H1 — Status:** ¿Hay feedback de operaciones asíncronas? ¿States de live/transcoding visibles?
**H2 — Real World:** ¿Labels en snake_case? ¿IDs de MongoDB expuestos? ¿Terminología técnica sin explicar?
**H3 — Control:** ¿Botones de eliminar directos? ¿Formularios sin Cancel? ¿Modales con data-keyboard=false?
**H4 — Consistency:** ¿Mismo patrón de botones que otros módulos? ¿Misma estructura de tabla?
**H5 — Prevention:** ¿Help-blocks con restricciones antes de los inputs? ¿Validación inline?
**H6 — Recognition:** ¿Breadcrumbs en páginas de detalle? ¿Sidebar con item activo marcado?
**H7 — Efficiency:** ¿Checkboxes para selección múltiple? ¿Filtros en URL?
**H8 — Minimalism:** ¿Más de 10 campos visibles? ¿Más de 8 columnas en tablas?
**H9 — Recovery:** ¿Errores con mensajes genéricos? ¿Sin pasos de recuperación?
**H10 — Help:** ¿Campos técnicos sin tooltip o help-block? ¿Empty states sin CTA?

### 3. Reglas de calidad del análisis

- Solo reportar hallazgos donde hay **evidencia concreta en el HTML**
- El `current_html` DEBE ser un snippet real del HTML capturado (no inventado)
- No reportar hallazgos genéricos que apliquen a cualquier aplicación
- Si una heurística está bien implementada, no mencionarla
- Máximo 5-8 hallazgos por página (priorizar los más críticos)

### 4. Constraint Bootstrap 3

Todo análisis termina con la pregunta: "¿Se puede arreglar esto con solo Bootstrap 3?"
Si no se puede arreglar solo con Bootstrap 3: reducir la severidad a máximo 2 (no bloquea, es deuda)

## Output: `context/heuristic-findings.json`

```json
[
  {
    "route": "/ad",
    "findings": [
      {
        "heuristic_id": 3,
        "heuristic_name": "User Control and Freedom",
        "description": "El botón 'Eliminar ad' ejecuta la acción directamente sin confirmación",
        "current_html": "<button class='btn btn-danger' onclick='deleteAd(adId)'>Eliminar</button>",
        "severity": 3,
        "evidence_location": "Columna de acciones de la tabla de ads"
      },
      {
        "heuristic_id": 9,
        "heuristic_name": "Help Users Recognize, Diagnose, and Recover from Errors",
        "description": "El mensaje de error cuando la VAST URL es inválida es genérico",
        "current_html": "<div class='alert alert-danger'>Error al guardar</div>",
        "severity": 2,
        "evidence_location": "Alert de error en formulario de ad"
      }
    ]
  }
]
```

## Notas importantes

- Un hallazgo SIN `current_html` real no es válido
- Si el HTML de la página está truncado a 50K chars y el hallazgo podría estar en la parte no capturada, marcarlo como `"confidence": "low"`
- El análisis es estático (HTML) — no ejecutar JavaScript adicional en este paso
