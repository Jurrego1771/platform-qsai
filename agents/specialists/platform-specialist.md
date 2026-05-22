# Specialist: Platform / Settings

## Dominio

Configuración general de la plataforma. Dashboard, cuenta, players, encoders, usuarios, webhooks.

## Features críticos

- Dashboard principal: acceso y carga correcta
- Settings de cuenta: configuración básica
- Gestión de usuarios: invitar, ver permisos
- API tokens: generar y ver
- Webhooks: configurar endpoints
- Player settings: configuración visual del player

## Flujos críticos a probar

1. **Dashboard:**
   - Verificar que carga sin errores (404, 500, JS errors)
   - Verificar que los widgets tienen datos o empty states correctos

2. **Settings generales:**
   - Navegar a `/settings/media`, `/settings/player`, `/settings/encoders`
   - Verificar que cargan sin errores
   - Verificar que los formularios tienen labels y help-blocks correctos (UX)

3. **Gestión de API tokens `/settings/api`:**
   - Verificar que se pueden ver los tokens existentes
   - (No generar nuevos tokens en QA a menos que sea necesario)

## Revenue impact: No

## Umbral de cobertura: 60%
