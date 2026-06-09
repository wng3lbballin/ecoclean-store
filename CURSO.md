# 🍃 Construye tu propio ERP Web — De cero a producción

**Curso completo paso a paso para crear un sistema ERP con Node.js, PostgreSQL, React y Tailwind CSS**

---

> **¿Qué vas a construir?**  
> Un sistema de gestión empresarial (ERP) para una tienda, con facturación, inventario, clientes, dashboard con gráficos, auditoría e integración de inteligencia artificial.  
> **Duración estimada:** 8-12 horas (dividido en secciones independientes).  
> **Nivel:** Principiante-Intermedio. Necesitas saber JavaScript básico.

---

## Índice

1. [Preparación del entorno](#1-preparación-del-entorno)
2. [Arquitectura del proyecto](#2-arquitectura-del-proyecto)
3. [Base de datos: diseño del esquema](#3-base-de-datos-diseño-del-esquema)
4. [Backend: el servidor API](#4-backend-el-servidor-api)
5. [Autenticación con JWT](#5-autenticación-con-jwt)
6. [Middleware: protección de rutas y roles](#6-middleware-protección-de-rutas-y-roles)
7. [CRUD: Crear, Leer, Actualizar, Eliminar](#7-crud-crear-leer-actualizar-eliminar)
8. [Transacciones y lógica de negocio](#8-transacciones-y-lógica-de-negocio)
9. [Frontend: React + Tailwind](#9-frontend-react--tailwind)
10. [Dashboard con gráficos (Recharts)](#10-dashboard-con-gráficos-recharts)
11. [Auditoría y logs](#11-auditoría-y-logs)
12. [Integración de Inteligencia Artificial](#12-integración-de-inteligencia-artificial)
13. [Despliegue en producción (Render + Docker)](#13-despliegue-en-producción-render--docker)
14. [Errores comunes y soluciones](#14-errores-comunes-y-soluciones)

---

## 1. Preparación del entorno

### Herramientas necesarias

| Herramienta | Versión | ¿Para qué? |
|-------------|---------|------------|
| **Node.js** | 18+ | Ejecutar JavaScript en el servidor |
| **PostgreSQL** | 15+ | Base de datos relacional |
| **Git** | cualquiera | Control de versiones |
| **VS Code** | cualquiera | Editor de código (recomendado) |
| **Postman** | cualquiera | Probar la API (opcional) |

### Instalación

**Windows:**
```
# Descarga los instaladores desde:
# - https://nodejs.org  (versión LTS)
# - https://www.postgresql.org/download/windows/
# - https://git-scm.com/download/win
```

**macOS:**
```bash
brew install node postgresql@15 git
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install nodejs npm postgresql git
```

### Verificar instalación

```bash
node --version   # Debe mostrar v18.x.x o superior
npm --version    # Debe mostrar 9.x.x o superior
psql --version   # Debe mostrar 15.x o superior
git --version
```

### Estructura de carpetas inicial

Crea la estructura base del proyecto:

```
mi-erp/
├── backend/
│   ├── package.json
│   └── src/
│       ├── index.js          ← Punto de entrada del servidor
│       ├── config/
│       │   └── database.js   ← Conexión a PostgreSQL
│       ├── routes/           ← Definición de endpoints
│       ├── controllers/      ← Lógica de cada endpoint
│       ├── middleware/       ← Autenticación y autorización
│       └── utils/            ← Utilidades (logger, seeders)
├── frontend/
│   ├── package.json
│   └── src/
│       ├── App.jsx           ← Rutas de React
│       ├── pages/            ← Vistas (Login, Dashboard, etc.)
│       ├── components/       ← Componentes reutilizables
│       ├── context/          ← Estado global (Auth)
│       └── services/         ← Conexión al backend (Axios)
└── README.md
```

---

## 2. Arquitectura del proyecto

### Diagrama de arquitectura

```
┌─────────────────────────────────────────────────────────┐
│                     USUARIO (Navegador)                 │
└─────────────────────┬───────────────────────────────────┘
                      │ HTTP / HTTPS
                      ▼
┌─────────────────────────────────────────────────────────┐
│              FRONTEND (React + Tailwind)                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────────┐  │
│  │  Login   │  │ Dashboard│  │  CRUDs (Productos,   │  │
│  │  (JWT)   │  │(Recharts)│  │  Clientes, Ventas)   │  │
│  └──────────┘  └──────────┘  └──────────────────────┘  │
│                                                         │
│  AuthContext → Guarda token JWT en localStorage         │
│  Axios Instance → Adjunta token en cada petición        │
└─────────────────────┬───────────────────────────────────┘
                      │ REST API (JSON)
                      ▼
┌─────────────────────────────────────────────────────────┐
│              BACKEND (Node.js + Express)                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────────┐  │
│  │  auth.js │  │  role.js │  │  Controllers         │  │
│  │(verifica │  │(permisos │  │  (CRUD + lógica)     │  │
│  │  JWT)    │  │ por rol) │  │                      │  │
│  └──────────┘  └──────────┘  └──────────────────────┘  │
│                                                         │
│  logger.js → Registra acciones en logs_auditoria        │
│  deepseekService.js → Cliente HTTP a API DeepSeek       │
└─────────────────────┬───────────────────────────────────┘
                      │ SQL (pg library)
                      ▼
┌─────────────────────────────────────────────────────────┐
│              BASE DE DATOS (PostgreSQL)                  │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │
│  │ usuarios │ │ ventas   │ │ productos│ │ clientes │  │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘  │
│  ┌──────────┐ ┌──────────┐ ┌──────────────────────┐    │
│  │ compras  │ │categorías│ │ logs_auditoria       │    │
│  └──────────┘ └──────────┘ └──────────────────────┘    │
└─────────────────────────────────────────────────────────┘
```

### Flujo de una petición típica

```
Usuario hace clic en "Crear Producto"
          │
          ▼
  React: POST /api/productos con { nombre, precio }
  Axios adjunta: Authorization: Bearer <JWT_TOKEN>
          │
          ▼
  Express → middleware/auth.js: ¿Token válido?
          NO → 401 Unauthorized
          SÍ → middleware/role.js: ¿Es admin?
                  NO → 403 Forbidden
                  SÍ → productController.crear()
                          │
                          ▼
                  pool.query('INSERT INTO productos...')
                  registrarLog('creó producto X')
                          │
                          ▼
                  Respuesta: 201 Created + producto
```

---

## 3. Base de datos: diseño del esquema

### Conceptos clave

**¿Por qué PostgreSQL?**
- Es relacional: las tablas se conectan mediante claves foráneas (FK)
- Soporta transacciones: si algo falla a medio camino, todo se revierte
- Es gratuito y open source

**UUID vs ID numérico:**
- Usamos `UUID` (identificador único universal) en vez de números incrementales
- Ventaja: no se puede adivinar el ID del siguiente registro
- Se genera con `uuid_generate_v4()` (requiere extensión `uuid-ossp`)

### Tabla principal: usuarios

```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";  -- Habilitar UUIDs

CREATE TABLE IF NOT EXISTS usuarios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,       -- UNIQUE = no puede repetirse
    password VARCHAR(255) NOT NULL,           -- Se guarda HASEADO (bcrypt)
    rol VARCHAR(20) CHECK (rol IN ('admin', 'vendedor', 'revisor')) NOT NULL,
    activo BOOLEAN DEFAULT true,              -- Para "desactivar" sin borrar
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

> **CHECK constraint:** el `CHECK` garantiza que solo se acepten esos 3 valores en `rol`. Si intentas insertar 'superadmin', PostgreSQL lo rechaza.

### Diagrama entidad-relación

```
┌──────────────┐       ┌──────────────┐
│  usuarios    │       │  categorias  │
├──────────────┤       ├──────────────┤
│ id (PK)      │       │ id (PK)      │
│ nombre       │       │ nombre       │
│ email        │       │ descripcion  │
│ password     │       └──────┬───────┘
│ rol          │              │ (FK)
│ activo       │              ▼
└──────┬───────┘       ┌──────────────┐
       │ (FK)          │  productos   │
       │               ├──────────────┤
       │      ┌───────│ id (PK)      │
       │      │        │ nombre       │
       ▼      │        │ precio       │
┌──────────────┐       │ stock        │
│   ventas     │       │ categoria_id │──→ categorias
├──────────────┤       └──────┬───────┘
│ id (PK)      │              │ (FK)
│ usuario_id ──→ usuarios     │
│ cliente_id ──→ clientes     ▼
│ total        │       ┌──────────────┐
│ numero_fact  │       │detalle_ventas│
│ estado       │       ├──────────────┤
│ fecha        │       │ venta_id (FK)│──→ ventas
└──────┬───────┘       │ producto_id  │──→ productos
       │               │ cantidad     │
       │               │ precio_unit  │
       ▼               │ subtotal     │
┌──────────────┐       └──────────────┘
│   clientes   │
├──────────────┤
│ id (PK)      │
│ nombre       │
│ email        │
└──────────────┘
```

### Tablas de detalle (relación muchos-a-muchos)

Una venta puede tener MUCHOS productos, y un producto puede estar en MUCHAS ventas. Esto se resuelve con una **tabla intermedia**:

```
VENTA #12
  ├── 3x "Cloro Gel 1L"       → $14.40
  ├── 2x "Jabón Líquido 500ml" →  $7.80
  └── 1x "Escoba Profesional"  →  $8.00
                              Total: $30.20
```

En SQL esto se guarda así:
```sql
-- Venta
INSERT INTO ventas (id, usuario_id, total, numero_factura)
VALUES ('uuid-venta-12', 'uuid-admin', 30.20, 'F-00012');

-- Detalles
INSERT INTO detalle_ventas (venta_id, producto_id, cantidad, precio_unitario, subtotal)
VALUES
  ('uuid-venta-12', 'uuid-cloro',    3, 4.80, 14.40),
  ('uuid-venta-12', 'uuid-jabon',    2, 3.90,  7.80),
  ('uuid-venta-12', 'uuid-escoba',   1, 8.00,  8.00);
```

### Tabla de logs de auditoría

```sql
CREATE TABLE IF NOT EXISTS logs_auditoria (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID NOT NULL REFERENCES usuarios(id),
    usuario_nombre VARCHAR(100) NOT NULL,      -- Guardamos el nombre para no hacer JOIN
    accion VARCHAR(250) NOT NULL,              -- "creó producto Cloro Gel"
    detalle TEXT DEFAULT '',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

> Guardamos `usuario_nombre` además del ID para que los logs sigan siendo legibles incluso si el usuario se elimina después.

---

## 4. Backend: el servidor API

### Inicializar el proyecto backend

```bash
mkdir mi-erp && cd mi-erp
mkdir backend && cd backend
npm init -y
npm install express cors dotenv pg bcryptjs jsonwebtoken pdfkit
npm install -D nodemon
```

| Paquete | ¿Para qué sirve? |
|---------|------------------|
| `express` | Framework web. Maneja rutas, middlewares, peticiones HTTP |
| `cors` | Permite que el frontend (otro puerto) hable con el backend |
| `dotenv` | Carga variables de entorno desde archivo `.env` |
| `pg` | Cliente de PostgreSQL para Node.js |
| `bcryptjs` | Hashea contraseñas (nunca las guardes en texto plano) |
| `jsonwebtoken` | Crea y verifica tokens JWT para autenticación |
| `pdfkit` | Genera PDFs (tickets de factura) |
| `nodemon` | Reinicia el servidor automáticamente al detectar cambios |

### package.json — scripts

```json
{
  "scripts": {
    "start": "node src/index.js",
    "dev": "nodemon src/index.js"
  }
}
```

### Conexión a la base de datos (`config/database.js`)

```javascript
const { Pool } = require('pg');

const pool = new Pool(
  process.env.DATABASE_URL
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.DATABASE_SSL === 'true'
          ? { rejectUnauthorized: false }
          : false,
      }
    : {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        database: process.env.DB_NAME || 'ecoclean',
        user: process.env.DB_USER || 'ecoclean',
        password: process.env.DB_PASSWORD || 'ecoclean123',
      }
);

module.exports = pool;
```

**¿Por qué dos modos?** En desarrollo usas variables individuales (`DB_HOST`, `DB_NAME`, etc.). En producción (Render/Railway) te dan una sola URL `DATABASE_URL`. El código soporta ambos.

> **ERROR COMÚN #1:** "password authentication failed" → Revisa que `DB_USER` y `DB_PASSWORD` sean correctos. En PostgreSQL Windows, el usuario por defecto suele ser `postgres`.

### El archivo `.env`

```
PORT=4000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ecoclean
DB_USER=ecoclean
DB_PASSWORD=ecoclean123
JWT_SECRET=clave_super_secreta_y_larga
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
DEEPSEEK_API_KEY=sk-xxxxxxxxxxxxxxxx
```

> **IMPORTANTE:** Nunca subas `.env` a Git. El archivo `.env.example` sí se sube (sin valores reales) para que otros sepan qué variables necesitan.

### Punto de entrada (`index.js`)

```javascript
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const pool = require('./config/database');
const authRoutes = require('./routes/authRoutes');
// ... más rutas

const app = express();
const PORT = process.env.PORT || 4000;

// Middlewares globales
app.use(cors({ origin: process.env.FRONTEND_URL || '*' }));
app.use(express.json());  // Parsea JSON del cuerpo de las peticiones

// Montar rutas
app.use('/api/auth', authRoutes);
app.use('/api/productos', require('./routes/productRoutes'));
// ... más rutas

// Health check (útil para Render y monitoreo)
app.get('/api/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok' });
  } catch {
    res.status(500).json({ status: 'error' });
  }
});

// Crear tablas y arrancar
async function init() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS usuarios (...);
    CREATE TABLE IF NOT EXISTS productos (...);
    -- ...
  `);
  app.listen(PORT, () => console.log(`API en puerto ${PORT}`));
}

init();
```

> **`CREATE TABLE IF NOT EXISTS`**: así no borras datos si la tabla ya existe. Ideal para desarrollo.

---

## 5. Autenticación con JWT

### ¿Cómo funciona JWT?

```
1. Usuario envía email + contraseña → POST /api/auth/login
2. Servidor verifica credenciales contra la BD
3. Si son correctas → genera un TOKEN firmado digitalmente
4. El token se envía al frontend y se guarda en localStorage
5. En cada petición posterior, el frontend envía el token en el header
6. El servidor verifica el token sin consultar la BD
```

```
┌──────────┐                    ┌──────────┐
│ FRONTEND │                    │ BACKEND  │
└────┬─────┘                    └────┬─────┘
     │                               │
     │  POST /api/auth/login         │
     │  { email, password }          │
     │──────────────────────────────>│
     │                               │ bcrypt.compare(password, hash)
     │                               │ jwt.sign({id, rol}, SECRET)
     │  { token, user }              │
     │<──────────────────────────────│
     │                               │
     │  GET /api/productos           │
     │  Authorization: Bearer <token>│
     │──────────────────────────────>│
     │                               │ jwt.verify(token, SECRET) ✓
     │  [productos...]               │
     │<──────────────────────────────│
```

### Controller de login

```javascript
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/database');

const login = async (req, res) => {
  const { email, password } = req.body;

  // 1. Buscar usuario por email
  const result = await pool.query(
    'SELECT id, nombre, email, password, rol, activo FROM usuarios WHERE email = $1',
    [email]
  );
  const user = result.rows[0];

  // 2. Validar que existe y está activo
  if (!user) return res.status(401).json({ error: 'Credenciales inválidas' });
  if (!user.activo) return res.status(403).json({ error: 'Usuario desactivado' });

  // 3. Comparar contraseña (bcrypt.compare, NUNCA en texto plano)
  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(401).json({ error: 'Credenciales inválidas' });

  // 4. Firmar token JWT (expira en 8 horas)
  const token = jwt.sign(
    { id: user.id, email: user.email, rol: user.rol, nombre: user.nombre },
    process.env.JWT_SECRET,
    { expiresIn: '8h' }
  );

  // 5. Responder (NUNCA envíes la contraseña)
  res.json({
    token,
    user: { id: user.id, nombre: user.nombre, email: user.email, rol: user.rol }
  });
};
```

> **ERROR COMÚN #2:** "jwt malformed" → El token no se está enviando o está corrupto. Revisa que el frontend lo adjunte como `Bearer <token>`.

### El hash de contraseñas

NUNCA guardes contraseñas en texto plano. Siempre usa bcrypt:

```javascript
// Al CREAR un usuario
const hashedPassword = await bcrypt.hash('123456', 10);
// Guarda: $2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy

// Al VERIFICAR en login
const isValid = await bcrypt.compare('123456', hashedPassword);
// Devuelve true
```

El `10` es el "salt rounds": cuántas veces se aplica el algoritmo. 10 es un buen balance entre seguridad y velocidad.

---

## 6. Middleware: protección de rutas y roles

### Middleware de autenticación (`middleware/auth.js`)

```javascript
const jwt = require('jsonwebtoken');

const auth = (req, res, next) => {
  // 1. Extraer token del header Authorization
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token requerido' });
  }

  const token = header.split(' ')[1];  // "Bearer xxxx" → "xxxx"

  try {
    // 2. Verificar y decodificar
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // decoded = { id, email, rol, nombre, iat, exp }

    // 3. Inyectar datos del usuario en la petición
    req.user = decoded;
    next();  // Continuar al siguiente middleware/controlador
  } catch {
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }
};

module.exports = auth;
```

### Middleware de autorización por roles (`middleware/role.js`)

```javascript
// role('admin') → solo admin
// role('admin', 'vendedor') → admin o vendedor
const role = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'No autenticado' });
    }
    if (!allowedRoles.includes(req.user.rol)) {
      return res.status(403).json({ error: 'No tienes permisos para esta acción' });
    }
    next();
  };
};

module.exports = role;
```

### Cómo se usan en las rutas

```javascript
const { Router } = require('express');
const auth = require('../middleware/auth');
const role = require('../middleware/role');
const router = Router();

// Público
router.post('/login', login);

// Autenticado
router.get('/productos', auth, listarProductos);

// Solo admin
router.post('/productos', auth, role('admin'), crearProducto);

// Admin o vendedor
router.post('/ventas', auth, role('admin', 'vendedor'), crearVenta);
```

> **ERROR COMÚN #3:** "Cannot read properties of undefined (reading 'rol')" → Olvidaste poner `auth` antes de `role`. El orden importa: `auth` primero (crea `req.user`), luego `role` (lo usa).

### Matriz de permisos

```
                    ┌───────┬──────────┬─────────┐
                    │ admin │ vendedor │ revisor │
┌───────────────────┼───────┼──────────┼─────────┤
│ Dashboard         │  ✅   │   ✅     │   ✅    │
│ Productos (ver)   │  ✅   │   ✅     │   ✅    │
│ Productos (CRUD)  │  ✅   │   ❌     │   ❌    │
│ Ventas (crear)    │  ✅   │   ✅     │   ❌    │
│ Ventas (ver)      │  ✅   │   ✅     │   ✅    │
│ Categorías (CRUD) │  ✅   │   ❌     │   ❌    │
│ Clientes (CRUD)   │  ✅   │   ❌     │   ❌    │
│ Usuarios (CRUD)   │  ✅   │   ❌     │   ❌    │
│ Logs (ver)        │  ✅   │   ❌     │   ✅    │
│ Reportes          │  ✅   │   ✅     │   ✅    │
└───────────────────┴───────┴──────────┴─────────┘
```

---

## 7. CRUD: Crear, Leer, Actualizar, Eliminar

### Patrón CRUD (ejemplo: Productos)

Toda entidad del sistema sigue el mismo patrón de 5 operaciones:

```
┌──────────┬─────────┬──────────────────────────┐
│ Operación│ Método  │ Ruta                     │
├──────────┼─────────┼──────────────────────────┤
│ Listar   │ GET     │ /api/productos           │
│ Obtener  │ GET     │ /api/productos/:id       │
│ Crear    │ POST    │ /api/productos           │
│ Editar   │ PUT     │ /api/productos/:id       │
│ Eliminar │ DELETE  │ /api/productos/:id       │
└──────────┴─────────┴──────────────────────────┘
```

### Archivo de rutas (`routes/productRoutes.js`)

```javascript
const { Router } = require('express');
const { listar, obtener, crear, editar, eliminar } = require('../controllers/productController');
const auth = require('../middleware/auth');
const role = require('../middleware/role');

const router = Router();

router.get('/', auth, listar);
router.get('/:id', auth, obtener);
router.post('/', auth, role('admin'), crear);
router.put('/:id', auth, role('admin'), editar);
router.delete('/:id', auth, role('admin'), eliminar);

module.exports = router;
```

### Archivo controlador (`controllers/productController.js`)

```javascript
const pool = require('../config/database');

const listar = async (_req, res) => {
  try {
    const result = await pool.query(
      `SELECT p.*, c.nombre AS categoria_nombre
       FROM productos p LEFT JOIN categorias c ON c.id = p.categoria_id
       ORDER BY p.nombre`
    );
    res.json(result.rows);  // Siempre devuelve un array (aunque vacío)
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ error: 'Error al listar' });
  }
};

const crear = async (req, res) => {
  const { nombre, precio } = req.body;

  // Validación
  if (!nombre || precio == null) {
    return res.status(400).json({ error: 'Nombre y precio requeridos' });
  }
  if (precio <= 0) {
    return res.status(400).json({ error: 'El precio debe ser > 0' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO productos (nombre, precio) VALUES ($1, $2) RETURNING *`,
      [nombre, precio]
    );
    res.status(201).json(result.rows[0]);  // 201 = Created
  } catch (err) {
    res.status(500).json({ error: 'Error al crear' });
  }
};

const eliminar = async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM productos WHERE id = $1 RETURNING *',
      [req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }
    res.json({ message: 'Producto eliminado' });
  } catch (err) {
    res.status(500).json({ error: 'Error al eliminar' });
  }
};
```

### ¿Por qué usamos `$1, $2` en vez de template strings?

```javascript
// ❌ NUNCA HAGAS ESTO (SQL Injection)
pool.query(`SELECT * FROM usuarios WHERE email = '${email}'`);

// ✅ SIEMPRE USA PARÁMETROS ($1, $2...) - pg los escapa automáticamente
pool.query('SELECT * FROM usuarios WHERE email = $1', [email]);
```

> **ERROR COMÚN #4:** Poner el nombre de la columna como parámetro `$1`. Solo funciona para VALORES. Para nombres de columna dinámicos necesitas concatenar manualmente (con precaución).

### Códigos HTTP que debes usar

| Código | Significado | Cuándo usarlo |
|--------|-------------|---------------|
| 200 | OK | GET, PUT exitoso |
| 201 | Created | POST exitoso |
| 400 | Bad Request | Datos inválidos del cliente |
| 401 | Unauthorized | Token faltante o inválido |
| 403 | Forbidden | Rol sin permisos |
| 404 | Not Found | Recurso no existe |
| 409 | Conflict | Email duplicado, etc. |
| 500 | Server Error | Error inesperado |

---

## 8. Transacciones y lógica de negocio

### ¿Qué es una transacción?

Una transacción agrupa varias operaciones SQL. Si UNA falla, TODAS se revierten (ROLLBACK). Si todas funcionan, se confirman (COMMIT).

```
┌─────────────────────────────────────┐
│            TRANSACCIÓN              │
│                                     │
│  BEGIN                              │
│    INSERT INTO ventas ...     ✓     │
│    INSERT INTO detalle_ventas ✓     │
│    UPDATE productos SET stock  ✓    │
│    INSERT INTO movimientos_stock ✓  │
│  COMMIT                             │
│                                     │
│  Si algo falla → ROLLBACK (todo se │
│  deshace, la BD queda intacta)      │
└─────────────────────────────────────┘
```

### Ejemplo: crear una venta

```javascript
const crear = async (req, res) => {
  const { items } = req.body;  // [{ producto_id, cantidad }, ...]
  const client = await pool.connect();  // Cliente dedicado para transacción

  try {
    await client.query('BEGIN');

    // Verificar stock de cada producto
    for (const item of items) {
      const prod = await client.query(
        'SELECT id, nombre, precio, stock FROM productos WHERE id = $1 FOR UPDATE',
        [item.producto_id]
      );

      if (prod.rows[0].stock < item.cantidad) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          error: `Stock insuficiente para "${prod.rows[0].nombre}"`
        });
      }
    }

    // Insertar venta
    const venta = await client.query(
      'INSERT INTO ventas (usuario_id, total) VALUES ($1, $2) RETURNING *',
      [req.user.id, total]
    );

    // Insertar detalles y actualizar stock
    for (const item of items) {
      await client.query(
        'INSERT INTO detalle_ventas (venta_id, producto_id, cantidad, ...) VALUES (...)',
        [venta.rows[0].id, ...]
      );
      await client.query(
        'UPDATE productos SET stock = stock - $1 WHERE id = $2',
        [item.cantidad, item.producto_id]
      );
    }

    await client.query('COMMIT');
    res.status(201).json(venta.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: 'Error al crear venta' });
  } finally {
    client.release();  // ¡SIEMPRE libera el cliente!
  }
};
```

> **ERROR COMÚN #5:** Olvidar `client.release()`. El pool tiene un número limitado de conexiones. Si no liberas, eventualmente se agotan y la app deja de responder.

### FOR UPDATE: bloqueo pesimista

`SELECT ... FOR UPDATE` bloquea la fila hasta que la transacción termine. Esto evita que dos vendedores vendan el mismo producto simultáneamente y generen stock negativo.

```
Vendedor A: SELECT stock FROM productos WHERE id=1 FOR UPDATE
           stock = 5 → VENDE 3 → UPDATE stock=2 → COMMIT
           
Vendedor B: SELECT stock FROM productos WHERE id=1 FOR UPDATE
           (espera a que A haga COMMIT...)
           stock = 2 → intenta vender 3 → ERROR: Stock insuficiente
```

---

## 9. Frontend: React + Tailwind

### Inicializar el proyecto frontend

```bash
cd mi-erp
npx create-react-app frontend
cd frontend
npm install axios react-router-dom
npm install -D tailwindcss autoprefixer postcss
npx tailwindcss init -p
```

### Configurar Tailwind

`tailwind.config.js`:
```javascript
module.exports = {
  content: ['./src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#ecfdf5', 100: '#d1fae5', 200: '#a7f3d0',
          500: '#10b981', 600: '#059669', 700: '#047857',
        }
      }
    }
  },
  plugins: [],
};
```

`src/index.css`:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

### El contexto de autenticación (`context/AuthContext.jsx`)

El contexto de React permite que cualquier componente acceda al usuario autenticado sin pasar props manualmente:

```javascript
import { createContext, useContext, useState } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    // Al cargar la app, recuperar sesión guardada
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    setUser(data.user);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook personalizado para usar el contexto fácilmente
export function useAuth() {
  return useContext(AuthContext);
}
```

### Servicio Axios (`services/api.js`)

```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:4000/api',
});

// Interceptor: adjuntar token en cada petición
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor: si el token expiró, cerrar sesión
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.clear();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
```

### Rutas protegidas (`components/ProtectedRoute.jsx`)

```javascript
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, roles }) {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.rol)) return <Navigate to="/dashboard" replace />;

  return children;
}
```

### El enrutador (`App.jsx`)

```javascript
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/productos" element={
              <ProtectedRoute roles={['admin','vendedor','revisor']}>
                <Products />
              </ProtectedRoute>
            } />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
```

### Patrón de página CRUD (ejemplo Categorías)

Toda página que lista, crea, edita y elimina sigue esta estructura:

```
┌────────────────────────────────────────────┐
│  Título                    [+ Nuevo]       │
├────────────────────────────────────────────┤
│  ┌──────┬──────────┬──────────┬────────┐   │
│  │ Nombre│ Descripción│ Productos│ Acciones│  │
│  ├──────┼──────────┼──────────┼────────┤   │
│  │ Cloro│ Desinf... │    12    │ ✏️ 🗑️  │   │
│  │ Jabón│ Líquido...│    25    │ ✏️ 🗑️  │   │
│  └──────┴──────────┴──────────┴────────┘   │
└────────────────────────────────────────────┘
         │                        │
         ▼                        ▼
┌─────────────────┐    ┌─────────────────┐
│   Modal Crear/  │    │  Modal Confirmar│
│   Editar        │    │  Eliminar       │
│  ┌───────────┐  │    │  ¿Seguro?       │
│  │ Nombre:   │  │    │  [Cancelar][Sí] │
│  │ Desc:     │  │    └─────────────────┘
│  │[Cancelar] │  │
│  │[Guardar]  │  │
│  └───────────┘  │
└─────────────────┘
```

```javascript
export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ nombre: '', descripcion: '' });

  // Cargar datos al montar
  useEffect(() => { loadCategories(); }, []);

  const loadCategories = async () => {
    const { data } = await api.get('/categorias');
    setCategories(data);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editingId) {
      await api.put(`/categorias/${editingId}`, form);
    } else {
      await api.post('/categorias', form);
    }
    setModalOpen(false);
    loadCategories();
  };

  // JSX: tabla + modales...
}
```

> **ERROR COMÚN #6:** "Cannot read properties of undefined" en el frontend → El backend no devolvió los datos esperados. Abre la consola del navegador (F12 → Network) y revisa la respuesta de la API.

---

## 10. Dashboard con gráficos (Recharts)

### Instalación

```bash
npm install recharts
```

### Componentes principales de Recharts

```
┌──────────────────────────────────────────────────┐
│                                                   │
│  <ResponsiveContainer width="100%" height={300}>  │
│    <BarChart data={misDatos}>                     │
│      <CartesianGrid strokeDasharray="3 3" />      │
│      <XAxis dataKey="mes" />                      │
│      <YAxis />                                    │
│      <Tooltip />                                  │
│      <Bar dataKey="total" fill="#059669" />       │
│    </BarChart>                                    │
│  </ResponsiveContainer>                           │
│                                                   │
└──────────────────────────────────────────────────┘
```

### Datos que necesita un gráfico de barras

```javascript
const ventasMensuales = [
  { mes: 'Ene', total: 1250.50, cantidad: 45 },
  { mes: 'Feb', total: 980.00,  cantidad: 38 },
  { mes: 'Mar', total: 1540.75, cantidad: 52 },
  // ...
];
```

### Endpoint para obtener datos agrupados

```sql
SELECT 
  EXTRACT(MONTH FROM fecha)::int AS mes,
  COUNT(*)::int AS cantidad,
  COALESCE(SUM(total), 0)::float AS total
FROM ventas
WHERE EXTRACT(YEAR FROM fecha) = 2026
GROUP BY EXTRACT(MONTH FROM fecha)
ORDER BY mes
```

- `EXTRACT(MONTH FROM fecha)` extrae el número de mes (1-12)
- `::int` convierte el resultado a entero
- `GROUP BY` agrupa todas las ventas del mismo mes
- `COALESCE(SUM(total), 0)` evita `NULL` cuando no hay ventas

### Selector de año

```javascript
const years = [];
for (let y = new Date().getFullYear(); y >= 2020; y--) {
  years.push(y);
}

<select value={anio} onChange={(e) => setAnio(parseInt(e.target.value))}>
  {years.map(y => <option key={y} value={y}>{y}</option>)}
</select>
```

### Módulo de reportes por período

```
┌──────────────────────────────────────────────┐
│  Reportes por Período                        │
│  [📅 Desde: 2026-01-01] [📅 Hasta: 2026-06-09] │
│  [Generar Reporte]                           │
│                                              │
│  ┌────────┐ ┌──────────┐ ┌──────────────┐   │
│  │ 47     │ │ $8,450   │ │ $179.79      │   │
│  │ Ventas │ │ Ingresos │ │ Ticket Prom. │   │
│  └────────┘ └──────────┘ └──────────────┘   │
│                                              │
│  Ventas por día (gráfico de barras)          │
│  ████████████████████                        │
│                                              │
│  Productos más vendidos                      │
│  Cloro Gel 1L ........ 120 unid .... $576    │
│  Jabón Líquido ......  89 unid .... $347    │
└──────────────────────────────────────────────┘
```

---

## 11. Auditoría y logs

### ¿Por qué auditar?

- Saber QUIÉN hizo QUÉ y CUÁNDO
- Detectar acciones sospechosas
- Cumplir con requisitos legales/regulatorios
- Diagnosticar errores ("¿quién borró el producto X?")

### Tabla de logs

```sql
CREATE TABLE logs_auditoria (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID NOT NULL REFERENCES usuarios(id),
    usuario_nombre VARCHAR(100) NOT NULL,
    accion VARCHAR(250) NOT NULL,
    detalle TEXT DEFAULT '',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Utilidad logger (`utils/logger.js`)

```javascript
const pool = require('../config/database');

const registrarLog = async (usuarioId, usuarioNombre, accion, detalle = '') => {
  try {
    await pool.query(
      `INSERT INTO logs_auditoria (usuario_id, usuario_nombre, accion, detalle)
       VALUES ($1, $2, $3, $4)`,
      [usuarioId, usuarioNombre, accion, detalle]
    );
  } catch (err) {
    console.error('Error al registrar log:', err.message);
    // No lanzamos error para no interrumpir la operación principal
  }
};

module.exports = { registrarLog };
```

### Dónde registrar logs

Inserta el logger después de cada operación exitosa:

```javascript
// En ventas
await registrarLog(req.user.id, req.user.nombre,
  `registró venta #${venta.numero_factura}`);

// En productos
await registrarLog(req.user.id, req.user.nombre,
  `creó producto "${nombre}"`);

// En usuarios
await registrarLog(req.user.id, req.user.nombre,
  `desactivó usuario ${targetUser.email}`);
```

> **Nota:** El logger falla silenciosamente. Si la inserción del log falla, no interrumpe la operación principal del usuario.

### Visualización en frontend

Tabla paginada con filtros de fecha:

```
┌──────────────────────┬──────────────────┬──────────────────────────────┐
│ Fecha                │ Usuario          │ Acción                       │
├──────────────────────┼──────────────────┼──────────────────────────────┤
│ 09/06/2026 14:32:15  │ Administrador    │ registró venta #F-00142      │
│ 09/06/2026 13:10:42  │ Vendedor         │ creó producto "Cloro Gel"    │
│ 08/06/2026 18:05:30  │ Administrador    │ desactivó usuario revisor... │
└──────────────────────┴──────────────────┴──────────────────────────────┘
```

---

## 12. Integración de Inteligencia Artificial

### Arquitectura de la integración IA

```
┌──────────┐     ┌──────────┐     ┌─────────────────┐
│ Frontend │     │ Backend  │     │ DeepSeek API    │
│ (React)  │────>│ (Node)   │────>│ (api.deepseek.  │
│          │     │          │     │  com/v1/chat/   │
│          │<────│          │<────│  completions)   │
└──────────┘     └──────────┘     └─────────────────┘
                        │
                        │ La API key NUNCA sale del backend
                        │ El frontend solo ve la respuesta final
```

> **IMPORTANTE:** La API key de DeepSeek NUNCA debe estar en el frontend. Si la pones en React, cualquier usuario puede verla en las DevTools y usarla para sus propios fines (te cobrarán a ti).

### Servicio DeepSeek (`services/deepseekService.js`)

```javascript
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const SYSTEM_PROMPT = `Eres un asistente de EcoClean Store. 
Ayudas con dudas sobre facturación, inventario, clientes y uso del ERP.
Respondes en español, de forma clara y profesional.`;

async function chatWithDeepSeek(messages) {
  if (!DEEPSEEK_API_KEY) {
    throw new Error('API key no configurada');
  }

  const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        ...messages,
      ],
      temperature: 0.7,   // 0 = preciso, 1 = creativo
      max_tokens: 800,     // Límite de respuesta
      stream: false,
    }),
  });

  const data = await response.json();
  return data.choices[0].message.content;
}
```

### Endpoints IA

```javascript
// POST /api/ia/chat
// Body: { messages: [{ role: "user", content: "¿Cómo creo una factura?" }] }
// Respuesta: { reply: "Para crear una factura, ve a..." }

// POST /api/ia/analisis-ventas
// Sin body (el backend consulta la BD)
// Respuesta: { analysis: "Tendencias: Los productos de limpieza...", resumen: {...} }
```

### Chatbot flotante en React

```
                                    ┌─────────────────────────┐
                                    │ 🤖 Asistente EcoClean   │
                                    │                         │
                                    │ Hola, ¿en qué ayudo?    │
                                    │                         │
                                    │       ¿Cómo creo una    │
                                    │       factura?          │
                                    │                         │
                                    │ Para crear una factura: │
                                    │ 1. Ve a Facturación     │
                                    │ 2. Haz clic en + Nueva  │
                                    │ ...                     │
                                    │                         │
                                    │ [Escribe tu consulta...│
                                    └─────────────────────────┘
                                                          ┌───┐
                                                          │ 🤖│
                                                          └───┘
```

### Análisis de ventas con IA en el Dashboard

```
┌─────────────────────────────────────────────────────┐
│ 🤖 Proyecciones y Análisis IA      [Actualizar]     │
├─────────────────────────────────────────────────────┤
│ 📈 Tendencias observadas:                           │
│ • Las ventas de desinfectantes aumentaron 23%       │
│   en los últimos 3 meses                            │
│ • El ticket promedio subió de $140 a $175           │
│                                                     │
│ 📦 Sugerencias de inventario:                       │
│ • Cloro Gel 1L: stock actual 45 und.                │
│   Se recomienda reponer 60 und. para cubrir         │
│   la demanda proyectada del próximo mes             │
│                                                     │
│ 💡 Recomendaciones:                                 │
│ • Ofrecer descuentos por volumen en jabones         │
│ • Agregar productos de limpieza ecológica           │
└─────────────────────────────────────────────────────┘
```

---

## 13. Despliegue en producción (Render + Docker)

### render.yaml (Infrastructure as Code)

```yaml
services:
  - type: web
    name: ecoclean-api
    runtime: docker
    plan: free
    dockerfilePath: backend/Dockerfile
    dockerContext: backend
    healthCheckPath: /api/health
    envVars:
      - key: DATABASE_URL
        fromDatabase:
          name: ecoclean-db
          property: connectionString
      - key: JWT_SECRET
        generateValue: true          # Render lo genera aleatoriamente
      - key: DEEPSEEK_API_KEY
        sync: false                  # Se configura manualmente en el dashboard
      - key: FRONTEND_URL
        value: https://ecoclean-web.onrender.com

  - type: web
    name: ecoclean-web
    runtime: docker
    plan: free
    dockerfilePath: frontend/Dockerfile
    dockerContext: frontend
    envVars:
      - key: API_URL
        value: https://ecoclean-api.onrender.com/api

databases:
  - name: ecoclean-db
    plan: free
```

### Pasos para desplegar

1. Sube el código a GitHub
2. Ve a [dashboard.render.com](https://dashboard.render.com)
3. Click **New** → **Blueprint**
4. Conecta tu repositorio de GitHub
5. Render lee `render.yaml` y crea todo automáticamente:
   - Base de datos PostgreSQL
   - Servicio backend (Docker)
   - Servicio frontend (Docker)
6. Espera ~5 minutos
7. Tu app estará viva en `https://ecoclean-web.onrender.com`

> **Plan gratuito de Render:** El servicio se "duerme" después de 15 minutos de inactividad. La primera petición tarda ~30-60 segundos en despertar.

---

## 14. Errores comunes y soluciones

### 🔴 Error: `ECONNREFUSED 127.0.0.1:5432`

**Causa:** PostgreSQL no está corriendo o los datos de conexión son incorrectos.

**Solución:**
```bash
# Windows: Verifica que el servicio esté corriendo
Get-Service postgresql*

# Linux/macOS:
sudo service postgresql status
sudo service postgresql start

# Revisa tu .env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ecoclean
DB_USER=ecoclean
DB_PASSWORD=ecoclean123
```

### 🔴 Error: `password authentication failed for user`

**Causa:** Usuario o contraseña de PostgreSQL incorrectos.

**Solución:**
```sql
-- Conéctate como superusuario
psql -U postgres

-- Crea el usuario y la base de datos
CREATE USER ecoclean WITH PASSWORD 'ecoclean123';
CREATE DATABASE ecoclean OWNER ecoclean;
GRANT ALL PRIVILEGES ON DATABASE ecoclean TO ecoclean;
```

### 🔴 Error: `relation "usuarios" does not exist`

**Causa:** Las tablas no se crearon (el backend no llegó a ejecutar `init()`).

**Solución:** El backend crea las tablas automáticamente al arrancar con `CREATE TABLE IF NOT EXISTS`. Asegúrate de que el backend se inició correctamente y pudo conectarse a PostgreSQL.

### 🔴 Error: `CORS error` en el navegador

**Causa:** El frontend (puerto 3000) está bloqueado por el backend (puerto 4000).

**Solución:** En el backend, configura CORS correctamente:
```javascript
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000'
}));
```

### 🔴 Error: `Cannot read properties of undefined (reading 'rol')`

**Causa:** El middleware `role` se ejecutó antes que `auth`, por lo que `req.user` no existe.

**Solución:** Siempre pon `auth` ANTES que `role`:
```javascript
// ✅ Correcto
router.post('/', auth, role('admin'), crear);

// ❌ Incorrecto
router.post('/', role('admin'), auth, crear);
```

### 🔴 Error: Token JWT expirado (401 en cada petición)

**Causa:** El token dura 8 horas. Después de eso, el interceptor redirige a /login.

**Solución:** Es comportamiento esperado. El usuario debe volver a iniciar sesión. Para extenderlo, cambia `expiresIn` en `jwt.sign()`:
```javascript
jwt.sign(payload, secret, { expiresIn: '24h' });  // 24 horas
```

### 🔴 Error: `DeepSeek API key no configurada`

**Causa:** La variable `DEEPSEEK_API_KEY` no está definida en el entorno.

**Solución:** 
- **Desarrollo local:** Agrégala al archivo `.env`
- **Producción (Render):** Ve al dashboard → ecoclean-api → Environment → agrega `DEEPSEEK_API_KEY`

### 🔴 Error: `ECONNRESET` o timeout al instalar paquetes npm

**Causa:** Conexión lenta o proxy corporativo.

**Solución:**
```bash
# Limpiar caché de npm
npm cache clean --force

# Usar un registry alternativo
npm install --registry https://registry.npmmirror.com
```

### 🔴 Error: `Module not found: Can't resolve 'recharts'`

**Causa:** No instalaste Recharts en el frontend.

**Solución:**
```bash
cd frontend
npm install recharts
```

### 🔴 Error: `Invalid date` en los gráficos

**Causa:** Las fechas de la BD vienen en formato ISO y necesitas parsearlas.

**Solución:**
```javascript
// Siempre parsea fechas de PostgreSQL
const fecha = new Date(venta.fecha);

// O en SQL, asegúrate de que el formato sea correcto:
SELECT TO_CHAR(fecha, 'YYYY-MM-DD') AS fecha FROM ventas;
```

### 🔴 Error: `duplicate key value violates unique constraint`

**Causa:** Intentas insertar un email que ya existe en la tabla usuarios.

**Solución:**
```javascript
// Siempre verifica antes de insertar
const exists = await pool.query(
  'SELECT id FROM usuarios WHERE email = $1', [email]
);
if (exists.rows.length > 0) {
  return res.status(409).json({ error: 'El email ya está registrado' });
}
```

---

## 🎯 Resumen: Lo que aprendiste

| Concepto | ¿Lo aplicamos en...? |
|----------|---------------------|
| REST API con Express | Backend: todas las rutas |
| PostgreSQL sin ORM | Conexión directa con `pg` y queries SQL |
| Autenticación JWT | `authController.js`, `middleware/auth.js` |
| Roles y permisos RBAC | `middleware/role.js` |
| Hashing de contraseñas | `bcryptjs` en creación de usuarios y login |
| Transacciones SQL | `BEGIN/COMMIT/ROLLBACK` en ventas y compras |
| CRUD completo | Productos, categorías, clientes, proveedores, usuarios |
| React Router v6 | `App.jsx` con rutas protegidas |
| Context API | `AuthContext.jsx` para estado global |
| Tailwind CSS | Todas las páginas y componentes |
| Gráficos con Recharts | `Dashboard.jsx` (BarChart, AreaChart) |
| Auditoría | `logs_auditoria` + `logger.js` |
| Integración IA | `deepseekService.js` + chatbot + análisis |
| Docker + Render | `render.yaml`, despliegue automático |
| Variables de entorno | `.env` local + `render.yaml` para producción |

---

**¿Siguiente paso?** El código completo está disponible. Experimenta modificando cosas pequeñas: agrega un campo nuevo a productos, cambia los colores del Dashboard, añade un nuevo rol. La mejor forma de aprender es romper cosas y arreglarlas.
