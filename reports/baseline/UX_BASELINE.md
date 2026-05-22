# UX Baseline — Login Flow — 2026-05-22

**Score UX:** 50/100
**Páginas auditadas:** 2 live + 1 análisis estático (`/login/totp`)
**Hallazgos totales:** 11 (🔴 0 críticos · 🟡 5 medios · 🟢 3 cosméticos) + 4 violaciones WCAG
**Accesibilidad:** 4 tipos de violación WCAG (critical: 1, serious: 2, moderate: 1, minor: 0)
**Revenue impact:** No (flujo pre-autenticación)

---

## Resumen Ejecutivo

El flujo de login de Mediastream Platform presenta una UX sólida en su estructura visual y layout dos columnas, pero acumula **deuda técnica sistémica** en tres dimensiones: accesibilidad WCAG, prevención de errores en formularios y consistencia de idioma/nomenclatura.

El hallazgo más impactante es que **ninguna de las tres páginas de login tiene `<html lang="en">`**, los dos encabezados principales son `<h3>` (sin `<h1>` en el documento), y todas las imágenes carecen de `alt`. Estas son las violaciones más frecuentes en auditorías de acceso y son **triviales de corregir** (todos los fixes son `xs` — una sola línea cada uno). No hay un solo hallazgo de esfuerzo `m` o `l` en este módulo: **todo el backlog puede cerrarse en un único PR de 30 minutos**.

Un patrón recurrente a través de las tres páginas: los campos de email usan `type="text"` en lugar de `type="email"`, desactivando validación nativa del browser y el teclado optimizado en mobile. El botón de Google Sign-In renderiza en español por ausencia del atributo `data-locale`, rompiendo la consistencia del idioma.

---

## Hallazgos por Severidad

### 🔴 Críticos (bloquean tareas)

Ninguno detectado.

---

### 🟡 Medios (generan fricción)

| Página | Heurística | Hallazgo | Esfuerzo | Revenue |
|--------|-----------|----------|---------|---------|
| `/` | H5 — Error Prevention | Campo Email con `type="text"`, sin validación nativa | xs | No |
| `/` | H9 — Error Recovery | Error "Incorrect username or password" sin CTA de recuperación inline | xs | No |
| `/` | H2 — Real World | Botón Google renderiza en español ("Acceder con Google") | xs | No |
| `/login/reset-password` | H5 — Error Prevention | Email `type="text"` + `tabindex` roto | xs | No |
| `/login/totp` | H5 — Error Prevention | Código TOTP sin `inputmode="numeric"` ni placeholder | xs | No |

#### H5 — `/` — Campo Email sin validación de email nativa

**Problema:**
El campo de email del formulario principal usa `type="text"`. Esto elimina la validación de formato de email nativa del browser y en mobile no invoca el teclado con `@` prominente.

**HTML actual:**
```html
<input type="text" class="form-control" placeholder="Email" name="username" tabindex="1">
```

**Propuesta Bootstrap 3:**
```html
<input type="email" class="form-control" placeholder="Email" name="username" autocomplete="email">
```

**Justificación:** H5 Error Prevention — `type="email"` activa validación de formato antes del submit, reduce errores de tipeo (falta de `@`, dominio incorrecto) y en mobile presenta el teclado con `@` destacado. `autocomplete="email"` permite al browser/gestores de contraseñas pre-llenar el campo.

---

#### H9 — `/` — Mensaje de error sin CTA de recuperación

**Problema:**
El error "Incorrect username or password" aparece sobre el formulario como alerta sin indicar qué acción tomar. El enlace "Forgot your password?" está al pie del formulario, visualmente desconectado del mensaje de error.

**HTML actual:**
```html
<div class="alert alert-error" sm="global-alert">Incorrect username or password.</div>
```

**Propuesta Bootstrap 3:**
```html
<div class="alert alert-danger" sm="global-alert">
  <strong>Incorrect email or password.</strong>
  <a href="/login/reset-password" class="alert-link" style="margin-left: 8px;">Forgot your password?</a>
</div>
```

**Justificación:** H9 Help Recover — la heurística requiere que los mensajes de error sugieran una solución constructiva. El CTA inline elimina la búsqueda del enlace de recuperación y corrige además la clase a `alert-danger` (Bootstrap 3 estándar).

---

#### H2 — `/` — Google Sign-In en español

**Problema:**
El botón de Google Sign-In renderiza "Acceder con Google" porque no hay atributo `data-locale`. La locale la determina el browser del usuario, causando inconsistencia de idioma.

**HTML actual:**
```html
<div id="link-google" class="g_id_signin" data-size="large" data-logo_alignment="center" data-width="300" data-type="standard" title="To use this login method, you need to link your google account...">
```

**Propuesta Bootstrap 3:**
```html
<div id="link-google" class="g_id_signin" data-size="large" data-logo_alignment="center" data-width="300" data-type="standard" data-locale="en" title="Requires a linked Google account. Link it in My Account → Integrations.">
```

**Justificación:** H2 Match Real World — `data-locale="en"` fuerza el texto "Sign in with Google" independientemente del idioma del browser, manteniendo coherencia con el resto de la interfaz en inglés.

---

#### H5 — `/login/reset-password` — Email `type="text"` y tabindex erróneo

**Problema:**
Mismo problema de `type="text"` que el login principal. Adicionalmente, `tabindex="3"` en el botón de submit salta el valor `2` (inexistente), rompiendo el orden natural de tabulación por teclado.

**HTML actual:**
```html
<input type="text" class="form-control" placeholder="Email" name="email" tabindex="1">
<input type="submit" class="btn btn-primary btn-block reset-btn" tabindex="3" value="Reset password">
```

**Propuesta Bootstrap 3:**
```html
<input type="email" class="form-control" placeholder="Email" name="email" autocomplete="email">
<input type="submit" class="btn btn-primary btn-block reset-btn" value="Reset password">
```

**Justificación:** H5 Error Prevention — eliminar los `tabindex` arbitrarios restaura el orden de tabulación natural del DOM. El cambio a `type="email"` añade validación nativa.

---

#### H5 — `/login/totp` — Código sin teclado numérico ni formato especificado

**Problema:**
El campo de código TOTP usa `type="text"` sin `inputmode="numeric"`, mostrando el teclado alfanumérico en mobile para un campo que solo acepta dígitos. El `placeholder=""` no orienta al usuario sobre el formato esperado.

**HTML actual (source):**
```html
<input autofocus="true" type="text" class="form-control" placeholder="" name="code" tabindex="1">
```

**Propuesta Bootstrap 3:**
```html
<input autofocus="true" type="text" inputmode="numeric" pattern="[0-9]*" class="form-control" placeholder="000000" name="code" autocomplete="one-time-code">
<span class="help-block">Enter the 6-digit code from your authenticator app.</span>
```

**Justificación:** H5 Error Prevention — `inputmode="numeric"` invoca el teclado numérico en mobile (iOS/Android), reduciendo errores de escritura en un campo sensible con tiempo de expiración. `autocomplete="one-time-code"` permite al OS capturar automáticamente el código del SMS en dispositivos que soporten esta feature.

---

### 🟢 Cosméticos (deuda menor)

| Página | Heurística | Hallazgo | Esfuerzo |
|--------|-----------|----------|---------|
| `/` | H10 — Help | Requisito de cuenta Google vinculada solo en tooltip | xs |
| `/` | H4 — Consistency | Clase `alert-error` (Bootstrap 2) en lugar de `alert-danger` (Bootstrap 3) | xs |
| `/login/totp` | H2 — Real World | Label "Authentication code" sin especificación de formato (6 dígitos) | xs |

---

## Accesibilidad WCAG 2.1

### Violaciones críticas y serias

| Regla axe | WCAG | Páginas afectadas | Elementos | Fix Bootstrap 3 |
|-----------|------|------------------|-----------|----------------|
| `image-alt` | 1.1.1 Non-text Content | `/`, `/login/reset-password` | 2 | Agregar `alt="Mediastream Platform"` al logo; `alt=""` a la imagen decorativa |
| `html-has-lang` | 3.1.1 Language of Page | `/`, `/login/reset-password` | 1 | `<html lang="en">` en todas las views de login |
| `tabindex` | 2.4.3 Focus Order | `/`, `/login/reset-password` | 3 / 2 | Eliminar todos los atributos `tabindex` del formulario |
| `page-has-heading-one` | Best Practice | `/`, `/login/reset-password` | 1 | Cambiar `<h3>` a `<h1 class="h3">` |

### Resumen por página

| Página | Critical | Serious | Moderate | Minor | Nota |
|--------|---------|---------|----------|-------|------|
| `/` | 1 | 2 | 1 | 0 | 4 violaciones |
| `/login/reset-password` | 1 | 2 | 1 | 0 | Mismas 4 violaciones |
| `/login/totp` | — | — | — | — | No crawleado (requiere sesión) |

---

## Screenshots

### `/` — Login principal

**Desktop (1280×800):**
![screenshot desktop](screenshots/login-main-desktop.png)

**Mobile (375×812):**
![screenshot mobile](screenshots/login-main-mobile.png)

---

### `/login/reset-password` — Recuperar contraseña

**Desktop (1280×800):**
![screenshot desktop](screenshots/login-reset-password-desktop.png)

**Mobile (375×812):**
![screenshot mobile](screenshots/login-reset-password-mobile.png)

---

## Backlog Priorizado

| # | Página | Tipo | Heurística/WCAG | Severidad | Esfuerzo | Revenue | Quick win |
|---|--------|------|-----------------|-----------|---------|---------|-----------|
| 1 | `/` | axe | WCAG 1.1.1 | 🔴 critical | xs | No | Sí |
| 2 | `/` | axe | WCAG 3.1.1 | 🟡 serious | xs | No | Sí |
| 3 | `/` | axe | WCAG 2.4.3 | 🟡 serious | xs | No | Sí |
| 4 | `/` | Nielsen | H5 — Error Prevention | 🟡 medio | xs | No | Sí |
| 5 | `/` | Nielsen | H9 — Error Recovery | 🟡 medio | xs | No | Sí |
| 6 | `/` | Nielsen | H2 — Real World | 🟡 medio | xs | No | Sí |
| 7 | `/login/reset-password` | Nielsen | H5 — Error Prevention | 🟡 medio | xs | No | Sí |
| 8 | `/login/totp` | Nielsen | H5 — Error Prevention | 🟡 medio | xs | No | Sí |
| 9 | `/` | axe | Best Practice | 🟢 moderate | xs | No | Sí |
| 10 | `/` | Nielsen | H10 — Help | 🟢 cosmético | xs | No | Sí |
| 11 | `/` | Nielsen | H4 — Consistency | 🟢 cosmético | xs | No | Sí |
| 12 | `/login/totp` | Nielsen | H2 — Real World | 🟢 cosmético | xs | No | Sí |

**Quick win** = severity >= 2 Y effort = xs/s. En este módulo, **todos los 12 hallazgos son quick wins** — todos son `xs`.

---

## Próximos pasos sugeridos

**PR único recomendado** — todos los fixes son `xs`, sin cambios de lógica de servidor:

1. **`<html lang="en">`** en `views/index.coffee`, `views/login_reset_password.coffee`, `views/login_totp.coffee`, `views/login_reset_password_confirm.coffee` — 4 líneas
2. **`alt` attributes** en las imágenes del layout de login (logo + icono decorativo) — 2 líneas por archivo
3. **`type="email"`** en campos de email en `/` y `/login/reset-password` — 2 líneas
4. **Eliminar `tabindex` arbitrarios** en todos los formularios de login — 5 líneas
5. **`data-locale="en"`** en el widget de Google Sign-In — 1 atributo
6. **`alert-error` → `alert-danger`** en los 4 templates de login — 4 líneas
7. **`<h3>` → `<h1 class="h3">`** en los títulos principales — 4 líneas
8. **`inputmode="numeric"` + placeholder + help-block** en campo TOTP — 2 líneas
9. **CTA inline en error de credenciales** — 1 línea en el template
10. **help-block** de requisito Google bajo el botón — 3 líneas

Impacto estimado del PR: **score UX 50 → ~90/100** (elimina todas las violaciones axe y todos los hallazgos de severidad ≥ 2).
