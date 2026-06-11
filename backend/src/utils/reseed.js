require('dotenv').config();
const pool = require('../config/database');

async function reseed() {
  try {
    console.log('Eliminando datos existentes...');

    await pool.query('DELETE FROM movimientos_stock');
    await pool.query('DELETE FROM detalle_ventas');
    await pool.query('DELETE FROM detalle_compras');
    await pool.query('DELETE FROM ventas');
    await pool.query('DELETE FROM compras');
    await pool.query('DELETE FROM productos');
    await pool.query('DELETE FROM categorias');
    await pool.query('DELETE FROM clientes');
    await pool.query('DELETE FROM proveedores');
    await pool.query('DELETE FROM historial_empleados');
    await pool.query('DELETE FROM empleados');

    console.log('Datos eliminados. Ejecutando seed...');

    const { seedData } = require('./seedData');
    await seedData();

    console.log('Reseed completado exitosamente');
    process.exit(0);
  } catch (err) {
    console.error('Error en reseed:', err);
    process.exit(1);
  }
}

reseed();
