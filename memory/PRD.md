# AgroFlow - Gestión Ganadera Inteligente

## PRD v2.0.0

### Rebrand: RanchoPro → AgroFlow
- Logo personalizado con vaca geométrica + flechas de crecimiento
- Nuevo nombre, slug y esquema de app

### Arquitectura
- Frontend: Expo SDK 54 + expo-router
- Backend: FastAPI + MongoDB + slowapi (rate limiting)
- Mapas: OpenStreetMap + Esri Satellite (NDVI)
- Alertas: Motor basado en reglas (cero costo)
- Auth: Emergent Google OAuth
- Offline: AsyncStorage + NetInfo + cola de sync

### Seguridad (Fase 1)
- Rate limiting: 10 req/min en auth, 20 req/min en photos
- Sanitización de inputs (strip HTML, limit length)
- Audit logging de todas las acciones críticas
- Solo owners pueden ver audit logs
- Validación de tamaño de fotos (máx 5MB)

### Funcionalidades v2.0

1. **Auth**: Google OAuth + sesiones 7 días
2. **Dashboard**: KPIs, gráficos, alertas urgentes, modo offline
3. **Ganado**: CRUD + salud + peso + campos reproductivos + **FOTOS**
4. **Potreros**: Lista/Mapa/**NDVI Satelital**
5. **Alertas**: Vacunación, parto, saturación, pasto, revisión
6. **NDVI**: Vista satelital Esri + recomendaciones
7. **Offline**: Caché + cola + sync automático
8. **Finanzas**: Ingresos/gastos + **EXPORTAR CSV**
9. **Exportar**: CSV de animales y finanzas con headers español
10. **Fotos**: Subir/ver/eliminar fotos de animales (base64)
11. **Auditoría**: Log de acciones (solo owners)
12. **Perfil**: Config finca + controles sync

### API Endpoints (28 total)
Auth (4), Animals (5), Health (2), Weight (2), Photos (3), Paddocks (4), Finance (4), Dashboard (1), Alerts (1), NDVI (1), Sync (1), Export (2), Audit (1), Seed (1)

### Cero Costos de IA
- Sin integraciones LLM
- Motor de alertas basado en reglas
- NDVI derivado de datos de campo
