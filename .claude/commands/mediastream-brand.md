---
name: mediastream-brand
description: >
  Guardian of Mediastream's brand identity (mediastream.co). Use this skill ALWAYS when creating, reviewing, or editing ANY content, design, document, presentation, code UI, social media post, email, proposal, or communication for or about Mediastream. Triggers include: any mention of "Mediastream", requests to create materials "for Mediastream", branding reviews, logo usage questions, color/font decisions for Mediastream projects, copy writing for Mediastream, or any deliverable that will carry the Mediastream name. Also triggers on: "¿cómo usamos el logo?", "colores de Mediastream", "tipografía de la marca", "paleta de colores", "guía de marca", "brand guidelines". Apply these rules proactively — even if the user doesn't mention brand explicitly, if the output is for Mediastream, enforce the guidelines.
---

# Mediastream Brand Guardian

Mediastream (mediastream.co) es una empresa mediatech latinoamericana fundada en 2007, líder en soluciones de streaming audio y video, OTT, podcasting, analítica y publicidad. Opera en LATAM y Europa con más de 300 clientes.

**Ante cualquier duda de marca:** contactar al equipo de marketing de Mediastream, o consultar https://www.mediastream.co/mediastream-brand-guidelines

---

## 1. IDENTIDAD DE MARCA

### Nombre y escritura
- ✅ Correcto: **Mediastream** (una palabra, M mayúscula, resto minúscula)
- ❌ Incorrecto: `MEDIASTREAM`, `Media Stream`, `mediastream`, `MediaStream`
- En contexto técnico o URL: `mediastream.co`

### Tagline / Misión
- Misión central: *"Transformar la manera en que el contenido es consumido, simplificando la complejidad técnica."*
- Tono: Profesional pero accesible, experto y confiable, orientado a soluciones y resultados
- Idiomas: español, inglés y portugués con igual calidad

---

## 2. LOGO Y ASSETS OFICIALES

| Asset | URL |
|-------|-----|
| **Logo principal** | `https://cdn.prod.website-files.com/6584479d07aff3fd2a2570e2/6584479d07aff3fd2a25712e_Mediastream-Brand.svg` |
| **Logo "Mediastream Platform"** | `https://cdn.prod.website-files.com/6584479d07aff3fd2a2570e2/6584479d07aff3fd2a2576a2_Mediastream%20Platform.svg` |
| **Imagen mockup Platform** | `https://cdn.prod.website-files.com/6584479d07aff3fd2a2570e2/6584479d07aff3fd2a2575d4_Platform-Mockup-audio-video-930%2520(2)-p-1080.png` |
| **"We are Mediatech"** | `https://cdn.prod.website-files.com/6584479d07aff3fd2a2570e2/6584479d07aff3fd2a2574d1_Mediastream-We-are-Mediatech.svg` |

### Uso correcto
- Usar siempre los archivos oficiales
- Mantener proporciones originales — **nunca distorsionar**
- Versión negativa/blanca sobre fondos oscuros
- Tamaño mínimo digital: 120px de ancho

### ❌ Prohibido
- Cambiar colores del logo
- Añadir efectos (sombras, brillos, gradientes sobre el logo)
- Usar versiones recreadas a mano

---

## 3. PALETA DE COLORES OFICIAL

| Nombre | HEX | Uso principal |
|--------|-----|---------------|
| **Mediastream Green** | `#97D700` | Color primario, CTAs, highlights, acentos de energía |
| **Mediastream Purple** | `#8E65D8` | Color secundario, fondos de marca, headers, gradientes |
| **Black** | `#1a1a1a` | Texto principal, fondos oscuros, elementos neutros |
| **White** | `#FFFFFF` | Fondos, texto sobre oscuro |

### Combinaciones aprobadas
- Fondo Purple `#8E65D8` + texto blanco → headers, hero sections
- Fondo blanco + texto Black → documentos, cuerpo de texto
- Green `#97D700` + fondo oscuro → CTAs, badges
- Fondo Black `#1a1a1a` + texto blanco + acento Green → **modo oscuro / presentaciones premium**

### Reglas
- Usar **únicamente** estos 4 colores y sus variaciones de opacidad
- El verde `#97D700` para llamadas a la acción y puntos de énfasis
- El morado `#8E65D8` define el ambiente de marca
- No usar el verde sobre el morado directamente (bajo contraste)

---

## 4. TIPOGRAFÍA OFICIAL

Fuente exclusiva: **Encode Sans Expanded** — Google Fonts: https://fonts.google.com/specimen/Encode+Sans+Expanded

| Peso | Uso |
|------|-----|
| **Light** | Texto largo, cuerpo de artículos, notas al pie |
| **Regular** | Cuerpo de texto estándar, párrafos |
| **SemiBold** | Subtítulos, énfasis, labels, botones |
| **Black** | Títulos principales (H1, H2), hero headlines |

- Fallback web: `'Encode Sans Expanded', 'Helvetica Neue', Arial, sans-serif`
- No mezclar con otras fuentes (excepción: monospace técnica en código)

---

## 5. INTERFACES / UI

```js
// tailwind.config.js
theme: {
  extend: {
    colors: {
      'ms-green':  '#97D700',
      'ms-purple': '#8E65D8',
      'ms-black':  '#1a1a1a',
    },
    fontFamily: {
      sans: ['"Encode Sans Expanded"', 'Helvetica Neue', 'Arial', 'sans-serif'],
    },
  }
}
```

- Framework JS: React 18+ con hooks modernos
- CSS: Tailwind CSS
- Documentación de componentes: Storybook

---

## 6. CHECKLIST DE REVISIÓN

- [ ] Nombre escrito correctamente ("Mediastream")
- [ ] Logo oficial, sin modificaciones
- [ ] Colores dentro de la paleta aprobada
- [ ] Tipografía Encode Sans Expanded
- [ ] Tono: profesional, claro, orientado a resultados
- [ ] Contraste accesible (WCAG AA)
- [ ] URL incluida: `mediastream.co`

**Referencia oficial:** https://www.mediastream.co/mediastream-brand-guidelines
