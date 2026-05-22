# Redesign Proposals — Login Flow — 2026-05-22

Generado por `/redesign-proposal login` · Brand: Mediastream v1

## Score antes/después

| Métrica | Antes (`/qa-ux login`) | Después (estimado) |
|---------|----------------------|-------------------|
| UX Score | 50/100 | ~90/100 |
| Violaciones WCAG | 4 tipos · 8 instancias | 0 |
| Hallazgos Nielsen medios | 5 | 0 |
| Hallazgos Nielsen cosméticos | 3 | 0 |
| Revenue impact | No | No |

## Mockups generados

| Página | Archivo | Fixes aplicados | Notas |
|--------|---------|----------------|-------|
| `/` — Login principal | [login-main-mockup.html](login-main-mockup.html) | 9 | Incluye demo toggle error state |
| `/login/reset-password` | [login-reset-password-mockup.html](login-reset-password-mockup.html) | 4 | Incluye estado éxito post-submit |
| `/login/totp` | [login-totp-mockup.html](login-totp-mockup.html) | 3 + bonus | 6 OTP boxes con auto-advance |

## Stack del mockup

```
Tailwind CSS CDN    — estilos (no instalar en SM2)
Encode Sans Expanded — Google Fonts (tipografía oficial)
Vanilla JS          — OTP auto-advance, demos interactivos
Sin dependencias npm — abrir directamente en browser
```

## Brand checklist

- [x] Logo oficial desde CDN (`Mediastream%20Platform.svg`)
- [x] Color primario CTA: `#97D700` (ms-green) sobre `#1a1a1a`
- [x] Color hero/gradiente: `#8E65D8` → `#1a1a1a` (140deg)
- [x] Tipografía: Encode Sans Expanded (Light/Regular/SemiBold/Black)
- [x] Nombre escrito correctamente: **Mediastream**
- [x] Contraste WCAG AA: verde sobre negro ✅ · blanco sobre morado ✅ · nunca verde sobre morado ✅
- [x] `lang="en"` en todos los documentos

## Mejoras bonus incluidas (no estaban en proposals.json)

| Mejora | Página | Justificación |
|--------|--------|--------------|
| Password show/hide toggle | `/` | Reduce errores de tipeo en campo crítico (H5) |
| Trust badges (300+ clients, 18y, LATAM) | `/` hero | Reduce ansiedad en login de nuevos usuarios |
| Mockup Platform en panel hero | `/` | Demuestra el producto antes del acceso |
| Steps de recuperación (1-2-3) | `/reset-password` hero | H10 — guía contextual del flujo |
| Estado de éxito post-submit | `/reset-password` | H1 — feedback claro de que el email se envió |
| 6 OTP boxes individuales con auto-advance | `/totp` | H5 — interfaz estándar moderna para códigos TOTP |
| Paste support del código SMS | `/totp` | H7 — eficiencia para usuarios con SMS OTP |
| Lista de apps recomendadas | `/totp` hero | H10 — documentación contextual |

## Próximo paso

Para implementar en SM2 (Bootstrap 3 / CoffeeScript):
1. Usar los `proposed_html` del `context/proposals.json` — son los fixes mínimos BS3
2. Los mockups Tailwind son la **visión target** para una migración futura de stack
3. Los cambios BS3 son todos `xs` effort — se pueden hacer en un PR en < 1 hora
