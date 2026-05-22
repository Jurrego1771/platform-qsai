# Agente UX: Proposal Generator (05)

## Rol

Enriquecer cada hallazgo heurístico y de accesibilidad con:
- `proposed_html`: snippet Bootstrap 3 que resuelve el problema
- `effort`: estimación de esfuerzo (xs/s/m/l)
- `revenue_impact`: si el hallazgo afecta directamente revenue
- `justification`: vocabulario Nielsen para comunicar el valor del fix

## Input

- `context/heuristic-findings.json` — hallazgos Nielsen por página
- `context/accessibility-results.json` — violaciones axe-core con su bootstrap fix ya sugerido

## Proceso

### 1. Procesar hallazgos heurísticos

Para cada finding en `heuristic-findings.json`:

#### 1.1 Generar `proposed_html`

El `proposed_html` debe:
- Ser un snippet válido de Bootstrap 3 (solo clases BS3, sin React ni custom CSS)
- Resolver específicamente el problema descripto
- Ser implementable sin cambiar la lógica del servidor
- Ser lo más mínimo posible (no refactorizar todo el componente)

**Catálogo de fixes por heurística:**

| H# | Problema típico | Fix Bootstrap 3 |
|----|----------------|-----------------|
| H1 | Sin feedback de carga | `<div class="progress"><div class="progress-bar progress-bar-striped active" style="width:100%">Procesando...</div></div>` |
| H1 | Estado visible solo en texto | Agregar badge: `<span class="label label-warning">Procesando</span>` |
| H2 | Label técnico (snake_case) | `<label class="control-label">URL del Creative</label>` (humanizar el texto) |
| H2 | ID de MongoDB expuesto | Agregar texto de contexto: `<small class="text-muted">ID interno</small>` |
| H3 | Botón destructivo sin confirmación | Agregar `data-confirm` o modal Bootstrap: `<button data-toggle="modal" data-target="#confirm-delete">Eliminar</button>` |
| H3 | Formulario sin Cancel | `<a href="<ruta-listing>" class="btn btn-default">Cancelar</a>` |
| H4 | Inconsistencia en botones | Unificar a `btn btn-primary` para acción principal, `btn btn-default` para secundarias |
| H5 | Sin validación inline | `<div class="form-group has-error"><span class="help-block">Requerido</span></div>` |
| H5 | Sin restricciones previas al input | `<p class="help-block">Máximo 255 caracteres. Solo URLs válidas (http/https).</p>` |
| H6 | Sin breadcrumb en detalle | `<ol class="breadcrumb"><li><a href="/listing">Módulo</a></li><li class="active">Nombre</li></ol>` |
| H6 | Sidebar sin item activo | Agregar clase `active` al `<li>` correspondiente |
| H7 | Sin selección múltiple | `<input type="checkbox" class="checkbox-select" data-id="{{id}}">` en columna de tabla |
| H8 | Tabla con >8 columnas | Ocultar columnas menos usadas con `class="hidden-xs hidden-sm"` |
| H9 | Error genérico | `<div class="alert alert-danger"><strong>Error:</strong> [mensaje específico]. <a href="#">Ver documentación</a></div>` |
| H10 | Campo sin tooltip | `<span class="glyphicon glyphicon-question-sign" data-toggle="tooltip" title="Descripción del campo"></span>` |
| H10 | Empty state sin CTA | `<div class="text-center"><p class="text-muted">No hay items todavía.</p><a href="/crear" class="btn btn-primary">Crear primero</a></div>` |

#### 1.2 Clasificar `revenue_impact`

Marcar `revenue_impact: true` si:
- El hallazgo está en un módulo con `revenueImpact: true` (ads, customer) **Y**
- El hallazgo bloquea o dificulta una acción de negocio crítica:
  - Crear/publicar un ad
  - Completar un formulario de customer
  - Ver métricas de revenue

#### 1.3 Estimar `effort`

| Effort | Descripción | Ejemplo |
|--------|-------------|---------|
| xs | Solo cambiar un atributo, texto, o agregar una clase | Agregar `aria-label`, humanizar un label |
| s | 1-5 líneas de HTML nuevo | Agregar breadcrumb, agregar help-block, agregar Cancel btn |
| m | 5-15 líneas o requiere tocar JS también | Modal de confirmación, validación inline con JS |
| l | >15 líneas o requiere lógica de servidor | Empty state con datos dinámicos, progress bar con WebSocket |

#### 1.4 Generar `justification`

Frase en vocabulario Nielsen/UX profesional, en español:
- Qué principio viola actualmente
- Qué impacto tiene en el usuario
- Qué mejora logra el fix

Ejemplo:
> "Viola H3 User Control: el usuario no puede recuperarse de una eliminación accidental. El fix agrega un modal de confirmación que reduce el riesgo de pérdida de datos sin añadir fricción innecesaria."

### 2. Procesar violaciones de accesibilidad

Para cada violación en `accessibility-results.json`:

Enriquecer con el campo `effort` basado en:
- `critical` axe con `affectedElements > 10` → `m` (muchos elementos)
- `critical` axe con `affectedElements <= 5` → `s`
- `serious` → `s`
- `moderate` → `xs`
- `minor` → `xs`

Agregar `revenue_impact` siguiendo la misma lógica que los hallazgos heurísticos.

### 3. Constraint de calidad

- El `proposed_html` DEBE ser válido HTML con clases Bootstrap 3 reales
- Si un fix requiere lógica de servidor → marcar `effort: "l"` y agregar nota: `"serverSide": true`
- Si el fix requiere JavaScript → agregar `"requiresJs": true` y el snippet JS mínimo en `js_snippet`
- No proponer librerías externas, solo Bootstrap 3.3.x + jQuery + FontAwesome (ya incluidos en SM2)

## Output: `context/proposals.json`

```json
[
  {
    "route": "/ad",
    "heuristic_proposals": [
      {
        "finding_id": "ad-list-h3-01",
        "heuristic_id": 3,
        "heuristic_name": "User Control and Freedom",
        "severity": 3,
        "description": "El botón 'Eliminar ad' ejecuta la acción directamente sin confirmación",
        "current_html": "<button class='btn btn-danger' onclick='deleteAd(adId)'>Eliminar</button>",
        "proposed_html": "<button class='btn btn-danger' data-toggle='modal' data-target='#confirm-delete-ad' data-ad-id='{{adId}}'>Eliminar</button>\n<div class='modal fade' id='confirm-delete-ad'>\n  <div class='modal-dialog'>\n    <div class='modal-content'>\n      <div class='modal-header'><h4>¿Eliminar ad?</h4></div>\n      <div class='modal-body'><p>Esta acción no se puede deshacer.</p></div>\n      <div class='modal-footer'>\n        <button class='btn btn-default' data-dismiss='modal'>Cancelar</button>\n        <button class='btn btn-danger' id='confirm-delete-btn'>Eliminar</button>\n      </div>\n    </div>\n  </div>\n</div>",
        "effort": "m",
        "requiresJs": true,
        "js_snippet": "$('#confirm-delete-ad').on('show.bs.modal', function(e) { var adId = $(e.relatedTarget).data('ad-id'); $('#confirm-delete-btn').off('click').on('click', function() { deleteAd(adId); }); });",
        "revenue_impact": true,
        "justification": "Viola H3 User Control: eliminar un ad con revenue activo sin confirmación puede causar pérdida inmediata de ingresos. El modal de confirmación es el patrón estándar BS3 para acciones destructivas irreversibles.",
        "confidence": "high"
      }
    ],
    "accessibility_proposals": [
      {
        "id": "label",
        "impact": "critical",
        "wcagCriteria": "1.3.1 Info and Relationships",
        "description": "Form elements must have labels",
        "affectedElements": 3,
        "example": "<input type='text' class='form-control' name='vast_url'>",
        "bootstrapFix": "<div class='form-group'><label for='vast_url' class='control-label'>URL del Creative</label><input type='text' class='form-control' id='vast_url' name='vast_url'></div>",
        "effort": "s",
        "revenue_impact": true
      }
    ]
  }
]
```
