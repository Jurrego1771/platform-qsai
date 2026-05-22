# Heurísticas de Nielsen para Mediastream Platform CMS

## Contexto de uso

Este documento es el sistema de evaluación UX del agente `04-heuristics-analyzer.md`.
Se aplica a cada página HTML capturada de Mediastream Platform (SM2).

**Stack de la plataforma:** Bootstrap 3.3.1, jQuery, CoffeeScript templates server-side.
**NO existe** React, Tailwind, ni design system propio.

## Constraint obligatorio

> **Toda propuesta de fix DEBE usar únicamente clases Bootstrap 3 ya presentes en la plataforma.**
> No introducir nuevas dependencias. No proponer React ni Tailwind.
> Copiar y pegar desde el HTML propuesto debe funcionar sin instalar nada.

## Catálogo Bootstrap 3 disponible

**Layout:** `.container-fluid`, `.row`, `.col-md-*`, `.col-sm-*`, `.col-xs-*`

**Tipografía:** `.lead`, `.text-muted`, `.text-danger`, `.text-warning`, `.text-success`, `.text-info`, `.small`, `.h1`–`.h6`

**Formularios:**
- Grupos: `.form-group`, `.form-horizontal`, `.form-inline`
- Controles: `.form-control`, `.input-group`, `.input-group-btn`, `.input-group-addon`
- Estados: `.has-error`, `.has-warning`, `.has-success`
- Ayuda: `.help-block`, `.control-label`

**Componentes:**
- `.panel`, `.panel-heading`, `.panel-body`, `.panel-footer`, `.panel-collapse`
- `.alert`, `.alert-danger`, `.alert-warning`, `.alert-info`, `.alert-success`
- `.label`, `.label-default`, `.label-primary`, `.label-danger`, `.label-warning`, `.label-success`, `.label-info`
- `.badge`
- `.progress`, `.progress-bar`, `.progress-bar-striped`, `.active`
- `.modal`, `.modal-dialog`, `.modal-content`, `.modal-header`, `.modal-body`, `.modal-footer`
- `.tooltip`, `.popover`
- `.well`
- `.list-group`, `.list-group-item`
- `.thumbnail`

**Botones:** `.btn`, `.btn-default`, `.btn-primary`, `.btn-success`, `.btn-info`, `.btn-warning`, `.btn-danger`, `.btn-link`, `.btn-sm`, `.btn-xs`, `.btn-lg`, `.btn-block`, `.disabled`

**Tablas:** `.table`, `.table-striped`, `.table-hover`, `.table-bordered`, `.table-condensed`, `.table-responsive`

**Navegación:** `.nav`, `.nav-tabs`, `.nav-pills`, `.navbar`, `.breadcrumb`, `.pagination`, `.pager`, `.active`, `.disabled`

**Utilidades:** `.clearfix`, `.pull-left`, `.pull-right`, `.center-block`, `.hidden-xs`, `.visible-xs`, `.text-center`, `.text-left`, `.text-right`

**Iconos (Glyphicons):** `.glyphicon`, `.glyphicon-ok`, `.glyphicon-remove`, `.glyphicon-warning-sign`, `.glyphicon-info-sign`, `.glyphicon-question-sign`, `.glyphicon-plus`, `.glyphicon-pencil`, `.glyphicon-trash`, `.glyphicon-search`, `.glyphicon-refresh`, `.glyphicon-upload`, `.glyphicon-download`

---

## Las 10 Heurísticas — Adaptadas al CMS

---

### H1 — Visibility of System Status

**Principio:** El sistema debe informar siempre qué está pasando, con feedback apropiado en tiempo razonable.

**En el CMS Mediastream esto significa:**

- **Uploads:** Mientras se sube un archivo, debe mostrarse un `<div class="progress"><div class="progress-bar">` con porcentaje. Un spinner genérico sin texto viola esta heurística.
- **Transcoding:** El estado del video debe ser visible como un `<span class="label label-warning">Procesando</span>` o `<span class="label label-success">Listo</span>` en el card/fila de la lista.
- **Live streams:** El estado (OFFLINE/STARTING/LIVE/ENDING) debe ser visible en la lista como un `<span class="label label-danger">LIVE</span>` sin necesidad de entrar al detalle.
- **Save/Update:** Al guardar un formulario, debe aparecer `<div class="alert alert-success">Guardado correctamente</div>` o en caso de error `<div class="alert alert-danger">`.
- **Acciones asíncronas:** Botones deben deshabilitarse durante la operación (`disabled`) y restaurarse al completar.

**Señales de alerta:**
- `<i class="fa-spin">` sin texto acompañante
- Estado de transcoding/live solo visible en vista de detalle
- Formularios que se guardan sin ningún feedback visual
- Progress bar sin porcentaje numérico visible

**Severidad típica:** 2-3 (bloquea tareas si el usuario no sabe si algo funcionó)

---

### H2 — Match Between System and Real World

**Principio:** El sistema debe hablar el lenguaje del usuario, usando palabras y conceptos familiares.

**En el CMS Mediastream esto significa:**

- **Labels de campos:** `publish_at` → "Fecha de publicación", `cdn_zone` → "Zona CDN", `is_pre_published` → "Pré-publicado"
- **Headers de sección:** Usar "Videos" para editores de contenido no técnicos, no "Media Assets"
- **Mensajes de error:** "Error 503" → "El video está siendo procesado, estará disponible en ~5 minutos"
- **IDs de MongoDB expuestos:** Un `ObjectId` visible en la UI sin contexto viola esta heurística
- **Tipos y estados:** "tvshow", "radioshow" en selects deben tener labels legibles: "Programa de TV", "Programa de radio"
- **Campos técnicos visibles a usuarios no-técnicos:** deben tener `<span class="help-block">` explicativo

**Señales de alerta:**
- Labels en snake_case directamente del API (`cdn_zone`, `is_published`)
- Errores con códigos numéricos sin explicación
- IDs de base de datos visibles en elementos de UI
- Terminología de desarrollo (endpoint, payload, token) sin explicación

**Severidad típica:** 1-2

---

### H3 — User Control and Freedom

**Principio:** Los usuarios necesitan "salidas de emergencia" cuando eligen funciones por error. Soporte para deshacer y rehacer.

**En el CMS Mediastream esto significa:**

- **Acciones destructivas:** Eliminar media, live stream, ad, categoría → SIEMPRE debe mostrarse un modal de confirmación:
  ```html
  <div class="modal fade" id="confirm-delete">
    <div class="modal-dialog">
      <div class="modal-content">
        <div class="modal-header"><h4 class="modal-title">¿Eliminar este elemento?</h4></div>
        <div class="modal-body"><p>Esta acción no se puede deshacer.</p></div>
        <div class="modal-footer">
          <button class="btn btn-default" data-dismiss="modal">Cancelar</button>
          <button class="btn btn-danger" id="confirm-delete-btn">Eliminar</button>
        </div>
      </div>
    </div>
  </div>
  ```
- **Formularios largos:** Deben tener botón "Cancelar" visible que no descarte cambios sin advertencia
- **Uploads en progreso:** Debe existir un botón "Cancelar" que aborte el upload
- **Modales:** No deben tener `data-keyboard="false"` ni `data-backdrop="static"` sin justificación
- **Edición inline:** Cambios no guardados deben mostrar un indicador "Cambios sin guardar"

**Señales de alerta:**
- Botones de eliminar que ejecutan la acción directamente (`onclick="deleteMedia(id)"`)
- Formularios sin botón "Cancelar"
- Modales con `data-keyboard="false"` arbitrario
- Uploads sin forma de cancelar

**Severidad típica:** 3 (crítico en acciones destructivas)

---

### H4 — Consistency and Standards

**Principio:** Los usuarios no deberían preguntarse si diferentes palabras, situaciones o acciones significan lo mismo.

**En el CMS Mediastream esto significa:**

- **Botón de crear:** Siempre `<button class="btn btn-primary"><i class="glyphicon glyphicon-plus"></i> Crear [Recurso]</button>` en la misma posición (esquina superior derecha del área de acción)
- **Botones de acción en tablas:** La pareja Editar/Eliminar debe ser idéntica en todos los módulos
- **Modales de confirmación:** Misma estructura en toda la plataforma (ver H3)
- **Paginación:** Mismo componente `.pagination` en todas las listas
- **Breadcrumbs:** Mismo componente `.breadcrumb` en todas las páginas de detalle
- **Mensajes de éxito/error:** Siempre `.alert alert-success` / `.alert alert-danger`

**Señales de alerta:**
- Diferente color de botón "crear" en diferentes módulos
- Tablas con columnas de acción con layout distinto
- Algunos módulos usan modales de confirmación y otros no
- Mix de `.alert` y custom divs de mensaje

**Severidad típica:** 2

---

### H5 — Error Prevention

**Principio:** Mejor que buenos mensajes de error es un diseño cuidadoso que previene que el problema ocurra.

**En el CMS Mediastream esto significa:**

- **Uploads:** Mostrar restricciones ANTES de seleccionar el archivo:
  ```html
  <div class="form-group">
    <label class="control-label">Archivo de video</label>
    <input type="file" class="form-control" accept=".mp4,.mov,.avi">
    <span class="help-block">Formatos aceptados: MP4, MOV, AVI. Tamaño máximo: 5 GB</span>
  </div>
  ```
- **Campos requeridos:** Marcar con `<span class="text-danger">*</span>` y aplicar validación inline con `.has-error` antes del submit
- **Fechas:** Usar datepicker que previene seleccionar fechas en el pasado si es una regla de negocio
- **Live stream:** Deshabilitar el botón "Crear" hasta que el nombre requerido esté completo
- **Thumbnails:** Mostrar dimensiones aceptadas con help-block antes del upload
- **VAST URL:** Validar que la URL es accesible antes de guardar el ad

**Señales de alerta:**
- Formularios de upload sin restricciones visibles antes de interactuar
- Campos requeridos sin marcación visual (`*`) antes del submit
- Botón de submit siempre activo aunque el form esté incompleto
- Validación solo al hacer submit, sin feedback inline

**Severidad típica:** 2-3

---

### H6 — Recognition Over Recall

**Principio:** Minimizar la carga de memoria del usuario. Las instrucciones de uso del sistema deben ser visibles o fácilmente recuperables.

**En el CMS Mediastream esto significa:**

- **Breadcrumbs:** Toda página de detalle/edición debe tener:
  ```html
  <ol class="breadcrumb">
    <li><a href="/media">Media</a></li>
    <li class="active">Mi Video</li>
  </ol>
  ```
- **Página de edición:** El título del recurso que se está editando debe ser visible sin scroll
- **Relaciones:** Si un Ad está asignado a un Live Stream, debe ser visible en la página del Ad sin navegar al Live
- **Selectores de categoría:** Mostrar la ruta completa ("Deportes / Fútbol") no solo el nombre leaf
- **Credenciales RTMP:** El endpoint y stream key del live deben estar en un panel visible sin navegación adicional
- **Navegación activa:** El ítem del sidebar que corresponde a la página actual debe tener `.active`

**Señales de alerta:**
- Páginas de edición sin breadcrumbs o con breadcrumbs vacíos (`<ol class="breadcrumb"></ol>`)
- IDs como único identificador en selectores (sin nombre del recurso)
- Sidebar sin ítem activo marcado
- Relaciones entre recursos no visibles en la página

**Severidad típica:** 2

---

### H7 — Flexibility and Efficiency of Use

**Principio:** Los aceleradores pueden agilizar la interacción para el usuario experto. El sistema debe servir tanto a novatos como a expertos.

**En el CMS Mediastream esto significa:**

- **Acciones masivas:** En listas de media, live, ads → checkbox en cada fila + barra de acciones bulk (publicar, despublicar, eliminar, mover a categoría)
- **Filtros en URL:** El estado del filtro seleccionado debe persistir en la URL (`?status=published&category=deporte`) para que se pueda compartir o marcar como favorito
- **Acción rápida "Duplicar":** En listas de media/ads/playlists, opción de duplicar con un clic
- **Indicador de cambios no guardados:** Banner o badge que avisa si hay cambios sin guardar en el formulario actual

**Señales de alerta:**
- Listas sin checkboxes para selección multiple
- Filtros que se pierden al recargar la página
- Flujos que requieren múltiples pasos para operaciones repetitivas comunes
- No hay forma de hacer "Publicar todos" o "Eliminar seleccionados"

**Severidad típica:** 1-2

---

### H8 — Aesthetic and Minimalist Design

**Principio:** Los diálogos no deben contener información irrelevante. Cada unidad extra de información compite con la información relevante.

**En el CMS Mediastream esto significa:**

- **Formularios:** No más de 8-10 campos visibles por defecto. Los campos avanzados (DRM, CDN override, configuración técnica) deben estar en un `<div class="panel panel-default"><div class="panel-collapse collapse">` con un toggle "Opciones avanzadas"
- **Tablas de lista:** No más de 6-8 columnas. Las columnas menos usadas pertenecen a la vista de detalle
- **Dashboard:** No más de 6 widgets/métricas en el primer scroll. Los widgets puramente decorativos que no llevan a una acción deben eliminarse
- **Sidebar:** Cada ítem de navegación debe justificar su espacio. Features beta o poco usadas no deben estar al mismo peso visual que las primarias
- **Modales:** Solo incluir la información necesaria para tomar la decisión. No incluir datos técnicos en un modal de confirmación

**Señales de alerta:**
- Formularios con más de 10 campos todos visibles por defecto
- Tablas con más de 8 columnas
- Información técnica (IDs, hashes, endpoints) en vistas destinadas a editores de contenido
- Secciones vacías que ocupan espacio sin aportar valor

**Severidad típica:** 1-2

---

### H9 — Help Users Recognize, Diagnose, and Recover from Errors

**Principio:** Los mensajes de error deben expresarse en lenguaje llano, indicar precisamente el problema, y sugerir constructivamente una solución.

**En el CMS Mediastream esto significa:**

- **Error de upload:** "El archivo es MP3. Solo se aceptan MP4, MOV y AVI. Por favor convierte el archivo primero." Con botón de acción si hay una alternativa.
- **Sesión expirada:**
  ```html
  <div class="alert alert-warning">
    Tu sesión ha expirado.
    <a href="/login" class="btn btn-primary btn-sm">Iniciar sesión nuevamente</a>
  </div>
  ```
- **Live sin señal:** "No se detecta señal de entrada. Verifica que tu encoder está enviando a este endpoint RTMP: [endpoint]"
- **Error de API:** Nunca mostrar el error raw del backend. Siempre traducir a lenguaje de usuario.
- **Validación de formulario:** Usar `.has-error` en el `form-group` específico + `help-block` con el error exacto. No solo un alert genérico arriba del form.
- **404 de recurso:** "Este video ya no existe. Puede haber sido eliminado. [Ir a la lista de videos]"

**Señales de alerta:**
- Mensajes de error genéricos ("An error occurred", "Error 500")
- Errores que no incluyen pasos de recuperación
- Stack traces o JSON de API expuestos al usuario
- Errores de validación solo como alert top-of-form, sin marcar el campo específico

**Severidad típica:** 2-3

---

### H10 — Help and Documentation

**Principio:** Aunque es mejor que el sistema se pueda usar sin documentación, puede ser necesario proveer ayuda y documentación.

**En el CMS Mediastream esto significa:**

- **Campos técnicos:** RTMP endpoint, stream key, bitrate, CDN zone, webhook URL → deben tener un `<span class="glyphicon glyphicon-question-sign text-muted" data-toggle="tooltip" title="Explicación concisa del campo">` o un `help-block` con una oración de explicación
- **Estados vacíos (empty states):** Una lista sin recursos no debe ser un div vacío. Debe mostrar:
  ```html
  <div class="well text-center">
    <h4>No hay videos aún</h4>
    <p class="text-muted">Sube tu primer video para comenzar.</p>
    <a href="/media/create" class="btn btn-primary">
      <i class="glyphicon glyphicon-upload"></i> Subir video
    </a>
  </div>
  ```
- **Primer uso:** Si es la primera vez que el usuario entra a un módulo, un panel de onboarding o modal con los 3 pasos principales.
- **Configuración avanzada:** Tooltips o popovers en configuraciones como DRM, geo-restriction, CDN zone.

**Señales de alerta:**
- Campos técnicos sin ninguna explicación o tooltip
- Listas vacías sin empty state ni CTA
- Módulos complejos sin ninguna guía de primer uso
- Links a documentación que están rotos o llevan a 404

**Severidad típica:** 1-2

---

## Escala de Severidad

| Nivel | Valor | Descripción |
|-------|-------|-------------|
| Cosmético | 1 | No impacta funcionalidad. Pulido visual, terminología menor. |
| Fricción | 2 | Ralentiza o confunde al usuario. Inconsistencias, feedback tardío, labels incorrectos. |
| Crítico | 3 | Bloquea la completación de una tarea o puede causar pérdida de datos. |

## Impacto en Revenue

Marcar como `revenue_impact: true` si el hallazgo está en:
- Rutas `/ad`, `/ad/:id` — configuración de publicidad
- Rutas `/customer/payments`, `/customer/:id` — pagos y suscripciones
- Rutas `/sale/*` — gestión de ventas

Estos hallazgos se priorizan en el backlog independientemente de la severidad técnica.

## JSON Schema del Output

Cada hallazgo debe ser un objeto con esta estructura exacta:

```json
{
  "finding_id": "media-list-h1-01",
  "heuristic_id": 1,
  "heuristic_name": "Visibility of System Status",
  "route": "/media",
  "view_file": "views/medias.coffee",
  "component": "progress-bar",
  "severity": 2,
  "severity_label": "medium",
  "current_html": "<i class='fa fa-spin'></i>",
  "proposed_html": "<div class='progress'><div class='progress-bar progress-bar-striped active' role='progressbar' style='width: 100%'>Procesando...</div></div>",
  "justification": "H1 (Visibility of System Status): el spinner sin texto no comunica el estado específico de la operación. La heurística requiere que el sistema informe con feedback apropiado. Un progress bar con label descriptivo cumple este requisito.",
  "revenue_impact": false,
  "effort": "xs"
}
```

**Campos de esfuerzo:**
- `xs` — cambiar un atributo o clase
- `s` — reemplazar un elemento
- `m` — reestructurar una sección
- `l` — refactorizar una vista completa
