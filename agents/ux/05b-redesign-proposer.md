# Agente UX: Redesign Proposer (05b)

## Rol

Generar mockups HTML modernos y auto-contenidos para cada página auditada, aplicando:
- La identidad de marca oficial de Mediastream (`/mediastream-brand`)
- Todos los fixes de UX de `context/proposals.json`
- Tailwind CSS (CDN — sin build step)
- Encode Sans Expanded (Google Fonts)

## Input

- `context/proposals.json` — hallazgos y fixes del pipeline UX
- `context/scope.json` — módulo, rutas y páginas auditadas
- Brand guidelines de `/mediastream-brand` (cargadas al inicio)

## Prerequisito

Este agente corre **después** de `05-proposal-generator.md`. Requiere `context/proposals.json` con datos.

## Proceso

### 1. Cargar brand tokens

Del skill `/mediastream-brand`, extraer:

```
--ms-green:  #97D700
--ms-purple: #8E65D8
--ms-black:  #1a1a1a
--ms-white:  #FFFFFF
font: 'Encode Sans Expanded', sans-serif
logo: https://cdn.prod.website-files.com/6584479d07aff3fd2a2570e2/6584479d07aff3fd2a2576a2_Mediastream%20Platform.svg
```

### 2. Para cada ruta en scope.json

Generar un archivo `reports/redesign/<módulo>-<nombre>-mockup.html` auto-contenido.

#### Estructura base del mockup

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>[Página] — Mediastream Platform (Redesign Proposal)</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      theme: {
        extend: {
          colors: {
            'ms-green':  '#97D700',
            'ms-purple': '#8E65D8',
            'ms-black':  '#1a1a1a',
          },
          fontFamily: {
            sans: ['"Encode Sans Expanded"', 'Helvetica Neue', 'Arial', 'sans-serif'],
          }
        }
      }
    }
  </script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Encode+Sans+Expanded:wght@300;400;600;900&display=swap" rel="stylesheet">
  <style>
    body { font-family: 'Encode Sans Expanded', Helvetica Neue, Arial, sans-serif; }
  </style>
</head>
<body class="bg-white text-ms-black font-sans">
  <!-- BANNER de contexto — NO es parte del diseño final -->
  <div class="bg-ms-purple text-white text-xs px-4 py-2 flex items-center gap-2">
    <span class="font-semibold">🎨 Redesign Proposal</span>
    <span class="opacity-75">·</span>
    <span>[ruta] · [fecha ISO]</span>
    <span class="opacity-75">·</span>
    <span>Fixes aplicados: [N hallazgos de proposals.json]</span>
  </div>

  <!-- MOCKUP de la página -->
  [contenido de la página rediseñada]
</body>
</html>
```

### 3. Principios de diseño para los mockups

#### Paleta aplicada
- **Fondo izquierdo / hero:** gradiente de `ms-purple` a `ms-black` (reemplaza el gradiente actual purple-only)
- **CTA principal (Login, Reset password):** `bg-ms-green text-ms-black font-semibold` — reemplaza el botón verde custom actual
- **Inputs:** `border border-gray-300 focus:border-ms-purple focus:ring-1 focus:ring-ms-purple`
- **Links:** `text-ms-purple hover:text-ms-green`
- **Errores:** `bg-red-50 border-l-4 border-red-500` con texto `text-red-700`

#### Tipografía aplicada
- `H1`: `text-3xl font-black text-ms-black` (o blanco sobre oscuro)
- `H2/H3`: `text-xl font-semibold`
- Labels: `text-sm font-semibold text-gray-700`
- Help-blocks: `text-xs text-gray-500 mt-1`
- Botones: `font-semibold`

#### UX fixes a incluir obligatoriamente
Aplicar **todos** los `proposed_html` de `proposals.json` para la ruta correspondiente:
- `type="email"` en campos email
- `inputmode="numeric"` en TOTP
- `lang="en"` en `<html>`
- `alt` attributes en imágenes
- Eliminar `tabindex` arbitrarios
- Error alerts con CTA inline
- H1 semántico (visual de H3)
- Help-block de requisito Google Sign-In

### 4. Layout moderno para el login flow

El layout dos columnas actual es correcto. Mejoras a aplicar:

**Columna izquierda (hero):**
```
- Gradiente: from-ms-purple to-ms-black (diagonal)
- Logo oficial (SVG desde CDN) en la parte superior
- Headline: font-black text-4xl, "start using" en ms-green
- Ilustración: img del CDN oficial (iconGroupLogin o Platform Mockup)
- Padding generoso: min-h-screen flex flex-col justify-between
```

**Columna derecha (formulario):**
```
- Fondo blanco puro
- Centrado vertical: flex flex-col justify-center
- Max-width: max-w-sm mx-auto w-full px-8
- Input con label SemiBold + focus ring ms-purple
- Submit: w-full bg-ms-green text-ms-black font-semibold py-3 rounded-lg hover:brightness-110
- "Forgot password": text-ms-purple text-sm
- Separador "or": línea gris con texto "or continue with"
- Google button: borde gris, fondo blanco, texto Black "Sign in with Google"
```

### 5. Añadir panel de comparación al final del mockup

Después del diseño, incluir una sección colapsable `<details>`:

```html
<details class="mt-8 border-t border-gray-200">
  <summary class="px-6 py-3 text-sm font-semibold text-gray-500 cursor-pointer hover:text-ms-purple">
    📋 UX Fixes aplicados en esta propuesta
  </summary>
  <div class="p-6">
    <table class="w-full text-sm border-collapse">
      <thead>
        <tr class="bg-gray-50">
          <th class="text-left p-2 border">Heurística</th>
          <th class="text-left p-2 border">Hallazgo</th>
          <th class="text-left p-2 border">Fix aplicado</th>
        </tr>
      </thead>
      <tbody>
        <!-- Una fila por finding_id de proposals.json -->
      </tbody>
    </table>
  </div>
</details>
```

## Output: `reports/redesign/`

| Archivo | Contenido |
|---------|-----------|
| `reports/redesign/<módulo>-<página>-mockup.html` | Mockup auto-contenido por página |
| `reports/redesign/INDEX.md` | Índice con links a todos los mockups y score antes/después |

### `INDEX.md` estructura

```markdown
# Redesign Proposals — [Módulo] — [fecha]

## Score antes/después

| Métrica | Antes | Después (estimado) |
|---------|-------|-------------------|
| UX Score | [N]/100 | ~90/100 |
| Violaciones WCAG | [N] | 0 |
| Hallazgos críticos | [N] | 0 |
| Hallazgos medios | [N] | 0 |

## Mockups generados

| Página | Mockup | Fixes aplicados |
|--------|--------|----------------|
| [ruta] | [link al HTML] | [N] |

## Brand checklist
- [x] Logo oficial (CDN)
- [x] Colores: #97D700, #8E65D8, #1a1a1a
- [x] Tipografía: Encode Sans Expanded
- [x] Contraste WCAG AA verificado visualmente
- [x] lang="en" en todos los documentos
```

## Notas importantes

- Los mockups son **propuestas de diseño**, no código de producción
- Stack real de SM2 es Bootstrap 3 / CoffeeScript — los mockups son para presentar al equipo
- Si el scope incluye rutas con `noSession: true`, generar el mockup desde el source estático
- Tailwind CDN es solo para mockups — en producción usaría el build de Tailwind
- Nunca usar verde `#97D700` sobre morado `#8E65D8` directamente (bajo contraste WCAG)
