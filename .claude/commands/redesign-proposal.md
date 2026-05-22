# /redesign-proposal — Propuesta de Rediseño Moderno con Branding Mediastream

## Propósito

Genera mockups HTML auto-contenidos (Tailwind CSS + Encode Sans Expanded) para cada página auditada por `/qa-ux`, aplicando la identidad de marca oficial de Mediastream y todos los fixes UX del pipeline.

**Output:** archivos `.html` listos para abrir en browser y compartir con el equipo de diseño. No requiere build step.

## Uso

```
/redesign-proposal           # usa el último audit en context/
/redesign-proposal login     # solo la página de login
/redesign-proposal media     # solo el módulo media
```

## Prerequisito

Requiere que `/qa-ux` haya corrido previamente y existan:
- `context/scope.json`
- `context/proposals.json`

Si no existen, ejecutar `/qa-ux [módulo]` primero.

## Pipeline de ejecución

### Paso 1 — Cargar Brand Guidelines (/mediastream-brand)

Leer `/mediastream-brand` para cargar los tokens oficiales:
- Colores: `#97D700` (green), `#8E65D8` (purple), `#1a1a1a` (black)
- Fuente: Encode Sans Expanded
- Logo: URL oficial del CDN
- Reglas de combinación de colores

### Paso 2 — Leer contexto del audit anterior

Leer `context/scope.json` y `context/proposals.json`.
Si el argumento especifica un módulo/página: filtrar solo esas rutas.

### Paso 3 — Redesign Proposer (agents/ux/05b-redesign-proposer.md)

Para cada ruta del scope, ejecutar el agente siguiendo las instrucciones de `05b-redesign-proposer.md`.

Genera en `reports/redesign/`:
- `<módulo>-<página>-mockup.html` — mockup auto-contenido por página
- `INDEX.md` — índice con score antes/después y brand checklist

### Paso 4 — Verificar con Playwright

Abrir cada mockup generado en el browser con Playwright para verificar que renderiza correctamente:
- Sin errores de consola
- Logo carga desde CDN
- Fuente Encode Sans Expanded presente
- Colores de marca correctos visualmente
- Tomar screenshot y guardarlo en `reports/redesign/screenshots/`

## Notas importantes

- Los mockups son **propuestas de diseño**, no código de producción (SM2 usa Bootstrap 3)
- Tailwind CDN se usa solo para los mockups — no introducir en el repo de SM2
- Aplicar TODOS los `proposed_html` de `proposals.json` — el mockup debe ser una versión "fixed"
- Verificar contraste WCAG AA: verde `#97D700` sobre negro `#1a1a1a` ✅ — nunca verde sobre morado directamente ❌
