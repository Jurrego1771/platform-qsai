# Specialist: Customer / Payments

## ⚠️ Revenue Impact: CRÍTICO

Módulo que gestiona los clientes de la plataforma y sus pagos. Umbral de cobertura: **70%**.

## ⛔ Restricción crítica en QA

**NUNCA ejecutar transacciones reales de pago.** Solo verificar:
- Que los formularios de pago se renderizan correctamente
- Que los estados de suscripción se muestran correctamente
- Que los flujos de gestión de customer funcionan
- Que los reportes financieros muestran datos

No interactuar con botones de "Cobrar", "Procesar pago", o "Activar suscripción" en ambientes que conecten con Stripe/PayPal/MercadoPago reales.

## Dominio

- Gestión de clientes (CRUD: crear, listar, ver detalle)
- Suscripciones y planes
- Reportes de pagos
- Access restrictions para contenido restringido

## Flujos críticos a probar

1. **CRUD de customer:**
   - Crear customer con email y datos básicos
   - Verificar que aparece en la lista
   - Acceder al detalle, verificar datos
   - Verificar que la deactivación funciona (no hay DELETE real en customers)

2. **Reporte de pagos `/customer/payments`:**
   - Verificar que la página carga correctamente
   - Verificar que los filtros de fecha funcionan
   - Verificar que los datos se muestran (aunque sean vacíos en el ambiente de QA)

3. **Access restrictions:**
   - Crear una restricción de acceso
   - Asignarla a un media
   - Verificar que el embed player bloquea el contenido correctamente

## Herramientas disponibles

- **Playwright MCP:** Navegación y verificación de formularios y reportes
- **Bash (curl):** Verificar API response de customer después de crear

## Revenue impact: SÍ — CRÍTICO

## Umbral de cobertura: 70%
