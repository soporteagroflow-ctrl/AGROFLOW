# RanchoPro - Gestión Ganadera Inteligente

## Product Requirements Document (PRD)

### 1. Concepto del Producto
- **Nombre**: RanchoPro
- **Problema**: Los ganaderos pequeños y medianos carecen de herramientas digitales accesibles para gestionar integralmente su finca
- **Propuesta de valor**: Plataforma móvil todo-en-uno con IA, mapas y analítica para la gestión ganadera
- **Usuarios**: Ganaderos (propietarios), trabajadores, veterinarios

### 2. Arquitectura Técnica
- **Frontend**: React Native (Expo SDK 54) con expo-router
- **Backend**: Python FastAPI
- **Base de datos**: MongoDB
- **Mapas**: OpenStreetMap (Leaflet)
- **IA**: GPT-4o-mini via Emergent LLM Key
- **Auth**: Emergent Google OAuth

### 3. Funcionalidades Implementadas (MVP)

#### 3.1 Autenticación
- Login con Google (Emergent OAuth)
- Sesiones con tokens (7 días)
- Roles: propietario, trabajador, veterinario

#### 3.2 Dashboard (Panel Principal)
- KPIs: Total ganado, potreros, peso promedio, rentabilidad
- Gráfico de distribución del hato (PieChart)
- Estado de potreros y pasto
- Resumen financiero
- Consejo IA diario
- Datos de ejemplo (seed)

#### 3.3 Gestión de Ganado
- Registro de animales (nombre, arete, raza, tipo, sexo, peso)
- Historial sanitario (vacunas, tratamientos, revisiones, enfermedades)
- Control de peso con registros históricos
- Filtros por tipo (vaca, toro, ternero, novilla)
- Búsqueda por nombre, arete o raza
- Asignación a potreros

#### 3.4 Gestión de Potreros
- Registro con coordenadas GPS
- Visualización en mapa OpenStreetMap (Leaflet)
- Estado del pasto (bueno, regular, malo)
- Estado del potrero (activo, en descanso, mantenimiento)
- Capacidad y conteo de animales
- Tipo de pasto (Brachiaria, Estrella, Guinea, etc.)
- Toggle vista mapa/lista

#### 3.5 Gestión Financiera
- Registro de ingresos y gastos
- Categorías: venta ganado, venta leche, alimento, veterinario, etc.
- Resumen con totales de ingresos, gastos y ganancia
- Eliminación de registros

#### 3.6 Inteligencia Artificial
- Predicción de peso del ganado
- Alertas sanitarias basadas en historial
- Optimización de rotación de potreros
- Consejo IA general

#### 3.7 Perfil y Configuración
- Información del usuario
- Configuración del nombre de finca
- Herramientas de IA
- Cierre de sesión

### 4. API Endpoints
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | /api/auth/session | Intercambiar session_id por token |
| GET | /api/auth/me | Obtener usuario actual |
| POST | /api/auth/logout | Cerrar sesión |
| PUT | /api/auth/profile | Actualizar perfil |
| GET/POST | /api/animals | Listar/Crear animales |
| GET/PUT/DELETE | /api/animals/{id} | CRUD animal individual |
| GET/POST | /api/animals/{id}/health | Registros sanitarios |
| GET/POST | /api/animals/{id}/weight | Registros de peso |
| GET/POST | /api/paddocks | Listar/Crear potreros |
| GET/PUT/DELETE | /api/paddocks/{id} | CRUD potrero individual |
| GET/POST | /api/finances | Listar/Crear registros financieros |
| DELETE | /api/finances/{id} | Eliminar registro financiero |
| GET | /api/finances/summary | Resumen financiero |
| GET | /api/dashboard | KPIs del dashboard |
| POST | /api/ai/predict | Predicciones IA |
| POST | /api/seed | Cargar datos de ejemplo |

### 5. Modelo de Negocio (Propuesta)
- **Plan Gratuito**: Hasta 50 animales, 3 potreros, dashboard básico
- **Plan Premium ($9.99/mes)**: Animales ilimitados, IA avanzada, reportes, multiusuario
- **Plan Empresarial**: API personalizada, soporte dedicado, integraciones IoT

### 6. Innovaciones Competitivas (Roadmap)
- Gemelo digital de la finca
- Simulador de rotación de pastos
- Análisis satelital NDVI
- Integración IoT (collares GPS, sensores)
- Trazabilidad blockchain
- Mercado ganadero digital
- Reconocimiento de animales por imagen
- Visión por dron
- Sistema de alertas (parto, vacunación, fuga)
