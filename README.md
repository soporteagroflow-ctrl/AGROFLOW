# AgroFlow

Aplicacion full-stack para gestion ganadera con backend en FastAPI y frontend en Expo React Native.

## Vision general

- `backend/`: API FastAPI conectada a MongoDB
- `frontend/`: app movil/web con Expo
- `backend/tests/`: pruebas de integracion del backend

## Backend

Archivo principal actual:

- `backend/server.py`

Dominios ya implementados:

- auth
- ganado
- salud
- pesos
- potreros
- finanzas
- dashboard
- alertas por reglas
- NDVI simulado
- sync offline
- fotos
- export CSV
- auditoria

Variables de entorno esperadas:

- `MONGO_URL`
- `DB_NAME`

## Frontend

Piezas clave:

- `frontend/app/`: rutas y pantallas
- `frontend/src/api.ts`: cliente HTTP y endpoints
- `frontend/src/store.ts`: estado global de sesion
- `frontend/src/offline.ts`: cache local y cola offline

Variable de entorno esperada:

- `EXPO_PUBLIC_BACKEND_URL`

## Como ejecutar

### Backend

```powershell
cd backend
pip install -r requirements.txt
uvicorn server:app --reload --host 0.0.0.0 --port 8000
```

Antes de iniciar, configura `MONGO_URL` y `DB_NAME`.

### Frontend

```powershell
cd frontend
npm install
npx expo start
```

Antes de iniciar, configura `EXPO_PUBLIC_BACKEND_URL`.

## Pruebas

```powershell
cd backend
pytest
```

## Estado actual

La app ya es funcional, pero esta en una etapa intermedia:

- backend aun monolitico en `backend/server.py`
- documentacion antes inconsistente
- deuda tecnica pendiente de modularizacion

## Proxima fase sugerida

- separar routers, schemas, services y repositories en el backend
- tipar mejor contratos entre frontend y backend
- documentar variables de entorno por ambiente
