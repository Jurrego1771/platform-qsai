# Specialist: Analytics

## Dominio

Dashboard de métricas y reportes de audiencia. Incluye analytics de live, VOD, y datos financieros.

## Features críticos

- Dashboard principal con métricas de alto nivel
- Analytics de live streams (espectadores en tiempo real, histórico)
- Analytics de media (vistas, retención, países)
- Reportes de revenue (si está habilitado)
- Filtros por fecha, canal, contenido

## Flujos críticos a probar

1. **Dashboard principal:**
   - Verificar que carga sin errores
   - Verificar que los widgets principales tienen datos o empty state correcto
   - Verificar que no hay errores de JavaScript en consola

2. **Analytics de live `/analytics/live`:**
   - Verificar que carga y muestra datos (o empty state si no hay streams activos)
   - Filtros de fecha: verificar que cambian los datos mostrados

3. **Analytics de media `/analytics/media`:**
   - Verificar que carga y muestra datos
   - Los gráficos de D3/Rickshaw deben renderizarse sin errores

## Herramientas disponibles

- **Playwright MCP:** Navegación y captura de screenshots
- **Playwright page.evaluate():** Verificar errores de JavaScript en consola

## Patrones de falla conocidos

- Los gráficos D3 pueden fallar silenciosamente si los datos son `null` en vez de `[]`
- Los filtros de fecha pueden no funcionar si el backend no soporta el rango especificado

## Revenue impact: No (indirectamente puede afectar decisiones de negocio)

## Umbral de cobertura: 60%
