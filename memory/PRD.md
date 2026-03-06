# RanchoPro - Gestión Ganadera Inteligente

## Product Requirements Document (PRD) v1.1

### Concepto
- **App**: RanchoPro - Gestión ganadera móvil todo-en-uno
- **Usuarios**: Ganaderos pequeños y medianos, veterinarios
- **Costo de operación**: CERO (sin IA de pago, mapas gratuitos)

### Arquitectura
- Frontend: React Native Expo SDK 54 + expo-router
- Backend: Python FastAPI + MongoDB
- Mapas: OpenStreetMap + Esri Satellite (NDVI)
- Alertas: Motor basado en reglas (cero costo)
- Auth: Emergent Google OAuth
- Offline: AsyncStorage + NetInfo + cola de sync

### Funcionalidades v1.1

1. **Dashboard**: KPIs, gráficos, alertas urgentes, resumen financiero, modo offline
2. **Gestión de Ganado**: CRUD completo, historial sanitario, peso, campos reproductivos
3. **Gestión de Potreros**: 3 vistas (Lista/Mapa/NDVI Satelital), GPS, estado pasto
4. **Sistema de Alertas**: Vacunación pendiente, parto próximo, potrero saturado, pasto deteriorado, revisión pendiente
5. **Análisis NDVI Satelital**: Vista satelital Esri, overlay de salud, recomendaciones
6. **Modo Offline**: Caché automático, cola de operaciones, sync al reconectar
7. **Finanzas**: Ingresos/gastos por categoría, resumen
8. **Perfil**: Config finca, controles de sync, estado de conexión

### API Endpoints
- Auth: /api/auth/session, /api/auth/me, /api/auth/logout, /api/auth/profile
- Animals: /api/animals (CRUD), /api/animals/{id}/health, /api/animals/{id}/weight
- Paddocks: /api/paddocks (CRUD)
- Finance: /api/finances (CRUD), /api/finances/summary
- Dashboard: /api/dashboard
- **Alerts**: /api/alerts (basado en reglas)
- **NDVI**: /api/ndvi (datos satelitales)
- **Sync**: /api/sync (sincronización offline)
- Seed: /api/seed

### IA DESACTIVADA
- Sin costo operativo
- Motor de alertas 100% basado en reglas
- NDVI derivado de datos de campo
