require('dotenv').config();
const express = require('express');
const cors = require('cors');
const pool = require('./config/database');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const productRoutes = require('./routes/productRoutes');
const saleRoutes = require('./routes/saleRoutes');
const clientRoutes = require('./routes/clientRoutes');
const supplierRoutes = require('./routes/supplierRoutes');
const purchaseRoutes = require('./routes/purchaseRoutes');
const logRoutes = require('./routes/logRoutes');
const statsRoutes = require('./routes/statsRoutes');
const iaRoutes = require('./routes/iaRoutes');
const employeeRoutes = require('./routes/employeeRoutes');
const { seedUsers } = require('./utils/seeder');
const { seedData } = require('./utils/seedData');

const app = express();
const PORT = process.env.PORT || 4000;

const corsOrigin = process.env.CORS_ORIGIN || process.env.FRONTEND_URL || '*';

app.use(
  cors({
    origin: corsOrigin === '*' ? '*' : corsOrigin.split(',').map((s) => s.trim()),
    credentials: corsOrigin !== '*',
  })
);
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/usuarios', userRoutes);
app.use('/api/categorias', categoryRoutes);
app.use('/api/productos', productRoutes);
app.use('/api/ventas', saleRoutes);
app.use('/api/clientes', clientRoutes);
app.use('/api/proveedores', supplierRoutes);
app.use('/api/compras', purchaseRoutes);
app.use('/api/logs', logRoutes);
app.use('/api/estadisticas', statsRoutes);
app.use('/api/ia', iaRoutes);
app.use('/api/empleados', employeeRoutes);

app.get('/api/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', db: 'connected' });
  } catch (err) {
    res.status(500).json({ status: 'error', db: 'disconnected' });
  }
});

async function init() {
  try {
    await pool.query(`
      CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

      CREATE TABLE IF NOT EXISTS usuarios (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        nombre VARCHAR(100) NOT NULL,
        email VARCHAR(150) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        rol VARCHAR(20) CHECK (rol IN ('admin', 'vendedor', 'revisor', 'gerente', 'programador')) NOT NULL,
        activo BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS categorias (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        nombre VARCHAR(100) NOT NULL,
        descripcion TEXT DEFAULT '',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS productos (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        nombre VARCHAR(150) NOT NULL,
        descripcion TEXT DEFAULT '',
        precio DECIMAL(10,2) NOT NULL CHECK (precio > 0),
        stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
        categoria_id UUID REFERENCES categorias(id) ON DELETE SET NULL,
        imagen_url VARCHAR(500) DEFAULT '',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS ventas (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        usuario_id UUID NOT NULL REFERENCES usuarios(id),
        total DECIMAL(12,2) NOT NULL DEFAULT 0,
        fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS detalle_ventas (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        venta_id UUID NOT NULL REFERENCES ventas(id) ON DELETE CASCADE,
        producto_id UUID NOT NULL REFERENCES productos(id),
        cantidad INTEGER NOT NULL CHECK (cantidad > 0),
        precio_unitario DECIMAL(10,2) NOT NULL,
        subtotal DECIMAL(12,2) NOT NULL
      );

      CREATE TABLE IF NOT EXISTS clientes (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        nombre VARCHAR(150) NOT NULL,
        email VARCHAR(150) DEFAULT '',
        telefono VARCHAR(30) DEFAULT '',
        direccion TEXT DEFAULT '',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS proveedores (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        nombre VARCHAR(150) NOT NULL,
        contacto VARCHAR(100) DEFAULT '',
        telefono VARCHAR(30) DEFAULT '',
        email VARCHAR(150) DEFAULT '',
        direccion TEXT DEFAULT '',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS compras (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        proveedor_id UUID NOT NULL REFERENCES proveedores(id),
        usuario_id UUID NOT NULL REFERENCES usuarios(id),
        total DECIMAL(12,2) NOT NULL DEFAULT 0,
        fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS detalle_compras (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        compra_id UUID NOT NULL REFERENCES compras(id) ON DELETE CASCADE,
        producto_id UUID NOT NULL REFERENCES productos(id),
        cantidad INTEGER NOT NULL CHECK (cantidad > 0),
        precio_unitario DECIMAL(10,2) NOT NULL,
        subtotal DECIMAL(12,2) NOT NULL
      );

      CREATE TABLE IF NOT EXISTS movimientos_stock (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        producto_id UUID NOT NULL REFERENCES productos(id),
        tipo VARCHAR(10) NOT NULL CHECK (tipo IN ('entrada','salida')),
        cantidad INTEGER NOT NULL,
        referencia VARCHAR(50) DEFAULT '',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      ALTER TABLE ventas ADD COLUMN IF NOT EXISTS cliente_id UUID REFERENCES clientes(id);
      ALTER TABLE ventas ADD COLUMN IF NOT EXISTS numero_factura VARCHAR(20) DEFAULT '';
      ALTER TABLE ventas ADD COLUMN IF NOT EXISTS estado VARCHAR(20) DEFAULT 'pagado' CHECK (estado IN ('pagado','pendiente','cancelado'));

      DO $$
      DECLARE
        cname text;
      BEGIN
        SELECT con.conname INTO cname
        FROM pg_constraint con
        JOIN pg_class rel ON rel.oid = con.conrelid
        WHERE rel.relname = 'usuarios' AND con.contype = 'c'
          AND pg_get_constraintdef(con.oid) LIKE '%rol%'
        LIMIT 1;
        IF cname IS NOT NULL THEN
          EXECUTE 'ALTER TABLE usuarios DROP CONSTRAINT ' || cname;
        END IF;
      END $$;
      ALTER TABLE usuarios ADD CONSTRAINT usuarios_rol_check CHECK (rol IN ('admin', 'vendedor', 'revisor', 'gerente', 'programador'));

      CREATE TABLE IF NOT EXISTS logs_auditoria (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        usuario_id UUID NOT NULL REFERENCES usuarios(id),
        usuario_nombre VARCHAR(100) NOT NULL,
        accion VARCHAR(250) NOT NULL,
        detalle TEXT DEFAULT '',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS empleados (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        nombre VARCHAR(150) NOT NULL,
        email VARCHAR(150) UNIQUE NOT NULL,
        telefono VARCHAR(30) DEFAULT '',
        puesto VARCHAR(100) NOT NULL,
        area VARCHAR(100) NOT NULL,
        salario DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (salario >= 0),
        fecha_ingreso DATE DEFAULT CURRENT_DATE,
        activo BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log('Tablas verificadas/creadas');

    await seedUsers();
    await seedData();

    app.listen(PORT, () => {
      console.log(`EcoClean API corriendo en puerto ${PORT}`);
    });
  } catch (err) {
    console.error('Error al inicializar:', err);
    process.exit(1);
  }
}

init();
