require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') });
const pool = require('../config/database');

function randomBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFrom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomDate(monthOffset, dayOffset) {
  const d = new Date();
  d.setMonth(d.getMonth() - monthOffset);
  d.setDate(randomBetween(1, dayOffset || 28));
  d.setHours(randomBetween(7, 20), randomBetween(0, 59), 0, 0);
  return d.toISOString();
}

async function inject() {
  console.log('=== Inyectando datos históricos masivos ===\n');

  try {
    const users = await pool.query('SELECT id, nombre FROM usuarios WHERE activo = true');
    const products = await pool.query('SELECT id, nombre, precio, stock FROM productos WHERE stock > 0');
    const clients = await pool.query('SELECT id, nombre FROM clientes');
    const suppliers = await pool.query('SELECT id, nombre FROM proveedores');

    if (users.rows.length === 0) {
      console.log('ERROR: No hay usuarios. Ejecuta el backend primero para crear datos base.');
      process.exit(1);
    }

    console.log(`Usuarios: ${users.rows.length} | Productos: ${products.rows.length} | Clientes: ${clients.rows.length} | Proveedores: ${suppliers.rows.length}`);
    console.log('');

    // ======= INYECTAR COMPRAS (reposición de inventario) =======
    console.log('Inyectando compras...');
    let comprasCreadas = 0;

    for (let mes = 24; mes >= 1; mes--) {
      const numCompras = randomBetween(1, 3);
      for (let c = 0; c < numCompras; c++) {
        const client = await pool.connect();
        try {
          await client.query('BEGIN');

          const supplier = randomFrom(suppliers.rows);
          const user = randomFrom(users.rows);
          const fecha = randomDate(mes, 28);

          let total = 0;
          const items = [];
          const numItems = randomBetween(2, 5);

          for (let i = 0; i < numItems; i++) {
            const prod = randomFrom(products.rows);
            const cant = randomBetween(10, 50);
            const precio = parseFloat(prod.precio);
            const subtotal = parseFloat((precio * cant).toFixed(2));
            total += subtotal;
            items.push({ producto_id: prod.id, cantidad: cant, precio_unitario: precio, subtotal });
          }

          const compraRes = await client.query(
            `INSERT INTO compras (proveedor_id, usuario_id, total, fecha)
             VALUES ($1, $2, $3, $4) RETURNING id`,
            [supplier.id, user.id, parseFloat(total.toFixed(2)), fecha]
          );

          for (const item of items) {
            await client.query(
              'INSERT INTO detalle_compras (compra_id, producto_id, cantidad, precio_unitario, subtotal) VALUES ($1,$2,$3,$4,$5)',
              [compraRes.rows[0].id, item.producto_id, item.cantidad, item.precio_unitario, item.subtotal]
            );
            await client.query(
              'UPDATE productos SET stock = stock + $1 WHERE id = $2',
              [item.cantidad, item.producto_id]
            );
          }

          await client.query('COMMIT');
          comprasCreadas++;
        } catch (err) {
          await client.query('ROLLBACK');
          console.error('Error en compra:', err.message);
        } finally {
          client.release();
        }
      }
    }

    console.log(`  -> ${comprasCreadas} compras creadas`);
    console.log('');

    // ======= INYECTAR VENTAS =======
    console.log('Inyectando ventas...');
    let ventasCreadas = 0;

    // Venta inicial de factura (si no hay ventas, comenzar desde F-00000)
    const countRes = await pool.query('SELECT COUNT(*)::int AS total FROM ventas');
    let facturaSeq = countRes.rows[0].total;

    for (let mes = 24; mes >= 0; mes--) {
      const numVentas = randomBetween(8, 15);
      for (let v = 0; v < numVentas; v++) {
        const client = await pool.connect();
        try {
          await client.query('BEGIN');

          const user = randomFrom(users.rows);
          const cliente = Math.random() > 0.25 ? randomFrom(clients.rows) : null;
          const fecha = randomDate(mes, 28);

          // Most are 'pagado', some 'pendiente'
          const estadoRand = Math.random();
          const estado = estadoRand < 0.15 ? 'pendiente' : estadoRand < 0.22 ? 'cancelado' : 'pagado';

          let total = 0;
          const items = [];
          const numItems = randomBetween(1, 4);

          for (let i = 0; i < numItems; i++) {
            const prod = randomFrom(products.rows);
            const cant = randomBetween(1, 5);
            const precio = parseFloat(prod.precio);
            const subtotal = parseFloat((precio * cant).toFixed(2));
            total += subtotal;
            items.push({ producto_id: prod.id, cantidad: cant, precio_unitario: precio, subtotal });
          }

          facturaSeq++;
          const numeroFactura = `F-${String(facturaSeq).padStart(5, '0')}`;

          const ventaRes = await client.query(
            `INSERT INTO ventas (usuario_id, total, cliente_id, numero_factura, estado, fecha)
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
            [user.id, parseFloat(total.toFixed(2)), cliente ? cliente.id : null, numeroFactura, estado, fecha]
          );

          for (const item of items) {
            await client.query(
              'INSERT INTO detalle_ventas (venta_id, producto_id, cantidad, precio_unitario, subtotal) VALUES ($1,$2,$3,$4,$5)',
              [ventaRes.rows[0].id, item.producto_id, item.cantidad, item.precio_unitario, item.subtotal]
            );
          }

          await client.query('COMMIT');
          ventasCreadas++;
        } catch (err) {
          await client.query('ROLLBACK');
          console.error('Error en venta:', err.message);
        } finally {
          client.release();
        }
      }
    }

    console.log(`  -> ${ventasCreadas} ventas creadas`);
    console.log('');

    // ======= RESUMEN FINAL =======
    const resumen = await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM ventas) AS total_ventas,
        (SELECT COUNT(*) FROM compras) AS total_compras,
        (SELECT COUNT(*) FROM clientes) AS total_clientes,
        (SELECT COALESCE(SUM(total), 0)::float FROM ventas) AS ingresos_totales
    `);

    const r = resumen.rows[0];
    console.log('=== RESUMEN FINAL ===');
    console.log(`  Ventas totales:    ${r.total_ventas}`);
    console.log(`  Compras totales:   ${r.total_compras}`);
    console.log(`  Clientes:          ${r.total_clientes}`);
    console.log(`  Ingresos totales:  $${r.ingresos_totales.toFixed(2)}`);
    console.log('\nDatos inyectados exitosamente. Reinicia el frontend para ver los gráficos actualizados.');

    process.exit(0);
  } catch (err) {
    console.error('Error fatal:', err);
    process.exit(1);
  }
}

inject();
