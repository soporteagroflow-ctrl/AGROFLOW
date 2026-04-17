# AgroFlow Frontend

Frontend Expo React Native para la operacion diaria de AgroFlow.

## Stack

- Expo
- React Native
- Expo Router
- Zustand
- AsyncStorage

## Estructura

- `app/`: rutas y pantallas
- `src/api.ts`: integracion con backend
- `src/store.ts`: sesion y usuario
- `src/offline.ts`: cache y sincronizacion offline
- `src/theme.ts`: tokens visuales

## Variable requerida

```env
EXPO_PUBLIC_BACKEND_URL=http://localhost:8000
```

## Ejecutar

```powershell
npm install
npx expo start
```

## Funcionalidades actuales

- login con Google
- dashboard operativo
- gestion de ganado
- gestion de potreros
- finanzas
- alertas por reglas
- soporte offline basico

## Nota

Este frontend debe reflejar el producto actual. No debe comunicar funciones de IA que no existan en el backend.
