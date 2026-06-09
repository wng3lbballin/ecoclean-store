# 🍃 EcoClean Store

Sistema ERP web para gestión de tienda de productos de limpieza.
**Stack:** Node.js + Express | PostgreSQL | React + Tailwind CSS | JWT + bcrypt | Docker

---

## Módulos

| Módulo | Descripción |
|--------|-------------|
| 📊 **Dashboard** | 6 indicadores en tiempo real + últimas ventas |
| 🧾 **Facturación** | Ventas con nº factura secuencial, cliente, estado de pago y ticket PDF |
| 📦 **Productos** | Catálogo con stock, categoría y alertas de inventario bajo |
| 🏷️ **Categorías** | Clasificación de productos con conteo |
| 👥 **Clientes** | Registro de clientes vinculados a facturas |
| 🚚 **Proveedores** | Registro de proveedores para compras |
| 📥 **Compras** | Reposición de inventario con aumento automático de stock |

---

## Roles

| Rol | Permisos |
|-----|----------|
| **admin** | Acceso total (todos los módulos, CRUD completo) |
| **vendedor** | Facturación, productos, clientes, proveedores (consulta + ventas) |
| **revisor** | Solo lectura: dashboard, productos, facturación, clientes |



---

## Demo en vivo

🔗 **[ecoclean-web.onrender.com](https://ecoclean-web.onrender.com)**

*(El plan gratuito de Render duerme el servicio tras inactividad. La primera carga tarda ~30s.)*

---

## Desarrollo local con Docker

```bash
docker-compose up --build
```

| Servicio | URL |
|----------|-----|
| Frontend | http://localhost:3000 |
| Backend | http://localhost:4000 |

---

## Desarrollo local manual

**Requisitos:** Node.js 18+, PostgreSQL 15+

```bash
# Backend
cd backend
cp .env.example .env
npm install
npm run dev

# Frontend
cd frontend
npm install
npm start
```

La base de datos y tablas se crean automáticamente al iniciar el backend. Incluye 12 categorías, 15 productos, 10 clientes, 6 proveedores, 3 compras y 8 facturas de ejemplo.

---

## Despliegue en Render

El proyecto usa **render.yaml** (Infrastructure as Code). Despliegue en 3 pasos:

1. Sube el repo a GitHub
2. Render → **New** → **Blueprint** → conecta el repo
3. Click **Apply**

Render crea automáticamente: PostgreSQL, backend (Docker) y frontend (Docker). El `JWT_SECRET` se genera solo.

---

## Variables de entorno

| Variable | Requerida | Descripción |
|----------|-----------|-------------|
| `DATABASE_URL` | No* | URL completa de PostgreSQL (Render/Railway la inyectan) |
| `DB_HOST` / `DB_PORT` / `DB_NAME` / `DB_USER` / `DB_PASSWORD` | No* | Conexión por variables individuales |
| `DATABASE_SSL` | No | `true` para conexiones en la nube |
| `JWT_SECRET` | **Sí** | Clave para firmar tokens JWT |
| `NODE_ENV` | No | `production` o `development` |
| `FRONTEND_URL` / `CORS_ORIGIN` | No | Origen(es) permitidos para CORS |
| `DEEPSEEK_API_KEY` | No* | Clave de API DeepSeek para el asistente IA y análisis de ventas |

\* Usa `DATABASE_URL` o las variables individuales. `DATABASE_URL` tiene prioridad.
\* Sin `DEEPSEEK_API_KEY`, las funciones de IA (chatbot y análisis) estarán deshabilitadas.

---

## API Endpoints

### Auth
| Método | Ruta | Roles |
|--------|------|-------|
| POST | `/api/auth/login` | Público |
| GET | `/api/auth/me` | Autenticado |

### Categorías
| Método | Ruta | Roles |
|--------|------|-------|
| GET | `/api/categorias` | Todos |
| GET | `/api/categorias/:id` | Todos |
| POST | `/api/categorias` | admin |
| PUT | `/api/categorias/:id` | admin |
| DELETE | `/api/categorias/:id` | admin |

### Productos
| Método | Ruta | Roles |
|--------|------|-------|
| GET | `/api/productos` | Todos |
| GET | `/api/productos/:id` | Todos |
| POST | `/api/productos` | admin |
| PUT | `/api/productos/:id` | admin |
| DELETE | `/api/productos/:id` | admin |

### Facturación (Ventas)
| Método | Ruta | Roles |
|--------|------|-------|
| GET | `/api/ventas` | Todos |
| GET | `/api/ventas/:id` | Todos |
| POST | `/api/ventas` | admin, vendedor |
| PATCH | `/api/ventas/:id/estado` | admin, vendedor |
| GET | `/api/ventas/:id/ticket` | Todos |

### Clientes
| Método | Ruta | Roles |
|--------|------|-------|
| GET | `/api/clientes` | Todos |
| GET | `/api/clientes/:id` | Todos |
| POST | `/api/clientes` | admin |
| PUT | `/api/clientes/:id` | admin |
| DELETE | `/api/clientes/:id` | admin |

### Proveedores
| Método | Ruta | Roles |
|--------|------|-------|
| GET | `/api/proveedores` | Todos |
| GET | `/api/proveedores/:id` | Todos |
| POST | `/api/proveedores` | admin |
| PUT | `/api/proveedores/:id` | admin |
| DELETE | `/api/proveedores/:id` | admin |

### Compras
| Método | Ruta | Roles |
|--------|------|-------|
| GET | `/api/compras` | Todos |
| GET | `/api/compras/:id` | Todos |
| POST | `/api/compras` | admin |
