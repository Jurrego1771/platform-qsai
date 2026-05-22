# Mapeo: Archivo Cambiado → Módulo → Specialist → Rutas

Usado por `agents/shared/01-diff-reader.md` para determinar qué módulos auditar cuando cambia un archivo en un PR.

## Cambios Globales (activan TODOS los módulos)

```
views/layout.coffee         → TODOS LOS MÓDULOS
public/css/bs3.css          → TODOS LOS MÓDULOS
public/css/theme.css        → TODOS LOS MÓDULOS
src/server/middleware/      → TODOS LOS MÓDULOS
src/server/middleware/auth.js → TODOS LOS MÓDULOS
app.js                      → TODOS LOS MÓDULOS
config.js                   → TODOS LOS MÓDULOS
```

---

## Media

**Specialist:** `agents/specialists/media-specialist.md`

**Revenue impact:** No | **Umbral de cobertura:** 60%

```
views/medias.coffee         → URL: /media
views/media.coffee          → URL: /media/:id
views/media/                → URL: /media/*
src/server/routes/media/    → URL: /media, /media/:id
src/server/services/media.js
src/server/services/media-ingest.js
public/css/media.css        → URL: /media, /media/:id
public/js/media.js          → URL: /media, /media/:id
```

**Rutas auditadas:**
- `/media` — Lista de videos/audios
- `/media/create` — Crear nuevo media
- `/media/:media_id` — Detalle y edición de media

---

## Live Stream

**Specialist:** `agents/specialists/live-specialist.md`

**Revenue impact:** Parcial | **Umbral de cobertura:** 60%

```
views/live_streams.coffee   → URL: /live-stream
views/live_stream.coffee    → URL: /live-stream/:id
views/live-stream/          → URL: /live-stream/*
src/server/routes/live-stream/ → URL: /live-stream, /live-stream/:id
src/server/services/live-stream.js
public/js/live_stream.js    → URL: /live-stream, /live-stream/:id
```

**Rutas auditadas:**
- `/live-stream` — Lista de live streams
- `/live-stream/create` — Crear nuevo stream
- `/live-stream/:stream_id` — Detalle y configuración

---

## Ads (Publicidad)

**Specialist:** `agents/specialists/ads-specialist.md`

**Revenue impact:** SÍ — CRÍTICO | **Umbral de cobertura:** 80%

```
views/ads.coffee            → URL: /ad
views/ad.coffee             → URL: /ad/:id
views/ad/                   → URL: /ad/*
src/server/routes/ad/       → URL: /ad, /ad/:id
src/server/services/ad.js
public/js/ad.js             → URL: /ad, /ad/:id
```

**Rutas auditadas:**
- `/ad` — Lista de anuncios
- `/ad/:ad_id` — Detalle y configuración de ad

---

## Channel

**Specialist:** `agents/specialists/channel-specialist.md`

**Revenue impact:** No | **Umbral de cobertura:** 60%

```
views/channel.coffee        → URL: /channel, /channel/:id
views/channels.coffee       → URL: /channel
src/server/routes/channel/  → URL: /channel, /channel/:id
src/server/services/channel.js
```

**Rutas auditadas:**
- `/channel` — Lista de canales
- `/channel/:channel_id` — Detalle y configuración

---

## Show (Contenido episódico)

**Specialist:** `agents/specialists/show-specialist.md`

**Revenue impact:** No | **Umbral de cobertura:** 60%

```
views/show.coffee           → URL: /show/:id
views/shows.coffee          → URL: /show
src/server/routes/show/     → URL: /show, /show/:id
src/server/services/show.js
```

**Rutas auditadas:**
- `/show` — Lista de shows
- `/show/:show_id` — Detalle y gestión de temporadas/episodios

---

## Analytics

**Specialist:** `agents/specialists/analytics-specialist.md`

**Revenue impact:** No | **Umbral de cobertura:** 60%

```
views/analytics/            → URL: /analytics/*
src/server/routes/analytics/ → URL: /analytics/*
src/server/services/analytics.js
```

**Rutas auditadas:**
- `/analytics` — Dashboard principal
- `/analytics/live` — Analytics de live streams
- `/analytics/media` — Analytics de videos
- `/analytics/now` — Espectadores en tiempo real

---

## Customer / Payments

**Specialist:** `agents/specialists/customer-specialist.md`

**Revenue impact:** SÍ — CRÍTICO | **Umbral de cobertura:** 70%

```
views/customer.coffee       → URL: /customer/:id
views/customers.coffee      → URL: /customer
views/customer_payments.coffee → URL: /customer/payments
src/server/routes/customer/ → URL: /customer, /customer/:id
src/server/services/customer.js
```

**Rutas auditadas:**
- `/customer` — Lista de clientes
- `/customer/:customer_id` — Detalle de cliente
- `/customer/payments` — Reporte de pagos
- `/customer/analytics/financial` — Analytics financieros

---

## Settings / Platform

**Specialist:** `agents/specialists/platform-specialist.md`

**Revenue impact:** No | **Umbral de cobertura:** 60%

```
views/settings/             → URL: /settings/*
views/account.coffee        → URL: /account
views/dashboard.coffee      → URL: /dashboard
src/server/routes/settings/ → URL: /settings/*
src/server/routes/account/  → URL: /account
```

**Rutas auditadas:**
- `/dashboard` — Dashboard principal
- `/account` — Configuración de cuenta
- `/settings/media` — Config de medios
- `/settings/player` — Config de player
- `/settings/encoders` — Config de encoders
- `/settings/user` — Gestión de usuarios
- `/settings/api` — Tokens de API
- `/settings/webhook` — Webhooks
- `/settings/access-restrictions` — Restricciones de acceso

---

## Playlist

**Specialist:** `agents/specialists/media-specialist.md` (mismo que media)

**Revenue impact:** No | **Umbral de cobertura:** 60%

```
views/playlist.coffee       → URL: /playlist/:id
src/server/routes/playlist/ → URL: /playlist/:id
```

**Rutas auditadas:**
- `/playlist/:playlist_id` — Detalle y configuración de playlist

---

## Algoritmo de resolución en diff-reader

Cuando se procesa el diff de un PR:

1. Obtener lista de archivos con `gh pr diff <PR> --name-only`
2. Para cada archivo, buscar coincidencia en las reglas de este documento
3. Si el archivo es de la sección "Cambios Globales" → marcar TODOS los módulos
4. Si no hay coincidencia → ignorar el archivo (puede ser CI config, README, etc.)
5. Eliminar duplicados en la lista de módulos resultante
6. Cargar el specialist de cada módulo identificado

**Ejemplo:**
```
Archivo cambiado: src/server/routes/ad/detail.js
→ Módulo: ads
→ Specialist: ads-specialist.md
→ Rutas a auditar: /ad, /ad/:id
→ Revenue impact: true
→ Umbral: 80%
```
