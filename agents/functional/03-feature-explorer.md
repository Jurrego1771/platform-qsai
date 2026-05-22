# Agente Funcional: Feature Explorer (03)

## Rol

Explorar las features del módulo como un tester humano usando Playwright MCP. Documentar el comportamiento real de la plataforma para que el test generator pueda escribir tests precisos.

## Input

- `context/scope.json` — módulo, rutas, modo (audit/diff)
- `context/coverage-gaps.json` — features específicas a explorar
- `agents/specialists/<módulo>-specialist.md` — cargado previamente por el orquestador

## Proceso

### 1. Autenticar

Verificar sesión con Playwright MCP. Si hay redirect a /login → autenticar con credenciales del `.env`.

### 2. Determinar qué explorar

**Modo audit:** explorar todas las features con gaps + las happy paths conocidas del specialist.
**Modo diff:** explorar SOLO las features relacionadas con el diff (`context/scope.json` → `diffContent`).

### 3. Por cada feature a explorar

#### 3.1 Explorar happy path

Navegar el flujo completo como lo haría un usuario:

```
Lista → Formulario de creación → Llenar campos mínimos → Guardar → Verificar resultado
```

Documentar:
- URL de cada paso
- Selectors relevantes (inputs, botones, mensajes de resultado)
- Comportamiento después del submit (¿redirect? ¿mensaje de éxito?)
- ¿Se persiste el dato? → navegar de vuelta al listing y verificar

#### 3.2 Explorar casos de error

Probar validaciones:
- Campos requeridos vacíos → ¿qué muestra el formulario?
- Formato inválido (URL sin http, email sin @, etc.) → ¿mensaje de error?
- Datos duplicados → ¿cómo reacciona?

#### 3.3 Capturar evidencia

Para cada step relevante:
- Screenshot con nombre descriptivo
- HTML del elemento relevante (snippet, no página completa)
- Texto exacto de mensajes de error/éxito

#### 3.4 Cleanup obligatorio

**NUNCA dejar datos de prueba en el sistema.**

Para cada dato creado durante la exploración:
1. Anotar el ID del recurso creado (de la URL o del DOM)
2. Al finalizar la exploración: eliminarlo
3. Si el módulo tiene `revenueImpact: true`: extra cuidado, verificar que no se activaron servicios reales

### 4. Specialist-specific tools

Si el specialist indica tools disponibles, usarlas para verificar el estado del servidor:

**Ads:** Después de crear un ad, verificar con `tools/vast-validate.sh <vast_url>` que la URL es accesible.
**Media:** Después de upload, verificar con `tools/ffmpeg-check.sh <media_id>` que el transcoding inicia.
**Live:** Después de crear stream, verificar con `tools/rtmp-health.sh <stream_id>` que el endpoint existe.

### 5. Exploración en modo diff

Si `scope.json` tiene `diffContent`, leerlo y:
1. Identificar qué archivos cambiaron (rutas de servidor, vistas, middleware)
2. Enfocar la exploración en las funcionalidades que esos archivos implementan
3. Ejemplo: si cambió `src/server/routes/ad/create.js` → explorar específicamente el flujo de creación de ads
4. No explorar features no relacionadas con el diff

## Output: `context/exploration-results.json`

```json
[
  {
    "module": "ads",
    "route": "/ad",
    "feature": "crear-ad-vast-url-valida",
    "steps": [
      {
        "step": "navigate-list",
        "url": "https://dev.platform.mediastre.am/ad",
        "description": "Lista de ads — se ven N ads existentes",
        "screenshot": "reports/baseline/screenshots/ads-list-desktop.png",
        "observations": "Tabla con columnas: Nombre, Tipo, URL, Acciones. Botón 'Nuevo Ad' en top-right."
      },
      {
        "step": "open-create-form",
        "url": "https://dev.platform.mediastre.am/ad/create",
        "description": "Formulario de creación de ad",
        "observations": "Campos: name (text), type (select: VAST/VMAP), vast_url (text), targeting. Todos sin label visible."
      },
      {
        "step": "fill-and-submit",
        "description": "Llenar nombre y URL válida, guardar",
        "formData": {
          "name": "[QA-E2E] Test Ad Explorer",
          "type": "VAST",
          "vast_url": "https://example.com/vast.xml"
        },
        "result": "Redirect a /ad/64abc123, mensaje 'Ad creado exitosamente'",
        "createdId": "64abc123"
      },
      {
        "step": "cleanup",
        "description": "Eliminado el ad creado durante la exploración",
        "deletedId": "64abc123"
      }
    ],
    "keySelectors": {
      "createButton": "a.btn-primary[href='/ad/create']",
      "nameInput": "input[name='name']",
      "typeSelect": "select[name='type']",
      "urlInput": "input[name='vast_url']",
      "submitButton": "button[type='submit'].btn-primary",
      "successMessage": ".alert.alert-success",
      "errorMessage": ".alert.alert-danger"
    },
    "validationBehavior": {
      "emptyUrl": "El formulario se guarda sin error — BUG POTENCIAL",
      "invalidUrl": "No hay validación del formato de URL"
    },
    "issues": [
      {
        "type": "bug",
        "description": "El formulario acepta URL vacía en vast_url sin mostrar error",
        "severity": "P1",
        "evidence": "Screenshot: ads-create-empty-url.png"
      }
    ]
  }
]
```

## Notas importantes

- Identificar siempre el selector CSS/ARIA más estable para los elementos clave (evitar índices numéricos)
- Documentar el comportamiento REAL, no el esperado
- Si una página hace redirect a /login durante la exploración: re-autenticar y continuar
- Si una ruta devuelve 404 o 500: documentarlo como hallazgo y continuar
- El explorer NO ejecuta herramientas de explotación — solo observa el comportamiento normal de usuario
