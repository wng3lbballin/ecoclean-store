# EcoClean Store

Sistema web de gestión para tienda de productos de limpieza.

## Stack

- **Backend:** Node.js + Express
- **Base de datos:** PostgreSQL
- **Frontend:** React + Tailwind CSS
- **Autenticación:** JWT + bcrypt
- **Despliegue:** Docker + docker-compose

## Roles

| Rol | Permisos |
|-----|----------|
| admin | Acceso total |
| vendedor | Ventas, productos, tickets |
| revisor | Solo lectura: dashboard, productos, ventas |

## Usuarios semilla

| Email | Contraseña | Rol |
|-------|-----------|-----|
| admin@ecoclean.com | 123456 | admin |
| vendedor@ecoclean.com | 123456 | vendedor |
| revisor@ecoclean.com | 123456 | revisor |

---

## Desarrollo local con Docker

```bash
docker-compose up --build
```

- Frontend: http://localhost:3000
- Backend: http://localhost:4000

El frontend se conecta al backend mediante el proxy de Nginx (`/api` → backend:4000).

---

## Desarrollo local manual

### Requisitos
- Node.js 18+
- PostgreSQL 15+

### Backend

```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

### Frontend

```bash
cd frontend
npm install
npm start
```

Asegúrate de que `REACT_APP_API_URL=http://localhost:4000/api` esté configurado en el entorno del frontend si lo ejecutas por separado.

### Base de datos

Crea una base de datos llamada `ecoclean`. Las tablas y usuarios semilla se crean automáticamente al iniciar el backend.

---

## Despliegue en Railway

Railway permite desplegar con Docker o desde el código fuente directamente.

### Opción A: Con Docker (recomendado)

1. Crea una cuenta en [railway.app](https://railway.app)
2. Instala Railway CLI: `npm i -g @railway/cli`
3. En la raíz del proyecto:
   ```bash
   railway init
   railway up
   ```
4. Railway detecta `docker-compose.yml` y despliega los 3 servicios.
5. Agrega estas variables de entorno en el dashboard de Railway:
   - `JWT_SECRET` — una clave segura y aleatoria
   - `FRONTEND_URL` — la URL que Railway asigne al frontend

### Opción B: Servicios individuales

#### Backend

1. Crea un nuevo servicio en Railway desde GitHub
2. Root directory: `backend`
3. Build command: `npm install`
4. Start command: `npm start`
5. Agrega un servicio PostgreSQL desde el dashboard
6. Variables de entorno (Railway las inyecta automáticamente al conectar PostgreSQL):
   - `DATABASE_URL` — Railway la provee automáticamente
   - `DATABASE_SSL=true`
   - `JWT_SECRET` — clave segura aleatoria
   - `NODE_ENV=production`
   - `CORS_ORIGIN` — URL del frontend desplegado
   - `PORT` — Railway lo asigna automáticamente

#### Frontend

1. Crea otro servicio desde GitHub
2. Root directory: `frontend`
3. Build command: `npm install && npm run build`
4. Start command: `npx serve -s build -l $PORT`
5. Variable de entorno:
   - `REACT_APP_API_URL` — URL del backend (ej: `https://ecoclean-api.up.railway.app/api`)

---

## Despliegue en Render

### Opción A: Docker (blueprint)

1. Crea cuenta en [render.com](https://render.com)
2. Ve a Dashboard → New → Blueprint
3. Conecta tu repositorio de GitHub
4. Render detecta `docker-compose.yml` y crea los servicios
5. Configura las variables de entorno en el dashboard

### Opción B: Servicios individuales

#### PostgreSQL

1. New → PostgreSQL
2. Nombre: `ecoclean-db`
3. Database: `ecoclean`
4. Después de crear, copia la `Internal Database URL`

#### Backend (Web Service)

1. New → Web Service
2. Root directory: `backend`
3. Runtime: Node
4. Build command: `npm install`
5. Start command: `npm start`
6. Variables de entorno:
   - `DATABASE_URL` — Internal Database URL de Render
   - `DATABASE_SSL=true`
   - `JWT_SECRET` — clave segura aleatoria
   - `NODE_ENV=production`
   - `FRONTEND_URL` — URL del frontend (la asignas después de crearlo)

#### Frontend (Static Site)

1. New → Static Site
2. Root directory: `frontend`
3. Build command: `npm install && npm run build`
4. Publish directory: `build`
5. Variable de entorno:
   - `REACT_APP_API_URL` — URL del backend (ej: `https://ecoclean-api.onrender.com/api`)
6. Rewrite rule: agregar `/* -> /index.html` (SPA fallback)

---

## Variables de entorno

| Variable | Requerida | Descripción |
|----------|-----------|-------------|
| `PORT` | No (default 4000) | Puerto del backend |
| `DATABASE_URL` | No* | URL completa de PostgreSQL (Render/Railway) |
| `DB_HOST` | No* | Host de PostgreSQL |
| `DB_PORT` | No* | Puerto de PostgreSQL |
| `DB_NAME` | No* | Nombre de la base de datos |
| `DB_USER` | No* | Usuario de PostgreSQL |
| `DB_PASSWORD` | No* | Contraseña de PostgreSQL |
| `DATABASE_SSL` | No | `true` para conexiones SSL (nube) |
| `JWT_SECRET` | **Sí** | Clave para firmar tokens JWT |
| `NODE_ENV` | No | `production` o `development` |
| `FRONTEND_URL` | No | URL del frontend para CORS |
| `CORS_ORIGIN` | No | Orígenes permitidos (separados por coma) |

\* Usa `DATABASE_URL` o las variables individuales. `DATABASE_URL` tiene prioridad.

---

## Endpoints

### Auth
- `POST /api/auth/login` — Iniciar sesión
- `GET /api/auth/me` — Datos del usuario autenticado

### Categorías
- `GET /api/categorias` — Listar categorías
- `GET /api/categorias/:id` — Ver una categoría
- `POST /api/categorias` — Crear (admin)
- `PUT /api/categorias/:id` — Editar (admin)
- `DELETE /api/categorias/:id` — Eliminar (admin)

### Productos
- `GET /api/productos` — Listar productos
- `GET /api/productos/:id` — Ver un producto
- `POST /api/productos` — Crear (admin)
- `PUT /api/productos/:id` — Editar (admin)
- `DELETE /api/productos/:id` — Eliminar (admin)

### Ventas
- `GET /api/ventas` — Listar ventas
- `GET /api/ventas/:id` — Ver venta con detalle
- `POST /api/ventas` — Registrar venta (admin, vendedor)
- `GET /api/ventas/:id/ticket` — Ticket PDF (admin, vendedor)
